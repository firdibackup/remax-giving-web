begin;

-- Fund-usage breakdown per campaign (rincian penggunaan dana).
-- Mirrors home_of_giving.campaign_milestones: per-campaign child rows with sort_order,
-- is_published, admin RLS CRUD + anon read, a public view, and admin/public bridge views.
create table if not exists home_of_giving.campaign_allocations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references home_of_giving.campaigns (id) on delete cascade,
  label text not null,
  amount_idr bigint not null default 0,
  note text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_allocations_amount_nonneg check (amount_idr >= 0),
  constraint campaign_allocations_label_present check (btrim(label) <> '')
);

create index if not exists campaign_allocations_campaign_idx
  on home_of_giving.campaign_allocations (campaign_id, sort_order);

alter table home_of_giving.campaign_allocations enable row level security;
alter table home_of_giving.campaign_allocations force row level security;

-- Keep updated_at fresh on every update (function defined in 01_schema.sql).
drop trigger if exists set_updated_at on home_of_giving.campaign_allocations;
create trigger set_updated_at
  before update on home_of_giving.campaign_allocations
  for each row execute function home_of_giving_private.set_updated_at();

-- Grants: admins (authenticated) get full CRUD gated by RLS; anon reads published columns.
revoke all on table home_of_giving.campaign_allocations from public, anon, authenticated, service_role;
grant select, insert, update, delete on table home_of_giving.campaign_allocations to authenticated;
grant all on table home_of_giving.campaign_allocations to service_role;
grant select (id, campaign_id, label, amount_idr, note, sort_order, is_published)
  on home_of_giving.campaign_allocations to anon;

drop policy if exists admin_read on home_of_giving.campaign_allocations;
create policy admin_read on home_of_giving.campaign_allocations
  for select to authenticated
  using ((select home_of_giving_private.is_admin()));

drop policy if exists admin_insert on home_of_giving.campaign_allocations;
create policy admin_insert on home_of_giving.campaign_allocations
  for insert to authenticated
  with check ((select home_of_giving_private.is_admin()));

drop policy if exists admin_update on home_of_giving.campaign_allocations;
create policy admin_update on home_of_giving.campaign_allocations
  for update to authenticated
  using ((select home_of_giving_private.is_admin()))
  with check ((select home_of_giving_private.is_admin()));

drop policy if exists admin_delete on home_of_giving.campaign_allocations;
create policy admin_delete on home_of_giving.campaign_allocations
  for delete to authenticated
  using ((select home_of_giving_private.is_admin()));

drop policy if exists public_read on home_of_giving.campaign_allocations;
create policy public_read on home_of_giving.campaign_allocations
  for select to anon
  using (
    is_published
    and exists (
      select 1
      from home_of_giving.campaigns c
      where c.id = campaign_allocations.campaign_id
        and c.published_at is not null
    )
  );

-- Public view: published allocations of published campaigns.
create or replace view home_of_giving.public_campaign_allocations
with (security_invoker = true) as
select
  a.id,
  a.campaign_id,
  a.label,
  a.amount_idr,
  a.note,
  a.sort_order
from home_of_giving.campaign_allocations a
join home_of_giving.campaigns c on c.id = a.campaign_id
where a.is_published
  and c.published_at is not null;

revoke all on table home_of_giving.public_campaign_allocations from public, anon, authenticated, service_role;
grant select on table home_of_giving.public_campaign_allocations to anon, authenticated, service_role;

-- public.* bridges consumed by the app through PostgREST.
create or replace view public.hog_campaign_allocations
with (security_invoker = true) as
select * from home_of_giving.public_campaign_allocations;

revoke all on table public.hog_campaign_allocations from public, anon, authenticated, service_role;
grant select on table public.hog_campaign_allocations to anon, authenticated, service_role;

create or replace view public.hog_admin_campaign_allocations
with (security_invoker = true) as
select * from home_of_giving.campaign_allocations;

revoke all on table public.hog_admin_campaign_allocations from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.hog_admin_campaign_allocations to authenticated, service_role;

commit;
