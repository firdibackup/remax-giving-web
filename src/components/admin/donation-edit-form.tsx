"use client";

import { useActionState } from "react";
import { updateDonation } from "@/app/admin/(protected)/donasi/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CampaignRow,
  DonationDetail,
} from "@/lib/supabase/database.types";

function DonationEditForm({
  donation,
  campaigns,
  today,
}: {
  donation: DonationDetail;
  campaigns: Array<Pick<CampaignRow, "id" | "title" | "status">>;
  today: string;
}) {
  const [state, formAction] = useActionState(
    updateDonation.bind(null, donation.id),
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <AdminNotice error={state.error} success={state.success} />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="program tujuan" htmlFor="campaign_id" required>
          <Select
            id="campaign_id"
            name="campaign_id"
            required
            defaultValue={donation.campaign_id}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Nominal donasi (Rp)" htmlFor="amount_idr" required>
          <Input
            id="amount_idr"
            name="amount_idr"
            type="number"
            min="1"
            step="1"
            defaultValue={donation.amount_idr}
            required
          />
        </FormField>
        <FormField
          label="Nama lengkap donatur"
          htmlFor="full_name"
          hint="Nama publik akan disamarkan ulang otomatis dari nama ini."
          required
        >
          <Input
            id="full_name"
            name="full_name"
            defaultValue={donation.full_name || ""}
            required
            autoComplete="off"
          />
        </FormField>
        <FormField label="Tanggal donasi" htmlFor="donated_on" required>
          <Input
            id="donated_on"
            name="donated_on"
            type="date"
            max={today}
            defaultValue={donation.donated_on}
            required
          />
        </FormField>
      </div>

      <div className="flex justify-end border-t border-brand-border pt-5">
        <SubmitButton
          pendingLabel="Menyimpan..."
          className="h-10 bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover"
        >
          Simpan perubahan
        </SubmitButton>
      </div>
    </form>
  );
}

export { DonationEditForm };
