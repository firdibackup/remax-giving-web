import { campaigns } from "./campaigns";
import type { Campaign, ProjectDonor } from "./types";

export interface ProjectDetail {
  slug: string;
  badgeLabel: string;
  descriptionParagraphs: string[];
  quote?: { text: string; author: string };
  summary: {
    recipient: string;
    location: string;
    status: string;
  };
  donors: ProjectDonor[];
  stats: { donors: number; cycleDays: number; totalHelped: number };
  docsLabel: string;
}

const overrides: Record<string, Partial<ProjectDetail>> = {
  "bantuan-banjir-bekasi": {
    badgeLabel: "Selesai",
    descriptionParagraphs: [
      "Banjir pertengahan Juli merendam 6 RW di Bekasi Utara hingga ketinggian satu meter. Ratusan keluarga kehilangan perabot, dokumen, dan persediaan makanan; sebagian anak berhenti sekolah karena seragam dan buku ikut hanyut.",
      "Panitia Home of Giving melakukan survei lapangan bersama Yayasan Sahabat Anak dan memutuskan menyalurkan seluruh donasi siklus Agustus ke satu penerima agar bantuannya utuh dan bisa dipertanggungjawabkan: 120 keluarga terdampak, dengan prioritas keluarga yang memiliki anak usia sekolah.",
    ],
    quote: {
      text: "“Yang paling kami butuhkan bukan uang tunai, tapi kepastian anak-anak bisa kembali ke sekolah minggu depan.”",
      author: "Ketua Yayasan Sahabat Anak, catatan survei 24 Juli 2026",
    },
    summary: {
      recipient: "Yayasan Sahabat Anak",
      location: "Bogor, Jawa Barat",
      status: "Selesai",
    },
    donors: [
      { name: "BO C*** Bandung", date: "17 Agustus", amount: "Rp 5.000.000" },
      { name: "Rat*** S.", date: "18 Agustus", amount: "Rp 2.000.000" },
      { name: "And*** P.", date: "15 Agustus", amount: "Rp 1.500.000" },
      { name: "Muh*** F.", date: "15 Agustus", amount: "Rp 500.000" },
    ],
    stats: { donors: 41, cycleDays: 30, totalHelped: 120 },
    docsLabel: "8 foto & 1 video",
  },
  "renovasi-rumah-ibadah": {
    summary: {
      recipient: "Masjid Al-Ikhlas, Cianjur",
      location: "Cianjur, Jawa Barat",
      status: "Selesai",
    },
  },
  "perpustakaan-mini-sdn-03-cianjur": {
    summary: {
      recipient: "SDN 03 Cianjur",
      location: "Cianjur, Jawa Barat",
      status: "Selesai",
    },
  },
  "bibit-pohon-kawasan-puncak": {
    summary: {
      recipient: "Kelompok Tani Puncak",
      location: "Puncak, Jawa Barat",
      status: "Selesai",
    },
  },
};

function buildDefaultDetail(c: Campaign): ProjectDetail {
  const override = overrides[c.slug] ?? {};

  return {
    slug: c.slug,
    badgeLabel: override.badgeLabel ?? (c.status === "tuntas" ? "Selesai" : `Berjalan · sisa ${c.meta.split("·")[0]?.replace("Sisa", "").trim() || "beberapa hari"}`),
    descriptionParagraphs:
      override.descriptionParagraphs ?? [
        `${c.title} adalah proyek Home of Giving untuk satu penerima manfaat agar bantuannya utuh dan mudah dipertanggungjawabkan.`,
        `Panitia melakukan survei kebutuhan sebelum menetapkan target donasi sebesar ${c.target}. Setiap donasi yang masuk dikonfirmasi dan dicatat sebelum ditampilkan di papan donatur.`,
      ],
    quote: override.quote,
    summary: override.summary ?? {
      recipient: c.recipient ?? "Ditentukan setelah survei panitia",
      location: c.location ?? "Indonesia",
      status: c.status === "tuntas" ? "Selesai" : "Sedang berjalan",
    },
    donors: override.donors ?? [],
    stats: override.stats ?? {
      donors: c.donorCount || 0,
      cycleDays: 30,
      totalHelped: Math.max(20, Math.round(c.raisedAmount / 1_000_000)),
    },
    docsLabel: override.docsLabel ?? "4 foto dokumentasi",
  };
}

export const projectDetails: Record<string, ProjectDetail> = Object.fromEntries(
  campaigns.map((c) => [c.slug, buildDefaultDetail(c)]),
);

export function getProjectDetail(slug: string) {
  return projectDetails[slug];
}
