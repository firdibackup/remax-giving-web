"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { bulkUpdateCampaignMedia } from "@/app/admin/(protected)/proyek/actions";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/supabase/database.types";

export type CampaignDocumentationItem = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  altText: string | null;
  albumLabel: string | null;
  mediaType: MediaType;
};

function CampaignDocumentationEditor({
  campaignId,
  items,
}: {
  campaignId: string;
  items: CampaignDocumentationItem[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [album, setAlbum] = useState("");
  const [alt, setAlt] = useState("");
  const headerRef = useRef<HTMLInputElement>(null);

  const allChecked = items.length > 0 && selected.size === items.length;
  const someChecked = selected.size > 0 && !allChecked;

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const canApply =
    selected.size > 0 &&
    (caption.trim() !== "" || album.trim() !== "" || alt.trim() !== "");

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-brand-navy">
            Dokumentasi tersimpan ({formatNumber(items.length)})
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-navy">
            <input
              ref={headerRef}
              type="checkbox"
              className="size-4 accent-brand-blue"
              checked={allChecked}
              onChange={toggleAll}
              aria-label="Pilih semua dokumentasi"
            />
            Pilih semua
          </label>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => {
            const checked = selected.has(item.id);
            return (
              <li key={item.id}>
                <label
                  className={cn(
                    "block cursor-pointer overflow-hidden rounded-xl bg-white ring-1 transition-shadow",
                    checked ? "ring-2 ring-brand-blue" : "ring-brand-border",
                  )}
                >
                  <span className="relative block h-28 w-full bg-brand-tint-blue">
                    {item.thumbUrl && item.mediaType === "image" ? (
                      <Image
                        src={item.thumbUrl}
                        alt={
                          item.altText || item.caption || "Dokumentasi proyek"
                        }
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-brand-text-body">
                        Video
                      </span>
                    )}
                    <span className="absolute top-2 left-2 rounded-md bg-white/95 p-1 shadow">
                      <input
                        type="checkbox"
                        className="block size-4 accent-brand-blue"
                        checked={checked}
                        onChange={() => toggle(item.id)}
                        aria-label={`Pilih ${item.caption || "dokumentasi"}`}
                      />
                    </span>
                  </span>
                  <span className="block truncate px-2.5 py-2 text-xs font-semibold text-brand-navy">
                    {item.caption || "Tanpa keterangan"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <form
        action={bulkUpdateCampaignMedia}
        className="space-y-4 rounded-xl border border-brand-border bg-brand-bg-soft p-4 sm:p-5"
      >
        <input type="hidden" name="campaign_id" value={campaignId} />
        {Array.from(selected).map((id) => (
          <input key={id} type="hidden" name="media_id" value={id} />
        ))}
        <p className="text-sm font-bold text-brand-navy">
          Ubah Keterangan Gambar
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Keterangan"
            htmlFor="bulk_caption"
            hint="Kosongkan bila tidak diubah."
          >
            <Input
              id="bulk_caption"
              name="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Serah terima bantuan"
            />
          </FormField>
          <FormField
            label="Album"
            htmlFor="bulk_album"
            hint="Kosongkan bila tidak diubah."
          >
            <Input
              id="bulk_album"
              name="album_label"
              value={album}
              onChange={(event) => setAlbum(event.target.value)}
              placeholder="Nama album galeri"
            />
          </FormField>
          <FormField
            label="Teks alternatif"
            htmlFor="bulk_alt"
            hint="Kosongkan bila tidak diubah."
          >
            <Input
              id="bulk_alt"
              name="alt_text"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Deskripsi singkat gambar"
            />
          </FormField>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-brand-text-body">
            {selected.size > 0
              ? `Berlaku untuk ${formatNumber(selected.size)} gambar terpilih.`
              : "Pilih minimal satu gambar di atas."}
          </p>
          <SubmitButton
            disabled={!canApply}
            pendingLabel="Menerapkan..."
            className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
          >
            {selected.size > 0
              ? `Terapkan ke ${formatNumber(selected.size)} gambar`
              : "Terapkan"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

export { CampaignDocumentationEditor };
