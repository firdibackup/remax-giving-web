select 'campaigns' as entity, count(*)::text as total from home_of_giving.campaigns
union all select 'campaigns_published', count(*)::text from home_of_giving.campaigns where published_at is not null
union all select 'campaigns_needs_review', count(*)::text from home_of_giving.campaigns where needs_review
union all select 'donations_verified', count(*)::text from home_of_giving.donations where status = 'verified'
union all select 'media_assets', count(*)::text from home_of_giving.media_assets
union all select 'blog_posts_published', count(*)::text from home_of_giving.blog_posts where status = 'published'
order by entity;

select
  c.slug,
  c.status,
  c.beneficiary_name,
  c.beneficiary_location,
  c.target_amount_idr,
  s.raised_amount_idr,
  s.verified_donation_count,
  s.percent_funded
from home_of_giving.campaigns c
join home_of_giving.campaign_stats s on s.campaign_id = c.id
where c.published_at is not null
order by s.raised_amount_idr desc;

select * from home_of_giving.site_stats;

select
  pg_get_function_result('home_of_giving.admin_dashboard_summary()'::regprocedure) as dashboard_result,
  pg_get_function_identity_arguments(
    'home_of_giving.admin_record_donation(uuid,text,bigint,date,text)'::regprocedure
  ) as record_donation_arguments;

select
  pg_get_function_identity_arguments(
    'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure
  ) as delete_campaigns_arguments,
  pg_get_function_result(
    'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure
  ) as delete_campaigns_result,
  has_function_privilege(
    'anon', 'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE'
  ) as anon_execute,
  has_function_privilege(
    'authenticated', 'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure, 'EXECUTE'
  ) as authenticated_execute;

select
  count(*) as total_baris,
  count(*) filter (where position('***' in public_name) = 0 and public_name <> 'Anonim') as nama_tidak_tersamarkan
from home_of_giving.public_donation_ledger;

select
  position('status = ''verified''' in pg_get_viewdef(
    'home_of_giving.campaign_stats'::regclass, true
  )) > 0 as campaign_stats_hanya_verified,
  position('status = ''verified''' in pg_get_functiondef(
    'home_of_giving.admin_dashboard_summary()'::regprocedure
  )) > 0 as dashboard_hanya_verified,
  position('status = ''verified''' in pg_get_functiondef(
    'home_of_giving.admin_donation_detail(uuid)'::regprocedure
  )) > 0 as detail_admin_hanya_verified;

select count(*) as donasi_belum_terverifikasi
from home_of_giving.donations
where status <> 'verified' or verified_at is null;

select
  count(*) filter (
    where source_table = 'donations_non_verified'
      and row_data ->> 'status' = 'rejected'
  ) as donasi_rejected_diarsipkan,
  count(*) filter (
    where source_table = 'donations_non_verified'
      and row_data ->> 'status' = 'void'
  ) as donasi_void_diarsipkan,
  count(*) filter (
    where source_table = 'donation_evidence'
      and row_data ? 'storage_path'
  ) as bukti_rejected_void_diarsipkan
from home_of_giving_private.simplification_archive
where migration_key = '2026-09-15_simplify_donation_flow_v1';

select slug, status
from home_of_giving.campaigns
where status in ('running', 'closed', 'disbursed', 'reported')
  and btrim(coalesce(beneficiary_name, '')) = ''
order by slug;

select slug, status, needs_review, review_note
from home_of_giving.campaigns
where needs_review
order by slug;

select slug, status
from home_of_giving.campaigns
where slug in (
  'renovasi-rumah-ibadah',
  'perpustakaan-mini-sdn-03-cianjur',
  'bibit-pohon-kawasan-puncak',
  'bantuan-kursi-roda',
  'sembako-ramadan-200-keluarga',
  'bantuan-gempa-cianjur'
)
order by slug;

select n.nspname as schema_name, c.relname as object_name, c.relkind
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
  ('home_of_giving', 'public_disbursements'),
  ('home_of_giving', 'public_disbursement_allocations'),
  ('home_of_giving', 'campaign_categories'),
  ('home_of_giving', 'category_distribution_stats'),
  ('public', 'hog_admin_campaign_categories'),
  ('public', 'hog_category_distribution_stats')
)
order by schema_name, object_name;

select table_name, column_name
from information_schema.columns
where table_schema = 'home_of_giving'
  and (
    (table_name = 'campaigns' and column_name = 'beneficiary_id')
    or (table_name = 'reports' and column_name = 'disbursement_id')
    or (table_name = 'campaigns' and column_name = 'category_id')
  )
order by table_name, column_name;

select
  constraint_row.conname,
  case constraint_row.confdeltype
    when 'r' then 'RESTRICT'
    when 'a' then 'NO ACTION'
    when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'
    when 'd' then 'SET DEFAULT'
  end as campaign_delete_action
from pg_constraint constraint_row
join pg_attribute attribute_row
  on attribute_row.attrelid = constraint_row.conrelid
 and attribute_row.attnum = any (constraint_row.conkey)
where constraint_row.conrelid = 'home_of_giving.reports'::regclass
  and constraint_row.contype = 'f'
  and attribute_row.attname = 'campaign_id';

select
  position('home_of_giving.reports' in pg_get_functiondef(
    'home_of_giving_private.enforce_campaign_rules()'::regprocedure
  )) = 0 as status_reported_tidak_bergantung_laporan;

select c.relname as tabel, c.relrowsecurity as rls_aktif
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'home_of_giving'
  and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

select
  c.relname as view_name,
  coalesce(
    (select option_value
     from pg_options_to_table(c.reloptions)
     where option_name = 'security_invoker'),
    'false'
  ) as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'home_of_giving'
  and c.relkind = 'v'
order by security_invoker, c.relname;

select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'home_of_giving'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
order by table_name, privilege_type;

select column_name
from information_schema.column_privileges
where grantee = 'anon'
  and table_schema = 'home_of_giving'
  and table_name = 'donations'
  and column_name in (
    'donor_identity_id', 'donor_type', 'city', 'branch_id', 'external_reference',
    'internal_note', 'rejected_reason', 'verified_by', 'created_by', 'updated_by'
  )
order by column_name;

select nspname, has_schema_privilege('anon', nspname, 'USAGE') as anon_usage,
       has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_usage
from pg_namespace
where nspname = 'home_of_giving_private';

select table_name, privilege_type
from information_schema.role_table_grants
where grantee in ('anon', 'authenticated')
  and table_schema = 'home_of_giving_private'
  and table_name in ('donor_identities', 'donation_evidence', 'simplification_archive')
order by table_name, privilege_type;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'home_of_giving_%'
order by policyname;

do $$
declare
  target_campaign uuid;
  unmasked_failed boolean := false;
  future_date_failed boolean := false;
begin
  select id into target_campaign
  from home_of_giving.campaigns
  where slug = 'bantuan-banjir-bekasi';

  if target_campaign is null then
    select id into target_campaign
    from home_of_giving.campaigns
    order by created_at desc
    limit 1;
  end if;

  if target_campaign is null then
    raise notice 'Uji aturan bisnis dilewati: tidak ada proyek untuk diuji.';
    return;
  end if;

  begin
    insert into home_of_giving.donations (campaign_id, public_name, amount_idr, donated_on)
    values (target_campaign, 'Budi Santoso', 100000, current_date);
  exception when check_violation then
    unmasked_failed := true;
  end;

  begin
    insert into home_of_giving.donations (campaign_id, public_name, amount_idr, donated_on)
    values (target_campaign, 'Bud*** S.', 100000, ((now() at time zone 'Asia/Jakarta')::date + 1));
  exception when others then
    future_date_failed := true;
  end;

  raise notice 'Uji nama tidak tersamarkan ditolak: %', unmasked_failed;
  raise notice 'Uji tanggal mendatang ditolak: %', future_date_failed;

  if not (unmasked_failed and future_date_failed) then
    raise exception 'Verifikasi aturan bisnis GAGAL. Periksa kembali file 01 dan 02.';
  end if;
end
$$;

select
  m.user_id,
  m.display_name,
  m.is_active,
  u.email
from home_of_giving_private.admin_members m
join auth.users u on u.id = m.user_id
order by m.created_at;
