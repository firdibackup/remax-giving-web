import { ProgramDirectory } from "@/components/program-directory";
import {
  getPublicAnnualGoal,
  getPublicCampaigns,
  getPublicDonations,
} from "@/lib/public-data";

export default async function ProgramPage() {
  const year = new Date().getFullYear();
  const [campaigns, donations, annualGoal] = await Promise.all([
    getPublicCampaigns(),
    getPublicDonations(),
    getPublicAnnualGoal(year),
  ]);
  const annualAmount = donations
    .filter((donation) => donation.dateRaw.startsWith(String(year)))
    .reduce((total, donation) => total + donation.amountIdr, 0);

  return (
    <ProgramDirectory
      campaigns={campaigns}
      annualAmount={annualAmount}
      annualGoal={annualGoal}
      year={year}
    />
  );
}
