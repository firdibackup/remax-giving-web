"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateMediaAsset } from "@/app/admin/(protected)/konten/actions";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MediaAssetRow } from "@/lib/supabase/database.types";

function MediaEditor({ media }: { media: MediaAssetRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = media.find((item) => item.id === selectedId);

  if (!selected) {
    return (
      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="p-5 sm:p-6">
          <p className="text-sm text-brand-text-body">Pilih media pada daftar untuk mengubah metadata.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {media.map((item) => <Button key={item.id} variant="outline" onClick={() => setSelectedId(item.id)}><Pencil className="size-3.5" />{item.caption || item.alt_text || item.id.slice(0, 8)}</Button>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
      <CardHeader className="flex-row items-center justify-between border-b border-brand-border px-5 py-5 sm:px-6"><CardTitle className="font-bold text-brand-navy">Ubah metadata media</CardTitle><Button variant="outline" onClick={() => setSelectedId(null)}><X className="size-4" />Batal</Button></CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form action={updateMediaAsset} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" name="media_id" value={selected.id} />
          <FormField label="Keterangan" htmlFor="edit_caption"><Input id="edit_caption" name="caption" defaultValue={selected.caption || ""} /></FormField>
          <FormField label="Teks alternatif" htmlFor="edit_alt_text"><Input id="edit_alt_text" name="alt_text" defaultValue={selected.alt_text || ""} /></FormField>
          <FormField label="Album" htmlFor="edit_album"><Input id="edit_album" name="album_label" defaultValue={selected.album_label || ""} /></FormField>
          <FormField label="Lokasi" htmlFor="edit_location"><Input id="edit_location" name="location_label" defaultValue={selected.location_label || ""} /></FormField>
          <FormField label="Tanggal dokumentasi" htmlFor="edit_captured"><Input id="edit_captured" name="captured_on" type="date" defaultValue={selected.captured_on || ""} /></FormField>
          <FormField label="Bentang" htmlFor="edit_span"><Select id="edit_span" name="layout_span" defaultValue={selected.layout_span}><option value="normal">Normal</option><option value="wide">Lebar</option><option value="tall">Tinggi</option></Select></FormField>
          <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm font-semibold text-brand-navy md:col-span-2"><input type="checkbox" name="is_published" defaultChecked={selected.is_published} className="size-4 accent-brand-blue" />Tampilkan di galeri publik</label>
          <div className="md:col-span-2"><SubmitButton className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Simpan metadata</SubmitButton></div>
        </form>
      </CardContent>
    </Card>
  );
}

export { MediaEditor };
