create schema if not exists home_of_giving;
create schema if not exists home_of_giving_private;

do $$
begin
  if to_regtype('home_of_giving.campaign_status') is null then
    create type home_of_giving.campaign_status as enum (
      'draft', 'scheduled', 'running', 'closed', 'disbursed', 'reported', 'cancelled', 'archived'
    );
  end if;

  if to_regtype('home_of_giving.donation_status') is null then
    create type home_of_giving.donation_status as enum ('pending', 'verified', 'rejected', 'void');
  end if;

  if to_regtype('home_of_giving.content_status') is null then
    create type home_of_giving.content_status as enum ('draft', 'scheduled', 'published', 'archived');
  end if;

  if to_regtype('home_of_giving.donor_type') is null then
    create type home_of_giving.donor_type as enum ('individual', 'branch');
  end if;

  if to_regtype('home_of_giving.media_type') is null then
    create type home_of_giving.media_type as enum ('image', 'video', 'document');
  end if;

  if to_regtype('home_of_giving.media_span') is null then
    create type home_of_giving.media_span as enum ('normal', 'wide', 'tall');
  end if;

  if to_regtype('home_of_giving.media_role') is null then
    create type home_of_giving.media_role as enum ('cover', 'gallery', 'handover', 'documentation');
  end if;

  if to_regtype('home_of_giving.milestone_kind') is null then
    create type home_of_giving.milestone_kind as enum (
      'opened', 'goal_reached', 'disbursed', 'report_published', 'custom'
    );
  end if;

  if to_regtype('home_of_giving.report_kind') is null then
    create type home_of_giving.report_kind as enum ('campaign', 'periodic');
  end if;
end
$$;

create table if not exists home_of_giving_private.admin_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists home_of_giving_private.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  before_data jsonb,
  after_data jsonb
);

create index if not exists audit_logs_table_record_idx
  on home_of_giving_private.audit_logs (table_name, record_id, occurred_at desc);

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

create or replace function home_of_giving_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from home_of_giving_private.admin_members m
    where m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

create or replace function home_of_giving_private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function home_of_giving_private.write_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_id text;
  before_data jsonb;
  after_data jsonb;
  payload jsonb;
begin
  if tg_op = 'DELETE' then
    before_data := to_jsonb(old);
    payload := before_data;
  elsif tg_op = 'INSERT' then
    after_data := to_jsonb(new);
    payload := after_data;
  else
    before_data := to_jsonb(old);
    after_data := to_jsonb(new);
    payload := after_data;
  end if;

  record_id := coalesce(payload ->> 'id', payload ->> 'key', payload ->> 'year');

  insert into home_of_giving_private.audit_logs (actor_id, action, table_name, record_id, before_data, after_data)
  values ((select auth.uid()), tg_op, tg_table_name, record_id, before_data, after_data);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

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

create table if not exists home_of_giving.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists home_of_giving.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists home_of_giving.media_assets (
  id uuid primary key default gen_random_uuid(),
  source_key text unique,
  media_type home_of_giving.media_type not null default 'image',
  storage_bucket text,
  storage_path text,
  external_url text,
  caption text,
  alt_text text,
  credit text,
  focal_position text not null default '50% 50%',
  layout_span home_of_giving.media_span not null default 'normal',
  album_label text,
  location_label text,
  captured_on date,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint media_assets_source_present check (
    external_url is not null or (storage_bucket is not null and storage_path is not null)
  )
);

create unique index if not exists media_assets_storage_unique_idx
  on home_of_giving.media_assets (storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;

create index if not exists media_assets_album_idx
  on home_of_giving.media_assets (album_label, sort_order)
  where is_published;

create table if not exists home_of_giving.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  beneficiary_name text,
  beneficiary_location text,
  cover_media_id uuid references home_of_giving.media_assets (id) on delete set null,
  status home_of_giving.campaign_status not null default 'draft',
  summary text,
  story_paragraphs text[] not null default array[]::text[],
  quote_text text,
  quote_author text,
  target_amount_idr bigint not null,
  starts_on date,
  ends_on date,
  total_beneficiaries integer,
  is_featured boolean not null default false,
  needs_review boolean not null default false,
  review_note text,
  internal_note text,
  published_at timestamptz,
  closed_at timestamptz,
  disbursed_at timestamptz,
  reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint campaigns_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint campaigns_target_positive check (target_amount_idr > 0),
  constraint campaigns_period_order check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  ),
  constraint campaigns_total_beneficiaries_positive check (
    total_beneficiaries is null or total_beneficiaries > 0
  )
);

create unique index if not exists campaigns_single_featured_idx
  on home_of_giving.campaigns (is_featured)
  where is_featured;

create index if not exists campaigns_status_published_idx
  on home_of_giving.campaigns (status, published_at desc);

create index if not exists campaigns_cover_media_idx
  on home_of_giving.campaigns (cover_media_id);

create table if not exists home_of_giving_private.donor_identities (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  donor_type home_of_giving.donor_type not null default 'individual',
  branch_id uuid references home_of_giving.branches (id) on delete set null,
  phone text,
  email text,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index if not exists donor_identities_branch_idx
  on home_of_giving_private.donor_identities (branch_id);

create table if not exists home_of_giving.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references home_of_giving.campaigns (id) on delete restrict,
  donor_identity_id uuid references home_of_giving_private.donor_identities (id) on delete restrict,
  donor_type home_of_giving.donor_type not null default 'individual',
  public_name text not null,
  city text,
  branch_id uuid references home_of_giving.branches (id) on delete set null,
  amount_idr bigint not null,
  donated_on date not null,
  external_reference text,
  status home_of_giving.donation_status not null default 'verified',
  is_legacy boolean not null default false,
  internal_note text,
  rejected_reason text,
  verified_at timestamptz not null default now(),
  verified_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint donations_amount_positive check (amount_idr > 0),
  constraint donations_public_name_present check (btrim(public_name) <> ''),
  constraint donations_public_name_masked check (
    public_name = 'Anonim' or position('***' in public_name) > 0
  ),
  constraint donations_status_verified check (status = 'verified'),
  constraint donations_verified_meta check (verified_at is not null)
);

create unique index if not exists donations_external_reference_unique_idx
  on home_of_giving.donations (external_reference)
  where external_reference is not null;

create index if not exists donations_campaign_status_idx
  on home_of_giving.donations (campaign_id, status, donated_on desc);

create index if not exists donations_status_date_idx
  on home_of_giving.donations (status, donated_on desc);

create index if not exists donations_branch_idx
  on home_of_giving.donations (branch_id);

create index if not exists donations_identity_idx
  on home_of_giving.donations (donor_identity_id);

create table if not exists home_of_giving_private.donation_evidence (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references home_of_giving.donations (id) on delete cascade,
  storage_bucket text not null default 'home-of-giving-private-donation-evidence',
  storage_path text not null,
  note text,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users (id),
  unique (storage_bucket, storage_path)
);

create index if not exists donation_evidence_donation_idx
  on home_of_giving_private.donation_evidence (donation_id);

create table if not exists home_of_giving.campaign_milestones (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references home_of_giving.campaigns (id) on delete cascade,
  kind home_of_giving.milestone_kind not null default 'custom',
  title text not null,
  detail text,
  occurred_on date,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_milestones_campaign_idx
  on home_of_giving.campaign_milestones (campaign_id, sort_order);

create table if not exists home_of_giving.reports (
  id uuid primary key default gen_random_uuid(),
  kind home_of_giving.report_kind not null default 'campaign',
  campaign_id uuid references home_of_giving.campaigns (id) on delete restrict,
  title text not null,
  storage_bucket text not null default 'home-of-giving-public-reports',
  storage_path text,
  external_url text,
  period_label text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint reports_scope check (
    (kind = 'campaign' and campaign_id is not null)
    or (kind = 'periodic' and campaign_id is null)
  ),
  constraint reports_file_present check (
    published_at is null or storage_path is not null or external_url is not null
  )
);

create index if not exists reports_campaign_idx
  on home_of_giving.reports (campaign_id, published_at desc);

create index if not exists reports_published_idx
  on home_of_giving.reports (published_at desc)
  where published_at is not null;

create table if not exists home_of_giving.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_id uuid references home_of_giving.blog_categories (id) on delete set null,
  campaign_id uuid references home_of_giving.campaigns (id) on delete set null,
  cover_media_id uuid references home_of_giving.media_assets (id) on delete set null,
  excerpt text,
  body_markdown text,
  author_name text,
  read_minutes integer,
  is_featured boolean not null default false,
  status home_of_giving.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint blog_posts_read_minutes_positive check (read_minutes is null or read_minutes > 0),
  constraint blog_posts_published_meta check (
    status <> 'published' or published_at is not null
  )
);

create unique index if not exists blog_posts_single_featured_idx
  on home_of_giving.blog_posts (is_featured)
  where is_featured;

create index if not exists blog_posts_status_published_idx
  on home_of_giving.blog_posts (status, published_at desc);

create index if not exists blog_posts_category_idx
  on home_of_giving.blog_posts (category_id);

create index if not exists blog_posts_campaign_idx
  on home_of_giving.blog_posts (campaign_id);

create index if not exists blog_posts_cover_media_idx
  on home_of_giving.blog_posts (cover_media_id);

create table if not exists home_of_giving.campaign_media (
  campaign_id uuid not null references home_of_giving.campaigns (id) on delete cascade,
  media_id uuid not null references home_of_giving.media_assets (id) on delete cascade,
  role home_of_giving.media_role not null default 'gallery',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (campaign_id, media_id)
);

create index if not exists campaign_media_media_idx
  on home_of_giving.campaign_media (media_id);

create index if not exists campaign_media_campaign_sort_idx
  on home_of_giving.campaign_media (campaign_id, sort_order);

create table if not exists home_of_giving.blog_media (
  post_id uuid not null references home_of_giving.blog_posts (id) on delete cascade,
  media_id uuid not null references home_of_giving.media_assets (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, media_id)
);

create index if not exists blog_media_media_idx
  on home_of_giving.blog_media (media_id);

create table if not exists home_of_giving.annual_goals (
  year integer primary key,
  target_amount_idr bigint not null,
  is_published boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint annual_goals_target_positive check (target_amount_idr > 0),
  constraint annual_goals_year_range check (year between 2000 and 2100)
);

create table if not exists home_of_giving.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  constraint site_settings_key_format check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

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

do $$
declare
  target text;
  targets text[] := array[
    'blog_categories', 'branches', 'media_assets', 'campaigns',
    'donations', 'campaign_milestones', 'reports', 'blog_posts', 'annual_goals'
  ];
begin
  foreach target in array targets loop
    execute format('drop trigger if exists set_updated_at on home_of_giving.%I', target);
    execute format(
      'create trigger set_updated_at before update on home_of_giving.%I for each row execute function home_of_giving_private.set_updated_at()',
      target
    );
  end loop;
end
$$;

do $$
declare
  target text;
  targets text[] := array[
    'campaigns', 'donations', 'reports', 'blog_posts', 'annual_goals'
  ];
begin
  foreach target in array targets loop
    execute format('drop trigger if exists write_audit on home_of_giving.%I', target);
    execute format(
      'create trigger write_audit after insert or update or delete on home_of_giving.%I for each row execute function home_of_giving_private.write_audit()',
      target
    );
  end loop;
end
$$;

drop trigger if exists enforce_rules on home_of_giving.donations;
create trigger enforce_rules
  before insert or update on home_of_giving.donations
  for each row execute function home_of_giving_private.enforce_donation_rules();

drop trigger if exists enforce_rules on home_of_giving.campaigns;
create trigger enforce_rules
  before insert or update on home_of_giving.campaigns
  for each row execute function home_of_giving_private.enforce_campaign_rules();

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
  cat.slug as category_slug,
  cat.name as category_name,
  m.external_url as cover_external_url,
  m.storage_bucket as cover_storage_bucket,
  m.storage_path as cover_storage_path,
  m.focal_position as cover_focal_position,
  m.alt_text as cover_alt_text
from home_of_giving.blog_posts p
left join home_of_giving.blog_categories cat on cat.id = p.category_id
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
