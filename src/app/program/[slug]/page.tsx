import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandBadge } from "@/components/brand/badge";
import { BrandButton } from "@/components/brand/button";
import { DonationCta } from "@/components/brand/donation-cta";
import { BrandProgressBar } from "@/components/brand/progress-bar";
import { Reveal } from "@/components/brand/reveal";
import { BrandStatCounter } from "@/components/brand/stat-counter";
import { ProgramDocumentation } from "@/components/program-documentation";
import { getPublicCampaignDetail } from "@/lib/public-data";

function cycleDays(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  return Math.max(
    1,
    Math.round(
      (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) /
        86_400_000,
    ) + 1,
  );
}

export async function generateMetadata({ params }: PageProps<"/program/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicCampaignDetail(slug);

  if (!detail) return { title: "Program tidak ditemukan" };

  const socialImage = detail.campaign.image.startsWith("http") ? [detail.campaign.image] : undefined;

  return {
    title: `${detail.campaign.title} | REMAX Home of Giving`,
    description: detail.campaign.summary,
    openGraph: {
      title: detail.campaign.title,
      description: detail.campaign.summary,
      images: socialImage,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps<"/program/[slug]">) {
  const { slug } = await params;
  const detail = await getPublicCampaignDetail(slug);

  if (!detail) notFound();

  const { campaign, donations, media, reports } = detail;
  const report = reports.find((item) => item.url);
  const descriptionParagraphs = campaign.storyParagraphs.length > 0
    ? campaign.storyParagraphs
    : [campaign.summary];
  const documentation = media
    .filter((item) => item.media_type === "image")
    .slice(0, 8)
    .map((item) => ({
      id: item.media_id,
      src: item.src,
      alt: item.alt_text || item.caption || "Dokumentasi proyek",
      caption: item.caption || item.alt_text || "Dokumentasi proyek",
      pos: item.focal_position || "50% 50%",
    }));
  const days = cycleDays(campaign.startsOn, campaign.endsOn);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={campaign.image}
            alt=""
            fill
            className="object-cover opacity-40"
            style={{ objectPosition: campaign.imagePos }}
            priority
          />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-5 py-12 text-white sm:px-8 sm:py-[60px]">
          <div className="mb-7 flex flex-wrap items-center gap-2 font-sans text-xs font-medium opacity-80 sm:mb-8">
            <Link href="/" className="text-white">Beranda</Link>
            <span>›</span>
            <Link href="/program" className="text-white">Program</Link>
            <span>›</span>
            <span className="opacity-70">{campaign.title}</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <BrandBadge tone="red">{campaign.statusLabel}</BrandBadge>
          </div>
          <h1 className="mb-3 max-w-[760px] text-3xl leading-[1.05] font-extrabold tracking-tight uppercase text-balance sm:text-[clamp(32px,4vw,48px)]">
            {campaign.title}
          </h1>
          {campaign.cycle && (
            <div className="font-sans text-base font-medium opacity-85">
              {campaign.cycle} · Penerima: {campaign.recipient}
            </div>
          )}
        </div>
      </section>

      <section className="relative z-[2] bg-white px-5 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="-mt-8 rounded-3xl border border-brand-border bg-white p-6 shadow-brand-card-hover sm:-mt-10 sm:p-9">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold tracking-tight text-brand-blue sm:text-[38px]">{campaign.raised}</span>
                <span className="font-sans text-base text-brand-text-body">terkumpul</span>
              </div>
              <span className="font-sans text-base font-semibold text-brand-text-body">
                target {campaign.target} · <span className="font-bold text-brand-red">{campaign.percent}%</span>
              </span>
            </div>
            <BrandProgressBar percent={campaign.percent} showLabel={false} />
            <div className="mt-7 grid grid-cols-3 justify-items-center gap-4 border-t border-brand-border pt-6.5 sm:gap-5">
              <BrandStatCounter value={String(campaign.donorCount)} label="Donatur" />
              <BrandStatCounter value={String(days)} label="Hari siklus" />
              <BrandStatCounter value={String(campaign.totalBeneficiaries)} label="Total terbantu" tone="red" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto grid max-w-[1200px] items-start gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
          <Reveal>
            <h2 className="mb-4 text-xl font-bold text-brand-navy">Deskripsi &amp; latar belakang</h2>
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-3.5 text-base leading-relaxed text-brand-text-body text-pretty last:mb-0 sm:text-lg">
                {paragraph}
              </p>
            ))}
            {campaign.quote && (
              <div className="mt-6 rounded-2xl bg-brand-tint-blue px-6 py-5 ring-1 ring-brand-border">
                <div className="font-hand text-xl leading-snug text-brand-navy sm:text-2xl">{campaign.quote.text}</div>
                <div className="mt-2.5 font-sans text-xs font-semibold text-brand-text-body">{campaign.quote.author}</div>
              </div>
            )}
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-2xl border border-brand-border bg-white p-6.5 shadow-brand-card">
              <div className="mb-4.5 font-sans text-xs font-bold tracking-[0.12em] text-brand-text-body uppercase">Ringkasan proyek</div>
              <div className="flex flex-col">
                <SummaryRow label="Penerima" value={campaign.recipient} />
                <SummaryRow label="Lokasi" value={campaign.location || "Tidak dicantumkan"} />
                <SummaryRow label="Status" value={campaign.statusLabel} last accent />
              </div>
              {report?.url && (
                <div className="mt-5">
                  <BrandButton variant="secondary" size="sm" className="w-full" href={report.url}>
                    Unduh laporan (PDF)
                  </BrandButton>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[920px]">
          <Reveal>
            <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-brand-card sm:p-9">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-xl font-bold text-brand-navy">Donatur proyek ini</h2>
                <span className="font-sans text-xs text-brand-text-body">{campaign.donorCount} donatur · nama disamarkan</span>
              </div>
              <div className="flex flex-col">
                {donations.length > 0 ? donations.slice(0, 8).map((donation) => (
                  <div key={donation.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-brand-border py-3.5">
                    <div className="min-w-0">
                      <div className="font-sans text-base font-semibold text-brand-navy">{donation.name}</div>
                      <div className="mt-0.5 font-sans text-xs text-brand-text-body">{donation.date}</div>
                    </div>
                    <div className="font-sans text-base font-bold text-brand-blue">{donation.amount}</div>
                  </div>
                )) : (
                  <div className="border-t border-brand-border py-6 font-sans text-sm text-brand-text-body">
                    Donatur akan tampil setelah donasi tercatat untuk proyek ini.
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-4.5">
                <Link href="/riwayat-donasi" className="font-sans text-base font-bold text-brand-red">Lihat semua donatur →</Link>
                <span className="font-sans text-xs text-brand-text-body">Ada data yang keliru? <span className="font-semibold">Lapor ke panitia</span></span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {documentation.length > 0 && <ProgramDocumentation items={documentation} />}

      <section className="relative overflow-hidden bg-brand-blue px-5 py-16 sm:px-8 sm:py-24">
        <div className="relative mx-auto max-w-[720px] text-center text-white">
          <Reveal>
            <div className="font-hand text-2xl leading-none font-bold opacity-85 sm:text-[32px]">
              {campaign.status === "running" ? "Proyek ini masih berjalan" : "Kebaikan terus berlanjut"}
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-2.5 mb-4 text-2xl leading-[1.06] font-extrabold tracking-tight uppercase sm:text-[clamp(28px,4vw,40px)]">
              Bantu hadirkan<br />dampak nyata
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mb-7 max-w-[480px] text-base leading-relaxed opacity-88 sm:text-lg">
              Hubungi panitia melalui WhatsApp untuk berdonasi dan memperoleh informasi proyek ini.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="flex flex-wrap justify-center gap-3.5">
              <DonationCta campaignTitle={campaign.title} size="lg" />
              <Link href="/program" className="inline-flex h-[56px] items-center rounded-[12px] border-[1.5px] border-white/60 px-6.5 font-sans text-base font-bold text-white transition-colors hover:bg-white/12">
                Lihat semua proyek
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
  accent = false,
}: {
  label: string;
  value: string;
  last?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 text-sm ${last ? "" : "border-b border-brand-border"}`}>
      <span className="text-brand-text-body">{label}</span>
      <span className={`text-right font-semibold ${accent ? "font-bold text-brand-red" : "text-brand-navy"}`}>{value}</span>
    </div>
  );
}
