"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  encodeNotice,
  readOptionalText,
  readText,
  toFriendlyError,
} from "@/lib/admin/form";
import {
  BUCKETS,
  isReportBucket,
  isUploadPresent,
  moveReportObject,
  removeStorageObjects,
  uploadToBucket,
} from "@/lib/admin/storage";
import type { ReportBucketName } from "@/lib/admin/storage";
import type { ReportKind } from "@/lib/supabase/database.types";

function revalidateReportSurfaces(campaignId?: string | null) {
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
  revalidatePath("/riwayat-donasi");
  revalidatePath("/program");

  if (campaignId) {
    revalidatePath("/program/[slug]", "page");
  }
}

export async function createReport(formData: FormData) {
  const admin = await requireAdmin();
  const title = readText(formData, "title");
  const kind = (readText(formData, "kind") || "campaign") as ReportKind;
  const campaignId = readOptionalText(formData, "campaign_id");
  const externalUrl = readOptionalText(formData, "external_url");
  const file = formData.get("report");

  if (!title) {
    redirect(`/admin/laporan${encodeNotice({ error: "Judul laporan wajib diisi." })}`);
  }

  if (!(["campaign", "periodic"] as ReportKind[]).includes(kind)) {
    redirect(`/admin/laporan${encodeNotice({ error: "Jenis laporan tidak valid." })}`);
  }

  if (kind === "campaign" && !campaignId) {
    redirect(`/admin/laporan${encodeNotice({ error: "Laporan proyek wajib memilih proyek." })}`);
  }

  if (!externalUrl && !isUploadPresent(file)) {
    redirect(`/admin/laporan${encodeNotice({ error: "Tambahkan berkas PDF atau tautan eksternal." })}`);
  }

  let storagePath: string | null = null;

  if (isUploadPresent(file)) {
    const upload = await uploadToBucket(BUCKETS.privateReports, campaignId ? `campaigns/${campaignId}` : "periodic", file);

    if ("error" in upload) {
      redirect(`/admin/laporan${encodeNotice({ error: upload.error })}`);
    }

    storagePath = upload.path;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_reports").insert({
    kind,
    campaign_id: kind === "campaign" ? campaignId : null,
    title,
    storage_bucket: BUCKETS.privateReports,
    storage_path: storagePath,
    external_url: externalUrl,
    period_label: readOptionalText(formData, "period_label"),
    created_by: admin.userId,
    updated_by: admin.userId,
  });

  if (error) {
    if (storagePath) {
      await removeStorageObjects([{ bucket: BUCKETS.privateReports, path: storagePath }]);
    }

    redirect(
      `/admin/laporan${encodeNotice({
        error: toFriendlyError(error.message, "Laporan gagal disimpan."),
      })}`,
    );
  }

  revalidateReportSurfaces(campaignId);
  redirect(`/admin/laporan${encodeNotice({ success: "Laporan berhasil dibuat." })}`);
}

type ManagedReportObject = { bucket: ReportBucketName; path: string };

type StoredReport = {
  storage_bucket: string;
  storage_path: string | null;
};

function ownedObject(report: StoredReport): ManagedReportObject | null {
  return report.storage_path && isReportBucket(report.storage_bucket)
    ? { bucket: report.storage_bucket, path: report.storage_path }
    : null;
}

async function loadReport(reportId: string): Promise<StoredReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_admin_reports")
    .select("storage_bucket,storage_path")
    .eq("id", reportId)
    .maybeSingle();

  return error ? null : data;
}

async function relocateReport(
  reportId: string,
  adminId: string,
  destinationBucket: ReportBucketName,
  publishedAt: string | null,
  fallbackMessage: string,
): Promise<string | null> {
  const report = await loadReport(reportId);

  if (!report) {
    return "Laporan tidak ditemukan.";
  }

  const source = ownedObject(report);
  const moved =
    source && source.bucket !== destinationBucket
      ? await moveReportObject(source.bucket, source.path, destinationBucket)
      : null;

  if (moved && "error" in moved) {
    if (moved.destinationPath) {
      const cleanup = await removeStorageObjects([
        { bucket: destinationBucket, path: moved.destinationPath },
      ]);

      if ("error" in cleanup) {
        return `${moved.error} Salinan tujuan juga gagal dibersihkan.`;
      }
    }

    return moved.error;
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("hog_admin_reports")
    .update({
      published_at: publishedAt,
      updated_by: adminId,
      ...(moved ? { storage_bucket: destinationBucket, storage_path: moved.path } : {}),
    })
    .eq("id", reportId)
    .select("id")
    .maybeSingle();

  if (!error && updated) {
    return null;
  }

  if (moved && source) {
    const reverted = await moveReportObject(destinationBucket, moved.path, source.bucket, source.path);

    if ("error" in reverted) {
      const cleanup = await removeStorageObjects([
        { bucket: destinationBucket, path: moved.path },
      ]);
      const detail = "error" in cleanup
        ? " Pemindahan balik dan pembersihan berkas tujuan juga gagal."
        : " Berkas tujuan sudah dibersihkan setelah pemindahan balik gagal.";

      return `${toFriendlyError(error?.message, fallbackMessage)}${detail}`;
    }
  }

  return toFriendlyError(error?.message, fallbackMessage);
}

export async function publishReport(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = readText(formData, "report_id");
  const campaignId = readOptionalText(formData, "campaign_id");

  const failure = await relocateReport(
    reportId,
    admin.userId,
    BUCKETS.publicReports,
    new Date().toISOString(),
    "Laporan gagal dipublikasikan.",
  );

  if (failure) {
    redirect(`/admin/laporan${encodeNotice({ error: failure })}`);
  }

  revalidateReportSurfaces(campaignId);
  redirect(`/admin/laporan${encodeNotice({ success: "Laporan dipublikasikan." })}`);
}

export async function unpublishReport(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = readText(formData, "report_id");
  const campaignId = readOptionalText(formData, "campaign_id");

  const failure = await relocateReport(
    reportId,
    admin.userId,
    BUCKETS.privateReports,
    null,
    "Laporan gagal ditarik dari publik.",
  );

  if (failure) {
    redirect(`/admin/laporan${encodeNotice({ error: failure })}`);
  }

  revalidateReportSurfaces(campaignId);
  redirect(`/admin/laporan${encodeNotice({ success: "Laporan ditarik dari publik." })}`);
}

export async function deleteReport(formData: FormData) {
  await requireAdmin();
  const reportId = readText(formData, "report_id");
  const campaignId = readOptionalText(formData, "campaign_id");

  const report = await loadReport(reportId);

  if (!report) {
    redirect(`/admin/laporan${encodeNotice({ error: "Laporan tidak ditemukan." })}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_reports").delete().eq("id", reportId);

  if (error) {
    redirect(
      `/admin/laporan${encodeNotice({
        error: toFriendlyError(error.message, "Laporan gagal dihapus."),
      })}`,
    );
  }

  const object = ownedObject(report);
  const cleanup = object ? await removeStorageObjects([object]) : { success: true as const };

  revalidateReportSurfaces(campaignId);

  if ("error" in cleanup) {
    redirect(
      `/admin/laporan${encodeNotice({
        error: "Laporan dihapus, tetapi berkas di penyimpanan gagal dihapus. Periksa Storage secara manual.",
      })}`,
    );
  }

  redirect(`/admin/laporan${encodeNotice({ success: "Laporan dihapus." })}`);
}
