"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { updateCampaignAllocations } from "@/app/admin/(protected)/program/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

type AllocationRow = {
  key: string;
  label: string;
  amount: string;
  note: string;
};

let rowCounter = 0;
function makeRow(label = "", amount = "", note = ""): AllocationRow {
  rowCounter += 1;
  return { key: `alloc-${rowCounter}`, label, amount, note };
}

function CampaignAllocationsEditor({
  campaignId,
  allocations,
}: {
  campaignId: string;
  allocations: Array<{
    label: string;
    amount_idr: number;
    note: string | null;
  }>;
}) {
  const [rows, setRows] = useState<AllocationRow[]>(() =>
    allocations.length > 0
      ? allocations.map((item) =>
          makeRow(item.label, String(item.amount_idr), item.note || ""),
        )
      : [makeRow()],
  );

  const total = rows.reduce(
    (sum, row) =>
      sum + (/^\d+$/.test(row.amount.trim()) ? Number(row.amount.trim()) : 0),
    0,
  );

  const update = (
    key: string,
    field: "label" | "amount" | "note",
    value: string,
  ) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((row) => row.key !== key));
  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  return (
    <form action={updateCampaignAllocations} className="space-y-4">
      <input type="hidden" name="campaign_id" value={campaignId} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.08em] text-brand-text-body uppercase">
            <tr>
              <th className="py-2 pr-3 font-bold">Alokasi</th>
              <th className="w-40 py-2 pr-3 font-bold">Nominal (Rp)</th>
              <th className="py-2 pr-3 font-bold">Keterangan</th>
              <th className="w-10 py-2" aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="align-top">
                <td className="py-1.5 pr-3">
                  <Input
                    name="allocation_label"
                    value={row.label}
                    onChange={(event) =>
                      update(row.key, "label", event.target.value)
                    }
                    placeholder="Paket sembako"
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <Input
                    name="allocation_amount"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={row.amount}
                    onChange={(event) =>
                      update(row.key, "amount", event.target.value)
                    }
                    placeholder="0"
                    className="tabular-nums"
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <Input
                    name="allocation_note"
                    value={row.note}
                    onChange={(event) =>
                      update(row.key, "note", event.target.value)
                    }
                    placeholder="200 paket"
                  />
                </td>
                <td className="py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Hapus baris"
                    title="Hapus baris"
                    className="grid size-9 place-items-center rounded-md text-brand-text-body transition-colors hover:bg-brand-tint-red hover:text-brand-red"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-brand-border">
              <td className="py-3 pr-3 text-sm font-bold text-brand-navy">
                Total
              </td>
              <td className="py-3 pr-3 text-sm font-bold text-brand-navy tabular-nums">
                {formatCurrency(total)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-bg-soft"
        >
          <Plus className="size-4" />
          Tambah baris
        </button>
        <SubmitButton
          pendingLabel="Menyimpan..."
          className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
        >
          Simpan rincian
        </SubmitButton>
      </div>
      <p className="text-xs leading-5 text-brand-text-body">
        Baris tanpa nama alokasi diabaikan. Kosongkan semua baris lalu simpan
        untuk menghapus rincian.
      </p>
    </form>
  );
}

export { CampaignAllocationsEditor };
