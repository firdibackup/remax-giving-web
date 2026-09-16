export type DonationStatus = "verified";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "closed"
  | "disbursed"
  | "reported"
  | "cancelled"
  | "archived";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type MediaType = "image" | "video" | "document";
export type MediaSpan = "normal" | "wide" | "tall";
export type MediaRole = "cover" | "gallery" | "handover" | "documentation";
export type MilestoneKind =
  | "opened"
  | "goal_reached"
  | "disbursed"
  | "report_published"
  | "custom";
export type ReportKind = "campaign" | "periodic";

export type AdminIdentity = {
  user_id: string | null;
  display_name: string | null;
  is_admin: boolean;
};

export type DashboardSummary = {
  total_donation_count: number;
  total_donation_amount_idr: number;
  running_campaign_count: number;
  unpublished_report_count: number;
};

export type CampaignDeletionResult = {
  deleted_campaign_count: number;
  deleted_donation_count: number;
  storage_objects: Array<{ bucket: string; path: string }>;
};

export type DonationDetail = {
  id: string;
  campaign_id: string;
  campaign_title: string;
  full_name: string | null;
  public_name: string;
  amount_idr: number;
  donated_on: string;
  status: DonationStatus;
  is_legacy: boolean;
  verified_at: string;
  evidence_paths: string[];
};

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type Actors = {
  created_by: string | null;
  updated_by: string | null;
};

export type BlogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
} & Timestamps;

export type BranchRow = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  is_active: boolean;
} & Timestamps;

export type MediaAssetRow = {
  id: string;
  source_key: string | null;
  media_type: MediaType;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  caption: string | null;
  alt_text: string | null;
  credit: string | null;
  focal_position: string;
  layout_span: MediaSpan;
  album_label: string | null;
  location_label: string | null;
  captured_on: string | null;
  sort_order: number;
  is_published: boolean;
} & Timestamps &
  Actors;

export type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  beneficiary_name: string | null;
  beneficiary_location: string | null;
  cover_media_id: string | null;
  status: CampaignStatus;
  summary: string | null;
  story_paragraphs: string[];
  quote_text: string | null;
  quote_author: string | null;
  target_amount_idr: number;
  starts_on: string | null;
  ends_on: string | null;
  total_beneficiaries: number | null;
  is_featured: boolean;
  needs_review: boolean;
  review_note: string | null;
  internal_note: string | null;
  published_at: string | null;
  closed_at: string | null;
  disbursed_at: string | null;
  reported_at: string | null;
} & Timestamps &
  Actors;

export type DonationRow = {
  id: string;
  campaign_id: string;
  public_name: string;
  amount_idr: number;
  donated_on: string;
  status: DonationStatus;
  is_legacy: boolean;
  verified_at: string;
} & Timestamps;

export type CampaignMilestoneRow = {
  id: string;
  campaign_id: string;
  kind: MilestoneKind;
  title: string;
  detail: string | null;
  occurred_on: string | null;
  sort_order: number;
  is_published: boolean;
} & Timestamps;

export type ReportRow = {
  id: string;
  kind: ReportKind;
  campaign_id: string | null;
  title: string;
  storage_bucket: string;
  storage_path: string | null;
  external_url: string | null;
  period_label: string | null;
  published_at: string | null;
} & Timestamps &
  Actors;

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  category_id: string | null;
  campaign_id: string | null;
  cover_media_id: string | null;
  excerpt: string | null;
  body_markdown: string | null;
  author_name: string | null;
  read_minutes: number | null;
  is_featured: boolean;
  status: ContentStatus;
  published_at: string | null;
} & Timestamps &
  Actors;

export type CampaignMediaRow = {
  campaign_id: string;
  media_id: string;
  role: MediaRole;
  sort_order: number;
  created_at: string;
};

export type BlogMediaRow = {
  post_id: string;
  media_id: string;
  sort_order: number;
  created_at: string;
};

export type AnnualGoalRow = {
  year: number;
  target_amount_idr: number;
  is_published: boolean;
  note: string | null;
} & Timestamps;

export type SiteSettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type AuditLogRow = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  before_data: unknown;
  after_data: unknown;
};

export type PublicCampaignRow = {
  id: string;
  slug: string;
  title: string;
  status: CampaignStatus;
  summary: string | null;
  story_paragraphs: string[];
  quote_text: string | null;
  quote_author: string | null;
  target_amount_idr: number;
  starts_on: string | null;
  ends_on: string | null;
  total_beneficiaries: number | null;
  beneficiary_name: string;
  beneficiary_location: string | null;
  is_featured: boolean;
  published_at: string;
  closed_at: string | null;
  disbursed_at: string | null;
  reported_at: string | null;
  cover_external_url: string | null;
  cover_storage_bucket: string | null;
  cover_storage_path: string | null;
  cover_focal_position: string | null;
  cover_alt_text: string | null;
  raised_amount_idr: number;
  verified_donation_count: number;
  percent_funded: number;
  days_remaining: number | null;
};

export type PublicDonationLedgerRow = {
  id: string;
  donated_on: string;
  public_name: string;
  amount_idr: number;
  campaign_id: string;
  campaign_slug: string;
  campaign_title: string;
};

export type PublicCampaignMilestoneRow = {
  id: string;
  campaign_id: string;
  kind: MilestoneKind;
  title: string;
  detail: string | null;
  occurred_on: string | null;
  sort_order: number;
};

export type PublicReportRow = {
  id: string;
  kind: ReportKind;
  campaign_id: string | null;
  title: string;
  period_label: string | null;
  storage_bucket: string;
  storage_path: string | null;
  external_url: string | null;
  published_at: string;
};

export type PublicBlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string | null;
  author_name: string | null;
  read_minutes: number | null;
  is_featured: boolean;
  published_at: string;
  campaign_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  cover_external_url: string | null;
  cover_storage_bucket: string | null;
  cover_storage_path: string | null;
  cover_focal_position: string | null;
  cover_alt_text: string | null;
};

export type PublicGalleryMediaRow = {
  id: string;
  media_type: MediaType;
  external_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  caption: string | null;
  alt_text: string | null;
  credit: string | null;
  focal_position: string;
  layout_span: MediaSpan;
  album_label: string | null;
  location_label: string | null;
  captured_on: string | null;
  sort_order: number;
  campaign_id: string | null;
  campaign_slug: string | null;
  campaign_title: string | null;
};

export type PublicCampaignMediaRow = {
  campaign_id: string;
  media_id: string;
  role: MediaRole;
  sort_order: number;
  media_type: MediaType;
  external_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  caption: string | null;
  alt_text: string | null;
  focal_position: string;
  layout_span: MediaSpan;
};

export type SiteStatsRow = {
  total_raised_idr: number;
  verified_donation_count: number;
  running_campaign_count: number;
  completed_campaign_count: number;
  total_beneficiaries: number;
};

export type PublicSiteSettingRow = {
  key: string;
  value: unknown;
};

export type PublicAnnualGoalRow = {
  year: number;
  target_amount_idr: number;
};

type ReadonlyView<Row> = {
  Row: Row;
  Relationships: [];
};

type WritableView<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: {
      hog_campaigns: ReadonlyView<PublicCampaignRow>;
      hog_campaign_stats: ReadonlyView<{
        campaign_id: string;
        slug: string;
        target_amount_idr: number;
        raised_amount_idr: number;
        verified_donation_count: number;
        percent_funded: number;
        last_donation_on: string | null;
      }>;
      hog_donation_ledger: ReadonlyView<PublicDonationLedgerRow>;
      hog_campaign_milestones: ReadonlyView<PublicCampaignMilestoneRow>;
      hog_reports: ReadonlyView<PublicReportRow>;
      hog_blog_posts: ReadonlyView<PublicBlogPostRow>;
      hog_gallery_media: ReadonlyView<PublicGalleryMediaRow>;
      hog_campaign_media: ReadonlyView<PublicCampaignMediaRow>;
      hog_site_stats: ReadonlyView<SiteStatsRow>;
      hog_site_settings: ReadonlyView<PublicSiteSettingRow>;
      hog_annual_goals: ReadonlyView<PublicAnnualGoalRow>;
      hog_admin_blog_categories: WritableView<BlogCategoryRow>;
      hog_admin_branches: WritableView<BranchRow>;
      hog_admin_media_assets: WritableView<MediaAssetRow>;
      hog_admin_campaigns: WritableView<CampaignRow>;
      hog_admin_donations: ReadonlyView<DonationRow>;
      hog_admin_campaign_milestones: WritableView<CampaignMilestoneRow>;
      hog_admin_reports: WritableView<ReportRow>;
      hog_admin_blog_posts: WritableView<BlogPostRow>;
      hog_admin_campaign_media: WritableView<CampaignMediaRow>;
      hog_admin_blog_media: WritableView<BlogMediaRow>;
      hog_admin_annual_goals: WritableView<AnnualGoalRow>;
      hog_admin_site_settings: WritableView<SiteSettingRow>;
      hog_admin_audit_logs: ReadonlyView<AuditLogRow>;
    };
    Functions: {
      hog_admin_whoami: {
        Args: Record<PropertyKey, never>;
        Returns: AdminIdentity[];
      };
      hog_admin_record_donation: {
        Args: {
          p_campaign_id: string;
          p_full_name: string;
          p_amount_idr: number;
          p_donated_on: string;
          p_evidence_path?: string | null;
        };
        Returns: string;
      };
      hog_admin_donation_detail: {
        Args: { p_donation_id: string };
        Returns: DonationDetail;
      };
      hog_admin_dashboard_summary: {
        Args: Record<PropertyKey, never>;
        Returns: DashboardSummary;
      };
      hog_admin_delete_campaigns: {
        Args: { p_campaign_ids: string[] };
        Returns: CampaignDeletionResult;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
