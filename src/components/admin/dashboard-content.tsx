import {
  CircleDollarSign,
  FolderHeart,
  HandCoins,
  ReceiptText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/supabase/database.types";
import type { RecentDonation } from "@/lib/auth/admin";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "blue" | "red" | "navy" | "amber";
}) {
  const tones = {
    blue: "bg-brand-tint-blue text-brand-blue",
    red: "bg-brand-tint-red text-brand-red",
    navy: "bg-brand-navy/8 text-brand-navy",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border shadow-[0_4px_18px_rgba(6,46,97,0.04)]">
      <CardContent className="p-5 sm:p-6">
        <div
          className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
        <p className="mt-6 text-2xl font-extrabold tracking-[-0.035em] text-brand-navy tabular-nums">
          {value}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-sm font-semibold text-brand-text-body">{label}</p>
          <p className="text-right text-xs text-brand-text-body">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContent({
  summary,
  recentDonations,
  displayName,
}: {
  summary: DashboardSummary;
  recentDonations: RecentDonation[];
  displayName: string;
}) {
  const firstName = displayName.split(" ")[0] || "Admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.035em] text-brand-navy sm:text-[32px]">
            Selamat datang, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-brand-text-body">
            Pantau donasi, proyek, dan laporan Home of Giving hari ini.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total donasi"
          value={currencyFormatter.format(summary.total_donation_amount_idr)}
          detail={`${numberFormatter.format(summary.total_donation_count)} transaksi`}
          icon={CircleDollarSign}
          tone="blue"
        />
        <MetricCard
          label="Jumlah transaksi"
          value={numberFormatter.format(summary.total_donation_count)}
          detail="Donasi tercatat"
          icon={HandCoins}
          tone="amber"
        />
        <MetricCard
          label="Program berjalan"
          value={numberFormatter.format(summary.running_campaign_count)}
          detail="Aktif dipublikasikan"
          icon={FolderHeart}
          tone="navy"
        />
        {/* <MetricCard
          label="Laporan belum terbit"
          value={numberFormatter.format(summary.unpublished_report_count)}
          detail="Perlu dilengkapi"
          icon={FileWarning}
          tone="red"
        /> */}
      </div>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border shadow-[0_4px_18px_rgba(6,46,97,0.04)]">
        <CardHeader className="flex-row items-center justify-between border-b border-brand-border px-5 py-5 sm:px-6">
          <div>
            <CardTitle className="font-bold text-brand-navy">
              Donasi terbaru
            </CardTitle>
            <p className="mt-1 text-sm text-brand-text-body">
              Transaksi terakhir yang tercatat di sistem.
            </p>
          </div>
          <ReceiptText className="size-5 text-brand-blue" />
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          {recentDonations.length > 0 ? (
            <table className="w-full min-w-[660px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-bold sm:px-6">
                    Donatur
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Program
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Tanggal
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-bold sm:px-6"
                  >
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {recentDonations.map((donation) => (
                  <tr
                    key={donation.id}
                    className="transition-colors hover:bg-brand-bg-soft/70"
                  >
                    <td className="px-5 py-4 font-bold text-brand-navy sm:px-6">
                      {donation.publicName}
                    </td>
                    <td className="max-w-[300px] px-4 py-4 font-medium text-brand-text-body">
                      <span className="line-clamp-2">
                        {donation.campaignTitle}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-brand-text-body tabular-nums">
                      {dateFormatter.format(
                        new Date(`${donation.donatedOn}T00:00:00`),
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-bold whitespace-nowrap text-brand-navy tabular-nums sm:px-6">
                      {currencyFormatter.format(donation.amountIdr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-14 text-center">
              <HandCoins className="mx-auto size-8 text-brand-text-body/50" />
              <p className="mt-3 font-bold text-brand-navy">Belum ada donasi</p>
              <p className="mt-1 text-sm text-brand-text-body">
                Transaksi terbaru akan muncul di sini.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { DashboardContent };
