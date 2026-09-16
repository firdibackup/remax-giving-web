import Image from "next/image";
import { BrandButton } from "@/components/brand/button";
import { BrandBadge } from "@/components/brand/badge";
import { DonationCta } from "@/components/brand/donation-cta";
import { BrandProgressBar } from "@/components/brand/progress-bar";
import type { PublicCampaignCard } from "@/lib/public-data";

function Hero({ featured }: { featured: PublicCampaignCard | null }) {
  return (
    <section id="beranda" className="relative overflow-hidden bg-brand-bg-soft px-5 pt-16 pb-20 sm:px-8 sm:pt-[76px] sm:pb-[104px] scroll-mt-20">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-tint-blue sm:-top-[180px] sm:-right-[160px] sm:h-[560px] sm:w-[560px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-brand-tint-red sm:-bottom-[120px] sm:-left-[90px] sm:h-[260px] sm:w-[260px]" />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
        <div>
          <div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">Kebaikan dimulai dari rumah</div>
          <h1 className="mt-2.5 mb-5 text-4xl leading-[1.05] font-extrabold tracking-tight text-brand-navy uppercase text-balance sm:text-[clamp(40px,6vw,72px)]">Giving Starts<br />From Home.</h1>
          <p className="mb-7 max-w-[470px] text-base leading-relaxed text-brand-text-body text-pretty sm:text-lg">REMAX Home of Giving menyalurkan donasi agent, rekan, dan mitra RE/MAX Indonesia ke satu penerima manfaat per proyek — dengan bukti penyaluran yang bisa Anda lacak sampai tuntas.</p>
          <div className="flex flex-wrap items-center gap-3.5"><DonationCta /><BrandButton variant="secondary" href="#proyek">Lihat proyek berjalan</BrandButton></div>
        </div>
        <div className="relative">
          <div className="h-[320px] overflow-hidden rounded-3xl bg-brand-tint-blue shadow-brand-card sm:h-[490px]">
            <Image src="/photos/community-01-web.jpg" alt="Relawan Home of Giving bersama anak penerima manfaat" width={800} height={980} className="h-full w-full object-cover" style={{ objectPosition: "52% 42%" }} priority />
          </div>
          {featured && (
            <div className="relative mx-auto -mt-10 w-[calc(100%-32px)] max-w-[296px] rounded-2xl border border-brand-border bg-white p-5 shadow-brand-card-hover sm:absolute sm:-bottom-10 sm:-left-11 sm:mt-0 sm:w-[296px]">
              <div className="mb-3 flex gap-2"><BrandBadge tone="red">{featured.statusLabel}</BrandBadge></div>
              <div className="mb-3.5 font-sans text-[17px] leading-snug font-bold text-brand-navy">{featured.title}</div>
              <BrandProgressBar percent={featured.percent} />
              <div className="mt-3.5 flex items-baseline justify-between border-t border-brand-border pt-3.5"><span className="font-sans text-sm font-bold text-brand-blue">{featured.raised}</span><span className="font-sans text-xs text-brand-text-body">target {featured.target}</span></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export { Hero };
