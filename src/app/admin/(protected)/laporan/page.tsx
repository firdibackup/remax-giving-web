import { ExternalLink, Trash2 } from "lucide-react";
import {
  createReport,
  deleteReport,
  publishReport,
  unpublishReport,
} from "@/app/admin/(protected)/laporan/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { EmptyState } from "@/components/admin/empty-state";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUCKETS,
  createSignedUrl,
  isReportBucket,
  publicStorageUrl,
} from "@/lib/admin/storage";
import { formatShortDate } from "@/lib/format";
import { listCampaignOptions, listReports } from "@/lib/admin/queries";

export default async function ReportsPage({ searchParams }: PageProps<"/admin/laporan">) {
  const notice = await searchParams;
  const [reports, campaigns] = await Promise.all([
    listReports(),
    listCampaignOptions(),
  ]);

  const fileUrls = new Map(
    await Promise.all(
      reports.map(async (report): Promise<[string, string | null]> => {
        if (report.external_url) {
          return [report.id, report.external_url];
        }

        if (!report.storage_path) {
          return [report.id, null];
        }

        if (report.storage_bucket === BUCKETS.publicReports) {
          return [report.id, publicStorageUrl(report.storage_bucket, report.storage_path)];
        }

        if (!isReportBucket(report.storage_bucket)) {
          return [report.id, null];
        }

        return [report.id, await createSignedUrl(report.storage_bucket, report.storage_path)];
      }),
    ),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Laporan"
        description="Kelola dokumen transparansi per proyek maupun laporan berkala dalam format PDF atau tautan eksternal."
      />
      <AdminNotice error={notice.error} success={notice.success} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Buat laporan</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={createReport} className="grid gap-5 md:grid-cols-2">
            <FormField label="Judul laporan" htmlFor="title" required>
              <Input id="title" name="title" required />
            </FormField>
            <FormField label="Jenis laporan" htmlFor="kind" required>
              <Select id="kind" name="kind" defaultValue="campaign" required>
                <option value="campaign">Laporan proyek</option>
                <option value="periodic">Laporan berkala</option>
              </Select>
            </FormField>
            <FormField label="Proyek" htmlFor="campaign_id" hint="Wajib untuk laporan proyek.">
              <Select id="campaign_id" name="campaign_id" defaultValue="">
                <option value="">Tidak terkait proyek</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Label periode" htmlFor="period_label">
              <Input id="period_label" name="period_label" placeholder="Agustus 2026" />
            </FormField>
            <FormField label="Berkas PDF" htmlFor="report" hint="Maksimal 25 MB.">
              <Input id="report" name="report" type="file" accept="application/pdf" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Tautan eksternal" htmlFor="external_url" hint="Opsional jika dokumen disimpan di layanan lain.">
                <Input id="external_url" name="external_url" type="url" placeholder="https://" />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <SubmitButton className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Simpan sebagai draf</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="overflow-x-auto px-0">
          {reports.length > 0 ? (
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
                <tr>
                  <th className="px-6 py-3 font-bold">Laporan</th>
                  <th className="px-4 py-3 font-bold">Lingkup</th>
                  <th className="px-4 py-3 font-bold">Periode</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {reports.map((report) => {
                  const fileUrl = fileUrls.get(report.id);

                  return (
                    <tr key={report.id} className="hover:bg-brand-bg-soft/60">
                      <td className="px-6 py-4">
                        <p className="font-bold text-brand-navy">{report.title}</p>
                        <p className="mt-1 text-xs text-brand-text-body">Dibuat {formatShortDate(report.created_at)}</p>
                      </td>
                      <td className="px-4 py-4 text-brand-text-body">{report.kind === "campaign" ? report.campaignTitle || "Proyek" : "Berkala"}</td>
                      <td className="px-4 py-4 text-brand-text-body">{report.period_label || "-"}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={report.published_at ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-border bg-white text-brand-text-body"}>
                          {report.published_at ? "Terbit" : "Draf"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {fileUrl && (
                            <Button asChild variant="outline" size="sm"><a href={fileUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Buka</a></Button>
                          )}
                          {report.published_at ? (
                            <form action={unpublishReport}>
                              <input type="hidden" name="report_id" value={report.id} />
                              <input type="hidden" name="campaign_id" value={report.campaign_id || ""} />
                              <ConfirmSubmitButton confirmMessage="Tarik laporan ini dari situs publik?">Tarik</ConfirmSubmitButton>
                            </form>
                          ) : (
                            <form action={publishReport}>
                              <input type="hidden" name="report_id" value={report.id} />
                              <input type="hidden" name="campaign_id" value={report.campaign_id || ""} />
                              <ConfirmSubmitButton confirmMessage="Publikasikan laporan ini? Pastikan berkas atau tautan sudah tersedia.">Terbitkan</ConfirmSubmitButton>
                            </form>
                          )}
                          <form action={deleteReport}>
                            <input type="hidden" name="report_id" value={report.id} />
                            <input type="hidden" name="campaign_id" value={report.campaign_id || ""} />
                            <ConfirmSubmitButton variant="ghost" confirmMessage="Hapus laporan ini secara permanen?"><Trash2 className="size-4" /></ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Belum ada laporan" description="Buat laporan proyek atau laporan berkala melalui form di atas." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
