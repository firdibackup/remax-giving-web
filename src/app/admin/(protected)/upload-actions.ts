"use server";

import { bucketLimits, uploadChunkBytes } from "@/lib/admin/buckets";
import { readText } from "@/lib/admin/form";
import { isManagedBucket, safeExtension } from "@/lib/admin/storage";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type UploadChunkResult = { path?: string; error?: string };

const uploadIdPattern = /^[0-9a-f-]{36}$/;
const folderPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/i;

// Files reach Storage through the server, one chunk per request: the browser
// cannot call Supabase itself (its HTTP endpoint is blocked as mixed content
// on the HTTPS site) and the remax.co.id proxy may reject bodies over 1 MB.
// Chunks wait under tmp/<upload_id>/ until the last one arrives, then the
// file is assembled at <folder>/<random>.<ext> and that path is returned.
export async function uploadChunk(formData: FormData): Promise<UploadChunkResult> {
  await requireAdmin();

  const bucket = readText(formData, "bucket");
  const folder = readText(formData, "folder");
  const uploadId = readText(formData, "upload_id");
  const type = readText(formData, "type");
  const index = Number(readText(formData, "index"));
  const total = Number(readText(formData, "total"));
  const chunk = formData.get("chunk");

  if (
    !isManagedBucket(bucket) ||
    !folderPattern.test(folder) ||
    !uploadIdPattern.test(uploadId) ||
    !(chunk instanceof Blob) ||
    chunk.size > uploadChunkBytes ||
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    index < 0 ||
    index >= total
  ) {
    return { error: "Unggahan tidak valid." };
  }

  const limits = bucketLimits[bucket];

  if (!limits.mimeTypes.includes(type)) {
    return { error: "Tipe berkas tidak diizinkan untuk penyimpanan ini." };
  }

  if (total > Math.ceil(limits.maxBytes / uploadChunkBytes)) {
    return {
      error: `Ukuran berkas melebihi batas ${Math.floor(limits.maxBytes / 1_048_576)} MB.`,
    };
  }

  const storage = (await createClient()).storage.from(bucket);
  const partPaths = Array.from({ length: total - 1 }, (_, i) => `tmp/${uploadId}/${i}`);

  if (index < total - 1) {
    const { error } = await storage.upload(partPaths[index], chunk, {
      contentType: type,
      upsert: true,
    });

    return error ? { error: "Potongan berkas gagal diunggah." } : {};
  }

  // ponytail: parts of an abandoned upload stay under tmp/; add a sweep if they pile up.
  const parts = await Promise.all(partPaths.map((partPath) => storage.download(partPath)));
  const cleanup = async () => {
    if (partPaths.length > 0) {
      await storage.remove(partPaths);
    }
  };

  if (parts.some(({ data }) => !data)) {
    await cleanup();
    return { error: "Potongan berkas tidak lengkap. Unggah ulang." };
  }

  const file = new Blob([...parts.map(({ data }) => data as Blob), chunk], { type });
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${safeExtension(readText(formData, "name"))}`;
  const { error } = await storage.upload(path, file, { contentType: type, upsert: false });
  await cleanup();

  return error ? { error: "Berkas gagal diunggah ke penyimpanan." } : { path };
}
