import Link from "next/link";
import { Search } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationsTable } from "@/components/admin/donations-table";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listCampaignOptions, listDonations } from "@/lib/admin/queries";

const PAGE_SIZE = 20;

export default async function DonationsPage({ searchParams }: PageProps<"/admin/donasi">) {
  const params = await searchParams;
  const campaignId = typeof params.campaign === "string" ? params.campaign : "";
  const search = typeof params.q === "string" ? params.q : "";
  const page = Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1;

  const [{ rows, total }, campaigns] = await Promise.all([
    listDonations({ campaignId, search, page, pageSize: PAGE_SIZE }),
    listCampaignOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildPageHref = (target: number) => {
    const query = new URLSearchParams();
    if (campaignId) query.set("campaign", campaignId);
    if (search) query.set("q", search);
    query.set("page", String(target));
    return `/admin/donasi?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Donasi"
        description="Catat dan telusuri seluruh donasi yang langsung masuk ke rekap publik."
        actionHref="/admin/donasi/baru"
        actionLabel="Catat donasi"
      />
      <AdminNotice error={params.error} success={params.success} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="p-4 sm:p-5">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-text-body" />
              <Input name="q" defaultValue={search} placeholder="Cari nama publik donatur" className="pl-9" />
            </div>
            <Select name="campaign" defaultValue={campaignId}>
              <option value="">Semua proyek</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
              ))}
            </Select>
            <Button type="submit" variant="outline" className="h-10">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="overflow-x-auto px-0">
          {rows.length > 0 ? (
            <DonationsTable
              donations={rows.map((donation) => ({
                id: donation.id,
                public_name: donation.public_name,
                campaignTitle: donation.campaignTitle,
                donated_on: donation.donated_on,
                amount_idr: donation.amount_idr,
              }))}
            />
          ) : (
            <EmptyState title="Donasi tidak ditemukan" description="Ubah filter pencarian atau catat donasi baru." />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-brand-text-body">Halaman {page} dari {totalPages} · {total} transaksi</p>
          <div className="flex gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={buildPageHref(Math.max(1, page - 1))}>Sebelumnya</Link>
            </Button>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={buildPageHref(Math.min(totalPages, page + 1))}>Berikutnya</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
