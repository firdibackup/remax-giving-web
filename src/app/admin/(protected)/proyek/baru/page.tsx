import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CampaignForm } from "@/components/admin/campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Proyek baru"
        description="Lengkapi informasi proyek dan tambahkan media awal bila sudah tersedia."
        backHref="/admin/proyek"
      />
      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Informasi proyek</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6"><CampaignForm /></CardContent>
      </Card>
    </div>
  );
}
