import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { DashboardSummary } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  displayName: string;
  email: string;
};

export type RecentDonation = {
  id: string;
  publicName: string;
  campaignTitle: string;
  amountIdr: number;
  donatedOn: string;
};

export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase.rpc("hog_admin_whoami");
  const identity = data?.[0];

  if (error || !identity?.is_admin || identity.user_id !== claimsData.claims.sub) {
    redirect("/admin/login?error=akses");
  }

  return {
    userId: identity.user_id,
    displayName: identity.display_name || "Super Admin",
    email: String(claimsData.claims.email || ""),
  };
});

export async function getDashboardData(): Promise<{
  summary: DashboardSummary;
  recentDonations: RecentDonation[];
}> {
  await requireAdmin();
  const supabase = await createClient();
  const [summaryResult, donationsResult, campaignsResult] = await Promise.all([
    supabase.rpc("hog_admin_dashboard_summary"),
    supabase
      .from("hog_admin_donations")
      .select("id,campaign_id,public_name,amount_idr,donated_on,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("hog_admin_campaigns").select("id,title"),
  ]);

  if (summaryResult.error || !summaryResult.data) {
    throw new Error("Ringkasan dashboard tidak dapat dimuat.");
  }

  if (donationsResult.error || campaignsResult.error) {
    throw new Error("Daftar donasi terbaru tidak dapat dimuat.");
  }

  const campaignTitles = new Map(
    (campaignsResult.data || []).map((campaign) => [campaign.id, campaign.title]),
  );

  return {
    summary: summaryResult.data,
    recentDonations: (donationsResult.data || []).map((donation) => ({
      id: donation.id,
      publicName: donation.public_name,
      campaignTitle: campaignTitles.get(donation.campaign_id) || "Program tidak ditemukan",
      amountIdr: donation.amount_idr,
      donatedOn: donation.donated_on,
    })),
  };
}
