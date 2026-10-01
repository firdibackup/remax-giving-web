"use client";

import { useState, useTransition } from "react";
import {
  CircleAlert,
  CircleCheck,
  ImagePlus,
  LoaderCircle,
  X,
} from "lucide-react";
import { addCampaignMedia } from "@/app/admin/(protected)/program/actions";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Mirrors BUCKETS.publicMedia and the 5 MB check in program/actions.ts
// (lib/admin/storage.ts is server-only).
const bucket = "home-of-giving-public-media";
const acceptedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
];
const maxFileBytes = 5 * 1024 * 1024;

type UploadItem = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "done" | "failed" | "invalid";
  error?: string;
  path?: string;
};

const statusLabel: Record<UploadItem["status"], string> = {
  ready: "Siap diunggah",
  uploading: "Mengunggah...",
  done: "Terunggah",
  failed: "Gagal diunggah",
  invalid: "Tidak dapat diunggah",
};

function formatSize(bytes: number): string {
  return `${(bytes / 1_048_576).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

function rejectReason(file: File): string | undefined {
  if (!acceptedTypes.includes(file.type)) {
    return "Tipe berkas tidak didukung.";
  }

  if (file.size > maxFileBytes) {
    return `Ukuran ${formatSize(file.size)}, maksimal 5 MB.`;
  }

  return undefined;
}

function extension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]{1,8})$/.exec(fileName);
  return match ? match[1].toLowerCase() : "bin";
}

function DocumentationUploader({ campaignId }: { campaignId: string }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const uploadable = items.filter((item) => item.status !== "invalid");
  const hasFailed = items.some((item) => item.status === "failed");

  function addFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const added = Array.from(files, (file): UploadItem => {
      const error = rejectReason(file);
      return {
        id: crypto.randomUUID(),
        file,
        status: error ? "invalid" : "ready",
        error,
      };
    });

    setItems((prev) => [...prev, ...added]);
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(item: UploadItem) {
    if (item.path) {
      // Uploaded but not yet recorded, so nothing else points at it.
      void createClient().storage.from(bucket).remove([item.path]);
    }

    setItems((prev) => prev.filter((other) => other.id !== item.id));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const supabase = createClient();
      // ponytail: objects uploaded here are orphaned if the tab closes before
      // addCampaignMedia runs; add a storage sweep if that ever piles up.
      const results = await Promise.all(
        uploadable.map(async (item) => {
          if (item.status === "done" && item.path) {
            return item.path;
          }

          const path = `campaigns/${campaignId}/${Date.now()}-${crypto.randomUUID()}.${extension(item.file.name)}`;
          updateItem(item.id, { status: "uploading", error: undefined });
          const { error } = await supabase.storage
            .from(bucket)
            .upload(path, item.file, {
              contentType: item.file.type,
              upsert: false,
            });

          if (error) {
            updateItem(item.id, {
              status: "failed",
              error: "Gagal diunggah. Periksa koneksi lalu coba lagi.",
            });
            return null;
          }

          updateItem(item.id, { status: "done", path });
          return path;
        }),
      );

      if (results.some((path) => path === null)) {
        return;
      }

      for (const path of results) {
        formData.append("storage_path", path as string);
      }

      setItems([]);
      await addCampaignMedia(formData);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-t border-brand-border pt-5"
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <p className="text-sm font-bold text-brand-navy">Tambah dokumentasi</p>

      <div className="space-y-2">
        <label
          htmlFor="documentation_files"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);

            if (!isPending) {
              addFiles(event.dataTransfer.files);
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-brand-border bg-brand-bg-soft px-4 py-8 text-center transition-colors duration-150 ease-out hover:border-brand-blue/60 has-[:focus-visible]:border-brand-blue has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-blue/15",
            dragging && "border-brand-blue bg-brand-tint-blue",
            isPending && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="mb-1 size-8 text-brand-blue" aria-hidden />
          <span className="text-sm font-bold text-brand-navy">
            Seret dan lepas berkas ke sini
          </span>
          <span className="text-sm text-brand-text-body">
            atau{" "}
            <span className="font-bold text-brand-blue underline underline-offset-2">
              pilih dari perangkat
            </span>
          </span>
          <input
            id="documentation_files"
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            disabled={isPending}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <p className="text-xs leading-5 text-brand-text-body">
          JPG, PNG, WebP, AVIF, atau MP4. Maksimal 5 MB per berkas, boleh banyak
          sekaligus. Keterangan, album, dan teks alternatif di bawah berlaku
          untuk semua berkas.
        </p>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-brand-border rounded-xl border border-brand-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              {item.status === "uploading" ? (
                <LoaderCircle
                  className="size-4 shrink-0 animate-spin text-brand-blue"
                  aria-hidden
                />
              ) : item.status === "done" ? (
                <CircleCheck
                  className="size-4 shrink-0 text-brand-blue"
                  aria-hidden
                />
              ) : item.status === "failed" || item.status === "invalid" ? (
                <CircleAlert
                  className="size-4 shrink-0 text-brand-red"
                  aria-hidden
                />
              ) : (
                <span
                  className="size-4 shrink-0 rounded-full border-2 border-brand-border"
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-navy">
                  {item.file.name}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    item.error ? "text-brand-red" : "text-brand-text-body",
                  )}
                >
                  {formatSize(item.file.size)} · {item.error ?? statusLabel[item.status]}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => removeItem(item)}
                aria-label={`Hapus ${item.file.name} dari daftar`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FormField label="Keterangan" htmlFor="caption">
        <Input id="caption" name="caption" placeholder="Serah terima bantuan" />
      </FormField>
      <FormField label="Album" htmlFor="album_label">
        <Input
          id="album_label"
          name="album_label"
          placeholder="Nama album galeri"
        />
      </FormField>
      <FormField label="Teks alternatif" htmlFor="media_alt_text">
        <Input
          id="media_alt_text"
          name="alt_text"
          placeholder="Deskripsi singkat gambar"
        />
      </FormField>

      {hasFailed && !isPending && (
        <p className="text-sm text-brand-red" role="alert">
          Sebagian berkas gagal diunggah. Tekan tombol di bawah untuk mencoba
          lagi, atau hapus berkas tersebut dari daftar.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || uploadable.length === 0}
        className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
      >
        {isPending && <LoaderCircle className="size-4 animate-spin" />}
        {isPending
          ? "Mengunggah..."
          : uploadable.length > 0
            ? `Unggah ${formatNumber(uploadable.length)} berkas`
            : "Tambah dokumentasi"}
      </Button>
    </form>
  );
}

export { DocumentationUploader };
