import { ProgramDirectory } from "@/components/program-directory";
import {
  getPublicAnnualGoal,
  getPublicCampaigns,
  getPublicDonations,
  getPublicSiteStats,
} from "@/lib/public-data";

export default async function ProgramPage() {
  const year = new Date().getFullYear();
  const [campaigns, stats, donations, annualGoal] = await Promise.all([
    getPublicCampaigns(),
    getPublicSiteStats(),
    getPublicDonations(),
    getPublicAnnualGoal(year),
  ]);
  const annualAmount = donations
    .filter((donation) => donation.dateRaw.startsWith(String(year)))
    .reduce((total, donation) => total + donation.amountIdr, 0);

  return (
    <ProgramDirectory
      campaigns={campaigns}
      runningCount={stats.running_campaign_count}
      completedCount={stats.completed_campaign_count}
      annualAmount={annualAmount}
      annualGoal={annualGoal}
      year={year}
    />
  );
}
