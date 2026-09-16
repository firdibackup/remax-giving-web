import { Search } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CampaignsTable } from "@/components/admin/campaigns-table";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listCampaigns } from "@/lib/admin/queries";

export default async function CampaignsPage({ searchParams }: PageProps<"/admin/proyek">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const search = typeof params.q === "string" ? params.q : "";
  const campaigns = await listCampaigns({ status, search });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Proyek"
        description="Kelola target, penerima manfaat, status publikasi, cerita, dan dokumentasi setiap proyek."
        actionHref="/admin/proyek/baru"
        actionLabel="Proyek baru"
      />
      <AdminNotice error={params.error} success={params.success} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-text-body" />
              <Input name="q" defaultValue={search} placeholder="Cari judul proyek" className="pl-9" />
            </div>
            <Select name="status" defaultValue={status} className="sm:w-48">
              <option value="">Semua status</option>
              <option value="draft">Draf</option>
              <option value="scheduled">Terjadwal</option>
              <option value="running">Berjalan</option>
              <option value="closed">Ditutup</option>
              <option value="disbursed">Selesai</option>
              <option value="reported">Laporan tersedia</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="archived">Diarsipkan</option>
            </Select>
            <Button type="submit" variant="outline" className="h-10">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="overflow-x-auto px-0">
          {campaigns.length > 0 ? (
            <CampaignsTable
              campaigns={campaigns.map((c) => ({
                id: c.id,
                title: c.title,
                beneficiary_name: c.beneficiary_name,
                starts_on: c.starts_on,
                ends_on: c.ends_on,
                status: c.status,
                raisedAmountIdr: c.raisedAmountIdr,
                percentFunded: c.percentFunded,
                verifiedDonationCount: c.verifiedDonationCount,
              }))}
            />
          ) : (
            <EmptyState title="Proyek tidak ditemukan" description="Ubah filter atau buat proyek baru." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
