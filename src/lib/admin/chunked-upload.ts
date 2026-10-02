import { uploadChunk } from "@/app/admin/(protected)/upload-actions";
import { uploadChunkBytes, type BucketName } from "@/lib/admin/buckets";

export async function uploadInChunks(
  file: File,
  bucket: BucketName,
  folder: string,
  onProgress?: (fraction: number) => void,
): Promise<{ path: string } | { error: string }> {
  const uploadId = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / uploadChunkBytes));

  // ponytail: one chunk per request, in order (Next.js runs server actions
  // one at a time anyway); move to a route handler if large videos feel slow.
  for (let index = 0; index < total; index++) {
    const formData = new FormData();
    formData.set("bucket", bucket);
    formData.set("folder", folder);
    formData.set("upload_id", uploadId);
    formData.set("name", file.name);
    formData.set("type", file.type);
    formData.set("index", String(index));
    formData.set("total", String(total));
    formData.set(
      "chunk",
      file.slice(index * uploadChunkBytes, (index + 1) * uploadChunkBytes),
    );

    const result = await uploadChunk(formData).catch(() => ({
      error: "Koneksi terputus saat mengunggah. Coba lagi.",
      path: undefined,
    }));

    if (result.error) {
      return { error: result.error };
    }

    onProgress?.((index + 1) / total);

    if (result.path) {
      return { path: result.path };
    }
  }

  return { error: "Berkas gagal diunggah." };
}
