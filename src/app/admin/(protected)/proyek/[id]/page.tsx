import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  addCampaignMedia,
  deleteCampaigns,
  uploadCampaignCover,
} from "@/app/admin/(protected)/proyek/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { CampaignDocumentationEditor } from "@/components/admin/campaign-documentation-editor";
import { CampaignForm } from "@/components/admin/campaign-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/format";
import {
  getCampaign,
  getCampaignCoverMedia,
  getCampaignStats,
  listCampaignDocumentation,
} from "@/lib/admin/queries";
import { resolveMediaUrl } from "@/lib/admin/storage";
import { campaignStatusPresentation } from "@/lib/status";

export default async function CampaignDetailPage({ params, searchParams }: PageProps<"/admin/proyek/[id]">) {
  const { id } = await params;
  const notice = await searchParams;
  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  const [stats, cover, documentation] = await Promise.all([
    getCampaignStats(id),
    getCampaignCoverMedia(id),
    listCampaignDocumentation(id),
  ]);
  const coverUrl = cover
    ? resolveMediaUrl(cover.external_url, cover.storage_bucket, cover.storage_path)
    : null;
  const documentationItems = documentation.map((item) => ({
    id: item.id,
    thumbUrl: resolveMediaUrl(item.external_url, item.storage_bucket, item.storage_path),
    caption: item.caption,
    altText: item.alt_text,
    albumLabel: item.album_label,
    mediaType: item.media_type,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={campaign.title}
        description="Perbarui detail proyek, sampul, dan dokumentasi yang tampil di situs publik."
        backHref="/admin/proyek"
        backLabel="Kembali ke daftar proyek"
      />
      <AdminNotice error={notice.error} success={notice.success} />

      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardContent className="p-5">
            <p className="text-xs font-bold tracking-[0.08em] text-brand-text-body uppercase">Terkumpul</p>
            <p className="mt-3 text-2xl font-extrabold text-brand-navy tabular-nums">{formatCurrency(stats.raisedAmountIdr)}</p>
            <p className="mt-1 text-xs text-brand-text-body">{stats.percentFunded}% dari {formatCurrency(campaign.target_amount_idr)}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardContent className="p-5">
             <p className="text-xs font-bold tracking-[0.08em] text-brand-text-body uppercase">Total donasi</p>
            <p className="mt-3 text-2xl font-extrabold text-brand-navy tabular-nums">{formatNumber(stats.verifiedDonationCount)}</p>
            <p className="mt-1 text-xs text-brand-text-body">transaksi tercatat</p>
          </CardContent>
        </Card>
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardContent className="p-5">
            <p className="text-xs font-bold tracking-[0.08em] text-brand-text-body uppercase">Status</p>
            <div className="mt-3"><AdminStatusBadge status={campaign.status} map={campaignStatusPresentation} /></div>
            <p className="mt-2 text-xs text-brand-text-body">Terbit {formatShortDate(campaign.published_at)}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
            <p className="text-xs font-bold tracking-[0.08em] text-brand-text-body uppercase">Tindakan</p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/program/${campaign.slug}`} target="_blank"><ExternalLink className="size-4" />Lihat halaman publik</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Informasi proyek</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <CampaignForm campaign={campaign} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
            <CardTitle className="font-bold text-brand-navy">Sampul proyek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            {cover && coverUrl ? (
              <div className="overflow-hidden rounded-xl border border-brand-border">
                {cover.media_type === "video" ? (
                  <video src={coverUrl} controls className="h-44 w-full bg-black object-contain" />
                ) : (
                  <div className="relative h-44 w-full">
                    <Image src={coverUrl} alt={cover.alt_text || "Sampul proyek"} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  </div>
                )}
                <p className="border-t border-brand-border bg-brand-bg-soft px-3 py-2 text-xs text-brand-text-body">
                  Teks alternatif tersimpan: <span className="font-semibold text-brand-navy">{cover.alt_text || "belum ada"}</span>
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-brand-border bg-brand-bg-soft px-4 py-3 text-sm text-brand-text-body">Belum ada sampul untuk proyek ini.</p>
            )}
            <form action={uploadCampaignCover} className="space-y-4">
              <input type="hidden" name="campaign_id" value={campaign.id} />
              <FormField label="Berkas sampul" htmlFor="cover" hint="JPG, PNG, WebP, AVIF, atau MP4. Maksimal 25 MB." required>
                <Input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" required />
              </FormField>
              <FormField label="Teks alternatif" htmlFor="alt_text">
                <Input id="alt_text" name="alt_text" placeholder="Deskripsi singkat gambar" defaultValue={cover?.alt_text || ""} />
              </FormField>
              <SubmitButton pendingLabel="Mengunggah..." className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Unggah sampul</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
            <CardTitle className="font-bold text-brand-navy">Dokumentasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            {documentationItems.length > 0 ? (
              <CampaignDocumentationEditor campaignId={campaign.id} items={documentationItems} />
            ) : (
              <p className="rounded-xl border border-dashed border-brand-border bg-brand-bg-soft px-4 py-3 text-sm text-brand-text-body">Belum ada dokumentasi untuk proyek ini.</p>
            )}
            <form action={addCampaignMedia} className="space-y-4 border-t border-brand-border pt-5">
              <input type="hidden" name="campaign_id" value={campaign.id} />
              <p className="text-sm font-bold text-brand-navy">Tambah dokumentasi</p>
              <FormField label="Berkas dokumentasi" htmlFor="media" hint="Boleh lebih dari satu. Total maksimal 29 MB per pengiriman. Keterangan, album, dan teks alternatif di bawah berlaku untuk semua berkas." required>
                <Input id="media" name="media" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" multiple required />
              </FormField>
              <FormField label="Keterangan" htmlFor="caption">
                <Input id="caption" name="caption" placeholder="Serah terima bantuan" />
              </FormField>
              <FormField label="Album" htmlFor="album_label">
                <Input id="album_label" name="album_label" placeholder="Nama album galeri" />
              </FormField>
              <FormField label="Teks alternatif" htmlFor="media_alt_text">
                <Input id="media_alt_text" name="alt_text" placeholder="Deskripsi singkat gambar" />
              </FormField>
              <SubmitButton pendingLabel="Mengunggah..." className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Tambah dokumentasi</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-red/25">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-red">Zona berisiko</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <p className="max-w-lg text-sm text-brand-text-body">
            Proyek, beserta donasi, dokumentasi, dan laporannya akan dihapus secara permanen dan tidak dapat dipulihkan.
          </p>
          <form action={deleteCampaigns}>
            <input type="hidden" name="campaign_id" value={campaign.id} />
            <ConfirmSubmitButton variant="destructive" confirmMessage="Hapus proyek ini secara permanen? Proyek, donasi, dokumentasi, dan laporannya tidak dapat dipulihkan.">Hapus proyek</ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
