import "server-only";

export type ActionState = {
  error?: string;
  success?: string;
};

export function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value ? value : null;
}

export function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function readInteger(formData: FormData, key: string): number | null {
  const value = readText(formData, key);

  if (!/^-?\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function readAmount(formData: FormData, key: string): number | null {
  const value = readText(formData, key);

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function readParagraphs(formData: FormData, key: string): string[] {
  return readText(formData, key)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

const friendlyErrors: Array<{ match: RegExp; message: string }> = [
  { match: /Akses ditolak/i, message: "Akses ditolak. Akun Anda bukan Super Admin aktif." },
  { match: /campaigns_slug_format|blog_posts_slug_format|categories_slug_format/i, message: "Slug hanya boleh huruf kecil, angka, dan tanda hubung." },
  { match: /duplicate key value|unique constraint/i, message: "Data dengan penanda unik yang sama sudah ada." },
  { match: /campaigns_single_featured_idx/i, message: "Hanya satu proyek yang dapat disorot. Nonaktifkan sorotan sebelumnya." },
  { match: /blog_posts_single_featured_idx/i, message: "Hanya satu tulisan yang dapat disorot. Nonaktifkan sorotan sebelumnya." },

  { match: /Tanggal donasi/i, message: "Tanggal donasi tidak boleh melewati hari ini." },
  { match: /violates foreign key|foreign key constraint/i, message: "Data masih dipakai record lain atau referensi tidak ditemukan." },
  { match: /row-level security|permission denied/i, message: "Akses ditolak oleh kebijakan keamanan database." },
];

export function toFriendlyError(message: string | null | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  for (const { match, message: friendly } of friendlyErrors) {
    if (match.test(message)) {
      return friendly;
    }
  }

  return fallback;
}

export function encodeNotice(params: { error?: string; success?: string }): string {
  const search = new URLSearchParams();

  if (params.error) {
    search.set("error", params.error);
  }

  if (params.success) {
    search.set("success", params.success);
  }

  const value = search.toString();
  return value ? `?${value}` : "";
}
