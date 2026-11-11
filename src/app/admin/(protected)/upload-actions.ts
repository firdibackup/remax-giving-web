"use server";

import { BUCKETS, bucketLimits, uploadChunkBytes } from "@/lib/admin/buckets";
import { optimizePublicImage } from "@/lib/admin/optimize-image";
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
    chunk.size === 0 ||
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

  // storage-js ignores the contentType option for Blob bodies and sends the
  // Blob's own type, and a sliced chunk arrives as application/octet-stream,
  // which the bucket's MIME allow-list rejects. Re-type it with the checked type.
  if (index < total - 1) {
    const { error } = await storage.upload(partPaths[index], new Blob([chunk], { type }), {
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
  const stem = `${Date.now()}-${crypto.randomUUID()}`;
  const extension = safeExtension(readText(formData, "name"));
  try {
    if (file.size > limits.maxBytes) {
      return { error: "Ukuran berkas melebihi batas penyimpanan." };
    }

    if (bucket === BUCKETS.publicMedia && type.startsWith("image/")) {
      const optimized = await optimizePublicImage(Buffer.from(await file.arrayBuffer()));
      if (optimized) {
        // shortcut: originals are retained for recovery; add a retention policy when storage grows.
        const original = await storage.upload(`${folder}/originals/${stem}.${extension}`, file, { upsert: false });
        if (original.error) return { error: "Berkas asli gagal disimpan. Coba lagi." };

        const path = `${folder}/${stem}.webp`;
        const { error } = await storage.upload(path, optimized, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
        return error ? { error: "Gambar teroptimasi gagal disimpan. Coba lagi." } : { path };
      }
    }

    const path = `${folder}/${stem}.${extension}`;
    const { error } = await storage.upload(path, file, { upsert: false });
    return error ? { error: "Berkas gagal diunggah ke penyimpanan." } : { path };
  } catch {
    return { error: "Berkas gagal diproses. Gunakan gambar valid maksimal 50 megapiksel, lalu coba lagi." };
  } finally {
    await cleanup();
  }
}
