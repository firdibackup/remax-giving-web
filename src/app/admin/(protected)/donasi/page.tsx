import Link from "next/link";
import { Search } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatShortDate } from "@/lib/format";
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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
                <tr>
                  <th className="px-6 py-3 font-bold">Donatur</th>
                  <th className="px-4 py-3 font-bold">Proyek</th>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 text-right font-bold">Nominal</th>
                  <th className="px-6 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {rows.map((donation) => (
                  <tr key={donation.id} className="hover:bg-brand-bg-soft/60">
                    <td className="px-6 py-4 font-bold text-brand-navy">{donation.public_name}</td>
                    <td className="max-w-[280px] px-4 py-4 text-brand-text-body"><span className="line-clamp-2">{donation.campaignTitle}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap text-brand-text-body tabular-nums">{formatShortDate(donation.donated_on)}</td>
                    <td className="px-4 py-4 text-right font-bold whitespace-nowrap text-brand-navy tabular-nums">{formatCurrency(donation.amount_idr)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="outline"><Link href={`/admin/donasi/${donation.id}`}>Lihat</Link></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
