"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  encodeNotice,
  readAmount,
  readBoolean,
  readInteger,
  readOptionalText,
  readText,
  toFriendlyError,
} from "@/lib/admin/form";

function revalidateSettings() {
  revalidatePath("/admin/pengaturan");
  revalidatePath("/program");
  revalidatePath("/program/[slug]", "page");
  revalidatePath("/");
}

function sanitizeWhatsAppPhone(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\+?[\d\s().-]+$/.test(trimmed)) {
    return null;
  }

  const phone = trimmed.replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

export async function saveWhatsAppCta(formData: FormData) {
  const admin = await requireAdmin();
  const phone = sanitizeWhatsAppPhone(readText(formData, "phone"));
  const message = readText(formData, "message");
  const label = readText(formData, "label");

  if (!phone) {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Nomor WhatsApp wajib menggunakan format internasional yang valid tanpa angka nol di depan." })}`);
  }

  if (!message) {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Pesan bawaan WhatsApp wajib diisi." })}`);
  }

  if (message.length > 1000 || label.length > 80) {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Pesan maksimal 1.000 karakter dan label maksimal 80 karakter." })}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("hog_admin_site_settings")
    .select("key")
    .eq("key", "whatsapp_cta")
    .maybeSingle();
  const payload = {
    value: { phone, message, label },
    description: "Tombol WhatsApp global situs publik",
    is_public: true,
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  };
  const { error } = existing
    ? await supabase.from("hog_admin_site_settings").update(payload).eq("key", "whatsapp_cta")
    : await supabase.from("hog_admin_site_settings").insert({ key: "whatsapp_cta", ...payload });

  if (error) {
    redirect(`/admin/pengaturan${encodeNotice({ error: toFriendlyError(error.message, "Pengaturan WhatsApp gagal disimpan.") })}`);
  }

  revalidateSettings();
  redirect(`/admin/pengaturan${encodeNotice({ success: "Tombol WhatsApp tersimpan dan tersedia untuk situs publik." })}`);
}

export async function saveAnnualGoal(formData: FormData) {
  await requireAdmin();
  const year = readInteger(formData, "year");
  const target = readAmount(formData, "target_amount_idr");

  if (!year || year < 2000 || year > 2100 || !target) {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Tahun dan target tahunan wajib valid." })}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("hog_admin_annual_goals")
    .select("year")
    .eq("year", year)
    .maybeSingle();
  const payload = {
    target_amount_idr: target,
    is_published: readBoolean(formData, "is_published"),
    note: readOptionalText(formData, "note"),
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabase.from("hog_admin_annual_goals").update(payload).eq("year", year)
    : await supabase.from("hog_admin_annual_goals").insert({ year, ...payload });

  if (error) {
    redirect(`/admin/pengaturan${encodeNotice({ error: toFriendlyError(error.message, "Target tahunan gagal disimpan.") })}`);
  }

  revalidateSettings();
  redirect(`/admin/pengaturan${encodeNotice({ success: "Target tahunan tersimpan." })}`);
}

export async function deleteAnnualGoal(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_annual_goals").delete().eq("year", readInteger(formData, "year") || 0);

  if (error) {
    redirect(`/admin/pengaturan${encodeNotice({ error: toFriendlyError(error.message, "Target tahunan gagal dihapus.") })}`);
  }

  revalidateSettings();
  redirect(`/admin/pengaturan${encodeNotice({ success: "Target tahunan dihapus." })}`);
}

export async function saveSiteSetting(formData: FormData) {
  const admin = await requireAdmin();
  const key = readText(formData, "key").toLowerCase();
  const rawValue = readText(formData, "value");

  if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(key) || !rawValue) {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Kunci dan nilai pengaturan wajib valid." })}`);
  }

  if (key === "whatsapp_cta") {
    redirect(`/admin/pengaturan${encodeNotice({ error: "Gunakan form Tombol WhatsApp global untuk mengubah whatsapp_cta." })}`);
  }

  let value: unknown;

  try {
    value = JSON.parse(rawValue);
  } catch {
    value = rawValue;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("hog_admin_site_settings")
    .select("key")
    .eq("key", key)
    .maybeSingle();
  const payload = {
    value,
    description: readOptionalText(formData, "description"),
    is_public: readBoolean(formData, "is_public"),
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  };
  const { error } = existing
    ? await supabase.from("hog_admin_site_settings").update(payload).eq("key", key)
    : await supabase.from("hog_admin_site_settings").insert({ key, ...payload });

  if (error) {
    redirect(`/admin/pengaturan${encodeNotice({ error: toFriendlyError(error.message, "Pengaturan situs gagal disimpan.") })}`);
  }

  revalidateSettings();
  redirect(`/admin/pengaturan${encodeNotice({ success: "Pengaturan situs tersimpan." })}`);
}

export async function deleteSiteSetting(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_site_settings").delete().eq("key", readText(formData, "key"));

  if (error) {
    redirect(`/admin/pengaturan${encodeNotice({ error: toFriendlyError(error.message, "Pengaturan situs gagal dihapus.") })}`);
  }

  revalidateSettings();
  redirect(`/admin/pengaturan${encodeNotice({ success: "Pengaturan situs dihapus." })}`);
}
