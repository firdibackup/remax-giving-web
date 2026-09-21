"use client";

import { useRef, useEffect, useTransition, useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { deleteDonations } from "@/app/admin/(protected)/donasi/actions";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatShortDate, formatNumber } from "@/lib/format";

type DonationItem = {
  id: string;
  public_name: string;
  campaignTitle: string;
  donated_on: string;
  amount_idr: number;
};

function DonationsTable({ donations }: { donations: DonationItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerRef = useRef<HTMLInputElement>(null);

  const totalAmount = donations
    .filter((donation) => selected.has(donation.id))
    .reduce((sum, donation) => sum + donation.amount_idr, 0);

  const allChecked = donations.length > 0 && selected.size === donations.length;
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
      if (prev.size === donations.length) {
        return new Set();
      }
      return new Set(donations.map((donation) => donation.id));
    });
  }, [donations]);

  const handleDelete = useCallback(() => {
    const confirmed = window.confirm(
      `Hapus ${formatNumber(selected.size)} donasi secara permanen? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const formData = new FormData();
      for (const id of selected) {
        formData.append("donation_id", id);
      }
      await deleteDonations(formData);
    });
  }, [selected]);

  return (
    <div className="relative">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
          <tr>
            <th className="px-6 py-3 font-bold" scope="col">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  ref={headerRef}
                  type="checkbox"
                  className="size-4 accent-brand-blue"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Pilih semua donasi"
                />
                Donatur
              </label>
            </th>
            <th className="px-4 py-3 font-bold" scope="col">Proyek</th>
            <th className="px-4 py-3 font-bold" scope="col">Tanggal</th>
            <th className="px-4 py-3 text-right font-bold" scope="col">Nominal</th>
            <th className="px-6 py-3 text-right font-bold" scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {donations.map((donation) => (
            <tr key={donation.id} className="hover:bg-brand-bg-soft/60">
              <td className="px-6 py-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-blue"
                    checked={selected.has(donation.id)}
                    onChange={() => toggle(donation.id)}
                    aria-label={`Pilih donasi ${donation.public_name}`}
                  />
                  <span className="font-bold text-brand-navy">{donation.public_name}</span>
                </label>
              </td>
              <td className="max-w-[280px] px-4 py-4 text-brand-text-body"><span className="line-clamp-2">{donation.campaignTitle}</span></td>
              <td className="px-4 py-4 whitespace-nowrap text-brand-text-body tabular-nums">{formatShortDate(donation.donated_on)}</td>
              <td className="px-4 py-4 text-right font-bold whitespace-nowrap text-brand-navy tabular-nums">{formatCurrency(donation.amount_idr)}</td>
              <td className="px-6 py-4 text-right">
                <Button asChild variant="outline"><Link href={`/admin/donasi/${donation.id}`}>Kelola</Link></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected.size > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-b-xl border border-brand-border bg-brand-navy px-5 py-3 text-sm text-white shadow-lg">
          <p>
            <span className="font-bold">{formatNumber(selected.size)}</span> donasi dipilih
            {" · "}
            <span className="font-bold tabular-nums">{formatCurrency(totalAmount)}</span> total
          </p>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isPending ? "Menghapus..." : "Hapus permanen"}
          </Button>
        </div>
      )}
    </div>
  );
}

export { DonationsTable };
export type { DonationItem };
