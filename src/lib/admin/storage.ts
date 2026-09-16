import "server-only";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const BUCKETS = {
  publicMedia: "home-of-giving-public-media",
  publicReports: "home-of-giving-public-reports",
  privateReports: "home-of-giving-private-reports",
  donationEvidence: "home-of-giving-private-donation-evidence",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
export type ReportBucketName = typeof BUCKETS.publicReports | typeof BUCKETS.privateReports;

export const MANAGED_BUCKETS: BucketName[] = Object.values(BUCKETS);
export const REPORT_BUCKETS: ReportBucketName[] = [BUCKETS.publicReports, BUCKETS.privateReports];

const bucketLimits: Record<BucketName, { maxBytes: number; mimeTypes: string[] }> = {
  [BUCKETS.publicMedia]: {
    maxBytes: 26_214_400,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"],
  },
  [BUCKETS.publicReports]: {
    maxBytes: 26_214_400,
    mimeTypes: ["application/pdf"],
  },
  [BUCKETS.privateReports]: {
    maxBytes: 26_214_400,
    mimeTypes: ["application/pdf"],
  },
  [BUCKETS.donationEvidence]: {
    maxBytes: 10_485_760,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
};

export function isManagedBucket(bucket: string | null | undefined): bucket is BucketName {
  return MANAGED_BUCKETS.includes(bucket as BucketName);
}

export function isReportBucket(bucket: string | null | undefined): bucket is ReportBucketName {
  return REPORT_BUCKETS.includes(bucket as ReportBucketName);
}

function safeExtension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]{1,8})$/.exec(fileName);
  return match ? match[1].toLowerCase() : "bin";
}

function baseMimeType(value: string): string {
  return value.split(";")[0].trim().toLowerCase();
}

function collisionSafePath(sourcePath: string): string {
  const separator = sourcePath.lastIndexOf("/");
  const folder = separator > 0 ? sourcePath.slice(0, separator + 1) : "";

  return `${folder}${Date.now()}-${crypto.randomUUID()}.${safeExtension(sourcePath)}`;
}

export function isUploadPresent(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}

export function validateUpload(bucket: BucketName, file: File): string | null {
  const limits = bucketLimits[bucket];

  if (file.size > limits.maxBytes) {
    const maxMb = Math.floor(limits.maxBytes / 1_048_576);
    return `Ukuran berkas melebihi batas ${maxMb} MB.`;
  }

  if (!file.type || !limits.mimeTypes.includes(file.type)) {
    return "Tipe berkas tidak diizinkan untuk penyimpanan ini.";
  }

  return null;
}

export async function uploadToBucket(
  bucket: BucketName,
  folder: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  await requireAdmin();

  const validationError = validateUpload(bucket, file);

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "umum";
  const path = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${safeExtension(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { error: "Berkas gagal diunggah ke penyimpanan." };
  }

  return { path };
}

export type RemoveStorageObjectsResult = { success: true } | { error: string };

export async function removeStorageObjects(
  objects: Array<{ bucket: BucketName; path: string }>,
): Promise<RemoveStorageObjectsResult> {
  if (objects.length === 0) {
    return { success: true };
  }

  await requireAdmin();
  const supabase = await createClient();
  const pathsByBucket = new Map<BucketName, string[]>();

  for (const object of objects) {
    const paths = pathsByBucket.get(object.bucket) || [];
    paths.push(object.path);
    pathsByBucket.set(object.bucket, paths);
  }

  const results = await Promise.all(
    Array.from(pathsByBucket, ([bucket, paths]) => supabase.storage.from(bucket).remove(paths)),
  );

  return results.some(({ error }) => error)
    ? { error: "Berkas gagal dihapus dari penyimpanan." }
    : { success: true };
}

export type MoveReportObjectResult =
  | { path: string }
  | { error: string; destinationPath: string | null };

export async function moveReportObject(
  sourceBucket: ReportBucketName,
  sourcePath: string,
  destinationBucket: ReportBucketName,
  destinationPath = collisionSafePath(sourcePath),
): Promise<MoveReportObjectResult> {
  await requireAdmin();

  if (sourceBucket === destinationBucket) {
    return { path: sourcePath };
  }

  const supabase = await createClient();
  const { data: file, error: downloadError } = await supabase.storage
    .from(sourceBucket)
    .download(sourcePath);

  if (downloadError || !file) {
    return { error: "Berkas laporan gagal dibaca dari penyimpanan.", destinationPath: null };
  }

  const limits = bucketLimits[destinationBucket];

  if (file.size > limits.maxBytes) {
    const maxMb = Math.floor(limits.maxBytes / 1_048_576);
    return { error: `Ukuran berkas melebihi batas ${maxMb} MB.`, destinationPath: null };
  }

  if (!file.type || !limits.mimeTypes.includes(baseMimeType(file.type))) {
    return { error: "Tipe berkas tidak diizinkan untuk penyimpanan ini.", destinationPath: null };
  }

  const { error: uploadError } = await supabase.storage
    .from(destinationBucket)
    .upload(destinationPath, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return {
      error: "Berkas laporan gagal dipindahkan ke penyimpanan tujuan.",
      destinationPath: null,
    };
  }

  const { error: removeError } = await supabase.storage.from(sourceBucket).remove([sourcePath]);

  if (removeError) {
    return {
      error: "Berkas laporan tersalin, tetapi berkas asal gagal dihapus.",
      destinationPath,
    };
  }

  return { path: destinationPath };
}

export async function createSignedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);

  return error ? null : data?.signedUrl ?? null;
}

export function publicStorageUrl(bucket: string | null, path: string | null): string | null {
  if (!bucket || !path) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!base) {
    return null;
  }

  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}

export function resolveMediaUrl(
  externalUrl: string | null,
  bucket: string | null,
  path: string | null,
): string | null {
  return externalUrl || publicStorageUrl(bucket, path);
}
