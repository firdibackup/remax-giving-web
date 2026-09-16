import { notFound } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUCKETS, createSignedUrl } from "@/lib/admin/storage";
import { formatCurrency, formatDateTime, formatLongDate } from "@/lib/format";
import { getDonationDetail } from "@/lib/admin/queries";

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[0.06em] text-brand-text-body uppercase">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold text-brand-navy">{value || "-"}</dd>
    </div>
  );
}

export default async function DonationDetailPage({ params, searchParams }: PageProps<"/admin/donasi/[id]">) {
  const { id } = await params;
  const notice = await searchParams;
  const donation = await getDonationDetail(id);

  if (!donation) {
    notFound();
  }

  const evidenceLinks = await Promise.all(
    (donation.evidence_paths || []).map(async (path, index) => ({
      path,
      label: `Bukti ${index + 1}`,
      url: await createSignedUrl(BUCKETS.donationEvidence, path),
    })),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={donation.public_name}
        description="Detail donasi yang telah tercatat di rekap."
        backHref="/admin/donasi"
        backLabel="Kembali ke daftar donasi"
      />
      <AdminNotice error={notice.error} success={notice.success} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
          <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
            <CardTitle className="font-bold text-brand-navy">Informasi donasi</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <DetailItem label="Nama lengkap" value={donation.full_name} />
              <DetailItem label="Nama publik" value={donation.public_name} />
              <DetailItem label="Proyek" value={donation.campaign_title} />
              <DetailItem label="Tanggal donasi" value={formatLongDate(donation.donated_on)} />
              <DetailItem label="Nominal" value={<span className="text-lg text-brand-blue tabular-nums">{formatCurrency(donation.amount_idr)}</span>} />
              <DetailItem label="Tercatat pada" value={formatDateTime(donation.verified_at)} />
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="gap-0 border-0 bg-brand-navy py-0 text-white ring-0">
            <CardContent className="p-5 sm:p-6">
              <ShieldCheck className="size-7 text-blue-200" />
              <h2 className="mt-5 text-lg font-extrabold">Data privat</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Nama lengkap dan berkas bukti hanya tersedia untuk Super Admin. Tautan bukti kedaluwarsa dalam lima menit.
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
            <CardHeader className="border-b border-brand-border px-5 py-5">
              <CardTitle className="font-bold text-brand-navy">Bukti transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5">
              {evidenceLinks.some((evidence) => evidence.url) ? (
                evidenceLinks.map((evidence) => evidence.url && (
                  <Button key={evidence.path} asChild variant="outline" className="w-full justify-between">
                    <a href={evidence.url} target="_blank" rel="noreferrer">{evidence.label}<ExternalLink className="size-4" /></a>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-brand-text-body">Tidak ada bukti transfer.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
