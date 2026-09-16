insert into home_of_giving.blog_categories (slug, name, sort_order)
values
  ('laporan', 'Laporan', 10),
  ('cerita-penerima', 'Cerita Penerima', 20),
  ('kegiatan', 'Kegiatan', 30),
  ('transparansi', 'Transparansi', 40)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into home_of_giving.branches (code, name, city, is_active)
values
  ('BO-C-BDG', 'BO C*** Bandung', 'Bandung', true),
  ('BO-P-SRP', 'BO P*** Serpong', 'Tangerang', true),
  ('BO-M-KNG', 'BO M*** Kuningan', 'Jakarta Pusat', true)
on conflict (code) do update
set name = excluded.name,
    city = excluded.city,
    is_active = excluded.is_active;

insert into home_of_giving.media_assets (
  source_key, external_url, caption, alt_text, focal_position, layout_span, album_label,
  location_label, captured_on, sort_order, is_published
)
values
  ('g1', '/photos/community-01-web.jpg', 'Serah terima paket bantuan di Bogor', 'Serah terima paket bantuan di Bogor', '45% 42%', 'wide', 'Serah terima', 'Bogor', date '2026-09-02', 10, true),
  ('g2', '/photos/community-02-web.jpg', 'Relawan mengemas paket sembako', 'Relawan mengemas paket sembako', '58% 40%', 'normal', 'Kegiatan relawan', 'Bogor', date '2026-08-30', 20, true),
  ('g3', '/photos/community-03-web.jpg', 'Survei kebutuhan di Bekasi Utara', 'Survei kebutuhan di Bekasi Utara', '40% 48%', 'normal', 'Bencana', 'Bekasi Utara', date '2026-07-24', 30, true),
  ('g4', '/photos/community-02-web.jpg', 'Hari pertama ruang baca dipakai', 'Hari pertama ruang baca dipakai', '35% 45%', 'tall', 'Pendidikan', 'Cianjur', date '2026-06-28', 40, true),
  ('g5', '/photos/community-01-web.jpg', 'Penyerahan beasiswa anak agent', 'Penyerahan beasiswa anak agent', '62% 38%', 'normal', 'Pendidikan', 'Kelapa Gading', date '2026-06-15', 50, true),
  ('g6', '/photos/community-03-web.jpg', 'Penyerahan dana renovasi rumah ibadah', 'Penyerahan dana renovasi rumah ibadah', '52% 55%', 'normal', 'Serah terima', 'Cianjur', date '2026-07-12', 60, true),
  ('g7', '/photos/community-01-web.jpg', 'Bermain bersama anak-anak penerima', 'Bermain bersama anak-anak penerima', '30% 52%', 'normal', 'Kegiatan relawan', 'Jakarta', date '2026-07-09', 70, true),
  ('g8', '/photos/community-02-web.jpg', 'Briefing panitia sebelum penyaluran', 'Briefing panitia sebelum penyaluran', '48% 32%', 'wide', 'Kegiatan relawan', 'Bogor', date '2026-07-01', 80, true),
  ('g9', '/photos/community-03-web.jpg', 'Distribusi air bersih pasca banjir', 'Distribusi air bersih pasca banjir', '60% 50%', 'normal', 'Bencana', 'Bekasi', date '2026-07-20', 90, true),
  ('g10', '/photos/community-01-web.jpg', 'Penataan 480 buku donasi', 'Penataan 480 buku donasi', '50% 60%', 'normal', 'Pendidikan', 'Cianjur', date '2026-06-26', 100, true),
  ('g11', '/photos/community-02-web.jpg', 'Tanda terima ditandatangani penerima', 'Tanda terima ditandatangani penerima', '42% 58%', 'normal', 'Serah terima', 'Puncak', date '2026-05-30', 110, true)
on conflict (source_key) do update
set external_url = excluded.external_url,
    caption = excluded.caption,
    alt_text = excluded.alt_text,
    focal_position = excluded.focal_position,
    layout_span = excluded.layout_span,
    album_label = excluded.album_label,
    location_label = excluded.location_label,
    captured_on = excluded.captured_on,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;

with refs as (
  select
    (select id from home_of_giving.media_assets where source_key = 'g1') as media_01,
    (select id from home_of_giving.media_assets where source_key = 'g2') as media_02,
    (select id from home_of_giving.media_assets where source_key = 'g3') as media_03
)
insert into home_of_giving.campaigns (
  slug, title, beneficiary_name, beneficiary_location, cover_media_id, status,
  summary, story_paragraphs, quote_text, quote_author, target_amount_idr, starts_on,
  ends_on, total_beneficiaries, is_featured, published_at, needs_review, review_note
)
select
  data.slug,
  data.title,
  data.beneficiary_name,
  data.beneficiary_location,
  data.cover_media_id,
  'running'::home_of_giving.campaign_status,
  data.summary,
  data.story_paragraphs,
  data.quote_text,
  data.quote_author,
  data.target_amount_idr,
  data.starts_on,
  data.ends_on,
  data.total_beneficiaries,
  data.is_featured,
  data.published_at,
  data.needs_review,
  data.review_note
from refs
cross join lateral (
  values
    (
      'bantuan-banjir-bekasi',
      'Bantuan Banjir Bekasi',
      'Yayasan Sahabat Anak',
      'Bogor, Jawa Barat',
      refs.media_01,
      'Bantuan untuk keluarga terdampak banjir Bekasi Utara.',
      array[
        'Banjir pertengahan Juli merendam 6 RW di Bekasi Utara hingga ketinggian satu meter.',
        'Panitia Home of Giving melakukan survei lapangan bersama Yayasan Sahabat Anak dan menyalurkan bantuan kepada satu penerima manfaat agar bantuannya utuh dan mudah dipertanggungjawabkan.'
      ]::text[],
      'Yang paling kami butuhkan bukan uang tunai, tapi kepastian anak-anak bisa kembali ke sekolah minggu depan.',
      'Ketua Yayasan Sahabat Anak, catatan survei 24 Juli 2026',
      100000000::bigint,
      date '2026-08-01',
      date '2026-08-31',
      120,
      true,
      timestamptz '2026-08-01 09:00:00+07',
      true,
      'Seed asli konflik: daftar proyek berjalan Rp68 juta, detail proyek tersalurkan Rp100 juta. Data canonical memakai ledger donasi Rp28,8 juta.'
    ),
    (
      'beasiswa-anak-agent-remax',
      'Beasiswa Anak Agent RE/MAX',
      'Anak keluarga agent RE/MAX',
      null,
      refs.media_02,
      'Beasiswa pendidikan untuk anak keluarga agent RE/MAX.',
      array[
        'Program beasiswa membantu anak keluarga agent RE/MAX yang membutuhkan dukungan biaya pendidikan.',
        'Setiap donasi dicatat panitia dan langsung ditampilkan dengan nama tersamarkan.'
      ]::text[],
      null,
      null,
      50000000::bigint,
      date '2026-08-01',
      date '2026-09-10',
      null,
      false,
      timestamptz '2026-08-01 09:00:00+07',
      false,
      null
    ),
    (
      'paket-gizi-anak-panti',
      'Paket Gizi Anak Panti',
      'Panti asuhan mitra Home of Giving',
      null,
      refs.media_03,
      'Paket gizi untuk anak-anak panti asuhan mitra.',
      array[
        'Program paket gizi mendukung kebutuhan nutrisi anak-anak panti asuhan mitra Home of Giving.',
        'Panitia mencatat setiap donasi dengan nama donatur yang otomatis disamarkan.'
      ]::text[],
      null,
      null,
      30000000::bigint,
      date '2026-08-01',
      date '2026-09-03',
      null,
      false,
      timestamptz '2026-08-01 09:00:00+07',
      false,
      null
    )
) as data(
  slug, title, beneficiary_name, beneficiary_location, cover_media_id,
  summary, story_paragraphs, quote_text, quote_author, target_amount_idr, starts_on,
  ends_on, total_beneficiaries, is_featured, published_at, needs_review, review_note
)
on conflict (slug) do update
set title = excluded.title,
    beneficiary_name = excluded.beneficiary_name,
    beneficiary_location = excluded.beneficiary_location,
    cover_media_id = excluded.cover_media_id,
    status = excluded.status,
    summary = excluded.summary,
    story_paragraphs = excluded.story_paragraphs,
    quote_text = excluded.quote_text,
    quote_author = excluded.quote_author,
    target_amount_idr = excluded.target_amount_idr,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    total_beneficiaries = excluded.total_beneficiaries,
    is_featured = excluded.is_featured,
    published_at = excluded.published_at,
    needs_review = excluded.needs_review,
    review_note = excluded.review_note;

with donation_rows as (
  select * from (values
    ('bantuan-banjir-bekasi', date '2026-08-18', 'Rat*** S.', 'Bekasi', 'individual'::home_of_giving.donor_type, null, 2000000::bigint),
    ('bantuan-banjir-bekasi', date '2026-08-17', 'BO C*** Bandung', 'Bandung', 'branch'::home_of_giving.donor_type, 'BO-C-BDG', 5000000::bigint),
    ('paket-gizi-anak-panti', date '2026-08-16', 'Yul*** H.', 'Jakarta Selatan', 'individual'::home_of_giving.donor_type, null, 750000::bigint),
    ('beasiswa-anak-agent-remax', date '2026-08-15', 'And*** P.', 'Kelapa Gading', 'individual'::home_of_giving.donor_type, null, 1500000::bigint),
    ('beasiswa-anak-agent-remax', date '2026-08-15', 'Muh*** F.', 'Surabaya', 'individual'::home_of_giving.donor_type, null, 500000::bigint),
    ('bantuan-banjir-bekasi', date '2026-08-14', 'BO P*** Serpong', 'Tangerang', 'branch'::home_of_giving.donor_type, 'BO-P-SRP', 7500000::bigint),
    ('paket-gizi-anak-panti', date '2026-08-13', 'Chr*** L.', 'Semarang', 'individual'::home_of_giving.donor_type, null, 1000000::bigint),
    ('bantuan-banjir-bekasi', date '2026-08-12', 'Ded*** W.', 'Bekasi', 'individual'::home_of_giving.donor_type, null, 300000::bigint),
    ('beasiswa-anak-agent-remax', date '2026-08-11', 'Nur*** A.', 'Depok', 'individual'::home_of_giving.donor_type, null, 2500000::bigint),
    ('bantuan-banjir-bekasi', date '2026-08-10', 'BO M*** Kuningan', 'Jakarta Pusat', 'branch'::home_of_giving.donor_type, 'BO-M-KNG', 10000000::bigint),
    ('paket-gizi-anak-panti', date '2026-08-09', 'Ste*** K.', 'Medan', 'individual'::home_of_giving.donor_type, null, 600000::bigint),
    ('beasiswa-anak-agent-remax', date '2026-08-08', 'Fit*** R.', 'Bandung', 'individual'::home_of_giving.donor_type, null, 1250000::bigint),
    ('bantuan-banjir-bekasi', date '2026-08-07', 'Hen*** T.', 'Bali', 'individual'::home_of_giving.donor_type, null, 4000000::bigint),
    ('paket-gizi-anak-panti', date '2026-08-06', 'Lin*** O.', 'Jakarta Barat', 'individual'::home_of_giving.donor_type, null, 450000::bigint)
  ) as d(campaign_slug, donated_on, public_name, city, donor_type, branch_code, amount_idr)
)
insert into home_of_giving.donations (
  campaign_id, donor_type, public_name, city, branch_id, amount_idr, donated_on,
  external_reference, status, is_legacy, internal_note, verified_at
)
select
  c.id,
  d.donor_type,
  d.public_name,
  d.city,
  b.id,
  d.amount_idr,
  d.donated_on,
  'seed:' || c.slug || ':' || to_char(d.donated_on, 'YYYYMMDD') || ':' || replace(d.public_name, ' ', '-'),
  'verified'::home_of_giving.donation_status,
  true,
  'Legacy demo seed: identitas asli dan bukti transfer belum tersedia.',
  timestamptz '2026-08-31 17:00:00+07'
from donation_rows d
join home_of_giving.campaigns c on c.slug = d.campaign_slug
left join home_of_giving.branches b on b.code = d.branch_code
on conflict (external_reference) where external_reference is not null do update
set campaign_id = excluded.campaign_id,
    donor_type = excluded.donor_type,
    public_name = excluded.public_name,
    city = excluded.city,
    branch_id = excluded.branch_id,
    amount_idr = excluded.amount_idr,
    donated_on = excluded.donated_on,
    status = excluded.status,
    is_legacy = excluded.is_legacy,
    internal_note = excluded.internal_note,
    verified_at = excluded.verified_at;

insert into home_of_giving.campaign_media (campaign_id, media_id, role, sort_order)
select c.id, m.id, rel.role::home_of_giving.media_role, rel.sort_order
from (values
  ('bantuan-banjir-bekasi', 'g1', 'cover', 10),
  ('bantuan-banjir-bekasi', 'g2', 'documentation', 20),
  ('bantuan-banjir-bekasi', 'g3', 'documentation', 30),
  ('beasiswa-anak-agent-remax', 'g5', 'gallery', 10),
  ('paket-gizi-anak-panti', 'g3', 'cover', 10)
) as rel(campaign_slug, media_source_key, role, sort_order)
join home_of_giving.campaigns c on c.slug = rel.campaign_slug
join home_of_giving.media_assets m on m.source_key = rel.media_source_key
on conflict (campaign_id, media_id) do update
set role = excluded.role,
    sort_order = excluded.sort_order;

with refs as (
  select
    (select id from home_of_giving.blog_categories where slug = 'cerita-penerima') as cat_cerita,
    (select id from home_of_giving.blog_categories where slug = 'laporan') as cat_laporan,
    (select id from home_of_giving.blog_categories where slug = 'transparansi') as cat_transparansi,
    (select id from home_of_giving.blog_categories where slug = 'kegiatan') as cat_kegiatan,
    (select id from home_of_giving.media_assets where source_key = 'g1') as media_01,
    (select id from home_of_giving.media_assets where source_key = 'g2') as media_02,
    (select id from home_of_giving.media_assets where source_key = 'g3') as media_03
)
insert into home_of_giving.blog_posts (
  slug, title, campaign_id, cover_media_id, excerpt, body_markdown,
  author_name, read_minutes, is_featured, status, published_at
)
select
  data.slug,
  data.title,
  data.campaign_id,
  data.cover_media_id,
  data.excerpt,
  data.body_markdown,
  data.author_name,
  data.read_minutes,
  data.is_featured,
  'published'::home_of_giving.content_status,
  data.published_at
from refs
cross join lateral (
  values
    ('sehari-bersama-keluarga-penerima-di-cianjur', 'Sehari bersama keluarga penerima di Cianjur', null::uuid, refs.media_01, 'Kami berangkat pukul lima pagi untuk mengantar bantuan renovasi. Yang paling diingat bukan angka donasinya, tapi kalimat pertama tuan rumah ketika pintu dibuka.', 'Cerita lapangan dari panitia Home of Giving. Konten lengkap akan diperbarui melalui panel admin.', 'Panitia Home of Giving', 6, true, timestamptz '2026-08-14 09:00:00+07'),
    ('laporan-siklus-juli-tiga-proyek-tuntas', 'Laporan siklus Juli: tiga proyek tuntas', null::uuid, refs.media_03, 'Rincian penggunaan dana untuk renovasi rumah ibadah, perpustakaan mini, dan bibit pohon kawasan Puncak.', 'Laporan ringkas dari data seed. Perlu rekonsiliasi ledger sebelum dipublikasikan sebagai laporan finansial final.', null, null, false, timestamptz '2026-07-28 09:00:00+07'),
    ('kenapa-nama-donatur-kami-samarkan', 'Kenapa nama donatur kami samarkan', null::uuid, refs.media_02, 'Prinsip pencatatan donasi Home of Giving: tercatat lengkap di internal, disamarkan saat dipublikasikan.', 'Nama asli donatur hanya disimpan untuk kebutuhan internal. Website publik selalu menggunakan nama tersamarkan.', null, null, false, timestamptz '2026-08-02 09:00:00+07'),
    ('perpustakaan-mini-sdn-03-dari-rak-kosong', 'Perpustakaan mini SDN 03: dari rak kosong ke 480 buku', null::uuid, refs.media_01, 'Guru kelas empat bercerita soal jam istirahat yang kini dipakai membaca, bukan berkeliaran di lorong.', 'Konten detail akan dilengkapi setelah data historis direkonsiliasi.', null, null, false, timestamptz '2026-07-21 09:00:00+07'),
    ('charity-run-agent-remax-240-peserta', 'Charity Run agent RE/MAX: 240 peserta, satu tujuan', null::uuid, refs.media_02, 'Catatan panitia dari Senayan - bagaimana biaya acara ditekan agar seluruh donasi tetap utuh.', 'Catatan kegiatan akan dilengkapi melalui panel admin.', null, null, false, timestamptz '2026-07-09 09:00:00+07'),
    ('cara-panitia-memilih-satu-penerima-manfaat', 'Cara panitia memilih satu penerima manfaat', null::uuid, refs.media_03, 'Survei lapangan, verifikasi lembaga, dan alasan kami tidak membagi donasi ke banyak penerima sekaligus.', 'Home of Giving menyalurkan satu proyek kepada satu penerima manfaat agar dampak dan pertanggungjawaban lebih utuh.', null, null, false, timestamptz '2026-06-24 09:00:00+07'),
    ('enam-bulan-home-of-giving', 'Enam bulan Home of Giving: yang berhasil dan yang belum', null::uuid, refs.media_01, 'Rekap paruh pertama 2026: Rp 640 juta tersalurkan, dua target belum tercapai, dan rencana perbaikannya.', 'Angka dalam artikel seed memerlukan konfirmasi karena belum didukung ledger Supabase awal.', null, null, false, timestamptz '2026-05-30 09:00:00+07')
) as data(slug, title, campaign_id, cover_media_id, excerpt, body_markdown, author_name, read_minutes, is_featured, published_at)
on conflict (slug) do update
set title = excluded.title,
    campaign_id = excluded.campaign_id,
    cover_media_id = excluded.cover_media_id,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown,
    author_name = excluded.author_name,
    read_minutes = excluded.read_minutes,
    is_featured = excluded.is_featured,
    status = excluded.status,
    published_at = excluded.published_at;

insert into home_of_giving.blog_media (post_id, media_id, sort_order)
select p.id, m.id, rel.sort_order
from (values
  ('sehari-bersama-keluarga-penerima-di-cianjur', 'g1', 10),
  ('kenapa-nama-donatur-kami-samarkan', 'g2', 10),
  ('laporan-siklus-juli-tiga-proyek-tuntas', 'g3', 10)
) as rel(post_slug, media_source_key, sort_order)
join home_of_giving.blog_posts p on p.slug = rel.post_slug
join home_of_giving.media_assets m on m.source_key = rel.media_source_key
on conflict (post_id, media_id) do update
set sort_order = excluded.sort_order;

insert into home_of_giving.annual_goals (year, target_amount_idr, is_published, note)
values (2026, 1500000000, true, 'Target tahunan dari desain program; bukan total donasi aktual.')
on conflict (year) do update
set target_amount_idr = excluded.target_amount_idr,
    is_published = excluded.is_published,
    note = excluded.note;

insert into home_of_giving.site_settings (key, value, description, is_public)
values
  ('whatsapp_cta', jsonb_build_object(
    'label', 'Chat panitia',
    'phone', null,
    'message', 'Halo, saya ingin bertanya tentang program donasi REMAX Home of Giving.'
  ), 'Nomor WhatsApp harus diisi dari pengaturan admin sebelum tombol aktif.', true),
  ('footer_links', jsonb_build_array('Tentang Kami', 'Program', 'Impact', 'Transparansi', 'Berita'), 'Footer link labels dari seed.', true),
  ('nav_label_donation_history', jsonb_build_object('label', 'Riwayat Donasi'), 'Label canonical untuk halaman riwayat donasi.', true),
  ('seed_reconciliation_note', jsonb_build_object(
    'status', 'needs_review',
    'message', 'Seed demo dibersihkan. Statistik publik dihitung dari ledger canonical, bukan dari angka hardcoded lama.'
  ), 'Catatan internal proses pembersihan seed.', false)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    is_public = excluded.is_public;
