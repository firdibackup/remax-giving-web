import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sqlFiles = {
  schema: "supabase/sql-editor/01_schema.sql",
  security: "supabase/sql-editor/02_security.sql",
  storage: "supabase/sql-editor/03_storage.sql",
  seed: "supabase/sql-editor/04_seed_demo.sql",
  verify: "supabase/sql-editor/05_verify.sql",
  bridge: "supabase/sql-editor/06_api_bridge.sql",
  verifyBridge: "supabase/sql-editor/07_verify_api_bridge.sql",
  upgrade: "supabase/sql-editor/08_simplify_donation_flow.sql",
  bulkDelete: "supabase/sql-editor/09_campaign_bulk_delete.sql",
  cleanupDrafts: "supabase/sql-editor/10_cleanup_legacy_drafts.sql",
  removeCategories: "supabase/sql-editor/11_remove_campaign_categories.sql",
};

const freshSequence = [
  sqlFiles.schema,
  sqlFiles.security,
  sqlFiles.storage,
  sqlFiles.seed,
  sqlFiles.verify,
  sqlFiles.bridge,
  sqlFiles.verifyBridge,
];

const idempotentSequence = [
  sqlFiles.schema,
  sqlFiles.security,
  sqlFiles.storage,
  sqlFiles.seed,
  sqlFiles.verify,
  sqlFiles.bridge,
  sqlFiles.verifyBridge,
];

const bootstrap = `
create schema if not exists auth;
create schema if not exists storage;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_admin') then create role supabase_admin nologin; end if;
end $$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner_id text
);

alter table storage.objects enable row level security;

create table if not exists public.other_app_records (
  id bigint generated always as identity primary key,
  value text not null
);

insert into public.other_app_records (value) values ('tetap-aman');
grant select on public.other_app_records to anon;

insert into storage.buckets (id, name, public)
values ('other-app-assets', 'other-app-assets', true)
on conflict (id) do nothing;

create policy other_app_policy on storage.objects
for select to anon
using (bucket_id = 'other-app-assets');
`;

const legacySeedDrafts = `
with historical as (
  select * from (values
    ('renovasi-rumah-ibadah', 'Renovasi Rumah Ibadah', 'g3', 80000000::bigint, 'Tersalurkan 12 Jul 2026'),
    ('perpustakaan-mini-sdn-03-cianjur', 'Perpustakaan Mini SDN 03 Cianjur', 'g2', 45000000::bigint, 'Tersalurkan 28 Jun 2026'),
    ('bibit-pohon-kawasan-puncak', 'Bibit Pohon Kawasan Puncak', 'g1', 25000000::bigint, 'Tersalurkan 30 Mei 2026'),
    ('bantuan-kursi-roda', 'Bantuan Kursi Roda', 'g3', 18000000::bigint, 'Tersalurkan 22 Apr 2026'),
    ('sembako-ramadan-200-keluarga', 'Sembako Ramadan 200 Keluarga', 'g1', 60000000::bigint, 'Tersalurkan 18 Mar 2026'),
    ('bantuan-gempa-cianjur', 'Bantuan Gempa Cianjur', 'g2', 95000000::bigint, 'Tersalurkan 5 Feb 2026')
  ) as h(slug, title, media_source_key, target_amount_idr, source_note)
)
insert into home_of_giving.campaigns (
  slug, title, cover_media_id, status, summary, story_paragraphs,
  target_amount_idr, needs_review, review_note
)
select
  h.slug,
  h.title,
  m.id,
  'draft'::home_of_giving.campaign_status,
  'Data historis dari seed belum memiliki ledger donasi pendukung.',
  array['Proyek ini disimpan sebagai draft rekonsiliasi dan belum dipublikasikan ke website.']::text[],
  h.target_amount_idr,
  true,
  'Butuh rekonsiliasi ledger donasi sebelum dapat dipublikasikan. Catatan seed: ' || h.source_note
from historical h
left join home_of_giving.media_assets m on m.source_key = h.media_source_key
on conflict (slug) do nothing;

insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order)
select c.id, m.id, rel.role::home_of_giving.media_role, rel.sort_order
from (values
  ('renovasi-rumah-ibadah', 'g6', 'documentation', 10),
  ('perpustakaan-mini-sdn-03-cianjur', 'g4', 'documentation', 10),
  ('bibit-pohon-kawasan-puncak', 'g11', 'documentation', 10),
  ('sembako-ramadan-200-keluarga', 'g7', 'documentation', 10)
) as rel(campaign_slug, media_source_key, role, sort_order)
join home_of_giving.campaigns c on c.slug = rel.campaign_slug
join home_of_giving.media_assets m on m.source_key = rel.media_source_key
on conflict (campaign_id, media_id) do nothing;

update home_of_giving.blog_posts p
set campaign_id = c.id
from home_of_giving.campaigns c
where c.slug = 'perpustakaan-mini-sdn-03-cianjur'
  and p.slug = 'perpustakaan-mini-sdn-03-dari-rak-kosong';
`;

const deletionFixture = `
insert into home_of_giving.media_assets (
  source_key, media_type, storage_bucket, storage_path, caption, alt_text, is_published
)
values
  ('del-shared-campaign', 'image', 'home-of-giving-public-media', 'media/uji-bersama-proyek.jpg', 'Media dipakai dua proyek', 'Media dipakai dua proyek', true),
  ('del-shared-blog', 'image', 'home-of-giving-public-media', 'media/uji-bersama-blog.jpg', 'Media dipakai blog', 'Media dipakai blog', true),
  ('del-orphan', 'image', 'home-of-giving-public-media', 'media/uji-yatim.jpg', 'Media hanya milik proyek uji', 'Media hanya milik proyek uji', true),
  ('del-cover', 'image', 'home-of-giving-public-media', 'media/uji-sampul.jpg', 'Sampul proyek uji', 'Sampul proyek uji', true);

insert into home_of_giving.media_assets (
  source_key, media_type, external_url, caption, alt_text, is_published
)
values (
  'del-orphan-external', 'image', 'https://example.invalid/uji-eksternal.jpg',
  'Media eksternal proyek uji', 'Media eksternal proyek uji', true
);

insert into home_of_giving.campaigns (
  slug, title, beneficiary_name, beneficiary_location, cover_media_id,
  status, summary, target_amount_idr, starts_on, ends_on, published_at
)
select
  'proyek-uji-hapus',
  'Proyek Uji Hapus',
  'Penerima Uji Hapus',
  'Jakarta',
  cover.id,
  'running',
  'Proyek uji untuk penghapusan massal.',
  20000000,
  date '2026-08-01',
  date '2026-09-30',
  timestamptz '2026-08-01 09:00:00+07'
from home_of_giving.media_assets cover
where cover.source_key = 'del-cover';

insert into home_of_giving.campaigns (
  slug, title, beneficiary_name, beneficiary_location,
  status, summary, target_amount_idr, starts_on, ends_on, published_at
)
select
  'proyek-uji-simpan',
  'Proyek Uji Simpan',
  'Penerima Uji Simpan',
  'Bandung',
  'running',
  'Proyek uji yang harus tetap utuh.',
  15000000,
  date '2026-08-01',
  date '2026-09-30',
  timestamptz '2026-08-01 09:00:00+07';

insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order)
select c.id, m.id, rel.role::home_of_giving.media_role, rel.sort_order
from (values
  ('proyek-uji-hapus', 'del-shared-campaign', 'gallery', 10),
  ('proyek-uji-hapus', 'del-shared-blog', 'gallery', 20),
  ('proyek-uji-hapus', 'del-orphan', 'documentation', 30),
  ('proyek-uji-hapus', 'del-orphan-external', 'documentation', 40),
  ('proyek-uji-simpan', 'del-shared-campaign', 'cover', 10)
) as rel(campaign_slug, media_source_key, role, sort_order)
join home_of_giving.campaigns c on c.slug = rel.campaign_slug
join home_of_giving.media_assets m on m.source_key = rel.media_source_key;

insert into home_of_giving.blog_media (post_id, media_id, sort_order)
select p.id, m.id, 10
from home_of_giving.blog_posts p
join home_of_giving.media_assets m on m.source_key = 'del-shared-blog'
where p.slug = 'kenapa-nama-donatur-kami-samarkan';

insert into home_of_giving.blog_posts (
  slug, title, campaign_id, excerpt, status, published_at
)
select
  'blog-uji-hapus',
  'Blog Uji Hapus',
  c.id,
  'Artikel yang harus tetap ada setelah proyeknya dihapus.',
  'published',
  timestamptz '2026-08-20 09:00:00+07'
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-hapus';

insert into home_of_giving.campaign_milestones (campaign_id, kind, title, is_published)
select c.id, 'custom', 'Milestone Uji Hapus', true
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-hapus';

insert into home_of_giving.reports (
  kind, campaign_id, title, storage_bucket, storage_path, published_at
)
select
  'campaign', c.id, 'Laporan Uji Hapus',
  'home-of-giving-private-reports', 'laporan/uji-hapus.pdf',
  timestamptz '2026-08-25 09:00:00+07'
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-hapus';

insert into home_of_giving.reports (
  kind, campaign_id, title, external_url, published_at
)
select
  'campaign', c.id, 'Laporan Uji Eksternal',
  'https://example.invalid/laporan-uji.pdf',
  timestamptz '2026-08-26 09:00:00+07'
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-hapus';

insert into home_of_giving_private.donor_identities (id, full_name)
values ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'Donatur Bersama');

insert into home_of_giving.donations (
  id, campaign_id, donor_identity_id, public_name, amount_idr, donated_on, external_reference
)
select
  'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  c.id,
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  'Don*** B.',
  400000,
  date '2026-08-20',
  'uji:hapus:bersama'
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-hapus';

insert into home_of_giving.donations (
  id, campaign_id, donor_identity_id, public_name, amount_idr, donated_on, external_reference
)
select
  'dddddddd-dddd-dddd-dddd-ddddddddddd3',
  c.id,
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  'Don*** B.',
  600000,
  date '2026-08-20',
  'uji:simpan:bersama'
from home_of_giving.campaigns c
where c.slug = 'proyek-uji-simpan';

insert into home_of_giving_private.donation_evidence (
  donation_id, storage_bucket, storage_path, note
)
values (
  'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  'home-of-giving-private-financial-evidence',
  'donations/uji/bukti-bersama.pdf',
  'Bukti uji pada bucket khusus'
);
`;

const legacyFixture = `
create type home_of_giving.beneficiary_kind as enum ('individual', 'organization');
create type home_of_giving.event_status as enum ('draft', 'published', 'archived');
create type home_of_giving.disbursement_status as enum ('draft', 'verified', 'published');

create table home_of_giving.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  public_name text not null,
  kind home_of_giving.beneficiary_kind not null default 'organization',
  city text,
  province text,
  created_at timestamptz not null default now()
);

create table home_of_giving_private.beneficiary_contacts (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references home_of_giving.beneficiaries (id),
  contact_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table home_of_giving.campaigns
  add column beneficiary_id uuid references home_of_giving.beneficiaries (id);

create table home_of_giving.events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references home_of_giving.campaigns (id),
  title text not null,
  status home_of_giving.event_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table home_of_giving.event_media (
  event_id uuid not null references home_of_giving.events (id),
  campaign_id uuid references home_of_giving.campaigns (id),
  media_id uuid not null references home_of_giving.media_assets (id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (event_id, media_id)
);

create table home_of_giving.disbursements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null unique references home_of_giving.campaigns (id),
  beneficiary_id uuid references home_of_giving.beneficiaries (id),
  amount_idr bigint not null,
  status home_of_giving.disbursement_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table home_of_giving.disbursement_allocations (
  id uuid primary key default gen_random_uuid(),
  disbursement_id uuid not null references home_of_giving.disbursements (id),
  label text not null,
  amount_idr bigint not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table home_of_giving.reports
  add column disbursement_id uuid references home_of_giving.disbursements (id),
  drop constraint reports_campaign_id_fkey,
  add constraint reports_campaign_id_fkey
    foreign key (campaign_id) references home_of_giving.campaigns (id) on delete cascade;

insert into home_of_giving.beneficiaries (id, public_name, city, province)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Yayasan Legacy Amanah', 'Cianjur', 'Jawa Barat');

insert into home_of_giving_private.beneficiary_contacts (id, beneficiary_id, contact_name, phone)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'Kontak Legacy',
  '620000000000'
);

update home_of_giving.campaigns
set beneficiary_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    beneficiary_name = null,
    beneficiary_location = null
where slug = 'renovasi-rumah-ibadah';

insert into home_of_giving.events (id, campaign_id, title, status, published_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  id,
  'Kegiatan Legacy',
  'published',
  now()
from home_of_giving.campaigns
where slug = 'renovasi-rumah-ibadah';

insert into home_of_giving.event_media (event_id, campaign_id, media_id, sort_order)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  c.id,
  m.id,
  15
from home_of_giving.campaigns c
join home_of_giving.media_assets m on m.source_key = 'g11'
where c.slug = 'renovasi-rumah-ibadah';

insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order)
select c.id, m.id, 'cover', 30
from home_of_giving.campaigns c
join home_of_giving.media_assets m on m.source_key = 'g11'
where c.slug = 'renovasi-rumah-ibadah'
on conflict (campaign_id, media_id) do update
set role = excluded.role,
    sort_order = excluded.sort_order;

insert into home_of_giving.disbursements (id, campaign_id, beneficiary_id, amount_idr, status)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  3000000,
  'verified'
from home_of_giving.campaigns
where slug = 'renovasi-rumah-ibadah';

insert into home_of_giving.disbursement_allocations (id, disbursement_id, label, amount_idr, sort_order)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  'Alokasi Legacy',
  3000000,
  10
);

insert into home_of_giving.reports (
  id, kind, campaign_id, disbursement_id, title, storage_path, published_at
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
  'campaign',
  id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  'Laporan Legacy',
  'legacy/laporan.pdf',
  now()
from home_of_giving.campaigns
where slug = 'renovasi-rumah-ibadah';

create view home_of_giving.public_beneficiaries with (security_invoker = true) as
select id, public_name from home_of_giving.beneficiaries;
create view home_of_giving.public_events with (security_invoker = true) as
select id, campaign_id, title, published_at from home_of_giving.events where published_at is not null;
create view home_of_giving.public_event_media with (security_invoker = true) as
select event_id, campaign_id, media_id, sort_order from home_of_giving.event_media;
create view home_of_giving.public_disbursements with (security_invoker = true) as
select id, campaign_id, amount_idr, status from home_of_giving.disbursements;
create view home_of_giving.public_disbursement_allocations with (security_invoker = true) as
select id, disbursement_id, label, amount_idr from home_of_giving.disbursement_allocations;

create view public.hog_events with (security_invoker = true) as
select * from home_of_giving.public_events;
create view public.hog_disbursements with (security_invoker = true) as
select * from home_of_giving.public_disbursements;
create view public.hog_disbursement_allocations with (security_invoker = true) as
select * from home_of_giving.public_disbursement_allocations;
create view public.hog_admin_beneficiaries with (security_invoker = true) as
select * from home_of_giving.beneficiaries;
create view public.hog_admin_events with (security_invoker = true) as
select * from home_of_giving.events;
create view public.hog_admin_event_media with (security_invoker = true) as
select * from home_of_giving.event_media;
create view public.hog_admin_disbursements with (security_invoker = true) as
select * from home_of_giving.disbursements;
create view public.hog_admin_disbursement_allocations with (security_invoker = true) as
select * from home_of_giving.disbursement_allocations;

create function home_of_giving.admin_verify_donation(p_donation_id uuid)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select d.id from home_of_giving.donations d where d.id = p_donation_id;
$$;

create function public.hog_admin_verify_donation(p_donation_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select home_of_giving.admin_verify_donation(p_donation_id);
$$;

create function home_of_giving.admin_record_donation(
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date,
  p_evidence_path text,
  p_legacy_note text
)
returns uuid
language sql
security definer
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

create function public.hog_admin_record_donation(
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date,
  p_evidence_path text,
  p_legacy_note text
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
    p_evidence_path,
    p_legacy_note
  );
$$;

drop trigger enforce_rules on home_of_giving.donations;
alter table home_of_giving.donations
  drop constraint donations_status_verified,
  drop constraint donations_verified_meta,
  alter column verified_at drop not null;

insert into home_of_giving.donations (
  id, campaign_id, public_name, amount_idr, donated_on, status, verified_at, internal_note
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
  id,
  'Leg*** P.',
  125000,
  current_date,
  'pending',
  null,
  'Donasi pending dari skema legacy'
from home_of_giving.campaigns
where slug = 'bantuan-banjir-bekasi';

insert into home_of_giving.donations (
  id, campaign_id, public_name, amount_idr, donated_on, status, verified_at,
  rejected_reason, internal_note
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
  id,
  'Leg*** R.',
  225000,
  current_date,
  'rejected',
  null,
  'Bukti tidak valid',
  'Donasi rejected dari skema legacy'
from home_of_giving.campaigns
where slug = 'bantuan-banjir-bekasi';

insert into home_of_giving.donations (
  id, campaign_id, public_name, amount_idr, donated_on, status, verified_at, internal_note
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9',
  id,
  'Leg*** V.',
  325000,
  current_date,
  'void',
  null,
  'Donasi void dari skema legacy'
from home_of_giving.campaigns
where slug = 'bantuan-banjir-bekasi';

insert into home_of_giving.donations (
  id, campaign_id, public_name, amount_idr, donated_on, status, verified_at, internal_note
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
  id,
  'Leg*** M.',
  175000,
  current_date,
  'verified',
  null,
  'Donasi verified tanpa timestamp dari skema legacy'
from home_of_giving.campaigns
where slug = 'bantuan-banjir-bekasi';

insert into home_of_giving_private.donation_evidence (
  id, donation_id, storage_path, note
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
    'legacy/rejected/bukti-transfer.pdf',
    'Bukti rejected legacy'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9',
    'legacy/void/bukti-transfer.pdf',
    'Bukti void legacy'
  );

insert into storage.objects (id, bucket_id, name)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc8',
    'home-of-giving-private-donation-evidence',
    'legacy/rejected/bukti-transfer.pdf'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc9',
    'home-of-giving-private-donation-evidence',
    'legacy/void/bukti-transfer.pdf'
  );
`;

const categoryFixture = `
create table home_of_giving.campaign_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table home_of_giving.campaigns
  add column category_id uuid references home_of_giving.campaign_categories (id) on delete set null;

create index if not exists campaigns_category_idx
  on home_of_giving.campaigns (category_id);

insert into home_of_giving.campaign_categories (slug, name, sort_order)
values ('bencana', 'Bencana', 10), ('pendidikan', 'Pendidikan', 20);

update home_of_giving.campaigns
set category_id = (select id from home_of_giving.campaign_categories where slug = 'bencana')
where slug = 'bantuan-banjir-bekasi';

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
  greatest(0, (c.ends_on - (now() at time zone 'Asia/Jakarta')::date))::integer as days_remaining,
  c.category_id,
  cat.slug as category_slug,
  cat.name as category_name
from home_of_giving.campaigns c
left join home_of_giving.media_assets m on m.id = c.cover_media_id
left join home_of_giving.campaign_stats s on s.campaign_id = c.id
left join home_of_giving.campaign_categories cat on cat.id = c.category_id
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
  updated_by,
  category_id
from home_of_giving.campaigns;

create view home_of_giving.category_distribution_stats
with (security_invoker = true) as
select
  cat.id,
  cat.slug,
  cat.name,
  count(c.id)::integer as campaign_count
from home_of_giving.campaign_categories cat
left join home_of_giving.campaigns c on c.category_id = cat.id
group by cat.id, cat.slug, cat.name;

create view public.hog_admin_campaign_categories
with (security_invoker = true) as
select * from home_of_giving.campaign_categories;

create view public.hog_category_distribution_stats
with (security_invoker = true) as
select * from home_of_giving.category_distribution_stats;
`;

function readSql(file) {
  return readFileSync(resolve(root, file), "utf8");
}

async function run(db, label, sql) {
  try {
    await db.exec(sql);
    console.log(`OK   ${label}`);
  } catch (error) {
    console.error(`FAIL ${label}`);
    console.error(`     ${error.message}`);
    if (error.position) {
      const position = Number(error.position);
      console.error(`     near: ${JSON.stringify(sql.slice(Math.max(0, position - 160), position + 160))}`);
    }
    throw error;
  }
}

async function check(db, label, sql, params = []) {
  const result = await db.query(sql, params);
  if (result.rows.length !== 1 || result.rows[0].ok !== true) {
    console.error(`FAIL ${label}`);
    console.error(result.rows);
    throw new Error(label);
  }
  console.log(`OK   ${label}`);
}

async function expectFailure(label, operation) {
  try {
    await operation();
  } catch {
    console.log(`OK   ${label}`);
    return;
  }
  throw new Error(`${label}: operasi seharusnya ditolak`);
}

async function withRole(db, role, userId, operation) {
  if (userId) {
    await db.exec(`set request.jwt.claim.sub = '${userId}'; set role ${role}`);
  } else {
    await db.exec(`set role ${role}`);
  }

  try {
    return await operation();
  } finally {
    await db.exec("reset role; reset request.jwt.claim.sub");
  }
}

async function applySequence(db, prefix, sequence) {
  for (const file of sequence) {
    await run(db, `${prefix} ${file}`, readSql(file));
  }
}

async function checkSharedIsolation(db, label) {
  await check(db, `${label}: tabel backend lain tetap utuh`, `select (
    (select count(*) from public.other_app_records where value = 'tetap-aman') = 1
    and (select count(*) from storage.buckets where id = 'other-app-assets') = 1
    and (select count(*) from pg_policies where schemaname = 'storage' and policyname = 'other_app_policy') = 1
  ) as ok`);
}

async function checkFinalObjects(db, label) {
  await check(db, `${label}: object dan kolom obsolete tidak ada`, `select (
    not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where (n.nspname, c.relname) in (
        ('home_of_giving', 'beneficiaries'),
        ('home_of_giving_private', 'beneficiary_contacts'),
        ('home_of_giving', 'events'),
        ('home_of_giving', 'event_media'),
        ('home_of_giving', 'disbursements'),
        ('home_of_giving', 'disbursement_allocations'),
        ('home_of_giving', 'public_events'),
        ('home_of_giving', 'public_event_media'),
        ('home_of_giving', 'public_disbursements'),
        ('home_of_giving', 'public_disbursement_allocations'),
        ('public', 'hog_events'),
        ('public', 'hog_disbursements'),
        ('public', 'hog_disbursement_allocations'),
        ('public', 'hog_admin_beneficiaries'),
        ('public', 'hog_admin_events'),
        ('public', 'hog_admin_event_media'),
        ('public', 'hog_admin_disbursements'),
        ('public', 'hog_admin_disbursement_allocations'),
        ('home_of_giving', 'campaign_categories'),
        ('home_of_giving', 'category_distribution_stats'),
        ('public', 'hog_admin_campaign_categories'),
        ('public', 'hog_category_distribution_stats')
      )
    )
    and not exists (
      select 1
      from information_schema.columns
      where (table_schema, table_name, column_name) in (
        ('home_of_giving', 'campaigns', 'beneficiary_id'),
        ('home_of_giving', 'reports', 'disbursement_id'),
        ('home_of_giving', 'campaigns', 'category_id')
      )
    )
    and to_regtype('home_of_giving.beneficiary_kind') is null
    and to_regtype('home_of_giving.event_status') is null
    and to_regtype('home_of_giving.disbursement_status') is null
  ) as ok`);

  await check(db, `${label}: hanya RPC donasi 5 arg yang tersisa`, `select (
    count(*) = 1
    and count(*) filter (
      where pg_get_function_identity_arguments(p.oid) =
        'p_campaign_id uuid, p_full_name text, p_amount_idr bigint, p_donated_on date, p_evidence_path text'
    ) = 1
  ) as ok
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hog_admin_record_donation'`);

  await check(db, `${label}: RPC workflow lama tidak ada`, `select not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'home_of_giving')
      and p.proname in (
        'hog_admin_preview_masked_name', 'hog_admin_attach_donation_evidence',
        'hog_admin_verify_donation', 'hog_admin_reject_donation',
        'hog_admin_void_donation', 'hog_admin_verify_disbursement',
        'hog_admin_publish_disbursement', 'admin_preview_masked_name',
        'admin_attach_donation_evidence', 'admin_verify_donation',
        'admin_reject_donation', 'admin_void_donation',
        'admin_verify_disbursement', 'admin_publish_disbursement'
      )
  ) as ok`);

  await check(db, `${label}: penerima manfaat tersimpan langsung pada proyek`, `select (
    (select count(*) from information_schema.columns
      where table_schema = 'home_of_giving' and table_name = 'campaigns'
        and column_name in ('beneficiary_name', 'beneficiary_location')) = 2
    and not exists (
      select 1 from home_of_giving.campaigns
      where status in ('running', 'closed', 'disbursed', 'reported')
        and btrim(coalesce(beneficiary_name, '')) = ''
    )
  ) as ok`);

  await check(db, `${label}: WhatsApp bersifat global`, `select (
    count(*) = 1
    and bool_and(is_public)
    and bool_and(jsonb_typeof(value) = 'object')
    and bool_and(value ? 'label' and value ? 'phone' and value ? 'message')
    and not exists (
      select 1 from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'campaigns'
        and column_name like '%whatsapp%'
    )
  ) as ok
  from home_of_giving.site_settings
  where key = 'whatsapp_cta'`);

  await check(db, `${label}: seluruh donasi langsung verified`, `select (
    not exists (
      select 1 from home_of_giving.donations
      where status <> 'verified' or verified_at is null
    )
    and (
      select pg_get_expr(d.adbin, d.adrelid) = '''verified''::home_of_giving.donation_status'
      from pg_attrdef d
      join pg_class c on c.oid = d.adrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum = d.adnum
      where n.nspname = 'home_of_giving'
        and c.relname = 'donations'
        and a.attname = 'status'
    )
  ) as ok`);

  await check(db, `${label}: agregat dan akses admin donation hanya verified`, `select (
    not exists (
      select 1
      from home_of_giving.campaign_stats s
      where s.raised_amount_idr <> coalesce((
        select sum(d.amount_idr)
        from home_of_giving.donations d
        where d.campaign_id = s.campaign_id
          and d.status = 'verified'
      ), 0)
    )
    and position('status = ''verified''' in pg_get_functiondef(
      'home_of_giving.admin_dashboard_summary()'::regprocedure
    )) > 0
    and position('status = ''verified''' in pg_get_functiondef(
      'home_of_giving.admin_donation_detail(uuid)'::regprocedure
    )) > 0
    and (
      position('status = ''verified''' in pg_get_viewdef(
        'public.hog_admin_donations'::regclass, true
      )) > 0
      or exists (
        select 1
        from pg_policy policy_row
        where policy_row.polrelid = 'home_of_giving.donations'::regclass
          and policy_row.polname = 'admin_read'
          and position('status = ''verified''' in pg_get_expr(
            policy_row.polqual, policy_row.polrelid
          )) > 0
      )
    )
  ) as ok`);

  await check(db, `${label}: report campaign memakai delete restrict`, `select (
    count(*) = 1
    and bool_and(constraint_row.confdeltype = 'r')
  ) as ok
  from pg_constraint constraint_row
  join pg_attribute attribute_row
    on attribute_row.attrelid = constraint_row.conrelid
   and attribute_row.attnum = any (constraint_row.conkey)
  where constraint_row.conrelid = 'home_of_giving.reports'::regclass
    and constraint_row.contype = 'f'
    and attribute_row.attname = 'campaign_id'`);

  await check(db, `${label}: bucket laporan privat dan admin-only`, `select (
    exists (
      select 1
      from storage.buckets
      where id = 'home-of-giving-private-reports'
        and name = id
        and not public
        and file_size_limit = 26214400
        and allowed_mime_types = array['application/pdf']::text[]
    )
    and exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname = 'home_of_giving_admin_manage_private_reports'
        and cmd = 'ALL'
        and roles = array['authenticated']::name[]
        and position('home-of-giving-private-reports' in coalesce(qual, '')) > 0
        and position('is_admin' in coalesce(qual, '')) > 0
        and position('home-of-giving-private-reports' in coalesce(with_check, '')) > 0
        and position('is_admin' in coalesce(with_check, '')) > 0
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and roles && array['public', 'anon']::name[]
        and (
          position('home-of-giving-private-reports' in coalesce(qual, '')) > 0
          or position('home-of-giving-private-reports' in coalesce(with_check, '')) > 0
        )
    )
  ) as ok`);

  await check(db, `${label}: status reported tidak bergantung publikasi report`, `select (
    position('home_of_giving.reports' in pg_get_functiondef(
      'home_of_giving_private.enforce_campaign_rules()'::regprocedure
    )) = 0
  ) as ok`);

  await check(db, `${label}: archive simplifikasi tetap privat`, `select (
    not has_schema_privilege('anon', 'home_of_giving_private', 'USAGE')
    and not has_table_privilege(
      'anon',
      'home_of_giving_private.simplification_archive',
      'SELECT'
    )
    and (
      select c.relrowsecurity and c.relforcerowsecurity
      from pg_class c
      where c.oid = 'home_of_giving_private.simplification_archive'::regclass
    )
    and exists (
      select 1 from pg_policies
      where schemaname = 'home_of_giving_private'
        and tablename = 'simplification_archive'
        and policyname = 'admin_read'
        and roles = array['authenticated']::name[]
    )
  ) as ok`);

  await check(db, `${label}: semua tabel aplikasi memakai RLS`, `select count(*) = 0 as ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('home_of_giving', 'home_of_giving_private')
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity`);

  await check(db, `${label}: seluruh view aplikasi security invoker`, `select count(*) = 0 as ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'v'
    and (n.nspname = 'home_of_giving' or (n.nspname = 'public' and c.relname like 'hog_%'))
    and coalesce(
      (select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'),
      'false'
    ) <> 'true'`);

  await check(db, `${label}: anon tidak memiliki grant tulis`, `select count(*) = 0 as ok
  from information_schema.role_table_grants
  where grantee = 'anon'
    and (table_schema = 'home_of_giving' or (table_schema = 'public' and table_name like 'hog_%'))
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')`);
}

async function validateFreshInstall() {
  console.log("\n== FRESH INSTALL: FINAL 01-07 ==");
  const db = new PGlite();
  await run(db, "fresh bootstrap Supabase stub", bootstrap);
  await applySequence(db, "fresh", freshSequence);

  await check(db, "fresh: seed canonical dan statistik konsisten", `select (
    (select count(*) from home_of_giving.campaigns) = 3
    and (select count(*) from home_of_giving.campaigns where published_at is not null) = 3
    and (select count(*) from home_of_giving.campaigns where status = 'draft' and needs_review) = 0
    and (select count(*) from home_of_giving.donations) = 14
    and (select coalesce(sum(amount_idr), 0) from home_of_giving.donations) = 37350000
    and (select total_raised_idr from home_of_giving.site_stats) = 37350000
  ) as ok`);

  await checkFinalObjects(db, "fresh");
  await checkSharedIsolation(db, "fresh");

  console.log("\n== FRESH INSTALL: RERUN IDEMPOTENT 01-07 ==");
  await applySequence(db, "fresh rerun", idempotentSequence);

  await check(db, "fresh rerun: seed tidak berduplikasi", `select (
    (select count(*) from home_of_giving.campaigns) = 3
    and (select count(*) from home_of_giving.donations) = 14
    and (select count(*) from home_of_giving.media_assets) = 11
    and (select count(*) from home_of_giving.blog_posts) = 7
    and (select count(*) from home_of_giving.campaign_media) = 5
  ) as ok`);
  await checkSharedIsolation(db, "fresh rerun");

  const nonAdminId = "11111111-1111-1111-1111-111111111111";
  const adminId = "22222222-2222-2222-2222-222222222222";
  await db.exec(`insert into auth.users (id, email) values
    ('${nonAdminId}', 'staff@example.test'),
    ('${adminId}', 'admin@example.test');
    insert into home_of_giving_private.admin_members (user_id, display_name)
    values ('${adminId}', 'Super Admin');`);

  await withRole(db, "anon", null, async () => {
    await check(db, "anon: dapat membaca ledger aman", `select count(*) = 14 as ok from public.hog_donation_ledger`);
    await expectFailure("anon: admin view ditolak", () => db.query("select count(*) from public.hog_admin_donations"));
    await expectFailure("anon: admin RPC ditolak", () => db.query("select public.hog_admin_dashboard_summary()"));
    await expectFailure("anon: tulis aplikasi ditolak", () => db.exec(
      "insert into home_of_giving.blog_categories (slug, name) values ('forbidden', 'Forbidden')",
    ));
    await expectFailure("anon: identitas privat ditolak", () => db.query(
      "select count(*) from home_of_giving_private.donor_identities",
    ));
  });

  await withRole(db, "authenticated", nonAdminId, async () => {
    await check(db, "non-admin: admin view kosong", `select count(*) = 0 as ok from public.hog_admin_campaigns`);
    await check(db, "non-admin: whoami bukan admin", `select is_admin = false as ok from public.hog_admin_whoami()`);
    await expectFailure("non-admin: dashboard admin ditolak", () => db.query(
      "select public.hog_admin_dashboard_summary()",
    ));
    await expectFailure("non-admin: mutation admin ditolak", () => db.exec(
      "insert into public.hog_admin_blog_categories (slug, name) values ('forbidden-auth', 'Forbidden Auth')",
    ));
  });

  let donationWithoutEvidence;
  let donationWithEvidence;
  let publishedReportId;
  let draftReportId;
  let campaignId;

  await withRole(db, "authenticated", adminId, async () => {
    await check(db, "admin: seluruh proyek dapat dibaca", `select count(*) = 3 as ok from public.hog_admin_campaigns`);
    await check(db, "admin: whoami terverifikasi", `select is_admin and user_id = '${adminId}'::uuid as ok
      from public.hog_admin_whoami()`);

    campaignId = (await db.query(
      "select id from public.hog_admin_campaigns where slug = 'paket-gizi-anak-panti'",
    )).rows[0].id;

    donationWithoutEvidence = (await db.query(
      `select public.hog_admin_record_donation(
        $1::uuid, 'Siti Rahmawati', 500000::bigint, current_date, null
      ) as id`,
      [campaignId],
    )).rows[0].id;

    donationWithEvidence = (await db.query(
      `select public.hog_admin_record_donation(
        $1::uuid, 'Siti Rahmawati', 250000::bigint, current_date, 'donations/test/bukti.pdf'
      ) as id`,
      [campaignId],
    )).rows[0].id;

    await check(db, "admin: donasi tanpa bukti langsung verified dan termasking deterministik", `select (
      data ->> 'public_name' = 'Sit*** R.'
      and data ->> 'full_name' = 'Siti Rahmawati'
      and data ->> 'status' = 'verified'
      and jsonb_array_length(data -> 'evidence_paths') = 0
    ) as ok
    from (select public.hog_admin_donation_detail($1::uuid) as data) detail`, [donationWithoutEvidence]);

    await check(db, "admin: bukti opsional tersimpan tanpa tahap verifikasi", `select (
      data ->> 'public_name' = 'Sit*** R.'
      and data ->> 'status' = 'verified'
      and data -> 'evidence_paths' = '["donations/test/bukti.pdf"]'::jsonb
    ) as ok
    from (select public.hog_admin_donation_detail($1::uuid) as data) detail`, [donationWithEvidence]);

    await db.query(
      "update public.hog_admin_campaigns set status = 'reported' where id = $1::uuid",
      [campaignId],
    );
    await check(db, "proyek: status reported tetap kompatibel tanpa mensyaratkan laporan", `select (
      status = 'reported'
      and reported_at is not null
      and not exists (
        select 1 from home_of_giving.reports r where r.campaign_id = c.id
      )
    ) as ok
    from home_of_giving.campaigns c
    where c.id = $1::uuid`, [campaignId]);

    publishedReportId = (await db.query(
      `insert into public.hog_admin_reports (kind, campaign_id, title, storage_bucket)
       values ('campaign', $1::uuid, 'Laporan Uji Proyek', 'home-of-giving-public-reports')
       returning id`,
      [campaignId],
    )).rows[0].id;

    await expectFailure("laporan: publikasi tanpa berkas atau URL ditolak", () => db.query(
      "update public.hog_admin_reports set published_at = now() where id = $1::uuid",
      [publishedReportId],
    ));

    await db.query(
      `update public.hog_admin_reports
       set external_url = 'https://example.invalid/laporan-uji.pdf', published_at = now()
       where id = $1::uuid`,
      [publishedReportId],
    );
    draftReportId = (await db.query(
      `insert into public.hog_admin_reports (
        kind, campaign_id, title, storage_bucket, external_url, period_label
      ) values (
        'periodic', null, 'Laporan Berkala Draf', 'home-of-giving-public-reports',
        'https://example.invalid/laporan-berkala.pdf', 'September 2026'
      ) returning id`,
    )).rows[0].id;

    await db.exec(`update public.hog_admin_site_settings
      set value = jsonb_build_object(
        'label', 'Hubungi panitia',
        'phone', '628111111111',
        'message', 'Halo, saya ingin berdonasi.'
      )
      where key = 'whatsapp_cta'`);

    await check(db, "admin: dashboard memakai shape final", `select (
      (select count(*) from jsonb_object_keys(summary)) = 4
      and summary ?& array[
        'total_donation_count', 'total_donation_amount_idr',
        'running_campaign_count', 'unpublished_report_count'
      ]::text[]
      and (summary ->> 'total_donation_count')::integer = 16
      and (summary ->> 'total_donation_amount_idr')::bigint = 38100000
      and (summary ->> 'running_campaign_count')::integer = 2
      and (summary ->> 'unpublished_report_count')::integer = 1
    ) as ok
    from (select public.hog_admin_dashboard_summary() as summary) dashboard`);
  });

  await withRole(db, "anon", null, async () => {
    await check(db, "anon: hanya laporan terbit yang terlihat", `select (
      count(*) = 1
      and count(*) filter (where id = $1::uuid) = 1
      and count(*) filter (where id = $2::uuid) = 0
    ) as ok from public.hog_reports`, [publishedReportId, draftReportId]);
    await check(db, "anon: konfigurasi WhatsApp global terbaca", `select (
      count(*) = 1 and bool_and(value ->> 'phone' = '628111111111')
    ) as ok from public.hog_site_settings where key = 'whatsapp_cta'`);
    await check(db, "anon: donasi baru langsung tampil aman", `select (
      count(*) filter (where id in ($1::uuid, $2::uuid)) = 2
      and count(*) filter (
        where id in ($1::uuid, $2::uuid)
          and public_name = 'Sit*** R.'
      ) = 2
    ) as ok from public.hog_donation_ledger`, [donationWithoutEvidence, donationWithEvidence]);
  });

  await checkSharedIsolation(db, "fresh final");
  await checkFinalObjects(db, "fresh final");
  console.log("OK   fresh install validation complete");
}

async function validateCampaignDeletion() {
  console.log("\n== HAPUS PROYEK: RPC BULK DELETE DAN CLEANUP DRAFT ==");
  const db = new PGlite();
  await run(db, "delete bootstrap Supabase stub", bootstrap);
  await applySequence(db, "delete", freshSequence);

  await run(db, "delete supabase/sql-editor/09_campaign_bulk_delete.sql", readSql(sqlFiles.bulkDelete));
  await run(db, "delete rerun 09 (idempotensi)", readSql(sqlFiles.bulkDelete));

  await check(db, "delete: kontrak RPC hapus proyek final", `select (
    (
      select count(*) = 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hog_admin_delete_campaigns'
    )
    and pg_get_function_identity_arguments(
      'public.hog_admin_delete_campaigns(uuid[])'::regprocedure
    ) = 'p_campaign_ids uuid[]'
    and pg_get_function_result('public.hog_admin_delete_campaigns(uuid[])'::regprocedure) = 'jsonb'
    and pg_get_function_result('home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure) = 'jsonb'
    and (
      select p.prosecdef
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'home_of_giving' and p.proname = 'admin_delete_campaigns'
    )
    and (
      select p.proconfig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'home_of_giving' and p.proname = 'admin_delete_campaigns'
    ) is not distinct from (
      select p.proconfig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'home_of_giving' and p.proname = 'admin_record_donation'
    )
    and position('cascade' in lower(pg_get_functiondef(
      'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure
    ))) = 0
    and not has_function_privilege('anon', 'public.hog_admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE')
    and not has_function_privilege('anon', 'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE')
    and has_function_privilege('authenticated', 'public.hog_admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE')
    and has_function_privilege('service_role', 'public.hog_admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE')
  ) as ok`);

  await run(db, "delete supabase/sql-editor/10_cleanup_legacy_drafts.sql", readSql(sqlFiles.cleanupDrafts));
  await run(db, "delete rerun 10 (idempotensi)", readSql(sqlFiles.cleanupDrafts));

  await check(db, "delete: cleanup 10 mempertahankan proyek berjalan dan 14 donasi canonical", `select (
    (select count(*) from home_of_giving.campaigns) = 3
    and (select count(*) from home_of_giving.campaigns where status = 'running') = 3
    and (select count(*) from home_of_giving.donations where external_reference like 'seed:%') = 14
    and (select coalesce(sum(amount_idr), 0) from home_of_giving.donations) = 37350000
    and (select count(*) from home_of_giving.media_assets) = 11
    and (
      select count(*) = 0
      from home_of_giving_private.simplification_archive
      where migration_key = '2026-09-16_cleanup_legacy_draft_campaigns_v1'
    )
  ) as ok`);

  await run(db, "delete fixture proyek uji", deletionFixture);

  const nonAdminId = "33333333-3333-3333-3333-333333333333";
  const adminId = "44444444-4444-4444-4444-444444444444";
  await db.exec(`insert into auth.users (id, email) values
    ('${nonAdminId}', 'staff-delete@example.test'),
    ('${adminId}', 'admin-delete@example.test');
    insert into home_of_giving_private.admin_members (user_id, display_name)
    values ('${adminId}', 'Super Admin Hapus');`);

  const targetId = (await db.query(
    "select id from home_of_giving.campaigns where slug = 'proyek-uji-hapus'",
  )).rows[0].id;
  const keeperId = (await db.query(
    "select id from home_of_giving.campaigns where slug = 'proyek-uji-simpan'",
  )).rows[0].id;

  await withRole(db, "authenticated", adminId, async () => {
    await db.query(
      `select public.hog_admin_record_donation(
        $1::uuid, 'Siti Rahmawati', 500000::bigint, date '2026-08-20', 'donations/uji/bukti-rpc.pdf'
      )`,
      [targetId],
    );
    await db.query(
      `select public.hog_admin_record_donation(
        $1::uuid, 'Budi Hartono', 300000::bigint, date '2026-08-20', null
      )`,
      [targetId],
    );
  });

  await check(db, "delete: fixture proyek uji lengkap sebelum penghapusan", `select (
    (select count(*) from home_of_giving.donations where campaign_id = $1::uuid) = 3
    and (select count(*) from home_of_giving_private.donor_identities) = 3
    and (
      select count(*)
      from home_of_giving_private.donation_evidence e
      join home_of_giving.donations d on d.id = e.donation_id
      where d.campaign_id = $1::uuid
    ) = 2
    and (select count(*) from home_of_giving.reports where campaign_id = $1::uuid) = 2
    and (select count(*) from home_of_giving.campaign_milestones where campaign_id = $1::uuid) = 1
    and (select count(*) from home_of_giving.campaign_media where campaign_id = $1::uuid) = 4
    and (select count(*) from home_of_giving.blog_posts where campaign_id = $1::uuid) = 1
  ) as ok`, [targetId]);

  await withRole(db, "anon", null, async () => {
    await expectFailure("anon: RPC hapus proyek ditolak", () => db.query(
      "select public.hog_admin_delete_campaigns(array[]::uuid[])",
    ));
    await expectFailure("anon: RPC hapus proyek internal ditolak", () => db.query(
      "select home_of_giving.admin_delete_campaigns(array[]::uuid[])",
    ));
  });

  await withRole(db, "authenticated", nonAdminId, async () => {
    await expectFailure("non-admin: RPC hapus proyek ditolak", () => db.query(
      "select public.hog_admin_delete_campaigns(array[$1::uuid])",
      [targetId],
    ));
  });

  await check(db, "delete: penolakan tidak menghapus data apa pun", `select (
    (select count(*) from home_of_giving.campaigns where id = $1::uuid) = 1
    and (select count(*) from home_of_giving.donations where campaign_id = $1::uuid) = 3
  ) as ok`, [targetId]);

  await withRole(db, "authenticated", adminId, async () => {
    await check(db, "delete: array kosong dan null mengembalikan nol", `select (
      (kosong ->> 'deleted_campaign_count')::integer = 0
      and (kosong ->> 'deleted_donation_count')::integer = 0
      and kosong -> 'storage_objects' = '[]'::jsonb
      and (nol ->> 'deleted_campaign_count')::integer = 0
      and (nol ->> 'deleted_donation_count')::integer = 0
      and nol -> 'storage_objects' = '[]'::jsonb
      and (asing ->> 'deleted_campaign_count')::integer = 0
      and (asing ->> 'deleted_donation_count')::integer = 0
      and asing -> 'storage_objects' = '[]'::jsonb
    ) as ok
    from (
      select
        public.hog_admin_delete_campaigns(array[]::uuid[]) as kosong,
        public.hog_admin_delete_campaigns(null::uuid[]) as nol,
        public.hog_admin_delete_campaigns(
          array['99999999-9999-9999-9999-999999999999'::uuid]
        ) as asing
    ) calls`);

    await check(db, "delete: payload hapus proyek sesuai kontrak", `select (
      (select count(*) from jsonb_object_keys(result)) = 3
      and result ?& array[
        'deleted_campaign_count', 'deleted_donation_count', 'storage_objects'
      ]::text[]
      and jsonb_typeof(result -> 'storage_objects') = 'array'
      and (result ->> 'deleted_campaign_count')::integer = 1
      and (result ->> 'deleted_donation_count')::integer = 3
      and jsonb_array_length(result -> 'storage_objects') = 5
      and not exists (
        select 1
        from jsonb_array_elements(result -> 'storage_objects') item
        where not (item ?& array['bucket', 'path']::text[])
          or (select count(*) from jsonb_object_keys(item)) <> 2
      )
      and result -> 'storage_objects' @> '[
        {"bucket": "home-of-giving-private-donation-evidence", "path": "donations/uji/bukti-rpc.pdf"},
        {"bucket": "home-of-giving-private-financial-evidence", "path": "donations/uji/bukti-bersama.pdf"},
        {"bucket": "home-of-giving-private-reports", "path": "laporan/uji-hapus.pdf"},
        {"bucket": "home-of-giving-public-media", "path": "media/uji-yatim.jpg"},
        {"bucket": "home-of-giving-public-media", "path": "media/uji-sampul.jpg"}
      ]'::jsonb
      and not (result -> 'storage_objects' @> '[{"path": "media/uji-bersama-proyek.jpg"}]'::jsonb)
      and not (result -> 'storage_objects' @> '[{"path": "media/uji-bersama-blog.jpg"}]'::jsonb)
      and not (result::text like '%example.invalid%')
    ) as ok
    from (select public.hog_admin_delete_campaigns(array[$1::uuid]) as result) call`, [targetId]);
  });

  await check(db, "delete: proyek, donasi, bukti, dan identitas yatim ikut terhapus", `select (
    not exists (select 1 from home_of_giving.campaigns where id = $1::uuid)
    and not exists (select 1 from home_of_giving.donations where campaign_id = $1::uuid)
    and not exists (
      select 1 from home_of_giving_private.donation_evidence
      where storage_path in ('donations/uji/bukti-rpc.pdf', 'donations/uji/bukti-bersama.pdf')
    )
    and (select count(*) from home_of_giving_private.donor_identities) = 1
    and (
      select full_name = 'Donatur Bersama'
      from home_of_giving_private.donor_identities
    )
    and not exists (select 1 from home_of_giving.reports where campaign_id = $1::uuid)
    and not exists (select 1 from home_of_giving.campaign_milestones where campaign_id = $1::uuid)
    and not exists (select 1 from home_of_giving.campaign_media where campaign_id = $1::uuid)
  ) as ok`, [targetId]);

  await check(db, "delete: proyek lain, donasi canonical, dan media bersama tetap utuh", `select (
    (select count(*) from home_of_giving.campaigns where id = $1::uuid) = 1
    and (select count(*) from home_of_giving.donations where campaign_id = $1::uuid) = 1
    and (select count(*) from home_of_giving.donations where external_reference like 'seed:%') = 14
    and (select count(*) from home_of_giving.campaigns) = 4
    and exists (
      select 1 from home_of_giving.media_assets where source_key = 'del-shared-campaign'
    )
    and exists (
      select 1 from home_of_giving.media_assets where source_key = 'del-shared-blog'
    )
    and exists (
      select 1 from home_of_giving.media_assets where source_key = 'del-orphan-external'
    )
    and exists (
      select 1 from home_of_giving.campaign_media cm
      join home_of_giving.media_assets m on m.id = cm.media_id
      where cm.campaign_id = $1::uuid and m.source_key = 'del-shared-campaign'
    )
    and exists (
      select 1 from home_of_giving.blog_media bm
      join home_of_giving.media_assets m on m.id = bm.media_id
      where m.source_key = 'del-shared-blog'
    )
  ) as ok`, [keeperId]);

  await check(db, "delete: media yatim berbasis storage dihapus", `select (
    not exists (select 1 from home_of_giving.media_assets where source_key = 'del-orphan')
    and not exists (select 1 from home_of_giving.media_assets where source_key = 'del-cover')
    and (select count(*) from home_of_giving.media_assets) = 14
  ) as ok`);

  await check(db, "delete: artikel blog bertahan dengan campaign_id null", `select (
    count(*) = 1
    and bool_and(campaign_id is null)
    and bool_and(status = 'published')
  ) as ok
  from home_of_giving.blog_posts
  where slug = 'blog-uji-hapus'`);

  await check(db, "delete: blog seed lain tidak terpengaruh", `select (
    (select count(*) from home_of_giving.blog_posts) = 8
  ) as ok`);

  await checkFinalObjects(db, "delete final");
  await checkSharedIsolation(db, "delete final");
  console.log("OK   campaign deletion validation complete");
}

async function validateLegacyUpgrade() {
  console.log("\n== LEGACY UPGRADE: REPRESENTATIVE PRE-08 DATABASE ==");
  const db = new PGlite();
  await run(db, "legacy bootstrap Supabase stub", bootstrap);
  await applySequence(db, "legacy fixture base", freshSequence);
  await run(db, "legacy fixture draft seed historis", legacySeedDrafts);
  await run(db, "legacy fixture objects and rows", legacyFixture);
  await run(db, "legacy fixture campaign categories gaya lama", categoryFixture);

  await check(db, "legacy fixture: obsolete modules dan seluruh status donation tersedia", `select (
    to_regclass('home_of_giving.beneficiaries') is not null
    and to_regclass('home_of_giving.events') is not null
    and to_regclass('home_of_giving.disbursements') is not null
    and exists (select 1 from home_of_giving.donations where status = 'pending')
    and exists (select 1 from home_of_giving.donations where status = 'rejected')
    and exists (select 1 from home_of_giving.donations where status = 'void')
    and exists (
      select 1 from home_of_giving.donations
      where status = 'verified' and verified_at is null
    )
    and (
      select constraint_row.confdeltype = 'c'
      from pg_constraint constraint_row
      where constraint_row.conname = 'reports_campaign_id_fkey'
        and constraint_row.conrelid = 'home_of_giving.reports'::regclass
    )
    and exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hog_admin_verify_donation'
    )
  ) as ok`);

  await check(db, "legacy fixture: kategori proyek gaya lama tersedia", `select (
    to_regclass('home_of_giving.campaign_categories') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'campaigns'
        and column_name = 'category_id'
    )
    and to_regclass('home_of_giving.category_distribution_stats') is not null
    and to_regclass('public.hog_admin_campaign_categories') is not null
    and to_regclass('public.hog_category_distribution_stats') is not null
    and position('category_id' in pg_get_viewdef('home_of_giving.public_campaigns'::regclass, true)) > 0
    and position('category_id' in pg_get_viewdef('public.hog_admin_campaigns'::regclass, true)) > 0
  ) as ok`);

  await run(db, "upgrade supabase/sql-editor/11_remove_campaign_categories.sql", readSql(sqlFiles.removeCategories));

  await check(db, "upgrade 11: object kategori hilang dan data proyek utuh", `select (
    to_regclass('home_of_giving.campaign_categories') is null
    and to_regclass('home_of_giving.category_distribution_stats') is null
    and to_regclass('public.hog_admin_campaign_categories') is null
    and to_regclass('public.hog_category_distribution_stats') is null
    and not exists (
      select 1 from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'campaigns'
        and column_name = 'category_id'
    )
    and position('category_id' in pg_get_viewdef('home_of_giving.public_campaigns'::regclass, true)) = 0
    and position('category_id' in pg_get_viewdef('public.hog_admin_campaigns'::regclass, true)) = 0
    and (select count(*) from home_of_giving.campaigns) = 9
    and (select count(*) from home_of_giving.donations) = 18
    and (select count(*) from home_of_giving.blog_categories) = 4
    and exists (
      select 1 from home_of_giving_private.simplification_archive
      where migration_key = '2026-09-16_remove_campaign_categories_v1'
        and source_table = 'campaign_categories'
    )
  ) as ok`);

  const categoryArchiveCount = (await db.query(
    "select count(*)::integer as total from home_of_giving_private.simplification_archive where migration_key = '2026-09-16_remove_campaign_categories_v1'",
  )).rows[0].total;
  await run(db, "upgrade rerun 11 (idempotensi)", readSql(sqlFiles.removeCategories));
  await check(db, "upgrade 11 rerun: arsip tidak berduplikasi", `select count(*) = $1::integer as ok
    from home_of_giving_private.simplification_archive where migration_key = '2026-09-16_remove_campaign_categories_v1'`, [categoryArchiveCount]);

  await run(db, "upgrade rerun 06 setelah 11 tanpa 42P16", readSql(sqlFiles.bridge));

  await run(db, "upgrade supabase/sql-editor/08_simplify_donation_flow.sql", readSql(sqlFiles.upgrade));

  await check(db, "upgrade: data legacy diarsipkan sebelum modul dihapus", `select (
    count(*) filter (where source_table = 'beneficiaries') = 1
    and count(*) filter (where source_table = 'beneficiary_contacts') = 1
    and count(*) filter (where source_table = 'events') = 1
    and count(*) filter (where source_table = 'event_media') = 1
    and count(*) filter (where source_table = 'disbursements') = 1
    and count(*) filter (where source_table = 'disbursement_allocations') = 1
    and count(*) filter (where source_table = 'campaigns_legacy_beneficiary') = 1
    and count(*) filter (where source_table = 'reports_legacy_disbursement') = 1
    and count(*) filter (
      where source_table = 'donations_non_verified'
        and row_data ->> 'status' = 'pending'
    ) = 1
    and count(*) filter (
      where source_table = 'donations_non_verified'
        and row_data ->> 'status' = 'rejected'
    ) = 1
    and count(*) filter (
      where source_table = 'donations_non_verified'
        and row_data ->> 'status' = 'void'
    ) = 1
    and count(*) filter (
      where source_table = 'donations_non_verified'
        and row_data ->> 'status' = 'verified'
        and row_data ->> 'verified_at' is null
    ) = 1
    and count(*) filter (
      where source_table = 'donation_evidence'
        and row_data ->> 'storage_path' in (
          'legacy/rejected/bukti-transfer.pdf',
          'legacy/void/bukti-transfer.pdf'
        )
    ) = 2
  ) as ok
  from home_of_giving_private.simplification_archive
  where migration_key = '2026-09-15_simplify_donation_flow_v1'`);

  await check(db, "upgrade: beneficiary dibackfill ke campaign", `select (
    beneficiary_name = 'Yayasan Legacy Amanah'
    and beneficiary_location = 'Cianjur, Jawa Barat'
  ) as ok
  from home_of_giving.campaigns
  where slug = 'renovasi-rumah-ibadah'`);

  await check(db, "upgrade: media event mempertahankan role campaign media yang sudah ada", `select exists (
    select 1
    from home_of_giving.campaign_media cm
    join home_of_giving.campaigns c on c.id = cm.campaign_id
    join home_of_giving.media_assets m on m.id = cm.media_id
    where c.slug = 'renovasi-rumah-ibadah'
      and m.source_key = 'g11'
      and cm.role = 'cover'
      and cm.sort_order = 15
  ) as ok`);

  await check(db, "upgrade: hanya pending dipromosikan dan verified tanpa timestamp diperbaiki", `select (
    (select status = 'verified' and verified_at is not null
     from home_of_giving.donations
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7')
    and (select status = 'verified' and verified_at is not null
     from home_of_giving.donations
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10')
    and not exists (
      select 1 from home_of_giving.donations
      where id in (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'
      )
    )
    and (select count(*) from home_of_giving.donations) = 16
    and (select coalesce(sum(amount_idr), 0) from home_of_giving.donations) = 37650000
    and (select total_raised_idr from home_of_giving.site_stats) = 37650000
  ) as ok`);

  await check(db, "upgrade: evidence rejected dan void terarsip sementara object storage tetap ada", `select (
    not exists (
      select 1 from home_of_giving_private.donation_evidence
      where donation_id in (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'
      )
    )
    and (
      select count(*) from storage.objects
      where bucket_id = 'home-of-giving-private-donation-evidence'
        and name in (
          'legacy/rejected/bukti-transfer.pdf',
          'legacy/void/bukti-transfer.pdf'
        )
    ) = 2
  ) as ok`);

  await check(db, "upgrade: laporan tetap ada tanpa relasi disbursement", `select (
    count(*) filter (where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6') = 1
    and not exists (
      select 1 from information_schema.columns
      where table_schema = 'home_of_giving'
        and table_name = 'reports'
        and column_name = 'disbursement_id'
    )
  ) as ok from home_of_giving.reports`);

  await expectFailure("upgrade: report mencegah campaign terhapus", () => db.query(
    `delete from home_of_giving.campaigns
     where slug = 'renovasi-rumah-ibadah'`,
  ));
  await check(db, "upgrade: report tidak ikut terhapus", `select exists (
    select 1 from home_of_giving.reports
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
  ) as ok`);

  await checkFinalObjects(db, "upgrade");
  await checkSharedIsolation(db, "upgrade");

  const archiveCount = (await db.query(
    "select count(*)::integer as total from home_of_giving_private.simplification_archive",
  )).rows[0].total;
  await run(db, "upgrade rerun 08 (idempotensi)", readSql(sqlFiles.upgrade));
  await check(db, "upgrade rerun: archive tidak berduplikasi", `select count(*) = $1::integer as ok
    from home_of_giving_private.simplification_archive`, [archiveCount]);

  await run(db, "upgrade supabase/sql-editor/09_campaign_bulk_delete.sql", readSql(sqlFiles.bulkDelete));
  await run(db, "upgrade rerun 09 (idempotensi)", readSql(sqlFiles.bulkDelete));
  await check(db, "upgrade: RPC hapus proyek terpasang setelah 09", `select (
    pg_get_function_identity_arguments(
      'public.hog_admin_delete_campaigns(uuid[])'::regprocedure
    ) = 'p_campaign_ids uuid[]'
    and pg_get_function_result('public.hog_admin_delete_campaigns(uuid[])'::regprocedure) = 'jsonb'
    and not has_function_privilege(
      'anon', 'public.hog_admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE'
    )
    and has_function_privilege(
      'authenticated', 'public.hog_admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE'
    )
  ) as ok`);

  await check(db, "upgrade: 6 draft seed historis siap dibersihkan", `select (
    (
      select count(*)
      from home_of_giving.campaigns
      where status = 'draft' and needs_review
    ) = 6
    and exists (
      select 1 from home_of_giving.blog_posts
      where slug = 'perpustakaan-mini-sdn-03-dari-rak-kosong'
        and campaign_id is not null
    )
  ) as ok`);

  await run(db, "upgrade supabase/sql-editor/10_cleanup_legacy_drafts.sql", readSql(sqlFiles.cleanupDrafts));

  await check(db, "cleanup: draft seed historis terarsip sebelum dihapus", `select (
    count(*) filter (where source_table = 'campaigns') = 6
    and count(*) filter (where source_table = 'campaign_media') = 5
    and count(*) filter (where source_table = 'reports') = 1
    and count(*) filter (where source_table = 'blog_posts_campaign_link') = 1
    and count(*) filter (
      where source_table = 'reports'
        and row_data ->> 'storage_path' = 'legacy/laporan.pdf'
    ) = 1
  ) as ok
  from home_of_giving_private.simplification_archive
  where migration_key = '2026-09-16_cleanup_legacy_draft_campaigns_v1'`);

  await check(db, "cleanup: draft seed historis dan relasinya terhapus", `select (
    not exists (
      select 1 from home_of_giving.campaigns
      where slug in (
        'renovasi-rumah-ibadah', 'perpustakaan-mini-sdn-03-cianjur',
        'bibit-pohon-kawasan-puncak', 'bantuan-kursi-roda',
        'sembako-ramadan-200-keluarga', 'bantuan-gempa-cianjur'
      )
    )
    and not exists (
      select 1 from home_of_giving.reports
      where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
    )
    and not exists (
      select 1 from home_of_giving.campaigns where status = 'draft' and needs_review
    )
  ) as ok`);

  await check(db, "cleanup: proyek berjalan dan 14 donasi canonical tetap utuh", `select (
    (select count(*) from home_of_giving.campaigns) = 3
    and (select count(*) from home_of_giving.campaigns where status = 'running') = 3
    and (select count(*) from home_of_giving.donations where external_reference like 'seed:%') = 14
    and (select count(*) from home_of_giving.donations) = 16
    and (select total_raised_idr from home_of_giving.site_stats) = 37650000
    and (select count(*) from home_of_giving.media_assets) = 11
    and (
      select count(*)
      from home_of_giving.media_assets
      where source_key in ('g4', 'g6', 'g7', 'g11')
    ) = 4
  ) as ok`);

  await check(db, "cleanup: artikel blog bertahan dengan campaign_id null", `select (
    count(*) = 7
    and count(*) filter (where campaign_id is not null) = 0
    and count(*) filter (
      where slug = 'perpustakaan-mini-sdn-03-dari-rak-kosong'
        and campaign_id is null
        and status = 'published'
    ) = 1
  ) as ok
  from home_of_giving.blog_posts`);

  const cleanupArchiveCount = (await db.query(
    "select count(*)::integer as total from home_of_giving_private.simplification_archive",
  )).rows[0].total;
  await run(db, "cleanup rerun 10 (idempotensi)", readSql(sqlFiles.cleanupDrafts));
  await check(db, "cleanup rerun: arsip dan data tidak berubah", `select (
    (select count(*) from home_of_giving_private.simplification_archive) = $1::integer
    and (select count(*) from home_of_giving.campaigns) = 3
    and (select count(*) from home_of_giving.donations) = 16
    and (select count(*) from home_of_giving.blog_posts) = 7
  ) as ok`, [cleanupArchiveCount]);

  await run(db, "upgrade final verification 05_verify.sql", readSql(sqlFiles.verify));
  await run(db, "upgrade final verification 07_verify_api_bridge.sql", readSql(sqlFiles.verifyBridge));
  await checkFinalObjects(db, "upgrade final");
  await checkSharedIsolation(db, "upgrade final");
  console.log("OK   legacy upgrade validation complete");
}

try {
  await validateFreshInstall();
  await validateCampaignDeletion();
  await validateLegacyUpgrade();
  console.log("\nSEMUA VALIDASI SQL SELESAI");
} catch (error) {
  process.exitCode = 1;
  console.error("\nVALIDASI SQL GAGAL");
  console.error(error);
}
