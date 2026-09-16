"use client";

import { useState } from "react";
import { PageHeader } from "@/components/brand/page-header";
import { BrandStatCounter } from "@/components/brand/stat-counter";
import { CampaignCard } from "@/components/brand/campaign-card";
import { BrandButton } from "@/components/brand/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { PublicCampaignCard } from "@/lib/public-data";

const statuses = ["Semua", "Berjalan", "Donasi ditutup", "Tuntas"] as const;

function matchesStatus(campaign: PublicCampaignCard, status: (typeof statuses)[number]) {
  if (status === "Semua") return true;
  if (status === "Berjalan") return campaign.status === "running";
  if (status === "Donasi ditutup") return campaign.status === "closed";
  return campaign.status === "disbursed" || campaign.status === "reported";
}

function ProgramDirectory({
  campaigns,
  runningCount,
  completedCount,
  annualAmount,
  annualGoal,
  year,
}: {
  campaigns: PublicCampaignCard[];
  runningCount: number;
  completedCount: number;
  annualAmount: number;
  annualGoal: number | null;
  year: number;
}) {
  const [status, setStatus] = useState<(typeof statuses)[number]>("Semua");
  const filtered = campaigns.filter((campaign) => matchesStatus(campaign, status));
  const progress = annualGoal ? Math.min(100, Math.floor((annualAmount / annualGoal) * 100)) : 0;

  return (
    <>
      <PageHeader breadcrumbLabel="Program & Target Donasi" eyebrow="Program & Target Donasi" title="Bersama menciptakan dampak nyata" description="Setiap siklus donasi punya satu penerima manfaat dan satu target yang jelas. Di halaman ini Anda bisa melihat semua proyek — yang sedang berjalan maupun yang sudah tuntas beserta laporannya." side={<div className="grid grid-cols-2 justify-items-center gap-4 sm:gap-5"><BrandStatCounter value={String(runningCount)} label="Proyek berjalan" tone="red" /><BrandStatCounter value={String(completedCount)} label="Proyek tuntas" /></div>} />
      <section className="bg-white px-5 py-12 sm:px-8 sm:py-16 sm:pb-24"><div className="mx-auto max-w-[1200px]"><div className="flex flex-col gap-6 border-b border-brand-border pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"><div className="flex flex-col gap-3.5"><div className="font-sans text-xs font-bold tracking-[0.14em] text-brand-text-body uppercase">Status</div><div className="flex flex-wrap gap-1.5 rounded-2xl bg-brand-bg-soft p-1.5">{statuses.map((label) => <button key={label} type="button" onClick={() => setStatus(label)} className={cn("cursor-pointer rounded-full px-5 py-2 font-sans text-sm font-bold transition-shadow", label === status ? "bg-white text-brand-blue shadow-brand-card" : "text-brand-text-body")}>{label}</button>)}</div></div></div><div className="my-6 font-sans text-base text-brand-text-body">Menampilkan <strong className="font-bold text-brand-navy">{filtered.length}</strong> proyek</div>{filtered.length > 0 ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((campaign) => <div key={campaign.id} className="flex flex-col gap-3"><CampaignCard slug={campaign.slug} image={campaign.image} imagePos={campaign.imagePos} title={campaign.title} raised={campaign.raised} target={campaign.target} percent={campaign.percent} /><div className="flex items-center justify-between gap-3 px-1"><span className="font-sans text-[13px] text-brand-text-body">{campaign.meta}</span></div></div>)}</div> : <div className="rounded-2xl bg-brand-bg-soft px-6 py-16 text-center"><div className="mb-2 text-xl font-bold text-brand-navy">Belum ada proyek di status ini</div><div className="text-base text-brand-text-body">Pilih status lain untuk melihat proyek yang tersedia.</div></div>}</div></section>
      <section className="bg-brand-bg-soft px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1200px]"><div className="mb-10"><div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">Target donasi {year}</div><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">Sejauh mana kita berjalan</h2></div><div className="rounded-3xl border border-brand-border bg-white p-8 shadow-brand-card"><div className="mb-3.5 font-sans text-xs font-bold tracking-[0.12em] text-brand-text-body uppercase">Total tahun ini</div><div className="mb-1.5 text-[44px] font-extrabold tracking-tight text-brand-blue">{formatCurrency(annualAmount)}</div><div className="mb-5.5 font-sans text-base text-brand-text-body">{annualGoal ? `dari target tahunan ${formatCurrency(annualGoal)}` : "Target tahunan belum dipublikasikan"}</div><div className="h-2 overflow-hidden rounded-full bg-brand-tint-blue"><div className="h-full rounded-full bg-brand-red" style={{ width: `${progress}%` }} /></div><div className="mt-6.5 border-t border-brand-border pt-5.5 font-sans text-sm leading-relaxed text-brand-text-body">Statistik dihitung dari donasi tercatat pada tahun berjalan.</div></div></div></section>
      <section className="bg-brand-blue px-5 py-16 text-white sm:px-8 sm:py-24"><div className="mx-auto max-w-[880px] text-center"><div className="font-hand text-2xl leading-none font-bold opacity-85 sm:text-[32px]">Usulkan penerima manfaat</div><h2 className="mt-2.5 mb-4 text-2xl leading-[1.06] font-extrabold tracking-tight uppercase sm:text-[clamp(24px,3vw,32px)]">Kenal seseorang yang perlu dibantu?</h2><p className="mx-auto mb-7 max-w-[520px] text-base leading-relaxed opacity-88 sm:text-lg">Agent, rekan, dan mitra RE/MAX bisa mengajukan calon penerima. Panitia akan mensurvei dan menjadwalkannya pada siklus berikutnya.</p><BrandButton variant="primary" href="/program">Lihat program berjalan →</BrandButton></div></section>
    </>
  );
}

export { ProgramDirectory };
