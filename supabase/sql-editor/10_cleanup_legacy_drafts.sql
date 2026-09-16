begin;

create temporary table hog_legacy_draft_targets on commit drop as
select c.id, c.slug
from home_of_giving.campaigns c
where c.slug in (
    'renovasi-rumah-ibadah',
    'perpustakaan-mini-sdn-03-cianjur',
    'bibit-pohon-kawasan-puncak',
    'bantuan-kursi-roda',
    'sembako-ramadan-200-keluarga',
    'bantuan-gempa-cianjur'
  )
  and c.status = 'draft'
  and c.needs_review
  and c.published_at is null
  and not exists (
    select 1
    from home_of_giving.donations d
    where d.campaign_id = c.id
  );

do $$
declare
  blockers text;
begin
  select string_agg(c.slug, ', ' order by c.slug)
  into blockers
  from hog_legacy_draft_targets t
  join home_of_giving.campaigns c on c.id = t.id
  where c.status <> 'draft'
     or not c.needs_review
     or c.published_at is not null
     or exists (
       select 1
       from home_of_giving.donations d
       where d.campaign_id = c.id
     );

  if blockers is not null then
    raise exception 'Pembersihan dibatalkan: proyek berikut tidak memenuhi syarat draft tanpa donasi: %', blockers;
  end if;

  if (select count(*) from hog_legacy_draft_targets) > 6 then
    raise exception 'Pembersihan dibatalkan: jumlah target melebihi 6 proyek seed historis.';
  end if;
end
$$;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'campaigns',
  c.id::text,
  to_jsonb(c)
from home_of_giving.campaigns c
join hog_legacy_draft_targets t on t.id = c.id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'campaign_media',
  cm.campaign_id::text || ':' || cm.media_id::text,
  to_jsonb(cm)
from home_of_giving.campaign_media cm
join hog_legacy_draft_targets t on t.id = cm.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'campaign_milestones',
  ms.id::text,
  to_jsonb(ms)
from home_of_giving.campaign_milestones ms
join hog_legacy_draft_targets t on t.id = ms.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'reports',
  r.id::text,
  to_jsonb(r)
from home_of_giving.reports r
join hog_legacy_draft_targets t on t.id = r.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'donations',
  d.id::text,
  to_jsonb(d)
from home_of_giving.donations d
join hog_legacy_draft_targets t on t.id = d.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving_private',
  'donation_evidence',
  e.id::text,
  to_jsonb(e)
from home_of_giving_private.donation_evidence e
join home_of_giving.donations d on d.id = e.donation_id
join hog_legacy_draft_targets t on t.id = d.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

insert into home_of_giving_private.simplification_archive (
  migration_key, source_schema, source_table, source_key, row_data
)
select
  '2026-09-16_cleanup_legacy_draft_campaigns_v1',
  'home_of_giving',
  'blog_posts_campaign_link',
  p.id::text,
  jsonb_build_object(
    'post_id', p.id,
    'post_slug', p.slug,
    'campaign_id', p.campaign_id,
    'campaign_slug', t.slug
  )
from home_of_giving.blog_posts p
join hog_legacy_draft_targets t on t.id = p.campaign_id
on conflict (migration_key, source_schema, source_table, source_key) do nothing;

delete from home_of_giving_private.donation_evidence e
where e.donation_id in (
  select d.id
  from home_of_giving.donations d
  join hog_legacy_draft_targets t on t.id = d.campaign_id
);

create temporary table hog_legacy_draft_identities on commit drop as
select distinct d.donor_identity_id as id
from home_of_giving.donations d
join hog_legacy_draft_targets t on t.id = d.campaign_id
where d.donor_identity_id is not null;

delete from home_of_giving.donations d
where d.campaign_id in (select t.id from hog_legacy_draft_targets t);

delete from home_of_giving_private.donor_identities i
where i.id in (select x.id from hog_legacy_draft_identities x)
  and not exists (
    select 1
    from home_of_giving.donations d
    where d.donor_identity_id = i.id
  );

delete from home_of_giving.campaign_media cm
where cm.campaign_id in (select t.id from hog_legacy_draft_targets t);

delete from home_of_giving.campaign_milestones ms
where ms.campaign_id in (select t.id from hog_legacy_draft_targets t);

delete from home_of_giving.reports r
where r.campaign_id in (select t.id from hog_legacy_draft_targets t);

delete from home_of_giving.campaigns c
where c.id in (select t.id from hog_legacy_draft_targets t);

do $$
declare
  leftovers text;
begin
  select string_agg(c.slug, ', ' order by c.slug)
  into leftovers
  from home_of_giving.campaigns c
  where c.slug in (
      'renovasi-rumah-ibadah',
      'perpustakaan-mini-sdn-03-cianjur',
      'bibit-pohon-kawasan-puncak',
      'bantuan-kursi-roda',
      'sembako-ramadan-200-keluarga',
      'bantuan-gempa-cianjur'
    )
    and c.status = 'draft'
    and c.needs_review
    and c.published_at is null;

  if leftovers is not null then
    raise exception 'Pembersihan gagal: draft seed historis masih tersisa: %', leftovers;
  end if;
end
$$;

select
  row_data ->> 'storage_bucket' as storage_bucket,
  row_data ->> 'storage_path' as storage_path,
  source_table
from home_of_giving_private.simplification_archive
where migration_key = '2026-09-16_cleanup_legacy_draft_campaigns_v1'
  and source_table in ('reports', 'donation_evidence')
  and nullif(btrim(coalesce(row_data ->> 'storage_path', '')), '') is not null
order by source_table, storage_path;

commit;
