import { CountUp } from "@/components/brand/count-up";
import { BrandStatCounter } from "@/components/brand/stat-counter";
import { Reveal } from "@/components/brand/reveal";
import { formatNumber } from "@/lib/format";
import type { SiteStatsRow } from "@/lib/supabase/database.types";

function ImpactStats({ stats }: { stats: SiteStatsRow }) {
  const totalMillions = stats.total_raised_idr / 1_000_000;

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-[104px] sm:pb-24">
      <div className="mx-auto max-w-[940px] text-center">
        <Reveal><div className="font-sans text-xs font-bold tracking-[0.16em] text-brand-text-body uppercase">Total donasi terkumpul</div></Reveal>
        <Reveal delay={80}><div className="mt-3.5 mb-1.5 flex items-start justify-center gap-2.5 leading-none font-extrabold tracking-tight text-brand-blue"><span className="text-4xl sm:text-[clamp(40px,6vw,74px)]">Rp</span><CountUp target={totalMillions} decimals={totalMillions < 100 ? 1 : 0} className="text-5xl sm:text-[clamp(52px,9vw,112px)]" /><span className="text-4xl sm:text-[clamp(40px,6vw,74px)]">Juta</span></div></Reveal>
        <Reveal delay={160}><div className="font-hand text-2xl font-semibold text-brand-navy/85 sm:text-[30px]">&ldquo;Sedikit dari kita, berarti banyak bagi mereka.&rdquo;</div></Reveal>
        <div className="mt-12 grid grid-cols-1 justify-items-center gap-6 border-t border-brand-border pt-11 sm:grid-cols-3"><Reveal><BrandStatCounter value={formatNumber(stats.verified_donation_count)} label="Donasi tercatat" /></Reveal><Reveal delay={110}><BrandStatCounter value={formatNumber(stats.total_beneficiaries)} label="Total terbantu" tone="red" /></Reveal><Reveal delay={220}><BrandStatCounter value={formatNumber(stats.completed_campaign_count)} label="Proyek tuntas" /></Reveal></div>
      </div>
    </section>
  );
}

export { ImpactStats };
