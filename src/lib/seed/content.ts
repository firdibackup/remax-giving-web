import type {
  BlogPost,
  GalleryAlbum,
  GalleryPhoto,
  ProjectDonor,
} from "./types";

export const blogPosts: BlogPost[] = [
  {
    slug: "sehari-bersama-keluarga-penerima-di-cianjur",
    title: "Sehari bersama keluarga penerima di Cianjur",
    category: "Cerita Penerima",
    date: "14 Agustus 2026",
    excerpt:
      "Kami berangkat pukul lima pagi untuk mengantar bantuan renovasi. Yang paling diingat bukan angka donasinya, tapi kalimat pertama tuan rumah ketika pintu dibuka.",
    image: "/photos/community-01-web.jpg",
    imagePos: "42% 45%",
    author: "Panitia Home of Giving",
    readTime: "6 menit baca",
    featured: true,
  },
  {
    slug: "laporan-siklus-juli-tiga-proyek-tuntas",
    title: "Laporan siklus Juli: tiga proyek tuntas",
    category: "Laporan",
    date: "28 Jul 2026",
    excerpt:
      "Rincian penggunaan dana untuk renovasi rumah ibadah, perpustakaan mini, dan bibit pohon kawasan Puncak.",
    image: "/photos/community-03-web.jpg",
    imagePos: "35% 50%",
  },
  {
    slug: "kenapa-nama-donatur-kami-samarkan",
    title: "Kenapa nama donatur kami samarkan",
    category: "Transparansi",
    date: "2 Agu 2026",
    excerpt:
      "Prinsip pencatatan donasi Home of Giving: tercatat lengkap di internal, disamarkan saat dipublikasikan.",
    image: "/photos/community-02-web.jpg",
    imagePos: "60% 40%",
  },
  {
    slug: "perpustakaan-mini-sdn-03-dari-rak-kosong",
    title: "Perpustakaan mini SDN 03: dari rak kosong ke 480 buku",
    category: "Cerita Penerima",
    date: "21 Jul 2026",
    excerpt:
      "Guru kelas empat bercerita soal jam istirahat yang kini dipakai membaca, bukan berkeliaran di lorong.",
    image: "/photos/community-01-web.jpg",
    imagePos: "50% 40%",
  },
  {
    slug: "charity-run-agent-remax-240-peserta",
    title: "Charity Run agent RE/MAX: 240 peserta, satu tujuan",
    category: "Kegiatan",
    date: "9 Jul 2026",
    excerpt:
      "Catatan panitia dari Senayan — bagaimana biaya acara ditekan agar seluruh donasi tetap utuh.",
    image: "/photos/community-02-web.jpg",
    imagePos: "45% 45%",
  },
  {
    slug: "cara-panitia-memilih-satu-penerima-manfaat",
    title: "Cara panitia memilih satu penerima manfaat",
    category: "Transparansi",
    date: "24 Jun 2026",
    excerpt:
      "Survei lapangan, verifikasi lembaga, dan alasan kami tidak membagi donasi ke banyak penerima sekaligus.",
    image: "/photos/community-03-web.jpg",
    imagePos: "55% 45%",
  },
  {
    slug: "enam-bulan-home-of-giving",
    title: "Enam bulan Home of Giving: yang berhasil dan yang belum",
    category: "Laporan",
    date: "30 Mei 2026",
    excerpt:
      "Rekap paruh pertama 2026: Rp 640 juta tersalurkan, dua target belum tercapai, dan rencana perbaikannya.",
    image: "/photos/community-01-web.jpg",
    imagePos: "40% 50%",
  },
];

export const blogCategories = [
  "Semua",
  "Laporan",
  "Cerita Penerima",
  "Kegiatan",
  "Transparansi",
];

export const galleryAlbumFilters = [
  "Semua",
  "Serah terima",
  "Kegiatan relawan",
  "Pendidikan",
  "Bencana",
];

export const galleryPhotos: GalleryPhoto[] = [
  { id: "g1", src: "/photos/community-01-web.jpg", pos: "45% 42%", album: "Serah terima", caption: "Serah terima paket bantuan di Bogor", meta: "2 September 2026 · Bantuan Banjir Bekasi", span: "wide" },
  { id: "g2", src: "/photos/community-02-web.jpg", pos: "58% 40%", album: "Kegiatan relawan", caption: "Relawan mengemas paket sembako", meta: "30 Agustus 2026 · Bantuan Banjir Bekasi" },
  { id: "g3", src: "/photos/community-03-web.jpg", pos: "40% 48%", album: "Bencana", caption: "Survei kebutuhan di Bekasi Utara", meta: "24 Juli 2026 · Bantuan Banjir Bekasi" },
  { id: "g4", src: "/photos/community-02-web.jpg", pos: "35% 45%", album: "Pendidikan", caption: "Hari pertama ruang baca dipakai", meta: "28 Juni 2026 · Perpustakaan Mini SDN 03", span: "tall" },
  { id: "g5", src: "/photos/community-01-web.jpg", pos: "62% 38%", album: "Pendidikan", caption: "Penyerahan beasiswa anak agent", meta: "15 Juni 2026 · Beasiswa Anak Agent RE/MAX" },
  { id: "g6", src: "/photos/community-03-web.jpg", pos: "52% 55%", album: "Serah terima", caption: "Penyerahan dana renovasi rumah ibadah", meta: "12 Juli 2026 · Renovasi Rumah Ibadah" },
  { id: "g7", src: "/photos/community-01-web.jpg", pos: "30% 52%", album: "Kegiatan relawan", caption: "Bermain bersama anak-anak penerima", meta: "9 Juli 2026 · Charity Day" },
  { id: "g8", src: "/photos/community-02-web.jpg", pos: "48% 32%", album: "Kegiatan relawan", caption: "Briefing panitia sebelum penyaluran", meta: "1 Juli 2026 · Panitia Home of Giving", span: "wide" },
  { id: "g9", src: "/photos/community-03-web.jpg", pos: "60% 50%", album: "Bencana", caption: "Distribusi air bersih pasca banjir", meta: "20 Juli 2026 · Bantuan Banjir Bekasi" },
  { id: "g10", src: "/photos/community-01-web.jpg", pos: "50% 60%", album: "Pendidikan", caption: "Penataan 480 buku donasi", meta: "26 Juni 2026 · Perpustakaan Mini SDN 03" },
  { id: "g11", src: "/photos/community-02-web.jpg", pos: "42% 58%", album: "Serah terima", caption: "Tanda terima ditandatangani penerima", meta: "30 Mei 2026 · Bibit Pohon Puncak" },
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    slug: "bantuan-banjir-bekasi",
    title: "Bantuan Banjir Bekasi",
    image: "/photos/community-01-web.jpg",
    imagePos: "45% 45%",
    photoCount: 32,
    period: "Sep 2026",
    description: "Survei lapangan, pengemasan paket, dan serah terima di Yayasan Sahabat Anak.",
  },
  {
    slug: "perpustakaan-mini-sdn-03-cianjur",
    title: "Perpustakaan Mini SDN 03",
    image: "/photos/community-02-web.jpg",
    imagePos: "55% 40%",
    photoCount: 21,
    period: "Jun 2026",
    description: "Pemasangan rak, penataan 480 buku, dan hari pertama ruang baca dipakai.",
  },
  {
    slug: "renovasi-rumah-ibadah",
    title: "Renovasi Rumah Ibadah",
    image: "/photos/community-03-web.jpg",
    imagePos: "40% 50%",
    photoCount: 18,
    period: "Jul 2026",
    description: "Kondisi sebelum renovasi, proses pengerjaan, dan salat pertama setelah selesai.",
  },
];

export const projectDetailDonors: ProjectDonor[] = [
  { name: "BO C*** Bandung", date: "17 Agustus", amount: "Rp 5.000.000" },
  { name: "Rat*** S.", date: "18 Agustus", amount: "Rp 2.000.000" },
  { name: "And*** P.", date: "15 Agustus", amount: "Rp 1.500.000" },
  { name: "Muh*** F.", date: "15 Agustus", amount: "Rp 500.000" },
];

export const detailProjectDocs = [
  { image: "/photos/community-01-web.jpg", pos: "50% 45%", alt: "Penyerahan bantuan kepada keluarga terdampak" },
  { image: "/photos/community-02-web.jpg", pos: "60% 40%", alt: "Dokumentasi kegiatan bersama anak-anak" },
  { image: "/photos/community-03-web.jpg", pos: "35% 50%", alt: "Kegiatan penyaluran bantuan" },
  { image: "/photos/community-01-web.jpg", pos: "20% 45%", alt: "Relawan menyiapkan paket bantuan" },
];
