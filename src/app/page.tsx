import { Hero } from "@/components/sections/home/hero";
import { ImpactStats } from "@/components/sections/home/impact-stats";
import { FeaturedProject } from "@/components/sections/home/featured-project";
import { ProgramPreview } from "@/components/sections/home/program-preview";
import { HistoryPreview } from "@/components/sections/home/history-preview";
import { FinalCta } from "@/components/sections/home/final-cta";
import {
  getPublicCampaigns,
  getPublicDonations,
  getPublicSiteStats,
} from "@/lib/public-data";

export default async function Home() {
  const [campaigns, stats, donations] = await Promise.all([
    getPublicCampaigns(),
    getPublicSiteStats(),
    getPublicDonations(),
  ]);
  const featured =
    campaigns.find((campaign) => campaign.featured) || campaigns[0] || null;

  return (
    <>
      <Hero featured={featured} />
      <ImpactStats stats={stats} />
      <FeaturedProject campaign={featured} />
      {/* <Transparency /> */}
      <ProgramPreview campaigns={campaigns} total={campaigns.length} />
      <HistoryPreview
        donations={donations.slice(0, 4)}
        totalDonations={stats.verified_donation_count}
      />
      <FinalCta />
    </>
  );
}
