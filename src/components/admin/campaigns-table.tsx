"use client";

import { useRef, useEffect, useTransition, useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { deleteCampaigns } from "@/app/admin/(protected)/proyek/actions";
import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { formatShortDate, formatCompactCurrency, formatNumber } from "@/lib/format";
import { campaignStatusPresentation } from "@/lib/status";
import type { CampaignStatus } from "@/lib/supabase/database.types";

type Campaign = {
  id: string;
  title: string;
  beneficiary_name: string | null;
  starts_on: string | null;
  ends_on: string | null;
  status: CampaignStatus;
  raisedAmountIdr: number;
  percentFunded: number;
  verifiedDonationCount: number;
};

function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const totalDonations = campaigns
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.verifiedDonationCount, 0);

  const allChecked = campaigns.length > 0 && selected.size === campaigns.length;
  const someChecked = selected.size > 0 && !allChecked;

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === campaigns.length) {
        return new Set();
      }
      return new Set(campaigns.map((c) => c.id));
    });
  }, [campaigns]);

  const handleDelete = useCallback(() => {
    if (!formRef.current) return;
    const confirmed = window.confirm(
      `Hapus ${formatNumber(selected.size)} proyek dan ${formatNumber(totalDonations)} donasi secara permanen? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const formData = new FormData();
      for (const id of selected) {
        formData.append("campaign_id", id);
      }
      await deleteCampaigns(formData);
    });
  }, [selected, totalDonations]);

  return (
    <div className="relative">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
          <tr>
            <th className="px-6 py-3 font-bold" scope="col">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  ref={headerRef}
                  type="checkbox"
                  className="size-4 accent-brand-blue"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Pilih semua proyek"
                />
                Proyek
              </label>
            </th>
            <th className="px-4 py-3 font-bold" scope="col">Penerima</th>
            <th className="px-4 py-3 font-bold" scope="col">Periode</th>
            <th className="px-4 py-3 text-right font-bold" scope="col">Terkumpul</th>
            <th className="px-4 py-3 text-center font-bold" scope="col">Donasi</th>
            <th className="px-4 py-3 font-bold" scope="col">Status</th>
            <th className="px-6 py-3 text-right font-bold" scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="hover:bg-brand-bg-soft/60">
              <td className="px-6 py-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-blue"
                    checked={selected.has(campaign.id)}
                    onChange={() => toggle(campaign.id)}
                    aria-label={`Pilih proyek ${campaign.title}`}
                  />
                  <div>
                    <p className="font-bold text-brand-navy">{campaign.title}</p>
                    <p className="mt-1 text-xs text-brand-text-body">{campaign.verifiedDonationCount} donasi</p>
                  </div>
                </label>
              </td>
              <td className="px-4 py-4 text-brand-text-body">{campaign.beneficiary_name || "Belum diisi"}</td>
              <td className="px-4 py-4 text-brand-text-body">{formatShortDate(campaign.starts_on)} – {formatShortDate(campaign.ends_on)}</td>
              <td className="px-4 py-4 text-right">
                <p className="font-bold text-brand-navy tabular-nums">{formatCompactCurrency(campaign.raisedAmountIdr)}</p>
                <p className="mt-1 text-xs text-brand-text-body">{campaign.percentFunded}% dari target</p>
              </td>
              <td className="px-4 py-4 text-center tabular-nums">{formatNumber(campaign.verifiedDonationCount)}</td>
              <td className="px-4 py-4"><AdminStatusBadge status={campaign.status} map={campaignStatusPresentation} /></td>
              <td className="px-6 py-4 text-right">
                <Button asChild variant="outline"><Link href={`/admin/proyek/${campaign.id}`}>Kelola</Link></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected.size > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-b-xl border border-brand-border bg-brand-navy px-5 py-3 text-sm text-white shadow-lg">
          <p>
            <span className="font-bold">{formatNumber(selected.size)}</span> proyek dipilih
            {" · "}
            <span className="font-bold">{formatNumber(totalDonations)}</span> donasi akan dihapus
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {isPending ? "Menghapus..." : "Hapus permanen"}
          </Button>
        </div>
      )}

      <form ref={formRef} className="hidden">
        {Array.from(selected).map((id) => (
          <input key={id} type="hidden" name="campaign_id" value={id} />
        ))}
      </form>
    </div>
  );
}

export { CampaignsTable };
export type { Campaign };
