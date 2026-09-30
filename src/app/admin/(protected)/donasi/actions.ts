"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  encodeNotice,
  isValidDate,
  readAmount,
  readText,
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
import { formatNumber, todayInJakarta } from "@/lib/format";

function revalidateDonationSurfaces() {
  revalidatePath("/admin/donasi");
  revalidatePath("/admin");
  revalidatePath("/riwayat-donasi");
  revalidatePath("/program");
  revalidatePath("/program/[slug]", "page");
  revalidatePath("/");
}

export async function createDonation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const campaignId = readText(formData, "campaign_id");
  const fullName = readText(formData, "full_name");
  const amount = readAmount(formData, "amount_idr");
  const donatedOn = readText(formData, "donated_on");
  const evidenceValue = formData.get("evidence");
  const evidence = isUploadPresent(evidenceValue) ? evidenceValue : null;

  if (!campaignId) {
    return { error: "Pilih program tujuan donasi." };
  }

  if (!fullName) {
    return { error: "Nama lengkap donatur wajib diisi." };
  }

  if (!amount) {
    return { error: "Nominal donasi wajib lebih dari nol." };
  }

  if (!isValidDate(donatedOn) || donatedOn > todayInJakarta()) {
    return { error: "Tanggal donasi tidak valid atau melewati hari ini." };
  }

  if (evidence) {
    const validationError = validateUpload(BUCKETS.donationEvidence, evidence);

    if (validationError) {
      return { error: validationError };
    }
  }

  let evidencePath: string | null = null;

  if (evidence) {
    const upload = await uploadToBucket(
      BUCKETS.donationEvidence,
      `donations/${campaignId}`,
      evidence,
    );

    if ("error" in upload) {
      return { error: upload.error };
    }

    evidencePath = upload.path;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hog_admin_record_donation", {
    p_campaign_id: campaignId,
    p_full_name: fullName,
    p_amount_idr: amount,
    p_donated_on: donatedOn,
    p_evidence_path: evidencePath,
  });

  if (error || !data) {
    if (evidencePath) {
      await removeStorageObjects([
        { bucket: BUCKETS.donationEvidence, path: evidencePath },
      ]);
    }

    return { error: toFriendlyError(error?.message, "Donasi gagal dicatat.") };
  }

  revalidateDonationSurfaces();
  redirect(
    `/admin/donasi/${data}${encodeNotice({ success: "Donasi berhasil dicatat dan langsung masuk ke rekap." })}`,
  );
}

export async function updateDonation(
  donationId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const campaignId = readText(formData, "campaign_id");
  const fullName = readText(formData, "full_name");
  const amount = readAmount(formData, "amount_idr");
  const donatedOn = readText(formData, "donated_on");

  if (!campaignId) {
    return { error: "Pilih program tujuan donasi." };
  }

  if (!fullName) {
    return { error: "Nama lengkap donatur wajib diisi." };
  }

  if (!amount) {
    return { error: "Nominal donasi wajib lebih dari nol." };
  }

  if (!isValidDate(donatedOn) || donatedOn > todayInJakarta()) {
    return { error: "Tanggal donasi tidak valid atau melewati hari ini." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("hog_admin_update_donation", {
    p_donation_id: donationId,
    p_campaign_id: campaignId,
    p_full_name: fullName,
    p_amount_idr: amount,
    p_donated_on: donatedOn,
  });

  if (error) {
    return {
      error: toFriendlyError(error.message, "Perubahan donasi gagal disimpan."),
    };
  }

  revalidateDonationSurfaces();
  revalidatePath(`/admin/donasi/${donationId}`);

  return { success: "Perubahan donasi tersimpan." };
}

export async function deleteDonations(formData: FormData) {
  await requireAdmin();
  const donationIds = Array.from(
    new Set(
      formData
        .getAll("donation_id")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (donationIds.length === 0) {
    redirect(
      `/admin/donasi${encodeNotice({ error: "Pilih minimal satu donasi untuk dihapus." })}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hog_admin_delete_donations", {
    p_donation_ids: donationIds,
  });

  if (error) {
    redirect(
      `/admin/donasi${encodeNotice({
        error: toFriendlyError(error.message, "Donasi gagal dihapus."),
      })}`,
    );
  }

  if (!data) {
    redirect(
      `/admin/donasi${encodeNotice({
        error:
          "Donasi gagal dihapus: RPC tidak mengembalikan data. Pastikan migrasi 12_donation_crud.sql sudah dijalankan.",
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

  revalidateDonationSurfaces();

  const summary = `${formatNumber(data.deleted_donation_count)} donasi dihapus permanen.`;

  if ("error" in cleanup) {
    redirect(
      `/admin/donasi${encodeNotice({
        error: `${summary} Sebagian berkas bukti masih tertinggal di penyimpanan dan perlu dibersihkan manual.`,
      })}`,
    );
  }

  redirect(`/admin/donasi${encodeNotice({ success: summary })}`);
}
