import { DonationHistory } from "@/components/donation-history";
import {
  getPublicDonations,
  getPublicReports,
  getPublicSiteStats,
} from "@/lib/public-data";

export default async function DonationHistoryPage() {
  const [donations, reports, stats] = await Promise.all([
    getPublicDonations(),
    getPublicReports(),
    getPublicSiteStats(),
  ]);

  return (
    <DonationHistory
      donations={donations}
      totalRaised={stats.total_raised_idr}
      completedCampaigns={stats.completed_campaign_count}
      reportUrl={reports.find((report) => report.kind === "periodic" && report.url)?.url || null}
    />
  );
}
