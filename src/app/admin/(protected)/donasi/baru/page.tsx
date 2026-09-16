import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationForm } from "@/components/admin/donation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCampaignOptions } from "@/lib/admin/queries";
import { todayInJakarta } from "@/lib/format";

export default async function NewDonationPage() {
  const campaigns = await listCampaignOptions();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catat donasi"
        description="Donasi langsung dicatat ke rekap setelah form disimpan."
        backHref="/admin/donasi"
        backLabel="Kembali ke daftar donasi"
      />
      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Data donasi</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <DonationForm campaigns={campaigns} today={todayInJakarta()} />
        </CardContent>
      </Card>
    </div>
  );
}
