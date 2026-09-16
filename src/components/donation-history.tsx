"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BrandButton } from "@/components/brand/button";
import { PageHeader } from "@/components/brand/page-header";
import { BrandStatCounter } from "@/components/brand/stat-counter";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import type { PublicDonationItem } from "@/lib/public-data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

function DonationHistory({
  donations,
  totalRaised,
  completedCampaigns,
  reportUrl,
}: {
  donations: PublicDonationItem[];
  totalRaised: number;
  completedCampaigns: number;
  reportUrl: string | null;
}) {
  const projects = useMemo(
    () => ["Semua proyek", ...Array.from(new Set(donations.map((donation) => donation.project)))],
    [donations],
  );
  const [project, setProject] = useState("Semua proyek");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const filtered = project === "Semua proyek"
    ? donations
    : donations.filter((donation) => donation.project === project);
  const rows = filtered.slice(0, limit);

  return (
    <>
      <PageHeader
        breadcrumbLabel="Riwayat Donasi"
        eyebrow="Riwayat & transparansi donasi"
        title="Setiap rupiah tercatat"
        description="Daftar donasi yang tercatat dalam papan donatur publik. Nama donatur selalu disamarkan sebelum dipublikasikan."
        tone="navy"
      />
      <section className="relative z-[2] bg-white px-5 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="-mt-10 grid grid-cols-1 gap-5 rounded-3xl border border-brand-border bg-white p-6 shadow-brand-card-hover sm:mt-[-52px] sm:grid-cols-3 sm:gap-6 sm:p-8">
            <BrandStatCounter value={formatNumber(donations.length)} label="Transaksi tercatat" />
            <BrandStatCounter value={formatCompactCurrency(totalRaised).replace("Rp ", "")} label="Total donasi (Rp)" tone="red" />
            <BrandStatCounter value={formatNumber(completedCampaigns)} label="Proyek tuntas" />
          </div>
        </div>
      </section>
      <section className="bg-white px-5 py-14 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-brand-card sm:p-8">
            <div className="mb-5.5 flex flex-wrap items-end justify-between gap-4.5">
              <h2 className="text-xl font-bold text-brand-navy">Donasi masuk</h2>
              <div className="flex flex-wrap gap-2">
                {projects.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setProject(label);
                      setLimit(PAGE_SIZE);
                    }}
                    className={cn(
                      "cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 font-sans text-[13px] font-bold",
                      label === project
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-brand-border bg-white text-brand-navy",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden grid-cols-[88px_1fr_1fr_auto] gap-4 border-b-[1.5px] border-brand-border pb-3 font-sans text-xs font-bold tracking-[0.1em] text-brand-text-body uppercase sm:grid">
              <div>Tanggal</div>
              <div>Donatur</div>
              <div>Proyek</div>
              <div className="text-right">Nominal</div>
            </div>
            <div>
              {rows.length > 0 ? rows.map((donation) => (
                <div key={donation.id} className="grid grid-cols-2 gap-2 border-b border-brand-border py-4 sm:grid-cols-[88px_1fr_1fr_auto] sm:items-center sm:gap-4">
                  <div className="font-sans text-[13px] font-medium text-brand-text-body">{donation.date}</div>
                  <div className="order-3 font-sans text-[15px] font-semibold text-brand-navy sm:order-none">{donation.name}</div>
                  <div className="order-4 font-sans text-[13px] leading-snug text-brand-text-body sm:order-none">{donation.project}</div>
                  <div className="text-right font-sans text-[15px] font-bold text-brand-blue">{donation.amount}</div>
                </div>
              )) : (
                <div className="py-12 text-center text-sm text-brand-text-body">
                  Belum ada donasi tercatat untuk proyek ini.
                </div>
              )}
            </div>
            {filtered.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((value) => value + PAGE_SIZE)}
                className="mt-5 w-full rounded-xl border-[1.5px] border-brand-blue py-3 font-sans text-sm font-bold text-brand-blue"
              >
                Muat lebih banyak
              </button>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
            {reportUrl && (
              <BrandButton variant="secondary" size="sm" href={reportUrl}>
                Unduh laporan lengkap (PDF)
              </BrandButton>
            )}
            <Link href="/program" className="font-sans text-sm font-bold text-brand-blue">
              Lihat semua proyek →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export { DonationHistory };
