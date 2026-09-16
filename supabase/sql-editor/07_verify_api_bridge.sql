select
  count(*) filter (where c.relname like 'hog_%')::integer as total_hog_views,
  count(*) filter (where c.relname like 'hog_admin_%')::integer as total_admin_views,
  count(*) filter (where c.relname like 'hog_%' and c.relkind <> 'v')::integer as hog_non_view_objects
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public';

select
  count(*)::integer as total_campaigns,
  count(*) filter (where status = 'running')::integer as running_campaigns,
  count(*) filter (where btrim(coalesce(beneficiary_name, '')) = '')::integer as missing_beneficiary_names
from public.hog_campaigns;

select
  count(*)::integer as total_donations,
  coalesce(sum(amount_idr), 0)::bigint as total_amount_idr,
  count(*) filter (
    where position('***' in public_name) = 0
      and public_name <> 'Anonim'
  )::integer as unmasked_names
from public.hog_donation_ledger;

select * from public.hog_site_stats;

select
  count(*) filter (where status <> 'verified')::integer as donasi_admin_bukan_verified
from public.hog_admin_donations;

select
  position('status = ''verified''' in pg_get_functiondef(
    'home_of_giving.admin_dashboard_summary()'::regprocedure
  )) > 0 as dashboard_hanya_verified,
  position('status = ''verified''' in pg_get_functiondef(
    'home_of_giving.admin_donation_detail(uuid)'::regprocedure
  )) > 0 as detail_admin_hanya_verified;

select
  pg_get_function_identity_arguments(
    'public.hog_admin_record_donation(uuid,text,bigint,date,text)'::regprocedure
  ) as record_donation_arguments,
  pg_get_function_result('home_of_giving.admin_dashboard_summary()'::regprocedure) as dashboard_result;

select
  pg_get_function_identity_arguments(
    'public.hog_admin_delete_campaigns(uuid[])'::regprocedure
  ) as delete_campaigns_arguments,
  pg_get_function_result(
    'public.hog_admin_delete_campaigns(uuid[])'::regprocedure
  ) as delete_campaigns_result,
  pg_get_function_result(
    'home_of_giving.admin_delete_campaigns(uuid[])'::regprocedure
  ) as delete_campaigns_core_result;

select
  count(*)::integer as legacy_seed_drafts
from public.hog_admin_campaigns
where slug in (
  'renovasi-rumah-ibadah',
  'perpustakaan-mini-sdn-03-cianjur',
  'bibit-pohon-kawasan-puncak',
  'bantuan-kursi-roda',
  'sembako-ramadan-200-keluarga',
  'bantuan-gempa-cianjur'
);

select
  c.relname as view_name,
  coalesce(
    (
      select option_value
      from pg_options_to_table(c.reloptions)
      where option_name = 'security_invoker'
    ),
    'false'
  ) as security_invoker,
  position('home_of_giving.' in pg_get_viewdef(c.oid, true)) > 0 as targets_home_of_giving
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname like 'hog_%'
order by c.relname;

select n.nspname as schema_name, c.relname as obsolete_bridge
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'hog_disbursements',
    'hog_disbursement_allocations',
    'hog_events',
    'hog_admin_beneficiaries',
    'hog_admin_disbursements',
    'hog_admin_disbursement_allocations',
    'hog_admin_events',
    'hog_admin_event_media',
    'hog_admin_campaign_categories',
    'hog_category_distribution_stats'
  )
order by c.relname;

select p.proname as obsolete_rpc
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'hog_admin_preview_masked_name',
    'hog_admin_attach_donation_evidence',
    'hog_admin_verify_donation',
    'hog_admin_reject_donation',
    'hog_admin_void_donation',
    'hog_admin_verify_disbursement',
    'hog_admin_publish_disbursement',
    'hog_admin_record_donation'
  )
  and not (
    p.proname = 'hog_admin_record_donation'
    and pg_get_function_identity_arguments(p.oid) =
      'p_campaign_id uuid, p_full_name text, p_amount_idr bigint, p_donated_on date, p_evidence_path text'
  )
order by p.proname;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'hog_admin_%'
order by p.proname;

select
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
  and table_name like 'hog_admin_%'
order by table_name, privilege_type;

select
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'public'
  and table_name = 'hog_admin_donations'
order by privilege_type;
