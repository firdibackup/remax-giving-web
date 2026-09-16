begin;

create schema if not exists home_of_giving_private;

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
declare
  collision text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
  into collision
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any (array[
      'hog_campaigns',
      'hog_admin_campaigns',
      'hog_admin_campaign_categories',
      'hog_category_distribution_stats'
    ])
    and (
      c.relkind <> 'v'
      or (
        position('home_of_giving.' in pg_get_viewdef(c.oid, true)) = 0
        and position('home_of_giving_private.' in pg_get_viewdef(c.oid, true)) = 0
      )
    );

  if collision is not null then
    raise exception 'Migrasi dibatalkan karena nama object public dipakai backend lain: %', collision;
  end if;
end
$$;

do $$
begin
  if to_regclass('home_of_giving.campaign_categories') is not null then
    execute $archive$
      insert into home_of_giving_private.simplification_archive (
        migration_key, source_schema, source_table, source_key, row_data
      )
      select
        '2026-09-16_remove_campaign_categories_v1',
        'home_of_giving',
        'campaign_categories',
        id::text,
        to_jsonb(t)
      from home_of_giving.campaign_categories t
      on conflict (migration_key, source_schema, source_table, source_key) do nothing
    $archive$;
  end if;
end
$$;

drop view if exists public.hog_campaigns;
drop view if exists public.hog_admin_campaigns;
drop view if exists public.hog_admin_campaign_categories;
drop view if exists public.hog_category_distribution_stats;

drop view if exists home_of_giving.public_campaigns;
drop view if exists home_of_giving.category_distribution_stats;

do $$
begin
  if to_regclass('home_of_giving.campaigns') is not null then
    execute 'alter table home_of_giving.campaigns drop column if exists category_id';
  end if;
end
$$;

drop table if exists home_of_giving.campaign_categories;

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

create or replace view public.hog_campaigns
with (security_invoker = true) as
select * from home_of_giving.public_campaigns;

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

revoke all on table public.hog_campaigns from public, anon, authenticated, service_role;
grant select on table public.hog_campaigns to anon, authenticated, service_role;

revoke all on table public.hog_admin_campaigns from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.hog_admin_campaigns to authenticated, service_role;

do $$
declare
  target text;
  targets text[] := array[
    'campaign_stats', 'public_campaigns', 'public_donation_ledger',
    'public_campaign_milestones', 'public_reports', 'public_blog_posts',
    'public_gallery_media', 'public_campaign_media', 'site_stats',
    'public_site_settings', 'public_annual_goals'
  ];
begin
  foreach target in array targets loop
    execute format('revoke all on table home_of_giving.%I from anon, authenticated', target);
    execute format('grant select on table home_of_giving.%I to anon, authenticated', target);
  end loop;
end
$$;

select n.nspname as schema_name, c.relname as object_name, c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where (n.nspname, c.relname) in (
  ('home_of_giving', 'campaign_categories'),
  ('home_of_giving', 'category_distribution_stats'),
  ('public', 'hog_admin_campaign_categories'),
  ('public', 'hog_category_distribution_stats')
)
order by schema_name, object_name;

select table_name, column_name
from information_schema.columns
where table_schema = 'home_of_giving'
  and table_name = 'campaigns'
  and column_name = 'category_id'
order by table_name, column_name;

commit;
