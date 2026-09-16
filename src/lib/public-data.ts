import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatDateRange,
  formatDayMonth,
  formatLongDate,
  formatReadMinutes,
  formatShortDate,
} from "@/lib/format";
import type {
  PublicBlogPostRow,
  PublicCampaignMediaRow,
  PublicCampaignRow,
  PublicDonationLedgerRow,
  PublicGalleryMediaRow,
  PublicReportRow,
  SiteStatsRow,
} from "@/lib/supabase/database.types";

const FALLBACK_CAMPAIGN_IMAGE = "/photos/community-01-web.jpg";
const FALLBACK_BLOG_IMAGE = "/photos/community-03-web.jpg";

function throwPublicDataError(operation: string): never {
  console.error(`[public-data] ${operation} failed.`);
  throw new Error("Data publik tidak dapat dimuat. Silakan coba lagi nanti.");
}

export type PublicCampaignCard = {
  id: string;
  slug: string;
  title: string;
  image: string;
  imagePos: string;
  imageAlt: string;
  status: PublicCampaignRow["status"];
  statusLabel: string;
  featured: boolean;
  raisedAmount: number;
  targetAmount: number;
  raised: string;
  target: string;
  percent: number;
  donorCount: number;
  daysRemaining: number | null;
  meta: string;
  cycle: string | null;
  recipient: string;
  location: string;
  summary: string;
  totalBeneficiaries: number;
  storyParagraphs: string[];
  quote: { text: string; author: string } | null;
  startsOn: string | null;
  endsOn: string | null;
  publishedAt: string | null;
};

export type PublicDonationItem = {
  id: string;
  date: string;
  dateRaw: string;
  name: string;
  project: string;
  projectSlug: string;
  amount: string;
  amountIdr: number;
};

export type PublicBlogItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  date: string;
  publishedAt: string | null;
  excerpt: string;
  bodyMarkdown: string;
  image: string;
  imagePos: string;
  imageAlt: string;
  author: string;
  readTime: string | null;
  featured: boolean;
};

export type PublicGalleryItem = {
  id: string;
  src: string;
  pos: string;
  alt: string;
  album: string;
  caption: string;
  meta: string;
  span?: "wide" | "tall";
  campaignSlug: string | null;
  campaignTitle: string | null;
};

export type PublicGalleryAlbum = {
  slug: string | null;
  title: string;
  image: string;
  imagePos: string;
  photoCount: number;
  period: string;
  description: string;
};

export type PublicCtaConfig = {
  label: string;
  phone: string | null;
  message: string;
};

function storageUrl(bucket: string | null, path: string | null): string | null {
  if (!bucket || !path) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${path}` : null;
}

export function resolvePublicMediaUrl(
  externalUrl: string | null,
  bucket: string | null,
  path: string | null,
): string | null {
  return externalUrl || storageUrl(bucket, path);
}

function campaignStatusLabel(status: PublicCampaignRow["status"]): string {
  const labels: Record<PublicCampaignRow["status"], string> = {
    draft: "Draf",
    scheduled: "Terjadwal",
    running: "Berjalan",
    closed: "Donasi ditutup",
    disbursed: "Selesai",
    reported: "Laporan tersedia",
    cancelled: "Dibatalkan",
    archived: "Diarsipkan",
  };

  return labels[status];
}

function campaignMeta(row: PublicCampaignRow): string {
  if (row.status === "running") {
    const remaining = row.days_remaining === null ? "Periode terbuka" : `Sisa ${row.days_remaining} hari`;
    return `${remaining} · ${row.verified_donation_count} donatur`;
  }

  return campaignStatusLabel(row.status);
}

function mapCampaign(row: PublicCampaignRow): PublicCampaignCard {
  const location = row.beneficiary_location || "";
  const image = resolvePublicMediaUrl(
    row.cover_external_url,
    row.cover_storage_bucket,
    row.cover_storage_path,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    image: image || FALLBACK_CAMPAIGN_IMAGE,
    imagePos: row.cover_focal_position || "50% 50%",
    imageAlt: row.cover_alt_text || row.title,
    status: row.status,
    statusLabel: campaignStatusLabel(row.status),
    featured: row.is_featured,
    raisedAmount: row.raised_amount_idr,
    targetAmount: row.target_amount_idr,
    raised: formatCurrency(row.raised_amount_idr),
    target: formatCurrency(row.target_amount_idr),
    percent: row.percent_funded,
    donorCount: row.verified_donation_count,
    daysRemaining: row.days_remaining,
    meta: campaignMeta(row),
    cycle: formatDateRange(row.starts_on, row.ends_on),
    recipient: row.beneficiary_name || "Penerima manfaat",
    location,
    summary: row.summary || "Dukungan ditujukan langsung kepada penerima manfaat.",
    totalBeneficiaries: row.total_beneficiaries ?? 0,
    storyParagraphs: row.story_paragraphs || [],
    quote: row.quote_text
      ? { text: row.quote_text, author: row.quote_author || "Penerima manfaat" }
      : null,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    publishedAt: row.published_at,
  };
}

function mapDonation(row: PublicDonationLedgerRow): PublicDonationItem {
  return {
    id: row.id,
    date: formatDayMonth(row.donated_on),
    dateRaw: row.donated_on,
    name: row.public_name,
    project: row.campaign_title,
    projectSlug: row.campaign_slug,
    amount: formatCurrency(row.amount_idr),
    amountIdr: row.amount_idr,
  };
}

function mapBlog(row: PublicBlogPostRow): PublicBlogItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category_name || "Kabar",
    categorySlug: row.category_slug || "kabar",
    date: formatLongDate(row.published_at),
    publishedAt: row.published_at,
    excerpt: row.excerpt || "Kabar terbaru dari Home of Giving.",
    bodyMarkdown: row.body_markdown || "",
    image:
      resolvePublicMediaUrl(
        row.cover_external_url,
        row.cover_storage_bucket,
        row.cover_storage_path,
      ) || FALLBACK_BLOG_IMAGE,
    imagePos: row.cover_focal_position || "50% 50%",
    imageAlt: row.cover_alt_text || row.title,
    author: row.author_name || "Panitia Home of Giving",
    readTime: formatReadMinutes(row.read_minutes),
    featured: row.is_featured,
  };
}

export const getPublicCtaConfig = cache(async (): Promise<PublicCtaConfig> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_site_settings")
    .select("value")
    .eq("key", "whatsapp_cta")
    .maybeSingle();

  if (error) {
    console.error("[public-data] WhatsApp CTA configuration failed.");
  }

  const raw = error ? null : data?.value;
  const value = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const label = typeof value.label === "string" && value.label.trim() ? value.label.trim() : "Chat panitia";
  const message = typeof value.message === "string" && value.message.trim()
    ? value.message.trim()
    : "Halo, saya ingin berdonasi melalui REMAX Home of Giving.";
  const phone = typeof value.phone === "string" ? value.phone.replace(/[^\d]/g, "") : "";

  return {
    label,
    phone: phone || null,
    message,
  };
});

export const getPublicCampaigns = cache(async (): Promise<PublicCampaignCard[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_campaigns")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    throwPublicDataError("campaign list");
  }

  return (data || [])
    .map(mapCampaign)
    .sort((a, b) => Number(b.status === "running") - Number(a.status === "running") || Number(b.featured) - Number(a.featured));
});

export const getPublicSiteStats = cache(async (): Promise<SiteStatsRow> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("hog_site_stats").select("*").maybeSingle();

  if (error) {
    throwPublicDataError("site statistics");
  }

  return data || {
    total_raised_idr: 0,
    verified_donation_count: 0,
    running_campaign_count: 0,
    completed_campaign_count: 0,
    total_beneficiaries: 0,
  };
});

export const getPublicDonations = cache(async (): Promise<PublicDonationItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_donation_ledger")
    .select("*")
    .order("donated_on", { ascending: false });

  if (error) {
    throwPublicDataError("donation ledger");
  }

  return (data || []).map(mapDonation);
});

export const getPublicReports = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_reports")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    throwPublicDataError("report list");
  }

  return (data || []).map((row) => ({
    ...row,
    url: row.external_url || storageUrl(row.storage_bucket, row.storage_path),
  }));
});

export const getPublicBlogPosts = cache(async (): Promise<PublicBlogItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    throwPublicDataError("blog post list");
  }

  const posts = (data || []).map(mapBlog);
  return posts.sort((a, b) => Number(b.featured) - Number(a.featured));
});

export const getPublicGallery = cache(async (): Promise<{
  media: PublicGalleryItem[];
  albums: PublicGalleryAlbum[];
}> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_gallery_media")
    .select("*")
    .eq("media_type", "image")
    .order("sort_order", { ascending: true });

  if (error) {
    throwPublicDataError("gallery");
  }

  const uniqueRows = new Map<string, PublicGalleryMediaRow>();

  for (const row of data || []) {
    const current = uniqueRows.get(row.id);
    if (!current || (!current.campaign_slug && row.campaign_slug)) {
      uniqueRows.set(row.id, row);
    }
  }

  const media = Array.from(uniqueRows.values()).flatMap((row) => {
    const src = resolvePublicMediaUrl(row.external_url, row.storage_bucket, row.storage_path);
    if (!src) return [];

    const meta = [row.location_label, row.captured_on ? formatShortDate(row.captured_on) : null]
      .filter(Boolean)
      .join(" · ");

    return [{
      id: row.id,
      src,
      pos: row.focal_position || "50% 50%",
      alt: row.alt_text || row.caption || "Dokumentasi Home of Giving",
      album: row.album_label || "Dokumentasi",
      caption: row.caption || "Dokumentasi Home of Giving",
      meta,
      span: row.layout_span === "normal" ? undefined : row.layout_span,
      campaignSlug: row.campaign_slug,
      campaignTitle: row.campaign_title,
    } satisfies PublicGalleryItem];
  });

  const grouped = new Map<string, PublicGalleryItem[]>();
  for (const item of media) {
    const items = grouped.get(item.album) || [];
    items.push(item);
    grouped.set(item.album, items);
  }

  const albums = Array.from(grouped.entries()).map(([title, items]) => ({
    slug: items.find((item) => item.campaignSlug)?.campaignSlug || null,
    title,
    image: items[0].src,
    imagePos: items[0].pos,
    photoCount: items.length,
    period: items.map((item) => item.meta).find(Boolean) || "Dokumentasi",
    description: items[0].caption,
  }));

  return { media, albums };
});

export const getPublicAnnualGoal = cache(async (year: number): Promise<number | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_annual_goals")
    .select("target_amount_idr")
    .eq("year", year)
    .maybeSingle();

  if (error) {
    throwPublicDataError("annual goal");
  }

  return data?.target_amount_idr ?? null;
});

export const getPublicCampaignDetail = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: campaignRow, error } = await supabase
    .from("hog_campaigns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throwPublicDataError("campaign detail");
  }

  if (!campaignRow) {
    return null;
  }

  const [donationsResult, mediaResult, reportsResult] = await Promise.all([
    supabase
      .from("hog_donation_ledger")
      .select("*")
      .eq("campaign_id", campaignRow.id)
      .order("donated_on", { ascending: false }),
    supabase
      .from("hog_campaign_media")
      .select("*")
      .eq("campaign_id", campaignRow.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("hog_reports")
      .select("*")
      .eq("campaign_id", campaignRow.id)
      .order("published_at", { ascending: false }),
  ]);

  if (donationsResult.error || mediaResult.error || reportsResult.error) {
    throwPublicDataError("campaign related data");
  }

  const media = (mediaResult.data || []).flatMap((row: PublicCampaignMediaRow) => {
    const src = resolvePublicMediaUrl(row.external_url, row.storage_bucket, row.storage_path);
    return src ? [{ ...row, src }] : [];
  });

  return {
    campaign: mapCampaign(campaignRow),
    donations: (donationsResult.data || []).map(mapDonation),
    media,
    reports: (reportsResult.data || []).map((row: PublicReportRow) => ({
      ...row,
      url: row.external_url || storageUrl(row.storage_bucket, row.storage_path),
    })),
  };
});

export const getPublicBlogDetail = cache(async (slug: string) => {
  const posts = await getPublicBlogPosts();
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    post,
    related: posts.filter((item) => item.slug !== slug).slice(0, 2),
  };
});
