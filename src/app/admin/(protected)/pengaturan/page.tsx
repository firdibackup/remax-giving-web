import { MessageCircle, Trash2 } from "lucide-react";
import {
  deleteAnnualGoal,
  deleteSiteSetting,
  saveAnnualGoal,
  saveSiteSetting,
  saveWhatsAppCta,
} from "@/app/admin/(protected)/pengaturan/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { listAnnualGoals, listSiteSettings } from "@/lib/admin/queries";

function serializeValue(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function whatsappValues(value: unknown) {
  const config = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    phone: typeof config.phone === "string" ? config.phone : "",
    message: typeof config.message === "string" ? config.message : "",
    label: typeof config.label === "string" ? config.label : "",
  };
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/pengaturan">) {
  const notice = await searchParams;
  const [goals, settings] = await Promise.all([listAnnualGoals(), listSiteSettings()]);
  const whatsappSetting = settings.find((setting) => setting.key === "whatsapp_cta");
  const whatsapp = whatsappValues(whatsappSetting?.value);
  const genericSettings = settings.filter((setting) => setting.key !== "whatsapp_cta");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Pengaturan" description="Kelola tombol WhatsApp, target donasi tahunan, dan konfigurasi situs publik." />
      <AdminNotice error={notice.error} success={notice.success} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="flex-row items-start gap-4 border-b border-brand-border px-5 py-5 sm:px-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint-blue text-brand-blue">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <CardTitle className="font-bold text-brand-navy">Tombol WhatsApp global</CardTitle>
            <p className="mt-1 text-sm leading-6 text-brand-text-body">Atur tujuan dan isi pesan tombol bantuan yang tampil di seluruh situs publik.</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={saveWhatsAppCta} className="grid gap-5 md:grid-cols-2">
            <FormField label="Nomor WhatsApp" htmlFor="whatsapp_phone" hint="Gunakan kode negara, misalnya 62, tanpa angka nol di depan." required>
              <Input id="whatsapp_phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={whatsapp.phone} placeholder="Kode negara dan nomor" required />
            </FormField>
            <FormField label="Label tombol" htmlFor="whatsapp_label" hint="Teks singkat yang terlihat pada tombol.">
              <Input id="whatsapp_label" name="label" defaultValue={whatsapp.label} placeholder="Chat panitia" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Pesan bawaan" htmlFor="whatsapp_message" hint="Pesan ini otomatis terisi saat pengunjung membuka WhatsApp." required>
                <Textarea id="whatsapp_message" name="message" rows={4} defaultValue={whatsapp.message} required />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <SubmitButton className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Simpan tombol WhatsApp</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Target tahunan</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={saveAnnualGoal} className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <FormField label="Tahun" htmlFor="year">
              <Input id="year" name="year" type="number" min="2000" max="2100" defaultValue={new Date().getFullYear()} required />
            </FormField>
            <FormField label="Target (Rp)" htmlFor="target_amount_idr">
              <Input id="target_amount_idr" name="target_amount_idr" type="number" min="1" step="1" required />
            </FormField>
            <FormField label="Catatan" htmlFor="goal_note">
              <Input id="goal_note" name="note" />
            </FormField>
            <div className="space-y-2">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-brand-border px-3 text-sm font-semibold text-brand-navy">
                <input type="checkbox" name="is_published" className="size-4 accent-brand-blue" />
                Publik
              </label>
            </div>
            <div className="md:col-span-4">
              <SubmitButton className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Simpan target</SubmitButton>
            </div>
          </form>

          {goals.length > 0 && (
            <div className="mt-6 divide-y divide-brand-border border-t border-brand-border">
              {goals.map((goal) => (
                <div key={goal.year} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-bold text-brand-navy">{goal.year} · {formatCurrency(goal.target_amount_idr)}</p>
                    <p className="mt-1 text-xs text-brand-text-body">{goal.note || "Tanpa catatan"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={goal.is_published ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-border bg-white text-brand-text-body"}>{goal.is_published ? "Publik" : "Internal"}</Badge>
                    <form action={deleteAnnualGoal}>
                      <input type="hidden" name="year" value={goal.year} />
                      <ConfirmSubmitButton variant="ghost" confirmMessage={`Hapus target tahun ${goal.year}?`}><Trash2 className="size-4" /></ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6">
          <CardTitle className="font-bold text-brand-navy">Pengaturan situs lainnya</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={saveSiteSetting} className="grid gap-5 md:grid-cols-2">
            <FormField label="Kunci" htmlFor="setting_key" hint="Huruf kecil, angka, dan garis bawah.">
              <Input id="setting_key" name="key" pattern="[a-z0-9]+(_[a-z0-9]+)*" required />
            </FormField>
            <FormField label="Deskripsi" htmlFor="setting_description">
              <Input id="setting_description" name="description" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Nilai" htmlFor="setting_value" hint="Menerima teks biasa atau JSON valid.">
                <Textarea id="setting_value" name="value" rows={5} required />
              </FormField>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm font-semibold text-brand-navy md:col-span-2">
              <input type="checkbox" name="is_public" className="size-4 accent-brand-blue" />
              Boleh dibaca situs publik
            </label>
            <div className="md:col-span-2">
              <SubmitButton className="bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">Simpan pengaturan</SubmitButton>
            </div>
          </form>

          {genericSettings.length > 0 && (
            <div className="mt-7 space-y-3 border-t border-brand-border pt-6">
              {genericSettings.map((setting) => (
                <div key={setting.key} className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-navy">{setting.key}</p>
                      <p className="mt-1 text-xs text-brand-text-body">{setting.description || "Tanpa deskripsi"} · {formatDateTime(setting.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={setting.is_public ? "border-blue-200 bg-blue-50 text-blue-700" : "border-brand-border bg-white text-brand-text-body"}>{setting.is_public ? "Publik" : "Internal"}</Badge>
                      <form action={deleteSiteSetting}>
                        <input type="hidden" name="key" value={setting.key} />
                        <ConfirmSubmitButton variant="ghost" confirmMessage={`Hapus pengaturan ${setting.key}?`}><Trash2 className="size-4" /></ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-xs leading-5 text-brand-navy ring-1 ring-brand-border">{serializeValue(setting.value)}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
