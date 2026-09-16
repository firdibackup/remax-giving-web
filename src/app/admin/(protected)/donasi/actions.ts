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
  isUploadPresent,
  removeStorageObjects,
  uploadToBucket,
  validateUpload,
} from "@/lib/admin/storage";
import { todayInJakarta } from "@/lib/format";

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
    return { error: "Pilih proyek tujuan donasi." };
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
    const upload = await uploadToBucket(BUCKETS.donationEvidence, `donations/${campaignId}`, evidence);

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
      await removeStorageObjects([{ bucket: BUCKETS.donationEvidence, path: evidencePath }]);
    }

    return { error: toFriendlyError(error?.message, "Donasi gagal dicatat.") };
  }

  revalidateDonationSurfaces();
  redirect(`/admin/donasi/${data}${encodeNotice({ success: "Donasi berhasil dicatat dan langsung masuk ke rekap." })}`);
}
