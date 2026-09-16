import { DashboardContent } from "@/components/admin/dashboard-content";
import { getDashboardData, requireAdmin } from "@/lib/auth/admin";

export default async function AdminDashboardPage() {
  const [admin, dashboard] = await Promise.all([
    requireAdmin(),
    getDashboardData(),
  ]);

  return (
    <DashboardContent
      displayName={admin.displayName}
      summary={dashboard.summary}
      recentDonations={dashboard.recentDonations}
    />
  );
}
