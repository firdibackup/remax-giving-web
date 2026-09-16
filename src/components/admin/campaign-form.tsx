"use client";

import { useActionState } from "react";
import { createCampaign, updateCampaign } from "@/app/admin/(protected)/proyek/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignRow } from "@/lib/supabase/database.types";

function CampaignForm({
  campaign,
}: {
  campaign?: CampaignRow;
}) {
  const action = campaign ? updateCampaign.bind(null, campaign.id) : createCampaign;
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <AdminNotice error={state.error} success={state.success} />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Judul proyek" htmlFor="title" required>
          <Input id="title" name="title" defaultValue={campaign?.title} required />
        </FormField>
        <FormField label="Slug" htmlFor="slug" hint="Kosongkan untuk dibuat otomatis dari judul.">
          <Input id="slug" name="slug" defaultValue={campaign?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        </FormField>
        <FormField label="Nama penerima manfaat" htmlFor="beneficiary_name" hint="Wajib saat proyek ditampilkan ke publik.">
          <Input id="beneficiary_name" name="beneficiary_name" defaultValue={campaign?.beneficiary_name || ""} />
        </FormField>
        <FormField label="Lokasi penerima manfaat" htmlFor="beneficiary_location" hint="Opsional, misalnya kota atau wilayah.">
          <Input id="beneficiary_location" name="beneficiary_location" defaultValue={campaign?.beneficiary_location || ""} />
        </FormField>
        <FormField label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={campaign?.status || "draft"} required>
            <option value="draft">Draf</option>
            <option value="scheduled">Terjadwal</option>
            <option value="running">Berjalan</option>
            <option value="closed">Ditutup</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="archived">Diarsipkan</option>
            {campaign?.status === "disbursed" && <option value="disbursed">Selesai</option>}
            {campaign?.status === "reported" && <option value="reported">Laporan tersedia</option>}
          </Select>
        </FormField>
        <FormField label="Target donasi (Rp)" htmlFor="target_amount_idr" required>
          <Input id="target_amount_idr" name="target_amount_idr" type="number" min="1" step="1" defaultValue={campaign?.target_amount_idr} required />
        </FormField>
        <FormField label="Tanggal mulai" htmlFor="starts_on">
          <Input id="starts_on" name="starts_on" type="date" defaultValue={campaign?.starts_on || ""} />
        </FormField>
        <FormField label="Tanggal selesai" htmlFor="ends_on">
          <Input id="ends_on" name="ends_on" type="date" defaultValue={campaign?.ends_on || ""} />
        </FormField>
        <FormField label="Jumlah penerima" htmlFor="total_beneficiaries">
          <Input id="total_beneficiaries" name="total_beneficiaries" type="number" min="1" defaultValue={campaign?.total_beneficiaries || ""} />
        </FormField>
      </div>

      <FormField label="Ringkasan" htmlFor="summary">
        <Textarea id="summary" name="summary" rows={3} defaultValue={campaign?.summary || ""} />
      </FormField>
      <FormField label="Cerita proyek" htmlFor="story_paragraphs" hint="Pisahkan paragraf dengan satu baris kosong.">
        <Textarea id="story_paragraphs" name="story_paragraphs" rows={9} defaultValue={campaign?.story_paragraphs.join("\n\n") || ""} />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Kutipan" htmlFor="quote_text">
          <Textarea id="quote_text" name="quote_text" rows={3} defaultValue={campaign?.quote_text || ""} />
        </FormField>
        <FormField label="Nama pemberi kutipan" htmlFor="quote_author">
          <Input id="quote_author" name="quote_author" defaultValue={campaign?.quote_author || ""} />
        </FormField>
      </div>

      {!campaign && (
        <fieldset className="space-y-5 rounded-xl border border-brand-border bg-brand-bg-soft p-4 sm:p-5">
          <legend className="px-1 text-sm font-bold text-brand-navy">Media awal</legend>
          <p className="text-sm leading-6 text-brand-text-body">
            Opsional. Total seluruh berkas pada form ini maksimal 29 MB agar dapat dikirim dengan aman.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Sampul proyek" htmlFor="cover" hint="Satu JPG, PNG, WebP, AVIF, atau MP4. Maksimal 25 MB.">
              <Input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" />
            </FormField>
            <FormField label="Teks alternatif sampul" htmlFor="cover_alt_text">
              <Input id="cover_alt_text" name="cover_alt_text" placeholder="Deskripsi singkat sampul" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Berkas dokumentasi" htmlFor="documentation" hint="Satu JPG, PNG, WebP, AVIF, atau MP4. Maksimal 25 MB. Tambah lagi lewat halaman edit proyek.">
                <Input id="documentation" name="documentation" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" />
              </FormField>
            </div>
            <FormField label="Keterangan dokumentasi" htmlFor="documentation_caption">
              <Input id="documentation_caption" name="documentation_caption" placeholder="Serah terima bantuan" />
            </FormField>
            <FormField label="Album dokumentasi" htmlFor="documentation_album_label">
              <Input id="documentation_album_label" name="documentation_album_label" placeholder="Nama album galeri" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Teks alternatif dokumentasi" htmlFor="documentation_alt_text">
                <Input id="documentation_alt_text" name="documentation_alt_text" placeholder="Deskripsi singkat gambar" />
              </FormField>
            </div>
          </div>
        </fieldset>
      )}

      <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm font-semibold text-brand-navy">
        <input type="checkbox" name="is_featured" defaultChecked={campaign?.is_featured} className="size-4 accent-brand-blue" />
        Sorot di halaman utama
      </label>

      <FormField label="Catatan internal" htmlFor="internal_note">
        <Textarea id="internal_note" name="internal_note" rows={3} defaultValue={campaign?.internal_note || ""} />
      </FormField>

      <div className="flex justify-end border-t border-brand-border pt-5">
        <SubmitButton
          pendingLabel={campaign ? "Menyimpan..." : "Membuat proyek..."}
          className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
        >
          {campaign ? "Simpan perubahan" : "Buat proyek"}
        </SubmitButton>
      </div>
    </form>
  );
}

export { CampaignForm };
