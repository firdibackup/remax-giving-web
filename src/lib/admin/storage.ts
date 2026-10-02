import "server-only";

import { BUCKETS, bucketLimits, type BucketName } from "@/lib/admin/buckets";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export { BUCKETS, type BucketName };
export type ReportBucketName = typeof BUCKETS.publicReports | typeof BUCKETS.privateReports;

export const MANAGED_BUCKETS: BucketName[] = Object.values(BUCKETS);
export const REPORT_BUCKETS: ReportBucketName[] = [BUCKETS.publicReports, BUCKETS.privateReports];

export function isManagedBucket(bucket: string | null | undefined): bucket is BucketName {
  return MANAGED_BUCKETS.includes(bucket as BucketName);
}

export function isReportBucket(bucket: string | null | undefined): bucket is ReportBucketName {
  return REPORT_BUCKETS.includes(bucket as ReportBucketName);
}

export function safeExtension(fileName: string): string {
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

export type StagedUpload = { path: string; size: number; contentType: string };

// Forms submit the path that uploadChunk (admin/(protected)/upload-actions.ts)
// returned, not the file. Re-check it so a form can only attach an object from
// its own folder, within its own size and type limits.
export async function verifyStagedUpload(
  bucket: BucketName,
  folder: string,
  path: string,
  maxBytes = bucketLimits[bucket].maxBytes,
): Promise<StagedUpload | { error: string }> {
  await requireAdmin();

  const prefix = `${folder}/`;

  if (!path.startsWith(prefix) || !/^[\w-]+\.[a-z0-9]{1,8}$/.test(path.slice(prefix.length))) {
    return { error: "Lokasi berkas tidak valid." };
  }

  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).info(path);

  if (!data) {
    return { error: "Berkas tidak ditemukan di penyimpanan. Unggah ulang." };
  }

  const size = data.size ?? 0;
  const contentType = baseMimeType(data.contentType ?? "");
  const error =
    size > maxBytes
      ? `Ukuran berkas melebihi batas ${Math.floor(maxBytes / 1_048_576)} MB.`
      : !bucketLimits[bucket].mimeTypes.includes(contentType)
        ? "Tipe berkas tidak diizinkan untuk penyimpanan ini."
        : null;

  if (error) {
    await removeStorageObjects([{ bucket, path }]);
    return { error };
  }

  return { path, size, contentType };
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
