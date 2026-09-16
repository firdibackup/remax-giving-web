"use client";

import { useActionState } from "react";
import { createDonation } from "@/app/admin/(protected)/donasi/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CampaignRow } from "@/lib/supabase/database.types";

function DonationForm({
  campaigns,
  today,
}: {
  campaigns: Array<Pick<CampaignRow, "id" | "title" | "status">>;
  today: string;
}) {
  const [state, formAction] = useActionState(createDonation, {});

  return (
    <form action={formAction} className="space-y-6">
      <AdminNotice error={state.error} success={state.success} />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Proyek tujuan" htmlFor="campaign_id" required>
          <Select id="campaign_id" name="campaign_id" required defaultValue="">
            <option value="" disabled>Pilih proyek</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Nominal donasi (Rp)" htmlFor="amount_idr" required>
          <Input id="amount_idr" name="amount_idr" type="number" min="1" step="1" required />
        </FormField>
        <FormField label="Nama lengkap donatur" htmlFor="full_name" hint="Nama publik akan disamarkan otomatis." required>
          <Input id="full_name" name="full_name" required autoComplete="off" />
        </FormField>
        <FormField label="Tanggal donasi" htmlFor="donated_on" required>
          <Input id="donated_on" name="donated_on" type="date" max={today} defaultValue={today} required />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Tangkapan layar transfer" htmlFor="evidence" hint="Opsional. JPG, PNG, WebP, atau PDF. Maksimal 10 MB.">
            <Input id="evidence" name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end border-t border-brand-border pt-5">
        <SubmitButton pendingLabel="Mencatat..." className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">
          Catat donasi
        </SubmitButton>
      </div>
    </form>
  );
}

export { DonationForm };
