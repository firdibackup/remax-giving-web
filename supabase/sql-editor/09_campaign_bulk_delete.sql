begin;

do $$
declare
  collision text;
begin
  select string_agg(p.proname, ', ' order by p.proname)
  into collision
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hog_admin_delete_campaigns'
    and position('home_of_giving.' in p.prosrc) = 0;

  if collision is not null then
    raise exception 'Migrasi dibatalkan karena nama function public dipakai backend lain: %', collision;
  end if;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    ) as function_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (
      ('home_of_giving', 'admin_delete_campaigns'),
      ('public', 'hog_admin_delete_campaigns')
    )
      and pg_get_function_identity_arguments(p.oid) <> 'p_campaign_ids uuid[]'
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated, service_role',
      item.function_name
    );
    execute format('drop function %s', item.function_name);
  end loop;
end
$$;

create or replace function home_of_giving.admin_delete_campaigns(p_campaign_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_ids uuid[];
  donation_ids uuid[];
  identity_ids uuid[];
  candidate_media_ids uuid[];
  orphan_media_ids uuid[];
  storage_objects jsonb := jsonb_build_array();
  deleted_donation_count integer := 0;
  deleted_campaign_count integer := 0;
begin
  if not home_of_giving_private.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  select coalesce(array_agg(c.id), array[]::uuid[])
  into target_ids
  from home_of_giving.campaigns c
  where c.id = any (coalesce(p_campaign_ids, array[]::uuid[]));

  if coalesce(array_length(target_ids, 1), 0) = 0 then
    return jsonb_build_object(
      'deleted_campaign_count', 0,
      'deleted_donation_count', 0,
      'storage_objects', jsonb_build_array()
    );
  end if;

  select coalesce(array_agg(d.id), array[]::uuid[])
  into donation_ids
  from home_of_giving.donations d
  where d.campaign_id = any (target_ids);

  select coalesce(array_agg(distinct d.donor_identity_id), array[]::uuid[])
  into identity_ids
  from home_of_giving.donations d
  where d.id = any (donation_ids)
    and d.donor_identity_id is not null;

  select coalesce(array_agg(distinct media.id), array[]::uuid[])
  into candidate_media_ids
  from (
    select cm.media_id as id
    from home_of_giving.campaign_media cm
    where cm.campaign_id = any (target_ids)
    union
    select c.cover_media_id as id
    from home_of_giving.campaigns c
    where c.id = any (target_ids)
      and c.cover_media_id is not null
  ) media;

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

  select storage_objects || coalesce(report.items, jsonb_build_array())
  into storage_objects
  from (
    select jsonb_agg(
      jsonb_build_object('bucket', item.bucket, 'path', item.path)
      order by item.bucket, item.path
    ) as items
    from (
      select distinct
        btrim(r.storage_bucket) as bucket,
        btrim(r.storage_path) as path
      from home_of_giving.reports r
      where r.campaign_id = any (target_ids)
        and nullif(btrim(coalesce(r.storage_path, '')), '') is not null
        and nullif(btrim(coalesce(r.storage_bucket, '')), '') is not null
    ) item
  ) report;

  delete from home_of_giving_private.donation_evidence e
  where e.donation_id = any (donation_ids);

  delete from home_of_giving.donations d
  where d.id = any (donation_ids);
  get diagnostics deleted_donation_count = row_count;

  delete from home_of_giving_private.donor_identities i
  where i.id = any (identity_ids)
    and not exists (
      select 1
      from home_of_giving.donations d
      where d.donor_identity_id = i.id
    );

  delete from home_of_giving.campaign_media cm
  where cm.campaign_id = any (target_ids);

  delete from home_of_giving.campaign_milestones ms
  where ms.campaign_id = any (target_ids);

  delete from home_of_giving.reports r
  where r.campaign_id = any (target_ids);

  delete from home_of_giving.campaigns c
  where c.id = any (target_ids);
  get diagnostics deleted_campaign_count = row_count;

  select coalesce(array_agg(m.id), array[]::uuid[])
  into orphan_media_ids
  from home_of_giving.media_assets m
  where m.id = any (candidate_media_ids)
    and nullif(btrim(coalesce(m.storage_bucket, '')), '') is not null
    and nullif(btrim(coalesce(m.storage_path, '')), '') is not null
    and not exists (
      select 1 from home_of_giving.campaign_media cm where cm.media_id = m.id
    )
    and not exists (
      select 1 from home_of_giving.blog_media bm where bm.media_id = m.id
    )
    and not exists (
      select 1 from home_of_giving.campaigns c where c.cover_media_id = m.id
    )
    and not exists (
      select 1 from home_of_giving.blog_posts p where p.cover_media_id = m.id
    );

  select storage_objects || coalesce(media.items, jsonb_build_array())
  into storage_objects
  from (
    select jsonb_agg(
      jsonb_build_object('bucket', item.bucket, 'path', item.path)
      order by item.bucket, item.path
    ) as items
    from (
      select distinct
        btrim(m.storage_bucket) as bucket,
        btrim(m.storage_path) as path
      from home_of_giving.media_assets m
      where m.id = any (orphan_media_ids)
    ) item
  ) media;

  delete from home_of_giving.media_assets m
  where m.id = any (orphan_media_ids);

  return jsonb_build_object(
    'deleted_campaign_count', deleted_campaign_count,
    'deleted_donation_count', deleted_donation_count,
    'storage_objects', coalesce(storage_objects, jsonb_build_array())
  );
end;
$$;

create or replace function public.hog_admin_delete_campaigns(p_campaign_ids uuid[])
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select home_of_giving.admin_delete_campaigns(p_campaign_ids);
$$;

do $$
declare
  fn text;
  fns text[] := array[
    'home_of_giving.admin_delete_campaigns(uuid[])',
    'public.hog_admin_delete_campaigns(uuid[])'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;

commit;
