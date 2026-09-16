import { Hero } from "@/components/sections/home/hero";
import { ImpactStats } from "@/components/sections/home/impact-stats";
import { FeaturedProject } from "@/components/sections/home/featured-project";
import { ProgramPreview } from "@/components/sections/home/program-preview";
import { HistoryPreview } from "@/components/sections/home/history-preview";
import { Stories } from "@/components/sections/home/stories";
import { FinalCta } from "@/components/sections/home/final-cta";
import {
  getPublicBlogPosts,
  getPublicCampaigns,
  getPublicDonations,
  getPublicSiteStats,
} from "@/lib/public-data";

export default async function Home() {
  const [campaigns, stats, donations, posts] = await Promise.all([
    getPublicCampaigns(),
    getPublicSiteStats(),
    getPublicDonations(),
    getPublicBlogPosts(),
  ]);
  const featured =
    campaigns.find((campaign) => campaign.featured) || campaigns[0] || null;

  return (
    <>
      <Hero featured={featured} />
      <ImpactStats stats={stats} />
      <FeaturedProject campaign={featured} />
      {/* <Transparency /> */}
      <ProgramPreview
        campaigns={campaigns
          .filter((campaign) => campaign.status === "running")
          .slice(0, 3)}
        total={campaigns.length}
      />
      <HistoryPreview
        donations={donations.slice(0, 4)}
        totalDonations={stats.verified_donation_count}
      />
      <Stories posts={posts.slice(0, 3)} />
      <FinalCta />
    </>
  );
}
