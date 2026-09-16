import Image from "next/image";
import Link from "next/link";
import { BrandBadge } from "@/components/brand/badge";
import { DonationCta } from "@/components/brand/donation-cta";
import { BrandProgressBar } from "@/components/brand/progress-bar";
import { Reveal } from "@/components/brand/reveal";
import type { PublicCampaignCard } from "@/lib/public-data";

function FeaturedProject({ campaign }: { campaign: PublicCampaignCard | null }) {
  if (!campaign) return null;

  return (
    <section id="proyek" className="scroll-mt-20 bg-brand-bg-soft px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-10"><div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">Proyek yang sedang berlangsung</div><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">Satu proyek, satu penerima</h2></Reveal>
        <Reveal delay={90}>
          <div className="grid overflow-hidden rounded-3xl border border-brand-border bg-white shadow-brand-card lg:grid-cols-[1.04fr_1fr]">
            <div className="relative h-[260px] min-h-[260px] w-full overflow-hidden bg-brand-tint-blue sm:h-[360px] lg:h-auto lg:min-h-[440px]"><Image src={campaign.image} alt={campaign.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" style={{ objectPosition: campaign.imagePos }} /></div>
            <div className="flex flex-col gap-4 p-6 sm:p-11">
              <div className="flex flex-wrap gap-2"><BrandBadge tone="red">{campaign.meta}</BrandBadge></div>
              <h3 className="text-2xl leading-snug font-extrabold tracking-tight text-brand-navy sm:text-[32px]">{campaign.title}</h3>
              <p className="text-base leading-relaxed text-brand-text-body text-pretty">{campaign.summary}</p>
              <div><div className="mb-2.5 flex items-baseline justify-between"><span className="text-2xl font-extrabold tracking-tight text-brand-blue sm:text-[28px]">{campaign.raised}</span><span className="font-sans text-xs text-brand-text-body">dari target {campaign.target}</span></div><BrandProgressBar percent={campaign.percent} showLabel={false} /></div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 font-sans text-xs text-brand-text-body"><span><strong className="font-bold text-brand-navy">{campaign.donorCount}</strong> donatur</span>{campaign.cycle && <span>{campaign.cycle}</span>}<span>Penerima: {campaign.recipient}</span></div>
              <div className="mt-1.5 flex flex-wrap gap-3"><DonationCta campaignTitle={campaign.title} /><Link href={`/program/${campaign.slug}`} className="inline-flex h-[50px] items-center rounded-[12px] border-[1.5px] border-brand-blue px-6 font-sans text-base font-bold text-brand-blue transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px hover:shadow-brand-card">Detail proyek</Link></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { FeaturedProject };
