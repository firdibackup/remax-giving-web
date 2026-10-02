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
  readStoryHtml,
  readText,
  slugify,
  toFriendlyError,
  type ActionState,
} from "@/lib/admin/form";
import { documentationMaxBytes } from "@/lib/admin/buckets";
import {
  BUCKETS,
  isManagedBucket,
  removeStorageObjects,
  verifyStagedUpload,
} from "@/lib/admin/storage";
import type { BucketName, StagedUpload } from "@/lib/admin/storage";
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
const publicCampaignStatuses: CampaignStatus[] = [
  "running",
  "closed",
  "disbursed",
  "reported",
];

function revalidateCampaignSurfaces(slug?: string | null) {
  revalidatePath("/admin/program");
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

function buildCampaignPayload(
  formData: FormData,
): CampaignPayload | { error: string } {
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
    return { error: "Judul program wajib diisi." };
  }

  if (!slug || !isValidSlug(slug)) {
    return {
      error: "Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.",
    };
  }

  if (!campaignStatuses.includes(status)) {
    return { error: "Status program tidak valid." };
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

  if (
    totalBeneficiariesInput &&
    (!totalBeneficiaries || totalBeneficiaries < 1)
  ) {
    return { error: "Jumlah penerima wajib berupa angka lebih dari nol." };
  }

  if (publicCampaignStatuses.includes(status) && !beneficiaryName) {
    return { error: "program publik wajib memiliki nama penerima manfaat." };
  }

  return {
    slug,
    title,
    beneficiary_name: beneficiaryName,
    beneficiary_location: readOptionalText(formData, "beneficiary_location"),
    status,
    summary: readOptionalText(formData, "summary"),
    story_paragraphs: readStoryHtml(formData, "story_paragraphs"),
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

// All-or-nothing: if any staged file fails, the ones that passed are removed too.
async function verifyMediaUploads(
  folder: string,
  uploads: Array<{ path: string; maxBytes?: number }>,
): Promise<StagedUpload[] | { error: string }> {
  const results = await Promise.all(
    uploads.map(({ path, maxBytes }) =>
      verifyStagedUpload(BUCKETS.publicMedia, folder, path, maxBytes),
    ),
  );
  const verified = results.filter(
    (result): result is StagedUpload => "path" in result,
  );
  const failed = results.find((result) => "error" in result);

  if (failed && "error" in failed) {
    await removeStorageObjects(
      verified.map(({ path }) => ({ bucket: BUCKETS.publicMedia, path })),
    );
    return { error: failed.error };
  }

  return verified;
}

function readPaths(formData: FormData, key: string): string[] {
  return Array.from(
    new Set(formData.getAll(key).map((value) => String(value).trim())),
  ).filter(Boolean);
}

async function clearOtherFeaturedCampaigns(currentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("hog_admin_campaigns")
    .update({ is_featured: false })
    .eq("is_featured", true);

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

  if ("error" in payload) {
    return { error: payload.error };
  }

  const coverPath = readText(formData, "cover_path");
  const staged = await verifyMediaUploads("campaigns", [
    ...(coverPath ? [{ path: coverPath }] : []),
    ...readPaths(formData, "documentation_path").map((path) => ({
      path,
      maxBytes: documentationMaxBytes,
    })),
  ]);

  if ("error" in staged) {
    return { error: staged.error };
  }

  const files = {
    cover: coverPath ? staged[0] : null,
    documentation: coverPath ? staged.slice(1) : staged,
  };
  const supabase = await createClient();
  const uploadedObjects = staged.map(({ path }) => ({
    bucket: BUCKETS.publicMedia,
    path,
  }));
  const mediaIds: string[] = [];
  let campaignId: string | null = null;
  let previousFeaturedIds: string[] = [];

  const rollback = async () => {
    if (campaignId) {
      await supabase
        .from("hog_admin_campaigns")
        .update({ cover_media_id: null })
        .eq("id", campaignId);
      await supabase
        .from("hog_admin_campaign_media")
        .delete()
        .eq("campaign_id", campaignId);
      await supabase.from("hog_admin_campaigns").delete().eq("id", campaignId);
    }

    if (mediaIds.length > 0) {
      await supabase.from("hog_admin_media_assets").delete().in("id", mediaIds);
    }

    await removeStorageObjects(uploadedObjects);

    if (previousFeaturedIds.length > 0) {
      await supabase
        .from("hog_admin_campaigns")
        .update({ is_featured: true })
        .in("id", previousFeaturedIds);
    }
  };

  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("hog_admin_campaigns")
      .insert({
        ...payload,
        is_featured: false,
        created_by: admin.userId,
        updated_by: admin.userId,
      })
      .select("id,slug")
      .single();

    if (campaignError || !campaign) {
      await rollback();
      return {
        error: toFriendlyError(
          campaignError?.message,
          "program gagal disimpan.",
        ),
      };
    }

    campaignId = campaign.id;
    let coverMediaId: string | null = null;

    if (files.cover) {
      const { data: media, error: mediaError } = await supabase
        .from("hog_admin_media_assets")
        .insert({
          media_type: files.cover.contentType.startsWith("video/")
            ? "video"
            : "image",
          storage_bucket: BUCKETS.publicMedia,
          storage_path: files.cover.path,
          alt_text:
            readOptionalText(formData, "cover_alt_text") || payload.title,
          is_published: true,
          created_by: admin.userId,
          updated_by: admin.userId,
        })
        .select("id")
        .single();

      if (mediaError || !media) {
        await rollback();
        return {
          error: toFriendlyError(mediaError?.message, "Sampul gagal dicatat."),
        };
      }

      coverMediaId = media.id;
      mediaIds.push(media.id);
    }

    for (const [index, file] of files.documentation.entries()) {
      const documentationCaption = readOptionalText(
        formData,
        "documentation_caption",
      );
      const { data: media, error: mediaError } = await supabase
        .from("hog_admin_media_assets")
        .insert({
          media_type: file.contentType.startsWith("video/") ? "video" : "image",
          storage_bucket: BUCKETS.publicMedia,
          storage_path: file.path,
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
        return {
          error: toFriendlyError(
            mediaError?.message,
            "Dokumentasi gagal dicatat.",
          ),
        };
      }

      mediaIds.push(media.id);
      const { error: linkError } = await supabase
        .from("hog_admin_campaign_media")
        .insert({
          campaign_id: campaign.id,
          media_id: media.id,
          role: "documentation",
          sort_order: index,
        });

      if (linkError) {
        await rollback();
        return {
          error: toFriendlyError(
            linkError.message,
            "Dokumentasi gagal dihubungkan ke program.",
          ),
        };
      }
    }

    if (coverMediaId) {
      const { error: coverError } = await supabase
        .from("hog_admin_campaigns")
        .update({ cover_media_id: coverMediaId, updated_by: admin.userId })
        .eq("id", campaign.id);

      if (coverError) {
        await rollback();
        return {
          error: toFriendlyError(coverError.message, "Sampul gagal dipasang."),
        };
      }
    }

    if (payload.is_featured) {
      const { data: featuredCampaigns } = await supabase
        .from("hog_admin_campaigns")
        .select("id")
        .eq("is_featured", true)
        .neq("id", campaign.id);
      previousFeaturedIds = (featuredCampaigns || []).map((item) => item.id);
      const { error: clearError } = await clearOtherFeaturedCampaigns(
        campaign.id,
      );

      if (clearError) {
        await rollback();
        return {
          error: toFriendlyError(
            clearError.message,
            "program unggulan gagal diperbarui.",
          ),
        };
      }

      const { error: featureError } = await supabase
        .from("hog_admin_campaigns")
        .update({ is_featured: true, updated_by: admin.userId })
        .eq("id", campaign.id);

      if (featureError) {
        await rollback();
        return {
          error: toFriendlyError(
            featureError.message,
            "program unggulan gagal diperbarui.",
          ),
        };
      }
    }

    revalidateCampaignSurfaces(campaign.slug);
    redirect(
      `/admin/program/${campaign.id}${encodeNotice({ success: "program berhasil dibuat." })}`,
    );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    await rollback();
    return {
      error: "program gagal dibuat. Semua berkas baru telah dibersihkan.",
    };
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
      return {
        error: toFriendlyError(
          error.message,
          "program unggulan gagal diperbarui.",
        ),
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hog_admin_campaigns")
    .update({ ...payload, updated_by: admin.userId })
    .eq("id", campaignId);

  if (error) {
    return {
      error: toFriendlyError(
        error.message,
        "Perubahan program gagal disimpan.",
      ),
    };
  }

  revalidateCampaignSurfaces(payload.slug);
  revalidatePath(`/admin/program/${campaignId}`);

  return { success: "Perubahan program tersimpan." };
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
    redirect(
      `/admin/program${encodeNotice({ error: "Pilih minimal satu program untuk dihapus." })}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hog_admin_delete_campaigns", {
    p_campaign_ids: campaignIds,
  });

  if (error) {
    redirect(
      `/admin/program${encodeNotice({
        error: toFriendlyError(error.message, "program gagal dihapus."),
      })}`,
    );
  }

  if (!data) {
    redirect(
      `/admin/program${encodeNotice({
        error:
          "program gagal dihapus: RPC tidak mengembalikan data. Pastikan migrasi 09_campaign_bulk_delete.sql sudah dijalankan.",
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

  const summary = `${formatNumber(data.deleted_campaign_count)} program dan ${formatNumber(data.deleted_donation_count)} donasi dihapus permanen.`;

  if ("error" in cleanup) {
    redirect(
      `/admin/program${encodeNotice({
        error: `${summary} Sebagian berkas masih tertinggal di penyimpanan dan perlu dibersihkan manual.`,
      })}`,
    );
  }

  redirect(`/admin/program${encodeNotice({ success: summary })}`);
}

export async function updateCampaignAllocations(formData: FormData) {
  await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const redirectBase = `/admin/program/${campaignId}`;

  if (!campaignId) {
    redirect(
      `/admin/program${encodeNotice({ error: "program tidak ditemukan." })}`,
    );
  }

  const labels = formData
    .getAll("allocation_label")
    .map((value) => String(value).trim());
  const amounts = formData
    .getAll("allocation_amount")
    .map((value) => String(value).trim());
  const notes = formData
    .getAll("allocation_note")
    .map((value) => String(value).trim());

  const rows: Array<{
    campaign_id: string;
    label: string;
    amount_idr: number;
    note: string | null;
    sort_order: number;
    is_published: boolean;
  }> = [];

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    if (!label) {
      continue;
    }

    const rawAmount = amounts[index] ?? "";
    if (rawAmount !== "" && !/^\d+$/.test(rawAmount)) {
      redirect(
        `${redirectBase}${encodeNotice({ error: `Nominal untuk "${label}" harus berupa angka bulat tidak negatif.` })}`,
      );
    }

    rows.push({
      campaign_id: campaignId,
      label,
      amount_idr: rawAmount === "" ? 0 : Number(rawAmount),
      note: notes[index] ? notes[index] : null,
      sort_order: rows.length,
      is_published: true,
    });
  }

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("hog_admin_campaigns")
    .select("slug")
    .eq("id", campaignId)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("hog_admin_campaign_allocations")
    .delete()
    .eq("campaign_id", campaignId);

  if (deleteError) {
    redirect(
      `${redirectBase}${encodeNotice({ error: toFriendlyError(deleteError.message, "Rincian penggunaan dana gagal disimpan.") })}`,
    );
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("hog_admin_campaign_allocations")
      .insert(rows);

    if (insertError) {
      redirect(
        `${redirectBase}${encodeNotice({ error: toFriendlyError(insertError.message, "Rincian penggunaan dana gagal disimpan.") })}`,
      );
    }
  }

  revalidateCampaignSurfaces(campaign?.slug);
  revalidatePath(redirectBase);
  redirect(
    `${redirectBase}${encodeNotice({ success: `${formatNumber(rows.length)} baris rincian penggunaan dana tersimpan.` })}`,
  );
}

export async function uploadCampaignCover(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const coverPath = readText(formData, "cover_path");
  const redirectBase = `/admin/program/${campaignId}`;

  if (!campaignId || !coverPath) {
    redirect(
      `${redirectBase}${encodeNotice({ error: "Pilih berkas sampul terlebih dahulu." })}`,
    );
  }

  const upload = await verifyStagedUpload(
    BUCKETS.publicMedia,
    `campaigns/${campaignId}`,
    coverPath,
  );

  if ("error" in upload) {
    redirect(`${redirectBase}${encodeNotice({ error: upload.error })}`);
  }

  const supabase = await createClient();
  const { data: media, error: mediaError } = await supabase
    .from("hog_admin_media_assets")
    .insert({
      media_type: upload.contentType.startsWith("video/") ? "video" : "image",
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
    await removeStorageObjects([
      { bucket: BUCKETS.publicMedia, path: upload.path },
    ]);
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
    await removeStorageObjects([
      { bucket: BUCKETS.publicMedia, path: upload.path },
    ]);
    redirect(
      `${redirectBase}${encodeNotice({
        error: toFriendlyError(campaignError.message, "Sampul gagal dipasang."),
      })}`,
    );
  }

  revalidateCampaignSurfaces();
  revalidatePath(redirectBase);
  redirect(
    `${redirectBase}${encodeNotice({ success: "Sampul program diperbarui." })}`,
  );
}

export async function addCampaignMedia(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const redirectBase = `/admin/program/${campaignId}`;
  // DocumentationUploader already stored the files via uploadChunk; this
  // action only records the returned paths.
  const paths = readPaths(formData, "storage_path");

  if (!campaignId || paths.length === 0) {
    redirect(
      `${redirectBase}${encodeNotice({ error: "Pilih berkas dokumentasi terlebih dahulu." })}`,
    );
  }

  const staged = await verifyMediaUploads(
    `campaigns/${campaignId}`,
    paths.map((path) => ({ path, maxBytes: documentationMaxBytes })),
  );

  if ("error" in staged) {
    redirect(`${redirectBase}${encodeNotice({ error: staged.error })}`);
  }

  const supabase = await createClient();
  const uploadedObjects = staged.map(({ path }) => ({
    bucket: BUCKETS.publicMedia,
    path,
  }));
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
    readOptionalText(formData, "alt_text") ||
    sharedCaption ||
    campaign?.title ||
    "Dokumentasi program";
  const sharedAlbum = readOptionalText(formData, "album_label");

  const mediaIds: string[] = [];

  const rollbackBatch = async () => {
    if (mediaIds.length > 0) {
      await supabase.from("hog_admin_media_assets").delete().in("id", mediaIds);
    }

    await removeStorageObjects(uploadedObjects);
  };

  let addedCount = 0;

  for (const [index, file] of staged.entries()) {
    const { data: media, error: mediaError } = await supabase
      .from("hog_admin_media_assets")
      .insert({
        media_type: file.contentType.startsWith("video/") ? "video" : "image",
        storage_bucket: BUCKETS.publicMedia,
        storage_path: file.path,
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
          error: toFriendlyError(
            mediaError?.message,
            "Dokumentasi gagal disimpan.",
          ),
        })}`,
      );
    }

    mediaIds.push(media.id);
    const { error: linkError } = await supabase
      .from("hog_admin_campaign_media")
      .insert({
        campaign_id: campaignId,
        media_id: media.id,
        role: "documentation",
        sort_order: baseOrder + 1 + index,
      });

    if (linkError) {
      await rollbackBatch();
      redirect(
        `${redirectBase}${encodeNotice({
          error: toFriendlyError(
            linkError.message,
            "Dokumentasi gagal dihubungkan ke program.",
          ),
        })}`,
      );
    }

    addedCount += 1;
  }

  revalidateCampaignSurfaces();
  revalidatePath(redirectBase);
  redirect(
    `${redirectBase}${encodeNotice({ success: `${formatNumber(addedCount)} dokumentasi ditambahkan.` })}`,
  );
}

export async function bulkUpdateCampaignMedia(formData: FormData) {
  const admin = await requireAdmin();
  const campaignId = readText(formData, "campaign_id");
  const redirectBase = `/admin/program/${campaignId}`;
  const mediaIds = Array.from(
    new Set(
      formData
        .getAll("media_id")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (!campaignId || mediaIds.length === 0) {
    redirect(
      `${redirectBase}${encodeNotice({ error: "Pilih minimal satu dokumentasi untuk diubah." })}`,
    );
  }

  const patch: {
    caption?: string | null;
    album_label?: string | null;
    alt_text?: string | null;
  } = {};
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
    redirect(
      `${redirectBase}${encodeNotice({ error: "Dokumentasi terpilih tidak termasuk program ini." })}`,
    );
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
