revoke all on schema home_of_giving_private from anon, authenticated;
revoke all on all tables in schema home_of_giving_private from anon, authenticated;
revoke all on all functions in schema home_of_giving_private from anon, authenticated;
revoke all on all sequences in schema home_of_giving_private from anon, authenticated;
grant usage on schema home_of_giving_private to authenticated, service_role;
grant all on all tables in schema home_of_giving_private to service_role;
grant all on all functions in schema home_of_giving_private to service_role;
grant all on all sequences in schema home_of_giving_private to service_role;

alter default privileges for role postgres in schema home_of_giving_private
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving_private
  revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving_private
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving_private
  grant all on tables to service_role;
alter default privileges for role postgres in schema home_of_giving_private
  grant all on functions to service_role;
alter default privileges for role postgres in schema home_of_giving_private
  grant all on sequences to service_role;

alter table home_of_giving_private.admin_members enable row level security;
alter table home_of_giving_private.audit_logs enable row level security;
alter table home_of_giving_private.simplification_archive enable row level security;
alter table home_of_giving_private.donor_identities enable row level security;
alter table home_of_giving_private.donation_evidence enable row level security;

alter table home_of_giving_private.admin_members force row level security;
alter table home_of_giving_private.audit_logs force row level security;
alter table home_of_giving_private.simplification_archive force row level security;

grant usage on schema home_of_giving to anon, authenticated, service_role;
grant all on all tables in schema home_of_giving to service_role;
grant all on all functions in schema home_of_giving to service_role;
grant all on all sequences in schema home_of_giving to service_role;

alter default privileges for role postgres in schema home_of_giving
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving
  revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema home_of_giving
  grant all on tables to service_role;
alter default privileges for role postgres in schema home_of_giving
  grant all on functions to service_role;
alter default privileges for role postgres in schema home_of_giving
  grant all on sequences to service_role;

do $$
declare
  target text;
  targets text[] := array[
    'blog_categories', 'branches', 'media_assets', 'campaigns',
    'donations', 'campaign_milestones', 'reports', 'blog_posts', 'campaign_media',
    'blog_media', 'annual_goals', 'site_settings'
  ];
begin
  foreach target in array targets loop
    execute format('alter table home_of_giving.%I enable row level security', target);
    execute format('revoke all on table home_of_giving.%I from anon, authenticated', target);
  end loop;
end
$$;

grant select on table home_of_giving.blog_categories,
  home_of_giving.branches, home_of_giving.media_assets, home_of_giving.campaigns,
  home_of_giving.donations, home_of_giving.campaign_milestones, home_of_giving.reports,
  home_of_giving.blog_posts, home_of_giving.campaign_media, home_of_giving.blog_media,
  home_of_giving.annual_goals, home_of_giving.site_settings
  to authenticated;

grant select (
  id, media_type, storage_bucket, storage_path, external_url, caption, alt_text,
  credit, focal_position, layout_span, album_label, location_label, captured_on,
  sort_order, is_published
) on home_of_giving.media_assets to anon;
grant select (
  id, slug, title, beneficiary_name, beneficiary_location, cover_media_id,
  status, summary, story_paragraphs, quote_text, quote_author, target_amount_idr,
  starts_on, ends_on, total_beneficiaries, is_featured, published_at, closed_at,
  disbursed_at, reported_at
) on home_of_giving.campaigns to anon;
grant select (id, campaign_id, public_name, amount_idr, donated_on, status)
  on home_of_giving.donations to anon;
grant select (id, campaign_id, kind, title, detail, occurred_on, sort_order, is_published)
  on home_of_giving.campaign_milestones to anon;
grant select (
  id, kind, campaign_id, title, storage_bucket, storage_path, external_url,
  period_label, published_at
) on home_of_giving.reports to anon;
grant select (
  id, slug, title, category_id, campaign_id, cover_media_id, excerpt, body_markdown,
  author_name, read_minutes, is_featured, status, published_at
) on home_of_giving.blog_posts to anon;
grant select (campaign_id, media_id, role, sort_order)
  on home_of_giving.campaign_media to anon;
grant select (post_id, media_id, sort_order)
  on home_of_giving.blog_media to anon;
grant select (year, target_amount_idr, is_published)
  on home_of_giving.annual_goals to anon;
grant select (key, value, is_public)
  on home_of_giving.site_settings to anon;

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

drop policy if exists public_read on home_of_giving.blog_categories;
create policy public_read on home_of_giving.blog_categories
  for select to anon
  using (true);

drop policy if exists public_read on home_of_giving.campaigns;
create policy public_read on home_of_giving.campaigns
  for select to anon
  using (
    published_at is not null
    and status in ('running', 'closed', 'disbursed', 'reported')
  );

drop policy if exists public_read on home_of_giving.donations;
create policy public_read on home_of_giving.donations
  for select to anon
  using (
    status = 'verified'
    and exists (
      select 1
      from home_of_giving.campaigns c
      where c.id = donations.campaign_id
        and c.published_at is not null
        and c.status in ('running', 'closed', 'disbursed', 'reported')
    )
  );

drop policy if exists public_read on home_of_giving.campaign_milestones;
create policy public_read on home_of_giving.campaign_milestones
  for select to anon
  using (
    is_published
    and exists (
      select 1
      from home_of_giving.campaigns c
      where c.id = campaign_milestones.campaign_id
        and c.published_at is not null
    )
  );

drop policy if exists public_read on home_of_giving.reports;
create policy public_read on home_of_giving.reports
  for select to anon
  using (published_at is not null);

drop policy if exists public_read on home_of_giving.media_assets;
create policy public_read on home_of_giving.media_assets
  for select to anon
  using (is_published);

drop policy if exists public_read on home_of_giving.blog_posts;
create policy public_read on home_of_giving.blog_posts
  for select to anon
  using (status = 'published' and published_at is not null);

drop policy if exists public_read on home_of_giving.campaign_media;
create policy public_read on home_of_giving.campaign_media
  for select to anon
  using (
    exists (
      select 1
      from home_of_giving.media_assets m
      where m.id = campaign_media.media_id
        and m.is_published
    )
    and exists (
      select 1
      from home_of_giving.campaigns c
      where c.id = campaign_media.campaign_id
        and c.published_at is not null
    )
  );

drop policy if exists public_read on home_of_giving.blog_media;
create policy public_read on home_of_giving.blog_media
  for select to anon
  using (
    exists (
      select 1
      from home_of_giving.media_assets m
      where m.id = blog_media.media_id
        and m.is_published
    )
    and exists (
      select 1
      from home_of_giving.blog_posts p
      where p.id = blog_media.post_id
        and p.status = 'published'
    )
  );

drop policy if exists public_read on home_of_giving.annual_goals;
create policy public_read on home_of_giving.annual_goals
  for select to anon
  using (is_published);

drop policy if exists public_read on home_of_giving.site_settings;
create policy public_read on home_of_giving.site_settings
  for select to anon
  using (is_public);

do $$
declare
  target text;
  targets text[] := array[
    'blog_categories', 'branches', 'media_assets', 'campaigns',
    'campaign_milestones', 'reports', 'blog_posts', 'campaign_media', 'blog_media',
    'annual_goals', 'site_settings'
  ];
begin
  foreach target in array targets loop
    execute format('grant select, insert, update, delete on table home_of_giving.%I to authenticated', target);

    execute format('drop policy if exists admin_read on home_of_giving.%I', target);
    execute format(
      'create policy admin_read on home_of_giving.%I for select to authenticated using ((select home_of_giving_private.is_admin()))',
      target
    );

    execute format('drop policy if exists admin_insert on home_of_giving.%I', target);
    execute format(
      'create policy admin_insert on home_of_giving.%I for insert to authenticated with check ((select home_of_giving_private.is_admin()))',
      target
    );

    execute format('drop policy if exists admin_update on home_of_giving.%I', target);
    execute format(
      'create policy admin_update on home_of_giving.%I for update to authenticated using ((select home_of_giving_private.is_admin())) with check ((select home_of_giving_private.is_admin()))',
      target
    );

    execute format('drop policy if exists admin_delete on home_of_giving.%I', target);
    execute format(
      'create policy admin_delete on home_of_giving.%I for delete to authenticated using ((select home_of_giving_private.is_admin()))',
      target
    );
  end loop;
end
$$;

drop policy if exists admin_read on home_of_giving.donations;
create policy admin_read on home_of_giving.donations
  for select to authenticated
  using (
    status = 'verified'
    and (select home_of_giving_private.is_admin())
  );

drop policy if exists admin_all on home_of_giving_private.donor_identities;
create policy admin_all on home_of_giving_private.donor_identities
  for all to authenticated
  using ((select home_of_giving_private.is_admin()))
  with check ((select home_of_giving_private.is_admin()));

drop policy if exists admin_all on home_of_giving_private.donation_evidence;
create policy admin_all on home_of_giving_private.donation_evidence
  for all to authenticated
  using ((select home_of_giving_private.is_admin()))
  with check ((select home_of_giving_private.is_admin()));

drop policy if exists admin_read on home_of_giving_private.audit_logs;
create policy admin_read on home_of_giving_private.audit_logs
  for select to authenticated
  using ((select home_of_giving_private.is_admin()));

drop policy if exists admin_read on home_of_giving_private.simplification_archive;
create policy admin_read on home_of_giving_private.simplification_archive
  for select to authenticated
  using ((select home_of_giving_private.is_admin()));

drop policy if exists admin_read on home_of_giving_private.admin_members;
create policy admin_read on home_of_giving_private.admin_members
  for select to authenticated
  using ((select home_of_giving_private.is_admin()));

revoke execute on function home_of_giving_private.is_admin() from public, anon;
grant execute on function home_of_giving_private.is_admin() to authenticated;
revoke execute on function home_of_giving_private.mask_donor_name(text) from public, anon, authenticated;
revoke execute on function home_of_giving_private.set_updated_at() from public, anon, authenticated;
revoke execute on function home_of_giving_private.write_audit() from public, anon, authenticated;
revoke execute on function home_of_giving_private.enforce_donation_rules() from public, anon, authenticated;
revoke execute on function home_of_giving_private.enforce_campaign_rules() from public, anon, authenticated;

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

do $$
declare
  fn text;
  fns text[] := array[
    'home_of_giving.admin_whoami()',
    'home_of_giving.admin_record_donation(uuid, text, bigint, date, text)',
    'home_of_giving.admin_donation_detail(uuid)',
    'home_of_giving.admin_dashboard_summary()',
    'home_of_giving.admin_delete_campaigns(uuid[])'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end
$$;
