import { ExternalLink, Trash2 } from "lucide-react";
import { deleteMediaAsset, uploadMediaAsset } from "@/app/admin/(protected)/konten/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FormField } from "@/components/admin/form-field";
import { MediaEditor } from "@/components/admin/media-editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/admin/storage";
import { formatShortDate } from "@/lib/format";
import { listMediaAssets } from "@/lib/admin/queries";

export default async function AdminMediaPage({ searchParams }: PageProps<"/admin/konten/media">) {
  const notice = await searchParams;
  const media = await listMediaAssets();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Media" description="Kelola aset gambar dan video untuk sampul, galeri, dokumentasi, dan serah terima." />
      <AdminNotice error={notice.error} success={notice.success} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6"><CardTitle className="font-bold text-brand-navy">Unggah media</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={uploadMediaAsset} className="grid gap-5 md:grid-cols-2">
            <FormField label="Berkas" htmlFor="media" required><Input id="media" name="media" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" required /></FormField>
            <FormField label="Keterangan" htmlFor="caption"><Input id="caption" name="caption" /></FormField>
            <FormField label="Teks alternatif" htmlFor="alt_text"><Input id="alt_text" name="alt_text" /></FormField>
            <FormField label="Album" htmlFor="album_label"><Input id="album_label" name="album_label" /></FormField>
            <FormField label="Lokasi" htmlFor="location_label"><Input id="location_label" name="location_label" /></FormField>
            <FormField label="Tanggal dokumentasi" htmlFor="captured_on"><Input id="captured_on" name="captured_on" type="date" /></FormField>
            <FormField label="Bentang galeri" htmlFor="layout_span"><Select id="layout_span" name="layout_span" defaultValue="normal"><option value="normal">Normal</option><option value="wide">Lebar</option><option value="tall">Tinggi</option></Select></FormField>
            <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm font-semibold text-brand-navy md:self-end"><input type="checkbox" name="is_published" className="size-4 accent-brand-blue" />Tampilkan di galeri publik</label>
            <div className="md:col-span-2"><SubmitButton pendingLabel="Mengunggah..." className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Unggah media</SubmitButton></div>
          </form>
        </CardContent>
      </Card>

      <MediaEditor media={media} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6"><CardTitle className="font-bold text-brand-navy">Pustaka media</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto px-0">
          {media.length > 0 ? (
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase"><tr><th className="px-6 py-3 font-bold">Media</th><th className="px-4 py-3 font-bold">Album</th><th className="px-4 py-3 font-bold">Jenis</th><th className="px-4 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Aksi</th></tr></thead>
              <tbody className="divide-y divide-brand-border">
                {media.map((item) => {
                  const url = resolveMediaUrl(item.external_url, item.storage_bucket, item.storage_path);
                  return (
                    <tr key={item.id} className="hover:bg-brand-bg-soft/60">
                      <td className="px-6 py-4"><p className="font-bold text-brand-navy">{item.caption || item.alt_text || "Tanpa keterangan"}</p><p className="mt-1 text-xs text-brand-text-body">{formatShortDate(item.captured_on || item.created_at)}</p></td>
                      <td className="px-4 py-4 text-brand-text-body">{item.album_label || "-"}</td>
                      <td className="px-4 py-4 capitalize text-brand-text-body">{item.media_type}</td>
                      <td className="px-4 py-4"><Badge variant="outline" className={item.is_published ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-border bg-white text-brand-text-body"}>{item.is_published ? "Publik" : "Internal"}</Badge></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-2">{url && <Button asChild variant="outline" size="sm"><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Buka</a></Button>}<form action={deleteMediaAsset}><input type="hidden" name="media_id" value={item.id} /><ConfirmSubmitButton variant="ghost" confirmMessage="Hapus record media ini? Berkas Storage tidak akan otomatis terhapus."><Trash2 className="size-4" /></ConfirmSubmitButton></form></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div className="p-8 text-center text-sm text-brand-text-body">Belum ada media.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
