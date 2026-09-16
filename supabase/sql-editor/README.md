# SQL Editor Supabase

Skrip database REMAX Home of Giving. Tabel aplikasi berada di schema `home_of_giving`, sedangkan identitas donatur, bukti donasi, keanggotaan admin, arsip migrasi, dan audit log berada di `home_of_giving_private`.

## Akses Data API

Schema `home_of_giving` tidak perlu ditambahkan ke **Exposed schemas**. `06_api_bridge.sql` menyediakan view dan RPC ber-prefix `hog_` di schema `public`, sehingga client tetap memakai schema default `public` tanpa membuka tabel internal secara langsung.

`home_of_giving_private` tidak boleh ditambahkan ke **Exposed schemas**. Anonymous tidak memiliki akses tulis, dan pengguna terautentikasi non-admin tidak memperoleh akses operasional.

## Instalasi baru

Untuk database baru yang belum pernah menjalankan skrip Home of Giving, jalankan versi final yang sudah tersinkronisasi berikut satu kali dan sesuai urutan:

| Urutan | File | Isi |
|---|---|---|
| 1 | `01_schema.sql` | Schema, tabel, constraint, trigger, dan read model final |
| 2 | `02_security.sql` | RLS, grant, dan RPC admin final |
| 3 | `03_storage.sql` | Bucket dan policy Storage; dijalankan sebelum seed |
| 4 | `04_seed_demo.sql` | Data demo canonical dan pengaturan WhatsApp global |
| 5 | `05_verify.sql` | Verifikasi schema, data, keamanan, dan aturan bisnis internal |
| 6 | `06_api_bridge.sql` | Bridge Data API `public.hog_*` |
| 7 | `07_verify_api_bridge.sql` | Verifikasi bridge, grant, dan kontrak RPC final |

**Jangan jalankan `08_simplify_donation_flow.sql`, `09_campaign_bulk_delete.sql`, dan `11_remove_campaign_categories.sql` pada instalasi baru.** Perubahan migrasi 08 dan RPC hapus proyek massal dari 09 sudah disinkronkan ke versi final `01`–`07`. `10_cleanup_legacy_drafts.sql` juga tidak diperlukan karena seed final sudah tidak membuat draft seed historis. Baseline instalasi baru sudah bebas kategori proyek, sehingga `11` hanya menjadi no-op di sana.

Skrip schema, security, storage, bridge, dan verifikasi dirancang dapat dijalankan ulang. Seed juga idempotent untuk data demo, tetapi jangan jalankan ulang `04_seed_demo.sql` setelah record demo mulai diedit melalui panel admin karena nilainya dapat dikembalikan ke baseline demo.

## Upgrade database legacy

Bagian ini hanya untuk database yang sebelumnya sudah menjalankan versi legacy `01`–`07`, saat modul penerima manfaat master, kegiatan, penyaluran, kategori proyek, serta workflow donasi pending masih tersedia.

1. Jalankan `11_remove_campaign_categories.sql` terlebih dahulu.
2. Jalankan `08_simplify_donation_flow.sql`.
3. Jalankan `09_campaign_bulk_delete.sql` untuk memasang RPC hapus proyek massal.
4. Jalankan `10_cleanup_legacy_drafts.sql` untuk membersihkan 6 draft seed historis.
5. Setelah berhasil, jalankan versi final `05_verify.sql`.
6. Jalankan versi final `07_verify_api_bridge.sql`.

`11` wajib dijalankan sebelum `08` karena `CREATE OR REPLACE VIEW` tidak dapat menghapus kolom: mengganti view lama yang masih memuat kolom kategori dengan definisi final yang lebih sedikit kolomnya gagal dengan error Postgres 42P16 "cannot drop columns from view". `11` menghapus view/kolom kategori usang lewat `DROP` lalu membangun ulang bentuk final, sehingga replace ala `06`/`08` sesudahnya berjalan bersih.

Migrasi 08 adalah migrasi arsip yang data-safe dan transaksional. Sebelum object lama dihapus, data penerima manfaat, kontak penerima, kegiatan, media kegiatan, penyaluran, alokasi, relasi legacy pada proyek/laporan, serta donasi non-verified disalin ke `home_of_giving_private.simplification_archive`. Migrasi juga:

- memindahkan nama dan lokasi penerima langsung ke `campaigns.beneficiary_name` dan `campaigns.beneficiary_location`;
- mempertahankan media kegiatan yang terkait proyek sebagai `campaign_media`;
- mempertahankan record laporan sambil melepas relasi penyaluran;
- mengarsipkan lalu menormalkan donasi legacy non-verified menjadi verified;
- menghapus tabel, view, RPC, policy, trigger, tipe, relasi, dan bridge API yang hanya digunakan modul lama;
- membangun kembali read model serta API bridge final.

Migrasi 08 dapat dijalankan ulang: unique key arsip mencegah duplikasi dan langkah pembersihannya memeriksa keberadaan object. Tetap gunakan backup database sebelum upgrade produksi. Jangan menjalankan ulang seed saat upgrade database yang datanya sudah dikelola admin.

### 09: RPC hapus proyek massal

`09_campaign_bulk_delete.sql` bersifat transaksional dan idempotent. Skrip ini memasang `home_of_giving.admin_delete_campaigns(uuid[])` beserta bridge `public.hog_admin_delete_campaigns(uuid[])` pada database yang sudah menjalankan 08. RPC tersebut `security definer`, memakai `set search_path = ''`, hanya dapat dipanggil Super Admin (`home_of_giving_private.is_admin()`, error `42501` bila bukan admin), serta tidak diberikan ke `public`/`anon`.

Menghapus proyek berarti menghapus seluruh data terkaitnya secara permanen dengan urutan aman tanpa `cascade`: metadata bukti donasi, donasi, identitas donatur yang menjadi yatim, relasi media proyek, milestone, laporan, lalu proyeknya. Artikel blog tidak pernah dihapus; `campaign_id`-nya menjadi null.

RPC mengembalikan `jsonb`:

```json
{
  "deleted_campaign_count": 0,
  "deleted_donation_count": 0,
  "storage_objects": [{ "bucket": "…", "path": "…" }]
}
```

`storage_objects` adalah daftar object Storage yang harus dihapus aplikasi: bukti donasi (default bucket `home-of-giving-private-donation-evidence` kecuali baris menyimpan bucket sendiri), berkas laporan yang memiliki `storage_path`, dan media yang menjadi yatim. Media dianggap yatim bila hanya terkait proyek yang dihapus serta tidak dipakai `blog_media`, `campaign_media` lain, maupun `cover_media_id` yang tersisa; baris `media_assets` yatim berbasis Storage ikut dihapus. Item yang hanya memiliki `external_url` tidak pernah dikembalikan maupun dihapus. Array kosong atau null menghasilkan nilai nol dan daftar kosong.

### 10: pembersihan draft seed historis

`10_cleanup_legacy_drafts.sql` bersifat transaksional dan dapat dijalankan ulang. Skrip ini hanya menyasar 6 proyek seed historis (`renovasi-rumah-ibadah`, `perpustakaan-mini-sdn-03-cianjur`, `bibit-pohon-kawasan-puncak`, `bantuan-kursi-roda`, `sembako-ramadan-200-keluarga`, `bantuan-gempa-cianjur`) yang masih berstatus `draft` dengan `needs_review`, belum terbit, dan tidak memiliki donasi. Proyek berjalan atau yang sudah punya donasi tidak pernah disentuh.

Sebelum dihapus, proyek dan relasinya (`campaign_media`, `campaign_milestones`, `reports`, `donations`, `donation_evidence`, serta tautan `blog_posts.campaign_id`) diarsipkan ke `home_of_giving_private.simplification_archive` dengan `migration_key` `2026-09-16_cleanup_legacy_draft_campaigns_v1`. Penghapusan memakai urutan dependensi yang sama seperti RPC. Baris `media_assets` tidak dihapus skrip ini agar galeri publik tetap utuh; query terakhir menampilkan bucket dan path berkas yang perlu dibersihkan manual dari Storage.

### 11: hapus kategori proyek

`11_remove_campaign_categories.sql` bersifat transaksional dan dapat dijalankan ulang. Skrip ini hanya menyasar kategori proyek (`home_of_giving.campaign_categories`, `campaigns.category_id` beserta FK/index-nya, `home_of_giving.public_campaigns` dan `home_of_giving.category_distribution_stats` versi lama, serta `public.hog_campaigns`, `public.hog_admin_campaigns`, `public.hog_admin_campaign_categories`, `public.hog_category_distribution_stats` versi lama); kategori blog (`home_of_giving.blog_categories` + `blog_posts.category_id`) tidak disentuh.

Sebelum dihapus, seluruh baris kategori proyek disalin ke `home_of_giving_private.simplification_archive` dengan `migration_key` `2026-09-16_remove_campaign_categories_v1`. Penghapusan memakai urutan dependensi tanpa `CASCADE`: bridge `public` dulu, lalu view `home_of_giving`, lalu kolom `campaigns.category_id`, lalu tabel kategori. View `home_of_giving.public_campaigns`, `public.hog_campaigns`, dan `public.hog_admin_campaigns` dibangun ulang dalam bentuk final tanpa kategori beserta grant-nya; dua query terakhir menampilkan sisa object/kolom kategori yang seharusnya 0 baris.

## Model final yang disederhanakan

- Penerima manfaat bukan master data terpisah; nama dan lokasi disimpan langsung pada setiap proyek.
- Donasi yang dimasukkan Super Admin langsung berstatus `verified` dan langsung masuk statistik serta ledger publik.
- RPC pencatatan donasi final memiliki lima argumen: campaign, nama lengkap, nominal, tanggal, dan path bukti opsional.
- Bukti transfer bersifat opsional. Jika diberikan, metadata file disimpan privat; bukti tidak menjadi syarat verifikasi.
- Masking nama bersifat deterministik. Contoh: `Siti Rahmawati` menjadi `Sit*** R.`.
- Nomor, label, dan pesan WhatsApp disimpan sekali secara global pada setting publik `whatsapp_cta`; tidak ada konfigurasi WhatsApp per proyek.
- Laporan tetap tersedia sebagai laporan proyek atau berkala. PDF draf disimpan di bucket privat, dipindahkan ke bucket publik saat diterbitkan, dan dikembalikan ke bucket privat saat ditarik; tautan eksternal tidak dikelola oleh Storage.
- Menghapus proyek berarti menghapus permanen donasi, identitas donatur yatim, metadata bukti, relasi media, milestone, dan laporan proyek tersebut melalui RPC `hog_admin_delete_campaigns`. Artikel blog tidak ikut terhapus dan hanya kehilangan tautan proyeknya.
- Modul penerima manfaat master, kontak penerima, kegiatan/event, media event, penyaluran, dan rincian alokasi sudah dihapus dari schema serta API final.
- Statistik publik selalu dihitung dari ledger donasi verified, bukan dari angka tampilan terpisah.

## Data demo

Baseline demo berisi:

- 3 proyek berjalan dengan penerima manfaat berupa teks langsung pada proyek;
- 14 donasi verified bertanda legacy, total **Rp37.350.000**;
- kategori blog, konten blog, media, target tahunan, serta pengaturan situs termasuk WhatsApp global.

6 proyek historis berstatus draft dengan tanda `needs_review` tidak lagi dibuat seed. Data tersebut hanya angka seed tanpa ledger donasi pendukung sehingga hanya menambah noise pada panel admin. Database lama yang sudah terlanjur memilikinya dibersihkan lewat `10_cleanup_legacy_drafts.sql`.

Angka lama seperti Rp1,2 miliar, 312 transaksi, 14 proyek selesai, dan 248 foto tidak dimasukkan karena tidak didukung record canonical.

## Membuat Super Admin

1. Buat akun melalui **Authentication → Users → Add user**.
2. Nonaktifkan pendaftaran publik pada pengaturan Auth.
3. Jalankan SQL berikut dengan email akun tersebut:

```sql
insert into home_of_giving_private.admin_members (user_id, display_name)
select id, 'Super Admin'
from auth.users
where lower(email) = lower('GANTI_EMAIL_ADMIN')
on conflict (user_id) do update
set display_name = excluded.display_name,
    is_active = true;
```

Tanpa keanggotaan aktif tersebut, akun terautentikasi tidak dapat memakai panel atau API admin.

## Validasi lokal

Validator menggunakan Postgres lokal di PGlite dan tidak mengakses database Supabase remote:

```bash
node scripts/validate-sql.mjs
```

Jalankan hanya jika `@electric-sql/pglite` sudah tersedia. Validator menjalankan baseline fresh final `01`–`07`, menguji rerun idempotent, isolasi shared schema, akses anon/non-admin/admin, RPC donasi lima argumen dengan bukti opsional, masking, penerima langsung pada proyek, laporan, dashboard, WhatsApp global, serta ketiadaan object/API obsolete termasuk kategori proyek.

Validator juga menguji hapus proyek massal: penolakan anon dan non-admin, kontrak payload, penghapusan donasi beserta metadata bukti dan identitas donatur yatim, preservasi media bersama proyek/blog, penghapusan media yatim, artikel blog yang bertahan dengan `campaign_id` null, serta idempotensi `09` dan `10`.

Terakhir, validator membangun fixture database legacy representatif lengkap dengan 6 draft seed historis plus fixture kategori proyek gaya lama, menjalankan `11` lalu memeriksa object kategori hilang dan data proyek utuh, mererun `11`, menjalankan ulang `06` dan bagian view `08` tanpa 42P16, menjalankan migrasi 08, memeriksa arsip dan preservasi data, mererun 08, memasang 09, menjalankan 10 sampai draft historis bersih tanpa mengubah proyek berjalan dan 14 donasi canonical, lalu menjalankan verifikasi final `05` dan `07`.

## Integrasi aplikasi

Next.js memakai schema default `public` dan hanya mengakses view/RPC `hog_*`. Project URL dan publishable key disimpan melalui environment aplikasi; secret key atau service role tidak dikirim ke browser.

## Penyimpanan laporan

Bucket `home-of-giving-private-reports` bersifat privat (25 MB, `application/pdf`) dengan policy `home_of_giving_admin_manage_private_reports` khusus Super Admin, terpisah dari policy aset publik. Panel admin membuka berkas privat melalui signed URL berumur pendek yang dibuat di server, sedangkan berkas pada bucket publik memakai URL publik. Dengan pola ini, laporan yang belum terbit atau sudah ditarik tidak lagi dapat dibaca publik.
