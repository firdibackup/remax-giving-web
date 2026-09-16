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
      'hog_admin_branches',
      'hog_admin_media_assets', 'hog_admin_campaigns', 'hog_admin_donations',
      'hog_admin_campaign_milestones', 'hog_admin_reports', 'hog_admin_blog_posts',
      'hog_admin_campaign_media', 'hog_admin_blog_media', 'hog_admin_annual_goals',
      'hog_admin_site_settings', 'hog_admin_audit_logs'
    ])
    and (
      c.relkind <> 'v'
      or (
        position('home_of_giving.' in pg_get_viewdef(c.oid, true)) = 0
        and position('home_of_giving_private.' in pg_get_viewdef(c.oid, true)) = 0
      )
    );

  if collision is not null then
    raise exception 'API bridge dibatalkan karena nama object public sudah dipakai backend lain: %', collision;
  end if;

  select string_agg(p.proname, ', ' order by p.proname)
  into collision
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = any (array[
      'hog_admin_whoami', 'hog_admin_record_donation',
      'hog_admin_donation_detail', 'hog_admin_dashboard_summary',
      'hog_admin_delete_campaigns'
    ])
    and position('home_of_giving.' in p.prosrc) = 0;

  if collision is not null then
    raise exception 'API bridge dibatalkan karena nama function public sudah dipakai backend lain: %', collision;
  end if;
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
    'hog_campaigns', 'hog_campaign_stats', 'hog_donation_ledger',
    'hog_campaign_milestones', 'hog_reports', 'hog_blog_posts',
    'hog_gallery_media', 'hog_campaign_media', 'hog_site_stats',
    'hog_site_settings', 'hog_annual_goals'
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
from home_of_giving.donations;

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
    'hog_admin_media_assets', 'hog_admin_campaigns', 'hog_admin_campaign_milestones',
    'hog_admin_reports', 'hog_admin_blog_posts', 'hog_admin_campaign_media',
    'hog_admin_blog_media', 'hog_admin_annual_goals', 'hog_admin_site_settings'
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

grant select on home_of_giving_private.audit_logs to authenticated;

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
    'public.hog_admin_whoami()',
    'public.hog_admin_record_donation(uuid, text, bigint, date, text)',
    'public.hog_admin_donation_detail(uuid)',
    'public.hog_admin_dashboard_summary()',
    'public.hog_admin_delete_campaigns(uuid[])'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;
