begin;

-- Guard: make sure the public function names we are about to (re)create are not
-- already owned by an unrelated backend, mirroring 09_campaign_bulk_delete.sql.
do $$
declare
  collision text;
begin
  select string_agg(p.proname, ', ' order by p.proname)
  into collision
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('hog_admin_delete_donations', 'hog_admin_update_donation')
    and position('home_of_giving.' in p.prosrc) = 0;

  if collision is not null then
    raise exception 'Migrasi dibatalkan karena nama function public dipakai backend lain: %', collision;
  end if;
end
$$;

-- Drop any prior versions with a different signature so create-or-replace does not clash.
do $$
declare
  item record;
begin
  for item in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as function_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (
      ('home_of_giving', 'admin_delete_donations'),
      ('public', 'hog_admin_delete_donations'),
      ('home_of_giving', 'admin_update_donation'),
      ('public', 'hog_admin_update_donation')
    )
      and pg_get_function_identity_arguments(p.oid) not in (
        'p_donation_ids uuid[]',
        'p_donation_id uuid, p_campaign_id uuid, p_full_name text, p_amount_idr bigint, p_donated_on date'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', item.function_name);
    execute format('drop function %s', item.function_name);
  end loop;
end
$$;

-- Relax the donation trigger: verified donations may now be edited by an admin.
-- The future-date, verified-status, and legacy-import guards stay in place; only the
-- "nominal & program tidak dapat diubah" block is removed so admin CRUD can update them.
create or replace function home_of_giving_private.enforce_donation_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.donated_on > ((now() at time zone 'Asia/Jakarta')::date) then
    raise exception 'Tanggal donasi tidak boleh melewati hari ini';
  end if;

  if new.status <> 'verified' then
    raise exception 'Donasi baru langsung tercatat sebagai terverifikasi.';
  end if;

  if new.is_legacy
    and (tg_op = 'INSERT' or not old.is_legacy)
    and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Status legacy hanya dapat digunakan oleh proses import tepercaya.';
  end if;

  new.verified_at := coalesce(new.verified_at, now());
  new.verified_by := coalesce(new.verified_by, (select auth.uid()));
  return new;
end;
$$;

revoke execute on function home_of_giving_private.enforce_donation_rules() from public, anon, authenticated, service_role;
grant execute on function home_of_giving_private.enforce_donation_rules() to service_role;

-- Bulk delete donations (and their evidence + orphaned donor identities), returning
-- the private storage objects the app must clean up afterwards.
create or replace function home_of_giving.admin_delete_donations(p_donation_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  donation_ids uuid[];
  identity_ids uuid[];
  storage_objects jsonb := jsonb_build_array();
  deleted_donation_count integer := 0;
begin
  if not home_of_giving_private.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  select coalesce(array_agg(d.id), array[]::uuid[])
  into donation_ids
  from home_of_giving.donations d
  where d.id = any (coalesce(p_donation_ids, array[]::uuid[]));

  if coalesce(array_length(donation_ids, 1), 0) = 0 then
    return jsonb_build_object(
      'deleted_donation_count', 0,
      'storage_objects', jsonb_build_array()
    );
  end if;

  select coalesce(array_agg(distinct d.donor_identity_id), array[]::uuid[])
  into identity_ids
  from home_of_giving.donations d
  where d.id = any (donation_ids)
    and d.donor_identity_id is not null;

  select storage_objects || coalesce(evidence.items, jsonb_build_array())
  into storage_objects
  from (
    select jsonb_agg(
      jsonb_build_object('bucket', item.bucket, 'path', item.path)
      order by item.bucket, item.path
    ) as items
    from (
      select distinct
        coalesce(
          nullif(btrim(e.storage_bucket), ''),
          'home-of-giving-private-donation-evidence'
        ) as bucket,
        btrim(e.storage_path) as path
      from home_of_giving_private.donation_evidence e
      where e.donation_id = any (donation_ids)
        and nullif(btrim(coalesce(e.storage_path, '')), '') is not null
    ) item
  ) evidence;

  delete from home_of_giving_private.donation_evidence e
  where e.donation_id = any (donation_ids);

  delete from home_of_giving.donations d
  where d.id = any (donation_ids);
  get diagnostics deleted_donation_count = row_count;

  delete from home_of_giving_private.donor_identities i
  where i.id = any (identity_ids)
    and not exists (
      select 1 from home_of_giving.donations d where d.donor_identity_id = i.id
    );

  return jsonb_build_object(
    'deleted_donation_count', deleted_donation_count,
    'storage_objects', coalesce(storage_objects, jsonb_build_array())
  );
end;
$$;

-- Update an existing verified donation. Re-masks the public name from the full name,
-- and may move the donation to a different campaign / change the amount and date.
create or replace function home_of_giving.admin_update_donation(
  p_donation_id uuid,
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  identity_id uuid;
  donation_found boolean := false;
begin
  if not home_of_giving_private.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  if btrim(coalesce(p_full_name, '')) = '' then
    raise exception 'Nama lengkap donatur wajib diisi';
  end if;

  if p_amount_idr is null or p_amount_idr <= 0 then
    raise exception 'Nominal donasi wajib lebih dari nol';
  end if;

  if p_donated_on is null then
    raise exception 'Tanggal donasi wajib diisi';
  end if;

  if not exists (select 1 from home_of_giving.campaigns c where c.id = p_campaign_id) then
    raise exception 'program tidak ditemukan';
  end if;

  select d.donor_identity_id, true
  into identity_id, donation_found
  from home_of_giving.donations d
  where d.id = p_donation_id
    and d.status = 'verified';

  if not donation_found then
    raise exception 'Donasi tidak ditemukan';
  end if;

  if identity_id is null then
    insert into home_of_giving_private.donor_identities (full_name, created_by)
    values (btrim(p_full_name), actor)
    returning id into identity_id;
  else
    update home_of_giving_private.donor_identities
    set full_name = btrim(p_full_name)
    where id = identity_id;
  end if;

  update home_of_giving.donations
  set campaign_id = p_campaign_id,
      donor_identity_id = identity_id,
      public_name = home_of_giving_private.mask_donor_name(p_full_name),
      amount_idr = p_amount_idr,
      donated_on = p_donated_on,
      updated_by = actor,
      updated_at = now()
  where id = p_donation_id;

  return p_donation_id;
end;
$$;

-- Public (security invoker) bridges the app calls through PostgREST.
create or replace function public.hog_admin_delete_donations(p_donation_ids uuid[])
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select home_of_giving.admin_delete_donations(p_donation_ids);
$$;

create or replace function public.hog_admin_update_donation(
  p_donation_id uuid,
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select home_of_giving.admin_update_donation(
    p_donation_id, p_campaign_id, p_full_name, p_amount_idr, p_donated_on
  );
$$;

do $$
declare
  fn text;
  fns text[] := array[
    'home_of_giving.admin_delete_donations(uuid[])',
    'home_of_giving.admin_update_donation(uuid, uuid, text, bigint, date)',
    'public.hog_admin_delete_donations(uuid[])',
    'public.hog_admin_update_donation(uuid, uuid, text, bigint, date)'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;

commit;
