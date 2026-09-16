import Link from "next/link";
import { CampaignCard } from "@/components/brand/campaign-card";
import { Reveal } from "@/components/brand/reveal";
import type { PublicCampaignCard } from "@/lib/public-data";

function ProgramPreview({ campaigns, total }: { campaigns: PublicCampaignCard[]; total: number }) {
  return (
    <section id="program" className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-10 text-center sm:mb-13"><div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">Program &amp; Target Donasi</div><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">Bersama menciptakan dampak nyata</h2></Reveal>
        {campaigns.length > 0 ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{campaigns.map((campaign) => <CampaignCard key={campaign.id} slug={campaign.slug} image={campaign.image} imagePos={campaign.imagePos} title={campaign.title} raised={campaign.raised} target={campaign.target} percent={campaign.percent} />)}</div> : <div className="rounded-2xl bg-brand-bg-soft px-6 py-12 text-center text-brand-text-body">Belum ada proyek berjalan saat ini.</div>}
        <div className="mt-11 text-center"><Link href="/program" className="font-sans text-base font-bold text-brand-blue">Lihat semua {total} proyek →</Link></div>
      </div>
    </section>
  );
}

export { ProgramPreview };
