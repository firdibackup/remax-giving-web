import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";

// Keep the asset record until Storage cleanup succeeds, so a failed delete can be retried.
export async function deleteCampaignMediaAsset(
  supabase: SupabaseClient<Database>,
  campaignId: string,
  mediaId: string,
  role: "cover" | "documentation",
): Promise<{ error?: string }> {
  const scope = role === "cover"
    ? await supabase.from("hog_admin_campaigns").select("id").eq("id", campaignId).eq("cover_media_id", mediaId).maybeSingle()
    : await supabase.from("hog_admin_campaign_media").select("media_id").eq("campaign_id", campaignId).eq("media_id", mediaId).eq("role", "documentation").maybeSingle();
  if (scope.error || !scope.data) return { error: "Gambar tidak ditemukan pada program ini. Muat ulang halaman." };

  const { data: media, error } = await supabase.from("hog_admin_media_assets")
    .select("id,storage_bucket,storage_path,external_url").eq("id", mediaId).single();
  if (error || !media) return { error: "Aset gambar gagal dibaca. Coba lagi." };

  if (media.storage_bucket && media.storage_path) {
    if (media.storage_bucket !== "home-of-giving-public-media") {
      return { error: "Berkas bukan bagian dari penyimpanan media publik." };
    }
    const storage = supabase.storage.from(media.storage_bucket);
    const paths = [media.storage_path];
    const separator = media.storage_path.lastIndexOf("/");
    const name = media.storage_path.slice(separator + 1);
    // Only generated display copies have originals sharing this timestamp/UUID stem.
    const match = /^(\d+-[0-9a-f-]{36})\.webp$/.exec(name);
    if (match) {
      const folder = `${media.storage_path.slice(0, separator + 1)}originals`;
      const { data: originals, error: listError } = await storage.list(folder, { search: `${match[1]}.`, limit: 100 });
      if (listError) return { error: "Salinan asli gagal diperiksa. Penghapusan dibatalkan; coba lagi." };
      for (const original of originals || []) {
        if (original.id && original.name.slice(0, original.name.lastIndexOf(".")) === match[1]) {
          paths.push(`${folder}/${original.name}`);
        }
      }
    }
    const { error: removeError } = await storage.remove(paths);
    if (removeError) return { error: "Berkas gagal dihapus dari Storage. Aset masih tercatat; coba hapus kembali." };
  } else if (media.external_url) {
    return { error: "Gambar menggunakan URL eksternal. Berkas harus dihapus pada penyedia asal; penghapusan permanen tidak tersedia di sini." };
  }

  // FK rules clear covers and cascade documentation links wherever the asset is used.
  const result = await supabase.from("hog_admin_media_assets").delete().eq("id", mediaId).select("id");
  if (result.error || !result.data?.length) {
    return { error: "Berkas sudah dibersihkan, tetapi record aset belum terhapus. Coba hapus kembali." };
  }
  return {};
}
