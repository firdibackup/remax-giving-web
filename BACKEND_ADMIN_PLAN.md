# Backend Supabase dan Panel Admin

## Status final

Backend Supabase, integrasi data Next.js, dan panel Super Admin sudah diimplementasikan dengan alur MVP yang disederhanakan. Versi final `01`–`07` merupakan baseline tersinkronisasi untuk instalasi baru. `08_simplify_donation_flow.sql` hanya digunakan untuk meng-upgrade database yang pernah menjalankan versi legacy `01`–`07`.

Integrasi provider email dan E2E dengan kredensial Super Admin nyata masih menunggu kredensial/domain pengirim dan akun uji. Keduanya tidak mengubah model data final.

## Keputusan final

- Supabase adalah sumber data utama aplikasi.
- MVP memiliki satu role aplikasi: Super Admin, dengan keanggotaan pada tabel privat dan Supabase Auth invite-only.
- Nama donatur pada website publik selalu disamarkan secara deterministik.
- Super Admin memasukkan donasi manual setelah konfirmasi transfer.
- Donasi baru langsung tercatat sebagai `verified`; tidak ada antrean pending, reject, void, atau langkah verifikasi terpisah pada alur admin final.
- Bukti transfer bersifat opsional dan disimpan privat jika diunggah.
- Penerima manfaat disimpan sebagai teks `beneficiary_name` dan `beneficiary_location` langsung pada proyek; tidak ada master penerima manfaat atau kontak penerima terpisah.
- Nilai terkumpul, persentase, jumlah transaksi, dan statistik situs dihitung dari ledger donasi verified.
- Laporan proyek dan laporan berkala tetap tersedia tanpa bergantung pada record penyaluran.
- Nomor, label, dan pesan WhatsApp dikelola sekali melalui setting global `whatsapp_cta`, lalu dipakai seluruh CTA website.
- Modul penerima manfaat master, kegiatan/event, penyaluran, dan rincian alokasi sudah dihapus dari schema, API bridge, panel admin, dan navigasi.

## Sumber data dan rekonsiliasi awal

Sumber awal:

- `src/lib/seed/campaigns.ts`
- `src/lib/seed/donations.ts`
- `src/lib/seed/project-details.ts`
- `src/lib/seed/content.ts`
- `src/lib/seed/site.ts`
- `RE-MAX_Peduli_Rancangan_MVP (1).docx`

Konflik seed yang tidak boleh dianggap sebagai fakta:

- Bantuan Banjir Bekasi tercatat berjalan dengan Rp68.000.000 di daftar proyek, tetapi tercatat selesai dan tersalurkan Rp100.000.000 pada detail proyek.
- Empat belas transaksi seed hanya berjumlah Rp37.350.000.
- Statistik Rp1,2 miliar, 312 transaksi, 14 proyek selesai, dan 248 foto tidak didukung record seed.
- Enam proyek historis tidak memiliki ledger donasi pendukung.
- Data penyaluran historis lama tidak lengkap dan tidak dapat direkonsiliasi sebagai fakta finansial.

Baseline canonical mempublikasikan tiga proyek berjalan, empat belas donasi verified, kategori, blog, media demo, target tahunan, dan pengaturan situs yang aman. Enam proyek historis tetap berupa draft `needs_review`. Statistik publik tidak memakai angka hardcoded lama.

## Isolasi pada shared Supabase project

- Tabel, enum, view, trigger, dan RPC internal berada di schema `home_of_giving`.
- Identitas donatur, bukti donasi, admin, arsip migrasi, dan audit berada di `home_of_giving_private`.
- Data API menggunakan view/RPC `public.hog_*`; `home_of_giving` tidak perlu ditambahkan ke Exposed schemas.
- `home_of_giving_private` tidak pernah ditambahkan ke Exposed schemas.
- Collision guard menghentikan pembuatan atau migrasi bridge jika nama `hog_*` sudah dimiliki backend lain.
- Bucket Storage menggunakan prefix `home-of-giving-` karena namespace bucket bersifat global dalam satu project.
- Validator menjaga agar tabel, bucket, dan policy milik aplikasi lain tidak berubah.

## Model data final

### Schema `home_of_giving`

- `campaign_categories`
- `blog_categories`
- `branches`
- `media_assets`
- `campaigns`
- `donations`
- `campaign_milestones`
- `reports`
- `blog_posts`
- `campaign_media`
- `blog_media`
- `annual_goals`
- `site_settings`

### Schema `home_of_giving_private`

- `admin_members`
- `donor_identities`
- `donation_evidence`
- `audit_logs`
- `simplification_archive`

### Object yang sudah dihapus

- `beneficiaries` dan `beneficiary_contacts`
- `events` dan `event_media`
- `disbursements` dan `disbursement_allocations`
- Kolom legacy `campaigns.beneficiary_id` dan `reports.disbursement_id`
- Seluruh public/internal view, policy, trigger, RPC, dan bridge admin yang hanya mendukung object tersebut
- RPC donation pending/evidence-required: attach evidence, verify, reject, void, serta preview masking terpisah

## Alur final

### Proyek

Proyek menyimpan nama dan lokasi penerima secara langsung. Proyek publik wajib memiliki kategori, `published_at`, dan `beneficiary_name`. Media dokumentasi terkait proyek menggunakan `campaign_media`.

### Donasi

RPC final:

```text
public.hog_admin_record_donation(
  p_campaign_id uuid,
  p_full_name text,
  p_amount_idr bigint,
  p_donated_on date,
  p_evidence_path text default null
)
```

RPC hanya dapat dijalankan admin. Dalam satu transaksi RPC akan:

1. memvalidasi proyek, nama, nominal, dan tanggal;
2. menyimpan identitas lengkap pada schema privat;
3. menghasilkan nama publik deterministik, misalnya `Siti Rahmawati` menjadi `Sit*** R.`;
4. membuat donasi langsung berstatus `verified`;
5. menyimpan metadata bukti privat hanya jika `p_evidence_path` diberikan.

Donasi langsung masuk ledger dan statistik publik. Nominal atau proyek pada donasi verified tidak dapat diubah; koreksi dilakukan dengan mencatat transaksi yang benar sesuai prosedur operasional.

### Laporan

Laporan dapat berjenis `campaign` atau `periodic`. Draft tidak terlihat publik. Laporan hanya dapat dipublikasikan jika memiliki path berkas atau URL eksternal. Proyek hanya dapat diubah ke status `reported` setelah memiliki laporan proyek yang sudah terbit. Tidak ada relasi atau workflow penyaluran.

### WhatsApp

`site_settings.whatsapp_cta` adalah konfigurasi global yang berisi `label`, `phone`, dan `message`. Panel Pengaturan mengelola satu konfigurasi ini; CTA umum dan CTA donasi proyek membacanya dari public site settings. Tidak ada nomor WhatsApp per proyek.

## Privasi dan keamanan

- Supabase Auth menggunakan akun invite-only dan pendaftaran publik dinonaktifkan.
- Otorisasi tidak menggunakan `user_metadata`; keanggotaan Super Admin berasal dari `home_of_giving_private.admin_members`.
- Semua tabel aplikasi mengaktifkan RLS.
- Anonymous hanya membaca view publik aman dan tidak memiliki grant tulis.
- Pengguna terautentikasi non-admin tidak dapat membaca data operasional atau menjalankan mutation admin.
- Identitas asli, bukti donasi, arsip migrasi, dan audit log tidak tersedia melalui API publik.
- Public view menggunakan `security_invoker = true`.
- RPC internal privileged memeriksa keanggotaan admin dan memiliki `search_path` kosong.
- Secret key atau service role tidak pernah dikirim ke browser.

## Storage aktif

- `home-of-giving-public-media`: foto dan video publik.
- `home-of-giving-public-reports`: laporan PDF publik.
- `home-of-giving-private-donation-evidence`: bukti donasi opsional.

Anonymous hanya membaca bucket publik. Super Admin mengelola object melalui sesi terautentikasi. Bukti privat diakses menggunakan signed URL berdurasi terbatas.

## Read model dan API bridge final

Public read model utama:

- `public_campaigns`
- `campaign_stats`
- `public_donation_ledger`
- `public_campaign_milestones`
- `public_reports`
- `public_blog_posts`
- `public_gallery_media`
- `public_campaign_media`
- `site_stats`
- `category_distribution_stats`
- `public_site_settings`
- `public_annual_goals`

Client Next.js memakai schema default `public` melalui bridge `hog_*`. Admin memakai bridge `hog_admin_*` yang tersisa untuk proyek, donasi, laporan, blog, media, target tahunan, pengaturan, audit, identitas sesi, detail donasi, dan ringkasan dashboard.

Dashboard final mengembalikan tepat empat metrik:

- `total_donation_count`
- `total_donation_amount_idr`
- `running_campaign_count`
- `unpublished_report_count`

## Panel admin yang diimplementasikan

Routes final:

- `/admin/login`
- `/admin`
- `/admin/proyek`
- `/admin/proyek/baru`
- `/admin/proyek/[id]`
- `/admin/donasi`
- `/admin/donasi/baru`
- `/admin/donasi/[id]`
- `/admin/laporan`
- `/admin/konten/blog`
- `/admin/konten/media`
- `/admin/pengaturan`
- `/admin/audit`

Fungsi yang sudah tersedia:

- login, logout, refresh sesi, dan proteksi route;
- dashboard operasional dan donasi terbaru;
- pengelolaan proyek dengan penerima manfaat langsung, milestone, cover, dan galeri;
- pencatatan donasi langsung verified dengan bukti opsional dan detail privat untuk admin;
- pembuatan, penerbitan, penarikan, dan penghapusan laporan proyek/berkala;
- pengelolaan blog dan media;
- target tahunan, pengaturan situs, dan WhatsApp global;
- audit log;
- seluruh route publik membaca Supabase tanpa fallback seed runtime.

Tidak ada route panel untuk penerima manfaat master, event/kegiatan, penyaluran, atau alokasi.

## Menjalankan SQL

### Instalasi baru

Jalankan versi final tersinkronisasi:

1. `supabase/sql-editor/01_schema.sql`
2. `supabase/sql-editor/02_security.sql`
3. `supabase/sql-editor/03_storage.sql`
4. `supabase/sql-editor/04_seed_demo.sql`
5. `supabase/sql-editor/05_verify.sql`
6. `supabase/sql-editor/06_api_bridge.sql`
7. `supabase/sql-editor/07_verify_api_bridge.sql`

`08_simplify_donation_flow.sql` tidak diperlukan pada instalasi baru karena hasil akhirnya sudah tercakup dalam final `01`–`07`.

### Upgrade database legacy

Untuk database yang pernah menjalankan legacy `01`–`07`:

1. buat backup database;
2. jalankan `supabase/sql-editor/08_simplify_donation_flow.sql`;
3. jalankan versi final `supabase/sql-editor/05_verify.sql`;
4. jalankan versi final `supabase/sql-editor/07_verify_api_bridge.sql`.

Migrasi 08 berjalan dalam transaksi dan bersifat data-safe. Data dari modul lama diarsipkan ke `home_of_giving_private.simplification_archive` sebelum object dihapus. Nama/lokasi penerima dibackfill ke proyek, media event yang terkait proyek dipertahankan sebagai campaign media, laporan dipertahankan tanpa relasi penyaluran, dan donasi legacy non-verified diarsipkan lalu dinormalisasi menjadi verified. Unique key arsip membuat migrasi aman untuk dijalankan ulang tanpa menduplikasi arsip.

Jangan menjalankan ulang `04_seed_demo.sql` pada database upgrade yang record demonya sudah diedit melalui panel admin.

## Onboarding Super Admin

Setelah akun dibuat melalui Supabase Auth Dashboard:

```sql
insert into home_of_giving_private.admin_members (user_id, display_name)
select id, 'Super Admin'
from auth.users
where lower(email) = lower('GANTI_EMAIL_ADMIN')
on conflict (user_id) do update
set display_name = excluded.display_name,
    is_active = true;
```

## Validasi final

Validator lokal `node scripts/validate-sql.mjs` tidak mengakses SQL remote. Cakupannya:

- urutan fresh final `01`–`07`, termasuk Storage sebelum seed dan file verifikasi pada posisinya;
- rerun idempotent dan stabilitas jumlah seed;
- isolasi shared schema, bucket, dan policy;
- RLS, security-invoker view, grant anon, serta akses anon/non-admin/admin;
- RPC donasi lima argumen, immediate verified, bukti opsional, dan masking deterministik;
- penerima manfaat langsung pada proyek dan WhatsApp global;
- laporan draft/terbit serta prasyarat status proyek `reported`;
- shape dashboard final;
- ketiadaan object, kolom, view, dan RPC obsolete;
- fixture schema legacy representatif, eksekusi serta rerun migrasi 08, isi arsip, backfill, preservasi media/laporan, normalisasi donasi, lalu final `05` dan `07`.

## Definition of done MVP

Super Admin dapat mengelola proyek dan penerima manfaat langsung, mencatat donasi yang langsung verified dengan nama publik tersamarkan dan bukti opsional, mengelola laporan, blog, media, target, WhatsApp global, serta audit. Website hanya menampilkan data aman, dan seluruh statistik finansial berasal dari ledger donasi verified.
