



insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'home-of-giving-public-media',
    'home-of-giving-public-media',
    true,
    26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
  ),
  (
    'home-of-giving-public-reports',
    'home-of-giving-public-reports',
    true,
    26214400,
    array['application/pdf']
  ),
  (
    'home-of-giving-private-reports',
    'home-of-giving-private-reports',
    false,
    26214400,
    array['application/pdf']
  ),
  (
    'home-of-giving-private-donation-evidence',
    'home-of-giving-private-donation-evidence',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'home-of-giving-private-financial-evidence',
    'home-of-giving-private-financial-evidence',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
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

drop policy if exists "home_of_giving_admin_manage_private_evidence" on storage.objects;
create policy "home_of_giving_admin_manage_private_evidence"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('home-of-giving-private-donation-evidence', 'home-of-giving-private-financial-evidence')
  and (select home_of_giving_private.is_admin())
)
with check (
  bucket_id in ('home-of-giving-private-donation-evidence', 'home-of-giving-private-financial-evidence')
  and (select home_of_giving_private.is_admin())
);
