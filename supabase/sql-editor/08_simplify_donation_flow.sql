begin;

create schema if not exists home_of_giving_private;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'home-of-giving-private-reports',
  'home-of-giving-private-reports',
  false,
  26214400,
  array['application/pdf']
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "home_of_giving_admin_manage_public_assets" on storage.objects;
create policy "home_of_giving_admin_manage_public_assets"
on storage.objects
for all
to authenticated
using (
  bucket_id in (
    'home-of-giving-public-media',
    'home-of-giving-public-reports'
  )
  and (select home_of_giving_private.is_admin())
)
with check (
  bucket_id in (
    'home-of-giving-public-media',
    'home-of-giving-public-reports'
  )
  and (select home_of_giving_private.is_admin())
);

drop policy if exists "home_of_giving_admin_manage_private_reports" on storage.objects;
create policy "home_of_giving_admin_manage_private_reports"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'home-of-giving-private-reports'
  and (select home_of_giving_private.is_admin())
)
with check (
  bucket_id = 'home-of-giving-private-reports'
  and (select home_of_giving_private.is_admin())
);

create table if not exists home_of_giving_private.simplification_archive (
  id bigint generated always as identity primary key,
  migration_key text not null,
  source_schema text not null,
  source_table text not null,
  source_key text not null,
  row_data jsonb not null,
  archived_at timestamptz not null default now(),
  unique (migration_key, source_schema, source_table, source_key)
);

create index if not exists simplification_archive_source_idx
  on home_of_giving_private.simplification_archive (source_schema, source_table, archived_at desc);

alter table home_of_giving_private.simplification_archive enable row level security;
alter table home_of_giving_private.simplification_archive force row level security;
revoke all on table home_of_giving_private.simplification_archive from public, anon, authenticated;
revoke all on sequence home_of_giving_private.simplification_archive_id_seq from public, anon, authenticated;
grant select on table home_of_giving_private.simplification_archive to authenticated;
grant all on table home_of_giving_private.simplification_archive to service_role;
grant all on sequence home_of_giving_private.simplification_archive_id_seq to service_role;

drop policy if exists admin_read on home_of_giving_private.simplification_archive;
create policy admin_read on home_of_giving_private.simplification_archive
  for select to authenticated
  using ((select home_of_giving_private.is_admin()));

do $$
begin
  if to_regclass('home_of_giving_private.beneficiary_contacts') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving_private',
        'beneficiary_contacts',
        id::text,
        to_jsonb(t)
      from home_of_giving_private.beneficiary_contacts t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.beneficiaries') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'beneficiaries',
        id::text,
        to_jsonb(t)
      from home_of_giving.beneficiaries t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.events') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'events',
        id::text,
        to_jsonb(t)
      from home_of_giving.events t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.event_media') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'event_media',
        coalesce(
          nullif(concat_ws(':', to_jsonb(t) ->> 'event_id', to_jsonb(t) ->> 'campaign_id', to_jsonb(t) ->> 'media_id'), ''),
          md5(to_jsonb(t)::text)
        ),
        to_jsonb(t)
      from home_of_giving.event_media t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.event_media') is not null
    and to_regclass('home_of_giving.campaign_media') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'campaign_media_before_event_merge',
        campaign_id::text || ':' || media_id::text,
        to_jsonb(t)
      from home_of_giving.campaign_media t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.disbursements') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'disbursements',
        id::text,
        to_jsonb(t)
      from home_of_giving.disbursements t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.disbursement_allocations') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'disbursement_allocations',
        id::text,
        to_jsonb(t)
      from home_of_giving.disbursement_allocations t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'home_of_giving'
      and table_name = 'campaigns'
      and column_name = 'beneficiary_id'
  ) then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'campaigns_legacy_beneficiary',
        id::text,
        to_jsonb(t)
      from home_of_giving.campaigns t
      where beneficiary_id is not null
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'home_of_giving'
      and table_name = 'reports'
      and column_name = 'disbursement_id'
  ) then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'reports_legacy_disbursement',
        id::text,
        to_jsonb(t)
      from home_of_giving.reports t
      where disbursement_id is not null
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving.donations') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving',
        'donations_non_verified',
        id::text,
        to_jsonb(t)
      from home_of_giving.donations t
      where status <> 'verified'
         or verified_at is null
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;

  if to_regclass('home_of_giving_private.donation_evidence') is not null
    and to_regclass('home_of_giving.donations') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-15_simplify_donation_flow_v1',
        'home_of_giving_private',
        'donation_evidence',
        e.id::text,
        to_jsonb(e)
      from home_of_giving_private.donation_evidence e
      join home_of_giving.donations d on d.id = e.donation_id
      where d.status in ('rejected', 'void')
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;
end
$$;

alter table home_of_giving.campaigns
  add column if not exists beneficiary_name text,
  add column if not exists beneficiary_location text;

do $$
begin
  if to_regclass('home_of_giving.beneficiaries') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'campaigns'
        and column_name = 'beneficiary_id'
    ) then
    execute $backfill$
      update home_of_giving.campaigns c
      set beneficiary_name = coalesce(nullif(btrim(c.beneficiary_name), ''), nullif(btrim(b.public_name), '')),
          beneficiary_location = coalesce(
            nullif(btrim(c.beneficiary_location), ''),
            nullif(concat_ws(', ', nullif(btrim(b.city), ''), nullif(btrim(b.province), '')), '')
          )
      from home_of_giving.beneficiaries b
      where b.id = c.beneficiary_id
    $backfill$;
  end if;
end
$$;

do $$
declare
  missing_campaigns text;
begin
  select string_agg(slug, ', ' order by slug)
  into missing_campaigns
  from home_of_giving.campaigns
  where status in ('running', 'closed', 'disbursed', 'reported')
    and btrim(coalesce(beneficiary_name, '')) = '';

  if missing_campaigns is not null then
    raise exception 'Migrasi dibatalkan: proyek publik tanpa nama penerima manfaat: %', missing_campaigns;
  end if;
end
$$;

do $$
begin
  if to_regclass('home_of_giving.event_media') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'event_media'
        and column_name = 'campaign_id'
    ) then
    if to_regclass('home_of_giving.events') is not null
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'home_of_giving'
          and table_name = 'event_media'
          and column_name = 'event_id'
      ) then
      execute $migrate_media$
        insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order, created_at)
        select
          coalesce(em.campaign_id, e.campaign_id),
          em.media_id,
          'documentation'::home_of_giving.media_role,
          min(em.sort_order),
          min(em.created_at)
        from home_of_giving.event_media em
        left join home_of_giving.events e on e.id = em.event_id
        where coalesce(em.campaign_id, e.campaign_id) is not null
        group by coalesce(em.campaign_id, e.campaign_id), em.media_id
        on conflict (campaign_id, media_id) do update
        set sort_order = least(home_of_giving.campaign_media.sort_order, excluded.sort_order)
      $migrate_media$;
    else
      execute $migrate_media$
        insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order, created_at)
        select
          em.campaign_id,
          em.media_id,
          'documentation'::home_of_giving.media_role,
          min(em.sort_order),
          min(em.created_at)
        from home_of_giving.event_media em
        where em.campaign_id is not null
        group by em.campaign_id, em.media_id
        on conflict (campaign_id, media_id) do update
        set sort_order = least(home_of_giving.campaign_media.sort_order, excluded.sort_order)
      $migrate_media$;
    end if;
  elsif to_regclass('home_of_giving.event_media') is not null
    and to_regclass('home_of_giving.events') is not null then
    execute $migrate_media$
      insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order, created_at)
      select
        e.campaign_id,
        em.media_id,
        'documentation'::home_of_giving.media_role,
        min(em.sort_order),
        min(em.created_at)
      from home_of_giving.event_media em
      join home_of_giving.events e on e.id = em.event_id
      where e.campaign_id is not null
      group by e.campaign_id, em.media_id
      on conflict (campaign_id, media_id) do update
      set sort_order = least(home_of_giving.campaign_media.sort_order, excluded.sort_order)
    $migrate_media$;
  end if;
end
$$;

do $$
declare
  collision text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
  into collision
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any (array[
      'hog_campaigns', 'hog_campaign_stats', 'hog_donation_ledger',
      'hog_campaign_milestones', 'hog_reports', 'hog_blog_posts',
      'hog_gallery_media', 'hog_campaign_media', 'hog_site_stats',
      'hog_site_settings', 'hog_annual_goals',
      'hog_disbursements', 'hog_disbursement_allocations', 'hog_events',
      'hog_admin_branches',
      'hog_admin_beneficiaries', 'hog_admin_media_assets', 'hog_admin_campaigns',
      'hog_admin_donations', 'hog_admin_disbursements',
      'hog_admin_disbursement_allocations', 'hog_admin_campaign_milestones',
      'hog_admin_reports', 'hog_admin_blog_posts', 'hog_admin_events',
      'hog_admin_event_media', 'hog_admin_campaign_media', 'hog_admin_blog_media',
      'hog_admin_annual_goals', 'hog_admin_site_settings', 'hog_admin_audit_logs'
    ])
    and case
      when c.relkind = 'v' then
        position('home_of_giving.' in pg_get_viewdef(c.oid, true)) = 0
        and position('home_of_giving_private.' in pg_get_viewdef(c.oid, true)) = 0
      else true
    end;

  if collision is not null then
    raise exception 'Migrasi dibatalkan karena nama object public dipakai backend lain: %', collision;
  end if;

  select string_agg(p.proname, ', ' order by p.proname)
  into collision
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = any (array[
      'hog_admin_whoami', 'hog_admin_preview_masked_name',
      'hog_admin_record_donation', 'hog_admin_attach_donation_evidence',
      'hog_admin_verify_donation', 'hog_admin_reject_donation',
      'hog_admin_void_donation', 'hog_admin_donation_detail',
      'hog_admin_verify_disbursement', 'hog_admin_publish_disbursement',
      'hog_admin_dashboard_summary'
    ])
    and position('home_of_giving.' in p.prosrc) = 0;

  if collision is not null then
    raise exception 'Migrasi dibatalkan karena nama function public dipakai backend lain: %', collision;
  end if;
end
$$;

do $$
declare
  target text;
  targets text[] := array[
    'public.hog_campaigns',
    'public.hog_campaign_stats',
    'public.hog_donation_ledger',
    'public.hog_campaign_milestones',
    'public.hog_reports',
    'public.hog_blog_posts',
    'public.hog_gallery_media',
    'public.hog_campaign_media',
    'public.hog_site_stats',
    'public.hog_site_settings',
    'public.hog_annual_goals',
    'public.hog_disbursements',
    'public.hog_disbursement_allocations',
    'public.hog_events',
    'public.hog_admin_branches',
    'public.hog_admin_beneficiaries',
    'public.hog_admin_media_assets',
    'public.hog_admin_campaigns',
    'public.hog_admin_donations',
    'public.hog_admin_disbursements',
    'public.hog_admin_disbursement_allocations',
    'public.hog_admin_campaign_milestones',
    'public.hog_admin_reports',
    'public.hog_admin_blog_posts',
    'public.hog_admin_events',
    'public.hog_admin_event_media',
    'public.hog_admin_campaign_media',
    'public.hog_admin_blog_media',
    'public.hog_admin_annual_goals',
    'public.hog_admin_site_settings',
    'public.hog_admin_audit_logs'
  ];
begin
  foreach target in array targets loop
    if to_regclass(target) is not null then
      execute format('revoke all on table %s from public, anon, authenticated, service_role', target);
      execute format('drop view %s', target);
    end if;
  end loop;
end
$$;

do $$
declare
  target text;
  targets text[] := array[
    'home_of_giving.site_stats',
    'home_of_giving.public_campaigns',
    'home_of_giving.public_donation_ledger',
    'home_of_giving.public_campaign_milestones',
    'home_of_giving.public_reports',
    'home_of_giving.public_blog_posts',
    'home_of_giving.public_gallery_media',
    'home_of_giving.public_campaign_media',
    'home_of_giving.public_site_settings',
    'home_of_giving.public_annual_goals',
    'home_of_giving.public_disbursement_allocations',
    'home_of_giving.public_disbursements',
    'home_of_giving.public_events',
    'home_of_giving.public_event_media',
    'home_of_giving.public_beneficiaries',
    'home_of_giving.campaign_stats'
  ];
begin
  foreach target in array targets loop
    if to_regclass(target) is not null then
      execute format('revoke all on table %s from public, anon, authenticated, service_role', target);
      execute format('drop view %s', target);
    end if;
  end loop;
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
    where n.nspname = 'public'
      and p.proname = any (array[
        'hog_admin_whoami',
        'hog_admin_preview_masked_name',
        'hog_admin_record_donation',
        'hog_admin_attach_donation_evidence',
        'hog_admin_verify_donation',
        'hog_admin_reject_donation',
        'hog_admin_void_donation',
        'hog_admin_donation_detail',
        'hog_admin_verify_disbursement',
        'hog_admin_publish_disbursement',
        'hog_admin_dashboard_summary'
      ])
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated, service_role',
      item.function_name
    );
    execute format('drop function %s', item.function_name);
  end loop;
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
    where n.nspname = 'home_of_giving'
      and p.proname = any (array[
        'admin_whoami',
        'admin_preview_masked_name',
        'admin_record_donation',
        'admin_attach_donation_evidence',
        'admin_verify_donation',
        'admin_reject_donation',
        'admin_void_donation',
        'admin_donation_detail',
        'admin_verify_disbursement',
        'admin_publish_disbursement',
        'admin_dashboard_summary'
      ])
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated, service_role',
      item.function_name
    );
    execute format('drop function %s', item.function_name);
  end loop;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where (schemaname, tablename) in (
      ('home_of_giving_private', 'beneficiary_contacts'),
      ('home_of_giving', 'beneficiaries'),
      ('home_of_giving', 'events'),
      ('home_of_giving', 'event_media'),
      ('home_of_giving', 'disbursements'),
      ('home_of_giving', 'disbursement_allocations')
    )
  loop
    execute format(
      'drop policy %I on %I.%I',
      item.policyname,
      item.schemaname,
      item.tablename
    );
  end loop;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and (n.nspname, c.relname) in (
        ('home_of_giving_private', 'beneficiary_contacts'),
        ('home_of_giving', 'beneficiaries'),
        ('home_of_giving', 'events'),
        ('home_of_giving', 'event_media'),
        ('home_of_giving', 'disbursements'),
        ('home_of_giving', 'disbursement_allocations')
      )
  loop
    execute format(
      'drop trigger %I on %I.%I',
      item.trigger_name,
      item.schema_name,
      item.table_name
    );
  end loop;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where (n.nspname, c.relname) in (
      ('home_of_giving_private', 'beneficiary_contacts'),
      ('home_of_giving', 'beneficiaries'),
      ('home_of_giving', 'events'),
      ('home_of_giving', 'event_media'),
      ('home_of_giving', 'disbursements'),
      ('home_of_giving', 'disbursement_allocations')
    )
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke all on table %I.%I from public, anon, authenticated, service_role',
      item.schema_name,
      item.table_name
    );
  end loop;
end
$$;

drop trigger if exists enforce_rules on home_of_giving.campaigns;
drop trigger if exists enforce_rules on home_of_giving.donations;

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
    where n.nspname = 'home_of_giving_private'
      and p.proname = any (array[
        'disbursement_allocation_total',
        'campaign_verified_total',
        'donation_has_evidence',
        'enforce_disbursement_rules',
        'guard_locked_allocations',
        'enforce_campaign_rules',
        'enforce_donation_rules',
        'mask_donor_name'
      ])
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated, service_role',
      item.function_name
    );
    execute format('drop function %s', item.function_name);
  end loop;
end
$$;

drop index if exists home_of_giving_private.beneficiary_contacts_beneficiary_idx;
drop index if exists home_of_giving.campaigns_beneficiary_idx;
drop index if exists home_of_giving.events_published_start_idx;
drop index if exists home_of_giving.events_campaign_idx;
drop index if exists home_of_giving.events_cover_media_idx;
drop index if exists home_of_giving.event_media_media_idx;
drop index if exists home_of_giving.disbursements_status_idx;
drop index if exists home_of_giving.disbursements_beneficiary_idx;
drop index if exists home_of_giving.disbursements_evidence_media_idx;
drop index if exists home_of_giving.disbursement_allocations_parent_idx;
drop index if exists home_of_giving.reports_disbursement_idx;
drop index if exists home_of_giving.donations_pending_idx;

do $$
declare
  item record;
begin
  for item in
    select index_ns.nspname as schema_name, index_class.relname as index_name
    from pg_index i
    join pg_class table_class on table_class.oid = i.indrelid
    join pg_namespace table_ns on table_ns.oid = table_class.relnamespace
    join pg_class index_class on index_class.oid = i.indexrelid
    join pg_namespace index_ns on index_ns.oid = index_class.relnamespace
    where (table_ns.nspname, table_class.relname) in (
      ('home_of_giving_private', 'beneficiary_contacts'),
      ('home_of_giving', 'beneficiaries'),
      ('home_of_giving', 'events'),
      ('home_of_giving', 'event_media'),
      ('home_of_giving', 'disbursements'),
      ('home_of_giving', 'disbursement_allocations')
    )
      and not exists (
        select 1
        from pg_constraint constraint_row
        where constraint_row.conindid = i.indexrelid
      )
  loop
    execute format('drop index %I.%I', item.schema_name, item.index_name);
  end loop;
end
$$;

do $$
declare
  item record;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'home_of_giving'
      and table_name = 'reports'
      and column_name = 'disbursement_id'
  ) then
    for item in
      select constraint_row.conname
      from pg_constraint constraint_row
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = any (constraint_row.conkey)
      where constraint_row.conrelid = 'home_of_giving.reports'::regclass
        and constraint_row.contype = 'f'
        and attribute_row.attname = 'disbursement_id'
    loop
      execute format(
        'alter table home_of_giving.reports drop constraint %I',
        item.conname
      );
    end loop;

    alter table home_of_giving.reports drop column disbursement_id;
  end if;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select constraint_row.conname
    from pg_constraint constraint_row
    join pg_attribute attribute_row
      on attribute_row.attrelid = constraint_row.conrelid
     and attribute_row.attnum = any (constraint_row.conkey)
    where constraint_row.conrelid = 'home_of_giving.reports'::regclass
      and constraint_row.contype = 'f'
      and attribute_row.attname = 'campaign_id'
  loop
    execute format(
      'alter table home_of_giving.reports drop constraint %I',
      item.conname
    );
  end loop;

  alter table home_of_giving.reports
    add constraint reports_campaign_id_fkey
    foreign key (campaign_id)
    references home_of_giving.campaigns (id)
    on delete restrict;
end
$$;

do $$
declare
  item record;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'home_of_giving'
      and table_name = 'campaigns'
      and column_name = 'beneficiary_id'
  ) then
    alter table home_of_giving.campaigns
      drop constraint if exists campaigns_public_requirements;

    for item in
      select constraint_row.conname
      from pg_constraint constraint_row
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = any (constraint_row.conkey)
      where constraint_row.conrelid = 'home_of_giving.campaigns'::regclass
        and constraint_row.contype = 'f'
        and attribute_row.attname = 'beneficiary_id'
    loop
      execute format(
        'alter table home_of_giving.campaigns drop constraint %I',
        item.conname
      );
    end loop;

    alter table home_of_giving.campaigns drop column beneficiary_id;
  end if;
end
$$;

do $$
declare
  item record;
begin
  for item in
    select
      source_ns.nspname as source_schema,
      source.relname as source_table,
      constraint_row.conname
    from pg_constraint constraint_row
    join pg_class source on source.oid = constraint_row.conrelid
    join pg_namespace source_ns on source_ns.oid = source.relnamespace
    where constraint_row.contype = 'f'
      and (source_ns.nspname, source.relname) in (
        ('home_of_giving_private', 'beneficiary_contacts'),
        ('home_of_giving', 'events'),
        ('home_of_giving', 'event_media'),
        ('home_of_giving', 'disbursements'),
        ('home_of_giving', 'disbursement_allocations')
      )
  loop
    execute format(
      'alter table %I.%I drop constraint %I',
      item.source_schema,
      item.source_table,
      item.conname
    );
  end loop;
end
$$;

do $$
declare
  blockers text;
begin
  select string_agg(
    format('%I.%I (%I)', source_ns.nspname, source.relname, constraint_row.conname),
    ', ' order by source_ns.nspname, source.relname, constraint_row.conname
  )
  into blockers
  from pg_constraint constraint_row
  join pg_class source on source.oid = constraint_row.conrelid
  join pg_namespace source_ns on source_ns.oid = source.relnamespace
  join pg_class target on target.oid = constraint_row.confrelid
  join pg_namespace target_ns on target_ns.oid = target.relnamespace
  where constraint_row.contype = 'f'
    and (target_ns.nspname, target.relname) in (
      ('home_of_giving_private', 'beneficiary_contacts'),
      ('home_of_giving', 'beneficiaries'),
      ('home_of_giving', 'events'),
      ('home_of_giving', 'event_media'),
      ('home_of_giving', 'disbursements'),
      ('home_of_giving', 'disbursement_allocations')
    );

  if blockers is not null then
    raise exception 'Migrasi dibatalkan karena masih ada foreign key ke modul lama: %', blockers;
  end if;
end
$$;

drop table if exists home_of_giving.event_media;
drop table if exists home_of_giving.events;
drop table if exists home_of_giving.disbursement_allocations;
drop table if exists home_of_giving.disbursements;
drop table if exists home_of_giving_private.beneficiary_contacts;
drop table if exists home_of_giving.beneficiaries;

drop type if exists home_of_giving.event_status;
drop type if exists home_of_giving.disbursement_status;
drop type if exists home_of_giving.beneficiary_kind;

alter table home_of_giving.donations
  drop constraint if exists donations_verified_meta,
  drop constraint if exists donations_verified_identity,
  drop constraint if exists donations_rejected_reason,
  drop constraint if exists donations_status_verified;

delete from home_of_giving.donations
where status in ('rejected', 'void');

update home_of_giving.donations
set status = 'verified',
    verified_at = coalesce(verified_at, updated_at, created_at, now()),
    verified_by = coalesce(verified_by, updated_by, created_by),
    rejected_reason = null
where status = 'pending';

update home_of_giving.donations
set verified_at = coalesce(updated_at, created_at, now()),
    verified_by = coalesce(verified_by, updated_by, created_by)
where status = 'verified'
  and verified_at is null;

alter table home_of_giving.donations
  alter column status set default 'verified',
  alter column verified_at set default now(),
  alter column verified_at set not null,
  add constraint donations_status_verified check (status = 'verified'),
  add constraint donations_verified_meta check (verified_at is not null);

alter table home_of_giving.campaigns
  drop constraint if exists campaigns_public_requirements;

create or replace function home_of_giving_private.mask_donor_name(full_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  cleaned text;
  parts text[];
  total integer;
  head text;
  tail text;
begin
  cleaned := btrim(regexp_replace(coalesce(full_name, ''), '\s+', ' ', 'g'));

  if cleaned = '' then
    return 'Donatur';
  end if;

  parts := string_to_array(cleaned, ' ');
  total := array_length(parts, 1);
  head := left(parts[1], 3) || '***';

  if total = 1 then
    return head;
  end if;

  tail := upper(left(parts[total], 1)) || '.';
  return head || ' ' || tail;
end;
$$;

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

  if tg_op = 'UPDATE'
    and (new.amount_idr <> old.amount_idr or new.campaign_id <> old.campaign_id) then
    raise exception 'Donasi terverifikasi tidak dapat diubah nominal atau proyeknya. Batalkan dahulu lalu catat ulang.';
  end if;

  new.verified_at := coalesce(new.verified_at, now());
  new.verified_by := coalesce(new.verified_by, (select auth.uid()));
  return new;
end;
$$;

create or replace function home_of_giving_private.enforce_campaign_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('running', 'closed', 'disbursed', 'reported') and new.published_at is null then
    new.published_at := now();
  end if;

  if new.status = 'disbursed' and new.disbursed_at is null then
    new.disbursed_at := now();
  end if;

  if new.status = 'reported' and new.reported_at is null then
    new.reported_at := now();
  end if;

  if new.status in ('closed', 'disbursed', 'reported') and new.closed_at is null then
    new.closed_at := now();
  end if;

  return new;
end;
$$;

revoke execute on function home_of_giving_private.mask_donor_name(text) from public, anon, authenticated, service_role;
revoke execute on function home_of_giving_private.enforce_donation_rules() from public, anon, authenticated, service_role;
revoke execute on function home_of_giving_private.enforce_campaign_rules() from public, anon, authenticated, service_role;
grant execute on function home_of_giving_private.mask_donor_name(text) to service_role;
grant execute on function home_of_giving_private.enforce_donation_rules() to service_role;
grant execute on function home_of_giving_private.enforce_campaign_rules() to service_role;

create trigger enforce_rules
  before insert or update on home_of_giving.donations
  for each row execute function home_of_giving_private.enforce_donation_rules();

create trigger enforce_rules
  before insert or update on home_of_giving.campaigns
  for each row execute function home_of_giving_private.enforce_campaign_rules();

revoke all on table home_of_giving.campaigns from anon;
grant select (
  id, slug, title, beneficiary_name, beneficiary_location, cover_media_id,
  status, summary, story_paragraphs, quote_text, quote_author, target_amount_idr,
  starts_on, ends_on, total_beneficiaries, is_featured, published_at, closed_at,
  disbursed_at, reported_at
) on home_of_giving.campaigns to anon;

revoke all on table home_of_giving.donations from anon, authenticated;
grant select (id, campaign_id, public_name, amount_idr, donated_on, status)
  on home_of_giving.donations to anon;
grant select on table home_of_giving.donations to authenticated;
grant all on table home_of_giving.donations to service_role;

drop policy if exists admin_insert on home_of_giving.donations;
drop policy if exists admin_update on home_of_giving.donations;
drop policy if exists admin_delete on home_of_giving.donations;
drop policy if exists admin_read on home_of_giving.donations;
create policy admin_read on home_of_giving.donations
  for select to authenticated
  using (
    status = 'verified'
    and (select home_of_giving_private.is_admin())
  );

create or replace view home_of_giving.campaign_stats
with (security_invoker = true) as
select
  c.id as campaign_id,
  c.slug,
  c.target_amount_idr,
  coalesce(sum(d.amount_idr) filter (where d.status = 'verified'), 0)::bigint as raised_amount_idr,
  count(d.id) filter (where d.status = 'verified')::integer as verified_donation_count,
  least(
    100,
    floor(
      coalesce(sum(d.amount_idr) filter (where d.status = 'verified'), 0) * 100.0
      / nullif(c.target_amount_idr, 0)
    )
  )::integer as percent_funded,
  max(d.donated_on) filter (where d.status = 'verified') as last_donation_on
from home_of_giving.campaigns c
left join home_of_giving.donations d on d.campaign_id = c.id
group by c.id, c.slug, c.target_amount_idr;

create or replace view home_of_giving.public_campaigns
with (security_invoker = true) as
select
  c.id,
  c.slug,
  c.title,
  c.status,
  c.summary,
  c.story_paragraphs,
  c.quote_text,
  c.quote_author,
  c.target_amount_idr,
  c.starts_on,
  c.ends_on,
  c.total_beneficiaries,
  c.beneficiary_name,
  c.beneficiary_location,
  c.is_featured,
  c.published_at,
  c.closed_at,
  c.disbursed_at,
  c.reported_at,
  m.external_url as cover_external_url,
  m.storage_bucket as cover_storage_bucket,
  m.storage_path as cover_storage_path,
  m.focal_position as cover_focal_position,
  m.alt_text as cover_alt_text,
  s.raised_amount_idr,
  s.verified_donation_count,
  s.percent_funded,
  greatest(0, (c.ends_on - (now() at time zone 'Asia/Jakarta')::date))::integer as days_remaining
from home_of_giving.campaigns c
left join home_of_giving.media_assets m on m.id = c.cover_media_id
left join home_of_giving.campaign_stats s on s.campaign_id = c.id
where c.published_at is not null
  and c.status in ('running', 'closed', 'disbursed', 'reported');

create or replace view home_of_giving.public_donation_ledger
with (security_invoker = true) as
select
  d.id,
  d.donated_on,
  d.public_name,
  d.amount_idr,
  c.id as campaign_id,
  c.slug as campaign_slug,
  c.title as campaign_title
from home_of_giving.donations d
join home_of_giving.campaigns c on c.id = d.campaign_id
where d.status = 'verified'
  and c.published_at is not null
  and c.status in ('running', 'closed', 'disbursed', 'reported');

create or replace view home_of_giving.public_campaign_milestones
with (security_invoker = true) as
select
  ms.id,
  ms.campaign_id,
  ms.kind,
  ms.title,
  ms.detail,
  ms.occurred_on,
  ms.sort_order
from home_of_giving.campaign_milestones ms
join home_of_giving.campaigns c on c.id = ms.campaign_id
where ms.is_published
  and c.published_at is not null;

create or replace view home_of_giving.public_reports
with (security_invoker = true) as
select
  r.id,
  r.kind,
  r.campaign_id,
  r.title,
  r.period_label,
  r.storage_bucket,
  r.storage_path,
  r.external_url,
  r.published_at
from home_of_giving.reports r
where r.published_at is not null;

create or replace view home_of_giving.public_blog_posts
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.body_markdown,
  p.author_name,
  p.read_minutes,
  p.is_featured,
  p.published_at,
  p.campaign_id,
  m.external_url as cover_external_url,
  m.storage_bucket as cover_storage_bucket,
  m.storage_path as cover_storage_path,
  m.focal_position as cover_focal_position,
  m.alt_text as cover_alt_text
from home_of_giving.blog_posts p
left join home_of_giving.media_assets m on m.id = p.cover_media_id
where p.status = 'published'
  and p.published_at is not null;

create or replace view home_of_giving.public_gallery_media
with (security_invoker = true) as
select
  m.id,
  m.media_type,
  m.external_url,
  m.storage_bucket,
  m.storage_path,
  m.caption,
  m.alt_text,
  m.credit,
  m.focal_position,
  m.layout_span,
  m.album_label,
  m.location_label,
  m.captured_on,
  m.sort_order,
  cm.campaign_id,
  c.slug as campaign_slug,
  c.title as campaign_title
from home_of_giving.media_assets m
left join home_of_giving.campaign_media cm on cm.media_id = m.id
left join home_of_giving.campaigns c on c.id = cm.campaign_id
  and c.published_at is not null
  and c.status in ('running', 'closed', 'disbursed', 'reported')
where m.is_published
  and (cm.campaign_id is null or c.id is not null);

create or replace view home_of_giving.public_campaign_media
with (security_invoker = true) as
select
  cm.campaign_id,
  cm.media_id,
  cm.role,
  cm.sort_order,
  m.media_type,
  m.external_url,
  m.storage_bucket,
  m.storage_path,
  m.caption,
  m.alt_text,
  m.focal_position,
  m.layout_span
from home_of_giving.campaign_media cm
join home_of_giving.media_assets m on m.id = cm.media_id
join home_of_giving.campaigns c on c.id = cm.campaign_id
where m.is_published
  and c.published_at is not null;

create or replace view home_of_giving.site_stats
with (security_invoker = true) as
select
  coalesce(sum(s.raised_amount_idr), 0)::bigint as total_raised_idr,
  coalesce(sum(s.verified_donation_count), 0)::integer as verified_donation_count,
  count(*) filter (where c.status = 'running')::integer as running_campaign_count,
  count(*) filter (where c.status in ('closed', 'disbursed', 'reported'))::integer as completed_campaign_count,
  coalesce(sum(c.total_beneficiaries) filter (where c.status in ('closed', 'disbursed', 'reported')), 0)::integer as total_beneficiaries
from home_of_giving.campaigns c
join home_of_giving.campaign_stats s on s.campaign_id = c.id
where c.published_at is not null
  and c.status in ('running', 'closed', 'disbursed', 'reported');

create or replace view home_of_giving.public_site_settings
with (security_invoker = true) as
select s.key, s.value
from home_of_giving.site_settings s
where s.is_public;

create or replace view home_of_giving.public_annual_goals
with (security_invoker = true) as
select g.year, g.target_amount_idr
from home_of_giving.annual_goals g
where g.is_published;

do $$
declare
  target text;
  targets text[] := array[
    'campaign_stats',
    'public_campaigns',
    'public_donation_ledger',
    'public_campaign_milestones',
    'public_reports',
    'public_blog_posts',
    'public_gallery_media',
    'public_campaign_media',
    'site_stats',
    'public_site_settings',
    'public_annual_goals'
  ];
begin
  foreach target in array targets loop
    execute format('revoke all on table home_of_giving.%I from public, anon, authenticated, service_role', target);
    execute format('grant select on table home_of_giving.%I to anon, authenticated, service_role', target);
  end loop;
end
$$;

create or replace function home_of_giving.admin_whoami()
returns table (user_id uuid, display_name text, is_admin boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) as user_id,
    m.display_name,
    coalesce(m.is_active, false) as is_admin
  from (select 1) base
  left join home_of_giving_private.admin_members m
    on m.user_id = (select auth.uid())
   and m.is_active;
$$;

create or replace function home_of_giving.admin_record_donation(
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date,
  p_evidence_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  identity_id uuid;
  donation_id uuid;
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
    raise exception 'Proyek tidak ditemukan';
  end if;

  insert into home_of_giving_private.donor_identities (full_name, created_by)
  values (btrim(p_full_name), actor)
  returning id into identity_id;

  insert into home_of_giving.donations (
    campaign_id, donor_identity_id, public_name, amount_idr, donated_on,
    status, verified_at, verified_by, created_by, updated_by
  )
  values (
    p_campaign_id, identity_id, home_of_giving_private.mask_donor_name(p_full_name),
    p_amount_idr, p_donated_on, 'verified', now(), actor, actor, actor
  )
  returning id into donation_id;

  if nullif(btrim(coalesce(p_evidence_path, '')), '') is not null then
    insert into home_of_giving_private.donation_evidence (donation_id, storage_path, uploaded_by)
    values (donation_id, btrim(p_evidence_path), actor);
  end if;

  return donation_id;
end;
$$;

create or replace function home_of_giving.admin_donation_detail(p_donation_id uuid)
returns table (
  id uuid,
  campaign_id uuid,
  campaign_title text,
  full_name text,
  public_name text,
  amount_idr bigint,
  donated_on date,
  status home_of_giving.donation_status,
  is_legacy boolean,
  verified_at timestamptz,
  evidence_paths text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not home_of_giving_private.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  return query
  select
    d.id,
    d.campaign_id,
    c.title,
    i.full_name,
    d.public_name,
    d.amount_idr,
    d.donated_on,
    d.status,
    d.is_legacy,
    d.verified_at,
    coalesce(
      array_agg(e.storage_path order by e.uploaded_at, e.id) filter (where e.id is not null),
      array[]::text[]
    )
  from home_of_giving.donations d
  join home_of_giving.campaigns c on c.id = d.campaign_id
  left join home_of_giving_private.donor_identities i on i.id = d.donor_identity_id
  left join home_of_giving_private.donation_evidence e on e.donation_id = d.id
  where d.id = p_donation_id
    and d.status = 'verified'
  group by d.id, c.title, i.full_name;
end;
$$;

create or replace function home_of_giving.admin_dashboard_summary()
returns table (
  total_donation_count integer,
  total_donation_amount_idr bigint,
  running_campaign_count integer,
  unpublished_report_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not home_of_giving_private.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from home_of_giving.donations where status = 'verified'),
    (select coalesce(sum(amount_idr), 0)::bigint from home_of_giving.donations where status = 'verified'),
    (select count(*)::integer from home_of_giving.campaigns where status = 'running'),
    (select count(*)::integer from home_of_giving.reports where published_at is null);
end;
$$;

do $$
declare
  fn text;
  fns text[] := array[
    'home_of_giving.admin_whoami()',
    'home_of_giving.admin_record_donation(uuid, text, bigint, date, text)',
    'home_of_giving.admin_donation_detail(uuid)',
    'home_of_giving.admin_dashboard_summary()'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;

create or replace view public.hog_campaigns
with (security_invoker = true) as
select * from home_of_giving.public_campaigns;

create or replace view public.hog_campaign_stats
with (security_invoker = true) as
select * from home_of_giving.campaign_stats;

create or replace view public.hog_donation_ledger
with (security_invoker = true) as
select * from home_of_giving.public_donation_ledger;

create or replace view public.hog_campaign_milestones
with (security_invoker = true) as
select * from home_of_giving.public_campaign_milestones;

create or replace view public.hog_reports
with (security_invoker = true) as
select * from home_of_giving.public_reports;

create or replace view public.hog_blog_posts
with (security_invoker = true) as
select * from home_of_giving.public_blog_posts;

create or replace view public.hog_gallery_media
with (security_invoker = true) as
select * from home_of_giving.public_gallery_media;

create or replace view public.hog_campaign_media
with (security_invoker = true) as
select * from home_of_giving.public_campaign_media;

create or replace view public.hog_site_stats
with (security_invoker = true) as
select * from home_of_giving.site_stats;

create or replace view public.hog_site_settings
with (security_invoker = true) as
select * from home_of_giving.public_site_settings;

create or replace view public.hog_annual_goals
with (security_invoker = true) as
select * from home_of_giving.public_annual_goals;

do $$
declare
  target text;
  targets text[] := array[
    'hog_campaigns',
    'hog_campaign_stats',
    'hog_donation_ledger',
    'hog_campaign_milestones',
    'hog_reports',
    'hog_blog_posts',
    'hog_gallery_media',
    'hog_campaign_media',
    'hog_site_stats',
    'hog_site_settings',
    'hog_annual_goals'
  ];
begin
  foreach target in array targets loop
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', target);
    execute format('grant select on table public.%I to anon, authenticated, service_role', target);
  end loop;
end
$$;

create or replace view public.hog_admin_branches
with (security_invoker = true) as
select * from home_of_giving.branches;

create or replace view public.hog_admin_media_assets
with (security_invoker = true) as
select * from home_of_giving.media_assets;

create or replace view public.hog_admin_campaigns
with (security_invoker = true) as
select
  id,
  slug,
  title,
  beneficiary_name,
  beneficiary_location,
  cover_media_id,
  status,
  summary,
  story_paragraphs,
  quote_text,
  quote_author,
  target_amount_idr,
  starts_on,
  ends_on,
  total_beneficiaries,
  is_featured,
  needs_review,
  review_note,
  internal_note,
  published_at,
  closed_at,
  disbursed_at,
  reported_at,
  created_at,
  updated_at,
  created_by,
  updated_by
from home_of_giving.campaigns;

create or replace view public.hog_admin_donations
with (security_invoker = true) as
select
  id,
  campaign_id,
  public_name,
  amount_idr,
  donated_on,
  status,
  is_legacy,
  verified_at,
  created_at,
  updated_at
from home_of_giving.donations
where status = 'verified';

create or replace view public.hog_admin_campaign_milestones
with (security_invoker = true) as
select * from home_of_giving.campaign_milestones;

create or replace view public.hog_admin_reports
with (security_invoker = true) as
select * from home_of_giving.reports;

create or replace view public.hog_admin_blog_posts
with (security_invoker = true) as
select * from home_of_giving.blog_posts;

create or replace view public.hog_admin_campaign_media
with (security_invoker = true) as
select * from home_of_giving.campaign_media;

create or replace view public.hog_admin_blog_media
with (security_invoker = true) as
select * from home_of_giving.blog_media;

create or replace view public.hog_admin_annual_goals
with (security_invoker = true) as
select * from home_of_giving.annual_goals;

create or replace view public.hog_admin_site_settings
with (security_invoker = true) as
select * from home_of_giving.site_settings;

do $$
declare
  target text;
  targets text[] := array[
    'hog_admin_branches',
    'hog_admin_media_assets',
    'hog_admin_campaigns',
    'hog_admin_campaign_milestones',
    'hog_admin_reports',
    'hog_admin_blog_posts',
    'hog_admin_campaign_media',
    'hog_admin_blog_media',
    'hog_admin_annual_goals',
    'hog_admin_site_settings'
  ];
begin
  foreach target in array targets loop
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', target);
    execute format('grant select, insert, update, delete on table public.%I to authenticated, service_role', target);
  end loop;
end
$$;

revoke all on table public.hog_admin_donations from public, anon, authenticated, service_role;
grant select on table public.hog_admin_donations to authenticated, service_role;

grant select on table home_of_giving_private.audit_logs to authenticated;

create or replace view public.hog_admin_audit_logs
with (security_invoker = true) as
select * from home_of_giving_private.audit_logs;

revoke all on table public.hog_admin_audit_logs from public, anon, authenticated, service_role;
grant select on table public.hog_admin_audit_logs to authenticated, service_role;

create or replace function public.hog_admin_whoami()
returns table (user_id uuid, display_name text, is_admin boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from home_of_giving.admin_whoami();
$$;

create or replace function public.hog_admin_record_donation(
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date,
  p_evidence_path text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select home_of_giving.admin_record_donation(
    p_campaign_id,
    p_full_name,
    p_amount_idr,
    p_donated_on,
    p_evidence_path
  );
$$;

create or replace function public.hog_admin_donation_detail(p_donation_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select to_jsonb(result)
  from home_of_giving.admin_donation_detail(p_donation_id) result;
$$;

create or replace function public.hog_admin_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select to_jsonb(result)
  from home_of_giving.admin_dashboard_summary() result;
$$;

do $$
declare
  fn text;
  fns text[] := array[
    'public.hog_admin_whoami()',
    'public.hog_admin_record_donation(uuid, text, bigint, date, text)',
    'public.hog_admin_donation_detail(uuid)',
    'public.hog_admin_dashboard_summary()'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;

commit;
