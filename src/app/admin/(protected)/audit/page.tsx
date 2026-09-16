import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { listAuditLogs } from "@/lib/admin/queries";

const actionStyles: Record<string, string> = {
  INSERT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UPDATE: "border-blue-200 bg-blue-50 text-blue-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
};

export default async function AuditPage() {
  const logs = await listAuditLogs(100);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit log" description="Seratus perubahan operasional terbaru. Riwayat ini hanya dapat dibaca dan tidak dapat diubah dari panel." />
      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardContent className="overflow-x-auto px-0">
          {logs.length > 0 ? (
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase"><tr><th className="px-6 py-3 font-bold">Waktu</th><th className="px-4 py-3 font-bold">Aksi</th><th className="px-4 py-3 font-bold">Tabel</th><th className="px-4 py-3 font-bold">Record</th><th className="px-6 py-3 font-bold">Aktor</th></tr></thead>
              <tbody className="divide-y divide-brand-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-bg-soft/60">
                    <td className="px-6 py-4 whitespace-nowrap text-brand-text-body">{formatDateTime(log.occurred_at)}</td>
                    <td className="px-4 py-4"><Badge variant="outline" className={actionStyles[log.action] || "border-slate-200 bg-slate-50 text-slate-600"}>{log.action}</Badge></td>
                    <td className="px-4 py-4 font-bold text-brand-navy">{log.table_name}</td>
                    <td className="px-4 py-4 text-brand-text-body">{log.record_id || "-"}</td>
                    <td className="px-6 py-4 text-brand-text-body">{log.actor_id || "Sistem"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="Belum ada audit log" description="Perubahan pada data operasional akan muncul di sini." />}
        </CardContent>
      </Card>
    </div>
  );
}
