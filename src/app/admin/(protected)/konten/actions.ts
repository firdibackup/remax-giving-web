"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  encodeNotice,
  isValidSlug,
  readBoolean,
  readInteger,
  readOptionalText,
  readText,
  slugify,
  toFriendlyError,
} from "@/lib/admin/form";
import { BUCKETS, isUploadPresent, uploadToBucket } from "@/lib/admin/storage";
import type { ContentStatus, MediaSpan } from "@/lib/supabase/database.types";

function revalidateContent(kind: "blog" | "media") {
  revalidatePath(`/admin/konten/${kind}`);
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/galeri");
  revalidatePath("/");
}

async function uploadPublicMedia(
  file: File,
  folder: string,
  adminId: string,
  metadata: {
    caption?: string | null;
    altText?: string | null;
    albumLabel?: string | null;
    locationLabel?: string | null;
    capturedOn?: string | null;
    layoutSpan?: MediaSpan;
    published?: boolean;
  },
) {
  const upload = await uploadToBucket(BUCKETS.publicMedia, folder, file);

  if ("error" in upload) {
    return upload;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hog_admin_media_assets")
    .insert({
      media_type: file.type.startsWith("video/") ? "video" : "image",
      storage_bucket: BUCKETS.publicMedia,
      storage_path: upload.path,
      caption: metadata.caption ?? null,
      alt_text: metadata.altText ?? null,
      album_label: metadata.albumLabel ?? null,
      location_label: metadata.locationLabel ?? null,
      captured_on: metadata.capturedOn ?? null,
      layout_span: metadata.layoutSpan ?? "normal",
      is_published: metadata.published ?? false,
      created_by: adminId,
      updated_by: adminId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: toFriendlyError(error?.message, "Media gagal dicatat.") };
  }

  return { id: data.id };
}

export async function saveBlogPost(formData: FormData) {
  const admin = await requireAdmin();
  const postId = readOptionalText(formData, "post_id");
  const title = readText(formData, "title");
  const slug = slugify(readText(formData, "slug") || title);
  const status = (readText(formData, "status") || "draft") as ContentStatus;
  const file = formData.get("cover");

  if (!title || !slug || !isValidSlug(slug)) {
    redirect(`/admin/konten/blog${encodeNotice({ error: "Judul dan slug tulisan wajib valid." })}`);
  }

  let coverMediaId = readOptionalText(formData, "cover_media_id");

  if (isUploadPresent(file)) {
    const media = await uploadPublicMedia(file, `blog/${slug}`, admin.userId, {
      altText: readOptionalText(formData, "cover_alt_text") || title,
      published: status === "published",
    });

    if ("error" in media) {
      redirect(`/admin/konten/blog${encodeNotice({ error: media.error })}`);
    }

    coverMediaId = media.id;
  }

  if (readBoolean(formData, "is_featured")) {
    const supabase = await createClient();
    let clearQuery = supabase.from("hog_admin_blog_posts").update({ is_featured: false }).eq("is_featured", true);
    if (postId) clearQuery = clearQuery.neq("id", postId);
    await clearQuery;
  }

  const payload = {
    slug,
    title,
    category_id: readOptionalText(formData, "category_id"),
    campaign_id: readOptionalText(formData, "campaign_id"),
    cover_media_id: coverMediaId,
    excerpt: readOptionalText(formData, "excerpt"),
    body_markdown: readOptionalText(formData, "body_markdown"),
    author_name: readOptionalText(formData, "author_name"),
    read_minutes: readInteger(formData, "read_minutes"),
    is_featured: readBoolean(formData, "is_featured"),
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_by: admin.userId,
  };

  const supabase = await createClient();
  const { error } = postId
    ? await supabase.from("hog_admin_blog_posts").update(payload).eq("id", postId)
    : await supabase.from("hog_admin_blog_posts").insert({ ...payload, created_by: admin.userId });

  if (error) {
    redirect(`/admin/konten/blog${encodeNotice({ error: toFriendlyError(error.message, "Tulisan gagal disimpan.") })}`);
  }

  revalidateContent("blog");
  redirect(`/admin/konten/blog${encodeNotice({ success: postId ? "Tulisan diperbarui." : "Tulisan dibuat." })}`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_blog_posts").delete().eq("id", readText(formData, "post_id"));

  if (error) {
    redirect(`/admin/konten/blog${encodeNotice({ error: toFriendlyError(error.message, "Tulisan gagal dihapus.") })}`);
  }

  revalidateContent("blog");
  redirect(`/admin/konten/blog${encodeNotice({ success: "Tulisan dihapus." })}`);
}

export async function createBlogCategory(formData: FormData) {
  await requireAdmin();
  const name = readText(formData, "name");
  const slug = slugify(readText(formData, "slug") || name);

  if (!name || !slug || !isValidSlug(slug)) {
    redirect(`/admin/konten/blog${encodeNotice({ error: "Nama kategori tidak valid." })}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_blog_categories").insert({
    name,
    slug,
    sort_order: readInteger(formData, "sort_order") ?? 0,
  });

  if (error) {
    redirect(`/admin/konten/blog${encodeNotice({ error: toFriendlyError(error.message, "Kategori gagal disimpan.") })}`);
  }

  revalidateContent("blog");
  redirect(`/admin/konten/blog${encodeNotice({ success: "Kategori blog ditambahkan." })}`);
}

export async function uploadMediaAsset(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("media");

  if (!isUploadPresent(file)) {
    redirect(`/admin/konten/media${encodeNotice({ error: "Pilih berkas media terlebih dahulu." })}`);
  }

  const media = await uploadPublicMedia(file, "gallery", admin.userId, {
    caption: readOptionalText(formData, "caption"),
    altText: readOptionalText(formData, "alt_text"),
    albumLabel: readOptionalText(formData, "album_label"),
    locationLabel: readOptionalText(formData, "location_label"),
    capturedOn: readOptionalText(formData, "captured_on"),
    layoutSpan: (readText(formData, "layout_span") || "normal") as MediaSpan,
    published: readBoolean(formData, "is_published"),
  });

  if ("error" in media) {
    redirect(`/admin/konten/media${encodeNotice({ error: media.error })}`);
  }

  revalidateContent("media");
  redirect(`/admin/konten/media${encodeNotice({ success: "Media ditambahkan." })}`);
}

export async function updateMediaAsset(formData: FormData) {
  const admin = await requireAdmin();
  const mediaId = readText(formData, "media_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("hog_admin_media_assets")
    .update({
      caption: readOptionalText(formData, "caption"),
      alt_text: readOptionalText(formData, "alt_text"),
      album_label: readOptionalText(formData, "album_label"),
      location_label: readOptionalText(formData, "location_label"),
      captured_on: readOptionalText(formData, "captured_on"),
      layout_span: (readText(formData, "layout_span") || "normal") as MediaSpan,
      is_published: readBoolean(formData, "is_published"),
      updated_by: admin.userId,
    })
    .eq("id", mediaId);

  if (error) {
    redirect(`/admin/konten/media${encodeNotice({ error: toFriendlyError(error.message, "Media gagal diperbarui.") })}`);
  }

  revalidateContent("media");
  redirect(`/admin/konten/media${encodeNotice({ success: "Media diperbarui." })}`);
}

export async function deleteMediaAsset(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("hog_admin_media_assets").delete().eq("id", readText(formData, "media_id"));

  if (error) {
    redirect(`/admin/konten/media${encodeNotice({ error: toFriendlyError(error.message, "Media masih digunakan atau gagal dihapus.") })}`);
  }

  revalidateContent("media");
  redirect(`/admin/konten/media${encodeNotice({ success: "Record media dihapus." })}`);
}
