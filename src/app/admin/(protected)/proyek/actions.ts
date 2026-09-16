"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  encodeNotice,
  isValidDate,
  isValidSlug,
  readAmount,
  readBoolean,
  readInteger,
  readOptionalText,
  readParagraphs,
  readText,
  slugify,
  toFriendlyError,
  type ActionState,
} from "@/lib/admin/form";
import {
  BUCKETS,
  isManagedBucket,
  isUploadPresent,
  removeStorageObjects,
  uploadToBucket,
  validateUpload,
} from "@/lib/admin/storage";
import type { BucketName } from "@/lib/admin/storage";
import { formatNumber } from "@/lib/format";
import type { CampaignStatus } from "@/lib/supabase/database.types";

const campaignStatuses: CampaignStatus[] = [
  "draft",
  "scheduled",
  "running",
  "closed",
  "disbursed",
  "reported",
  "cancelled",
  "archived",
];
const publicCampaignStatuses: CampaignStatus[] = ["running", "closed", "disbursed", "reported"];
const maxCreateUploadBytes = 29_000_000;

function revalidateCampaignSurfaces(slug?: string | null) {
  revalidatePath("/admin/proyek");
  revalidatePath("/admin");
  revalidatePath("/program");
  revalidatePath("/");

  if (slug) {
    revalidatePath(`/program/${slug}`);
  }
}

function revalidateCampaignDeletionSurfaces() {
  revalidateCampaignSurfaces();
  revalidatePath("/admin/donasi");
  revalidatePath("/program/[slug]", "page");
  revalidatePath("/riwayat-donasi");
}

type CampaignPayload = {
  slug: string;
  title: string;
  beneficiary_name: string | null;
  beneficiary_location: string | null;
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
  internal_note: string | null;
};

function buildCampaignPayload(formData: FormData): CampaignPayload | { error: string } {
  const title = readText(formData, "title");
  const slugInput = readText(formData, "slug");
  const slug = slugInput ? slugify(slugInput) : slugify(title);
  const targetAmount = readAmount(formData, "target_amount_idr");
  const status = readText(formData, "status") as CampaignStatus;
  const startsOn = readOptionalText(formData, "starts_on");
  const endsOn = readOptionalText(formData, "ends_on");
  const beneficiaryName = readOptionalText(formData, "beneficiary_name");
  const totalBeneficiariesInput = readText(formData, "total_beneficiaries");
  const totalBeneficiaries = readInteger(formData, "total_beneficiaries");

  if (!title) {
    return { error: "Judul proyek wajib diisi." };
  }

  if (!slug || !isValidSlug(slug)) {
    return { error: "Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung." };
  }

  if (!campaignStatuses.includes(status)) {
    return { error: "Status proyek tidak valid." };
  }

  if (!targetAmount) {
    return { error: "Target donasi wajib diisi dan lebih dari nol." };
  }

  if (startsOn && !isValidDate(startsOn)) {
    return { error: "Tanggal mulai tidak valid." };
  }

  if (endsOn && !isValidDate(endsOn)) {
    return { error: "Tanggal selesai tidak valid." };
  }

  if (startsOn && endsOn && endsOn < startsOn) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  if (totalBeneficiariesInput && (!totalBeneficiaries || totalBeneficiaries < 1)) {
    return { error: "Jumlah penerima wajib berupa angka lebih dari nol." };
  }

  if (publicCampaignStatuses.includes(status) && !beneficiaryName) {
    return { error: "Proyek publik wajib memiliki nama penerima manfaat." };
  }

  return {
    slug,
    title,
    beneficiary_name: beneficiaryName,
    beneficiary_location: readOptionalText(formData, "beneficiary_location"),
    status,
    summary: readOptionalText(formData, "summary"),
    story_paragraphs: readParagraphs(formData, "story_paragraphs"),
    quote_text: readOptionalText(formData, "quote_text"),
    quote_author: readOptionalText(formData, "quote_author"),
    target_amount_idr: targetAmount,
    starts_on: startsOn,
    ends_on: endsOn,
    total_beneficiaries: totalBeneficiaries,
    is_featured: readBoolean(formData, "is_featured"),
    needs_review: readBoolean(formData, "needs_review"),
    internal_note: readOptionalText(formData, "internal_note"),
  };
}

function campaignFiles(formData: FormData): {
  cover: File | null;
  documentation: File[];
} {
  const coverValue = formData.get("cover");
  const cover = isUploadPresent(coverValue) ? coverValue : null;
  const documentation = formData
    .getAll("documentation")
    .filter(isUploadPresent);

  return { cover, documentation };
}

function validateCampaignFiles(cover: File | null, documentation: File[]): string | null {
  const files = cover ? [cover, ...documentation] : documentation;
  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalBytes > maxCreateUploadBytes) {
    return "Total ukuran sampul dan dokumentasi maksimal 29 MB.";
  }

  for (const file of files) {
    const error = validateUpload(BUCKETS.publicMedia, file);

    if (error) {
      return `${file.name}: ${error}`;
    }
  }

  return null;
}

async function clearOtherFeaturedCampaigns(currentId?: string) {
  const supabase = await createClient();
  let query = supabase.from("hog_admin_campaigns").update({ is_featured: false }).eq("is_featured", true);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  return query;
}

export async function createCampaign(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const payload = buildCampaignPayload(formData);
  const files = campaignFiles(formData);

  if ("error" in payload) {
    return { error: payload.error };
  }

  const fileError = validateCampaignFiles(files.cover, files.documentation);

  if (fileError) {
    return { error: fileError };
  }

  const supabase = await createClient();
  const uploadedObjects: Array<{ bucket: typeof BUCKETS.publicMedia; path: string }> = [];
  const mediaIds: string[] = [];
  let campaignId: string | null = null;
  let previousFeaturedIds: string[] = [];

  const rollback = async () => {
    if (campaignId) {
      await supabase.from("hog_admin_campaigns").update({ cover_media_id: null }).eq("id", campaignId);
      await supabase.from("hog_admin_campaign_media").delete().eq("campaign_id", campaignId);
      await supabase.from("hog_admin_campaigns").delete().eq("id", campaignId);
    }

    if (mediaIds.length > 0) {
      await supabase.from("hog_admin_media_assets").delete().in("id", mediaIds);
    }

    await removeStorageObjects(uploadedObjects);

    if (previousFeaturedIds.length > 0) {
      await supabase.from("hog_admin_campaigns").update({ is_featured: true }).in("id", previousFeaturedIds);
    }
  };

  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("hog_admin_campaigns")
      .insert({ ...payload, is_featured: false, created_by: admin.userId, updated_by: admin.userId })
      .select("id,slug")
      .single();

    if (campaignError || !campaign) {
      return { error: toFriendlyError(campaignError?.message, "Proyek gagal disimpan.") };
    }

    campaignId = campaign.id;
    let coverMediaId: string | null = null;

    if (files.cover) {
      const upload = await uploadToBucket(BUCKETS.publicMedia, `campaigns/${campaign.id}`, files.cover);

      if ("error" in upload) {
        await rollback();
        return { error: upload.error };
      }

      uploadedObjects.push({ bucket: BUCKETS.publicMedia, path: upload.path });
      const { data: media, error: mediaError } = await supabase
        .from("hog_admin_media_assets")
        .insert({
          media_type: files.cover.type.startsWith("video/") ? "video" : "image",
          storage_bucket: BUCKETS.publicMedia,
          storage_path: upload.path,
          alt_text: readOptionalText(formData, "cover_alt_text") || payload.title,
          is_published: true,
          created_by: admin.userId,
          updated_by: admin.userId,
        })
        .select("id")
        .single();

      if (mediaError || !media) {
        await rollback();
        return { error: toFriendlyError(mediaError?.message, "Sampul gagal dicatat.") };
      }

      coverMediaId = media.id;
      mediaIds.push(media.id);
    }

    for (const [index, file] of files.documentation.entries()) {
      const upload = await uploadToBucket(BUCKETS.publicMedia, `campaigns/${campaign.id}`, file);

      if ("error" in upload) {
        await rollback();
        return { error: upload.error };
      }

      uploadedObjects.push({ bucket: BUCKETS.publicMedia, path: upload.path });
      const documentationCaption = readOptionalText(formData, "documentation_caption");
      const { data: media, error: mediaError } = await supabase
        .from("hog_admin_media_assets")
        .insert({
          media_type: file.type.startsWith("video/") ? "video" : "image",
          storage_bucket: BUCKETS.publicMedia,
          storage_path: upload.path,
          caption: documentationCaption,
          alt_text:
            readOptionalText(formData, "documentation_alt_text") ||
            documentationCaption ||
            payload.title,
          album_label: readOptionalText(formData, "documentation_album_label"),
          is_published: true,
          created_by: admin.userId,
          updated_by: admin.userId,
        })
        .select("id")
        .single();

      if (mediaError || !media) {
        await rollback();
        return { error: toFriendlyError(mediaError?.message, "Dokumentasi gagal dicatat.") };
      }

      mediaIds.push(media.id);
      const { error: linkError } = await supabase.from("hog_admin_campaign_media").insert({
        campaign_id: campaign.id,
        media_id: media.id,
        role: "documentation",
        sort_order: index,
      });

      if (linkError) {
        await rollback();
        return { error: toFriendlyError(linkError.message, "Dokumentasi gagal dihubungkan ke proyek.") };
      }
    }

    if (coverMediaId) {
      const { error: coverError } = await supabase
        .from("hog_admin_campaigns")
        .update({ cover_media_id: coverMediaId, updated_by: admin.userId })
        .eq("id", campaign.id);

      if (coverError) {
        await rollback();
        return { error: toFriendlyError(coverError.message, "Sampul gagal dipasang.") };
      }
    }

    if (payload.is_featured) {
      const { data: featuredCampaigns } = await supabase
        .from("hog_admin_campaigns")
        .select("id")
        .eq("is_featured", true)
        .neq("id", campaign.id);
      previousFeaturedIds = (featuredCampaigns || []).map((item) => item.id);
      const { error: clearError } = await clearOtherFeaturedCampaigns(campaign.id);

      if (clearError) {
        await rollback();
        return { error: toFriendlyError(clearError.message, "Proyek unggulan gagal diperbarui.") };
      }

      const { error: featureError } = await supabase
        .from("hog_admin_campaigns")
        .update({ is_featured: true, updated_by: admin.userId })
        .eq("id", campaign.id);

      if (featureError) {
        await rollback();
        return { error: toFriendlyError(featureError.message, "Proyek unggulan gagal diperbarui.") };
      }
    }

    revalidateCampaignSurfaces(campaign.slug);
    redirect(`/admin/proyek/${campaign.id}${encodeNotice({ success: "Proyek berhasil dibuat." })}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    await rollback();
    return { error: "Proyek gagal dibuat. Semua berkas baru telah dibersihkan." };
  }
}

export async function updateCampaign(
  campaignId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const payload = buildCampaignPayload(formData);

  if ("error" in payload) {
    return { error: payload.error };
  }

  if (payload.is_featured) {
    const { error } = await clearOtherFeaturedCampaigns(campaignId);

    if (error) {
      return { error: toFriendlyError(error.message, "Proyek unggulan gagal diperbarui.") };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hog_admin_campaigns")
    .update({ ...payload, updated_by: admin.userId })
    .eq("id", campaignId);

  if (error) {
    return { error: toFriendlyError(error.message, "Perubahan proyek gagal disimpan.") };
  }

  revalidateCampaignSurfaces(payload.slug);
  revalidatePath(`/admin/proyek/${campaignId}`);

  return { success: "Perubahan proyek tersimpan." };
}

export async function deleteCampaigns(formData: FormData) {
  await requireAdmin();
  const campaignIds = Array.from(
    new Set(
      formData
        .getAll("campaign_id")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (campaignIds.length === 0) {
    redirect(`/admin/proyek${encodeNotice({ error: "Pilih minimal satu proyek untuk dihapus." })}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hog_admin_delete_campaigns", {
    p_campaign_ids: campaignIds,
  });

  if (error) {
    redirect(
      `/admin/proyek${encodeNotice({
        error: toFriendlyError(error.message, "Proyek gagal dihapus."),
      })}`,
    );
  }

  if (!data) {
    redirect(
      `/admin/proyek${encodeNotice({
        error: "Proyek gagal dihapus: RPC tidak mengembalikan data. Pastikan migrasi 09_campaign_bulk_delete.sql sudah dijalankan.",
      })}`,
    );
  }

  const removableObjects: Array<{ bucket: BucketName; path: string }> = [];

  for (const object of data.storage_objects || []) {
    if (object.path && isManagedBucket(object.bucket)) {
      removableObjects.push({ bucket: object.bucket, path: object.path });
    }
  }

  const cleanup = await removeStorageObjects(removableObjects);

  revalidateCampaignDeletionSurfaces();

  const summary = `${formatNumber(data.deleted_campaign_count)} proyek dan ${formatNumber(data.deleted_donation_count)} donasi dihapus permanen.`;

  if ("error" in cleanup) {
    redirect(
      `/admin/proyek${encodeNotice({
        error: `${summary} Sebagian berkas masih tertinggal di penyimpanan dan perlu dibersihkan manual.`,
      })}`,
    );
  }

  redirect(`/admin/proyek${encodeNotice({ success: summary })}`);
}

export async function uploadCampaignCover(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const file = formData.get("cover");
  const redirectBase = `/admin/proyek/${campaignId}`;

  if (!campaignId || !isUploadPresent(file)) {
    redirect(`${redirectBase}${encodeNotice({ error: "Pilih berkas sampul terlebih dahulu." })}`);
  }

  const upload = await uploadToBucket(BUCKETS.publicMedia, `campaigns/${campaignId}`, file);

  if ("error" in upload) {
    redirect(`${redirectBase}${encodeNotice({ error: upload.error })}`);
  }

  const supabase = await createClient();
  const { data: media, error: mediaError } = await supabase
    .from("hog_admin_media_assets")
    .insert({
      media_type: file.type.startsWith("video/") ? "video" : "image",
      storage_bucket: BUCKETS.publicMedia,
      storage_path: upload.path,
      alt_text: readOptionalText(formData, "alt_text"),
      is_published: true,
      created_by: admin.userId,
      updated_by: admin.userId,
    })
    .select("id")
    .single();

  if (mediaError || !media) {
    await removeStorageObjects([{ bucket: BUCKETS.publicMedia, path: upload.path }]);
    redirect(
      `${redirectBase}${encodeNotice({
        error: toFriendlyError(mediaError?.message, "Media gagal dicatat."),
      })}`,
    );
  }

  const { error: campaignError } = await supabase
    .from("hog_admin_campaigns")
    .update({ cover_media_id: media.id, updated_by: admin.userId })
    .eq("id", campaignId);

  if (campaignError) {
    await supabase.from("hog_admin_media_assets").delete().eq("id", media.id);
    await removeStorageObjects([{ bucket: BUCKETS.publicMedia, path: upload.path }]);
    redirect(
      `${redirectBase}${encodeNotice({
        error: toFriendlyError(campaignError.message, "Sampul gagal dipasang."),
      })}`,
    );
  }

  revalidateCampaignSurfaces();
  revalidatePath(redirectBase);
  redirect(`${redirectBase}${encodeNotice({ success: "Sampul proyek diperbarui." })}`);
}

export async function addCampaignMedia(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const redirectBase = `/admin/proyek/${campaignId}`;
  const files = formData.getAll("media").filter(isUploadPresent);

  if (!campaignId || files.length === 0) {
    redirect(`${redirectBase}${encodeNotice({ error: "Pilih berkas dokumentasi terlebih dahulu." })}`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalBytes > maxCreateUploadBytes) {
    redirect(`${redirectBase}${encodeNotice({ error: "Total ukuran dokumentasi maksimal 29 MB per pengiriman." })}`);
  }

  for (const file of files) {
    const fileError = validateUpload(BUCKETS.publicMedia, file);

    if (fileError) {
      redirect(`${redirectBase}${encodeNotice({ error: `${file.name}: ${fileError}` })}`);
    }
  }

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("hog_admin_campaigns")
    .select("title")
    .eq("id", campaignId)
    .maybeSingle();
  const { data: lastLink } = await supabase
    .from("hog_admin_campaign_media")
    .select("sort_order")
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const baseOrder = lastLink?.[0]?.sort_order ?? -1;
  const sharedCaption = readOptionalText(formData, "caption");
  const sharedAltText =
    readOptionalText(formData, "alt_text") || sharedCaption || campaign?.title || "Dokumentasi proyek";
  const sharedAlbum = readOptionalText(formData, "album_label");

  const uploadedObjects: Array<{ bucket: typeof BUCKETS.publicMedia; path: string }> = [];
  const mediaIds: string[] = [];

  const rollbackBatch = async () => {
    if (mediaIds.length > 0) {
      await supabase.from("hog_admin_media_assets").delete().in("id", mediaIds);
    }

    await removeStorageObjects(uploadedObjects);
  };

  let addedCount = 0;

  for (const [index, file] of files.entries()) {
    const upload = await uploadToBucket(BUCKETS.publicMedia, `campaigns/${campaignId}`, file);

    if ("error" in upload) {
      await rollbackBatch();
      redirect(`${redirectBase}${encodeNotice({ error: upload.error })}`);
    }

    uploadedObjects.push({ bucket: BUCKETS.publicMedia, path: upload.path });
    const { data: media, error: mediaError } = await supabase
      .from("hog_admin_media_assets")
      .insert({
        media_type: file.type.startsWith("video/") ? "video" : "image",
        storage_bucket: BUCKETS.publicMedia,
        storage_path: upload.path,
        caption: sharedCaption,
        alt_text: sharedAltText,
        album_label: sharedAlbum,
        is_published: true,
        created_by: admin.userId,
        updated_by: admin.userId,
      })
      .select("id")
      .single();

    if (mediaError || !media) {
      await rollbackBatch();
      redirect(
        `${redirectBase}${encodeNotice({
          error: toFriendlyError(mediaError?.message, "Dokumentasi gagal disimpan."),
        })}`,
      );
    }

    mediaIds.push(media.id);
    const { error: linkError } = await supabase.from("hog_admin_campaign_media").insert({
      campaign_id: campaignId,
      media_id: media.id,
      role: "documentation",
      sort_order: baseOrder + 1 + index,
    });

    if (linkError) {
      await rollbackBatch();
      redirect(
        `${redirectBase}${encodeNotice({
          error: toFriendlyError(linkError.message, "Dokumentasi gagal dihubungkan ke proyek."),
        })}`,
      );
    }

    addedCount += 1;
  }

  revalidateCampaignSurfaces();
  revalidatePath(redirectBase);
  redirect(`${redirectBase}${encodeNotice({ success: `${formatNumber(addedCount)} dokumentasi ditambahkan.` })}`);
}

export async function bulkUpdateCampaignMedia(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const redirectBase = `/admin/proyek/${campaignId}`;
  const mediaIds = Array.from(
    new Set(
      formData
        .getAll("media_id")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (!campaignId || mediaIds.length === 0) {
    redirect(`${redirectBase}${encodeNotice({ error: "Pilih minimal satu dokumentasi untuk diubah." })}`);
  }

  const patch: { caption?: string | null; album_label?: string | null; alt_text?: string | null } = {};
  const caption = readOptionalText(formData, "caption");
  const albumLabel = readOptionalText(formData, "album_label");
  const altText = readOptionalText(formData, "alt_text");

  if (caption) {
    patch.caption = caption;
  }

  if (albumLabel) {
    patch.album_label = albumLabel;
  }

  if (altText) {
    patch.alt_text = altText;
  }

  if (Object.keys(patch).length === 0) {
    redirect(
      `${redirectBase}${encodeNotice({ error: "Isi minimal satu kolom (keterangan, album, atau teks alternatif)." })}`,
    );
  }

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("hog_admin_campaign_media")
    .select("media_id")
    .eq("campaign_id", campaignId)
    .eq("role", "documentation")
    .in("media_id", mediaIds);

  const scopedIds = (links || []).map((link) => link.media_id);

  if (scopedIds.length === 0) {
    redirect(`${redirectBase}${encodeNotice({ error: "Dokumentasi terpilih tidak termasuk proyek ini." })}`);
  }

  const { error } = await supabase
    .from("hog_admin_media_assets")
    .update({ ...patch, updated_by: admin.userId })
    .in("id", scopedIds);

  if (error) {
    redirect(
      `${redirectBase}${encodeNotice({
        error: toFriendlyError(error.message, "Dokumentasi gagal diperbarui."),
      })}`,
    );
  }

  revalidateCampaignSurfaces();
  revalidatePath(redirectBase);
  redirect(
    `${redirectBase}${encodeNotice({ success: `${formatNumber(scopedIds.length)} dokumentasi diperbarui.` })}`,
  );
}

