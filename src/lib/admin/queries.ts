import "server-only";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AnnualGoalRow,
  AuditLogRow,
  BlogCategoryRow,
  BlogPostRow,
  CampaignRow,
  CampaignStatus,
  DonationDetail,
  DonationRow,
  MediaAssetRow,
  ReportRow,
  SiteSettingRow,
} from "@/lib/supabase/database.types";

export type CampaignListItem = CampaignRow & {
  raisedAmountIdr: number;
  verifiedDonationCount: number;
  percentFunded: number;
};

export async function listCampaigns(options?: {
  status?: string;
  search?: string;
}): Promise<CampaignListItem[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase.from("hog_admin_campaigns").select("*").order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status as CampaignStatus);
  }

  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`);
  }

  const [campaignsResult, statsResult] = await Promise.all([
    query,
    supabase.from("hog_campaign_stats").select("campaign_id,raised_amount_idr,verified_donation_count,percent_funded"),
  ]);

  if (campaignsResult.error) {
    throw new Error("Daftar proyek tidak dapat dimuat.");
  }

  const statsMap = new Map((statsResult.data || []).map((row) => [row.campaign_id, row]));

  return (campaignsResult.data || []).map((campaign) => {
    const stats = statsMap.get(campaign.id);

    return {
      ...campaign,
      raisedAmountIdr: stats?.raised_amount_idr ?? 0,
      verifiedDonationCount: stats?.verified_donation_count ?? 0,
      percentFunded: stats?.percent_funded ?? 0,
    };
  });
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("hog_admin_campaigns").select("*").eq("id", id).maybeSingle();

  return error ? null : data;
}

export async function getCampaignStats(id: string): Promise<{
  raisedAmountIdr: number;
  verifiedDonationCount: number;
  percentFunded: number;
}> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_campaign_stats")
    .select("raised_amount_idr,verified_donation_count,percent_funded")
    .eq("campaign_id", id)
    .maybeSingle();

  return {
    raisedAmountIdr: data?.raised_amount_idr ?? 0,
    verifiedDonationCount: data?.verified_donation_count ?? 0,
    percentFunded: data?.percent_funded ?? 0,
  };
}

export async function listCampaignOptions(): Promise<Array<Pick<CampaignRow, "id" | "title" | "status">>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_admin_campaigns")
    .select("id,title,status")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function listMediaAssets(): Promise<MediaAssetRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_admin_media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getCampaignCoverMedia(campaignId: string): Promise<MediaAssetRow | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("hog_admin_campaigns")
    .select("cover_media_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign?.cover_media_id) {
    return null;
  }

  const { data } = await supabase
    .from("hog_admin_media_assets")
    .select("*")
    .eq("id", campaign.cover_media_id)
    .maybeSingle();

  return data || null;
}

export async function listCampaignDocumentation(campaignId: string): Promise<MediaAssetRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("hog_admin_campaign_media")
    .select("media_id")
    .eq("campaign_id", campaignId)
    .eq("role", "documentation")
    .order("sort_order", { ascending: true });

  const ids = (links || []).map((link) => link.media_id);

  if (ids.length === 0) {
    return [];
  }

  const { data: assets } = await supabase
    .from("hog_admin_media_assets")
    .select("*")
    .in("id", ids);

  const assetsById = new Map((assets || []).map((asset) => [asset.id, asset]));

  return ids
    .map((id) => assetsById.get(id))
    .filter((asset): asset is MediaAssetRow => Boolean(asset));
}

export type DonationListItem = DonationRow & {
  campaignTitle: string;
};

export async function listDonations(options?: {
  campaignId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: DonationListItem[]; total: number }> {
  await requireAdmin();
  const supabase = await createClient();

  const pageSize = options?.pageSize ?? 20;
  const page = Math.max(1, options?.page ?? 1);
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("hog_admin_donations")
    .select("*", { count: "exact" })
    .order("donated_on", { ascending: false })
    .range(from, from + pageSize - 1);

  if (options?.campaignId) {
    query = query.eq("campaign_id", options.campaignId);
  }

  if (options?.search) {
    query = query.ilike("public_name", `%${options.search}%`);
  }

  const [donationsResult, campaignsResult] = await Promise.all([
    query,
    supabase.from("hog_admin_campaigns").select("id,title"),
  ]);

  if (donationsResult.error) {
    throw new Error("Daftar donasi tidak dapat dimuat.");
  }

  const campaignMap = new Map((campaignsResult.data || []).map((row) => [row.id, row.title]));

  return {
    rows: (donationsResult.data || []).map((donation) => ({
      ...donation,
      campaignTitle: campaignMap.get(donation.campaign_id) || "Proyek tidak ditemukan",
    })),
    total: donationsResult.count ?? 0,
  };
}

export async function getDonationDetail(id: string): Promise<DonationDetail | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hog_admin_donation_detail", { p_donation_id: id });

  return error ? null : data;
}

export type ReportListItem = ReportRow & {
  campaignTitle: string | null;
};

export async function listReports(): Promise<ReportListItem[]> {
  await requireAdmin();
  const supabase = await createClient();

  const [reportsResult, campaignsResult] = await Promise.all([
    supabase.from("hog_admin_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("hog_admin_campaigns").select("id,title"),
  ]);

  if (reportsResult.error) {
    throw new Error("Daftar laporan tidak dapat dimuat.");
  }

  const campaignMap = new Map((campaignsResult.data || []).map((row) => [row.id, row.title]));

  return (reportsResult.data || []).map((report) => ({
    ...report,
    campaignTitle: report.campaign_id ? campaignMap.get(report.campaign_id) ?? null : null,
  }));
}

export type BlogPostListItem = BlogPostRow & {
  categoryName: string | null;
};

export async function listBlogPosts(): Promise<BlogPostListItem[]> {
  await requireAdmin();
  const supabase = await createClient();
  const [postsResult, categoriesResult] = await Promise.all([
    supabase.from("hog_admin_blog_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("hog_admin_blog_categories").select("*"),
  ]);

  if (postsResult.error) {
    throw new Error("Daftar tulisan tidak dapat dimuat.");
  }

  const categoryMap = new Map((categoriesResult.data || []).map((category) => [category.id, category.name]));

  return (postsResult.data || []).map((post) => ({
    ...post,
    categoryName: post.category_id ? categoryMap.get(post.category_id) ?? null : null,
  }));
}

export async function listBlogCategories(): Promise<BlogCategoryRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_admin_blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return data || [];
}

export async function listAnnualGoals(): Promise<AnnualGoalRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_admin_annual_goals")
    .select("*")
    .order("year", { ascending: false });

  return data || [];
}

export async function listSiteSettings(): Promise<SiteSettingRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hog_admin_site_settings")
    .select("*")
    .order("key", { ascending: true });

  return data || [];
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_admin_audit_logs")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Audit log tidak dapat dimuat.");
  }

  return data || [];
}
