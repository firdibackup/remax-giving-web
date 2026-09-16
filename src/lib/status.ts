import type { CampaignStatus, ContentStatus } from "@/lib/supabase/database.types";

type StatusPresentation = {
  label: string;
  className: string;
};

const neutral = "border-slate-200 bg-slate-50 text-slate-600";
const info = "border-blue-200 bg-blue-50 text-blue-700";
const warning = "border-amber-200 bg-amber-50 text-amber-700";
const success = "border-emerald-200 bg-emerald-50 text-emerald-700";
const danger = "border-red-200 bg-red-50 text-red-700";

export const campaignStatusPresentation: Record<CampaignStatus, StatusPresentation> = {
  draft: { label: "Draf", className: neutral },
  scheduled: { label: "Terjadwal", className: info },
  running: { label: "Berjalan", className: info },
  closed: { label: "Ditutup", className: warning },
  disbursed: { label: "Selesai", className: success },
  reported: { label: "Laporan tersedia", className: success },
  cancelled: { label: "Dibatalkan", className: danger },
  archived: { label: "Diarsipkan", className: neutral },
};

export const contentStatusPresentation: Record<ContentStatus, StatusPresentation> = {
  draft: { label: "Draf", className: neutral },
  scheduled: { label: "Terjadwal", className: info },
  published: { label: "Terbit", className: success },
  archived: { label: "Diarsipkan", className: neutral },
};

export function statusPresentation<Status extends string>(
  map: Record<Status, StatusPresentation>,
  status: string,
): StatusPresentation {
  return map[status as Status] || { label: status, className: neutral };
}
