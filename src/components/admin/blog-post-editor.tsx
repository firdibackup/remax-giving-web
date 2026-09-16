"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { saveBlogPost } from "@/app/admin/(protected)/konten/actions";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BlogCategoryRow, BlogPostRow, CampaignRow } from "@/lib/supabase/database.types";

function BlogPostEditor({
  posts,
  categories,
  campaigns,
}: {
  posts: BlogPostRow[];
  categories: BlogCategoryRow[];
  campaigns: Array<Pick<CampaignRow, "id" | "title" | "status">>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = posts.find((post) => post.id === selectedId);

  return (
    <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
      <CardHeader className="flex-row items-center justify-between border-b border-brand-border px-5 py-5 sm:px-6">
        <div>
          <CardTitle className="font-bold text-brand-navy">{selected ? "Ubah tulisan" : "Tulisan baru"}</CardTitle>
          <p className="mt-1 text-sm text-brand-text-body">Isi artikel menggunakan Markdown sederhana.</p>
        </div>
        {selected ? (
          <Button variant="outline" onClick={() => setSelectedId(null)}><X className="size-4" />Batal</Button>
        ) : (
          <Button variant="outline" onClick={() => setSelectedId(null)}><Plus className="size-4" />Baru</Button>
        )}
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form key={selected?.id || "new"} action={saveBlogPost} className="space-y-5">
          {selected && <input type="hidden" name="post_id" value={selected.id} />}
          <input type="hidden" name="cover_media_id" value={selected?.cover_media_id || ""} />
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Judul" htmlFor="blog_title" required><Input id="blog_title" name="title" defaultValue={selected?.title} required /></FormField>
            <FormField label="Slug" htmlFor="blog_slug" hint="Kosongkan untuk dibuat dari judul."><Input id="blog_slug" name="slug" defaultValue={selected?.slug} /></FormField>
            <FormField label="Kategori" htmlFor="blog_category"><Select id="blog_category" name="category_id" defaultValue={selected?.category_id || ""}><option value="">Tanpa kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormField>
            <FormField label="Proyek terkait" htmlFor="blog_campaign"><Select id="blog_campaign" name="campaign_id" defaultValue={selected?.campaign_id || ""}><option value="">Tanpa proyek</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</Select></FormField>
            <FormField label="Penulis" htmlFor="author_name"><Input id="author_name" name="author_name" defaultValue={selected?.author_name || ""} /></FormField>
            <FormField label="Waktu baca (menit)" htmlFor="read_minutes"><Input id="read_minutes" name="read_minutes" type="number" min="1" defaultValue={selected?.read_minutes || ""} /></FormField>
            <FormField label="Status" htmlFor="blog_status" required><Select id="blog_status" name="status" defaultValue={selected?.status || "draft"} required><option value="draft">Draf</option><option value="scheduled">Terjadwal</option><option value="published">Terbit</option><option value="archived">Diarsipkan</option></Select></FormField>
            <FormField label="Sampul" htmlFor="blog_cover"><Input id="blog_cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></FormField>
          </div>
          <FormField label="Ringkasan" htmlFor="excerpt"><Textarea id="excerpt" name="excerpt" rows={3} defaultValue={selected?.excerpt || ""} /></FormField>
          <FormField label="Isi artikel" htmlFor="body_markdown"><Textarea id="body_markdown" name="body_markdown" rows={14} defaultValue={selected?.body_markdown || ""} /></FormField>
          <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm font-semibold text-brand-navy">
            <input type="checkbox" name="is_featured" defaultChecked={selected?.is_featured} className="size-4 accent-brand-red" />
            Jadikan tulisan utama
          </label>
          <div className="flex flex-wrap justify-between gap-3 border-t border-brand-border pt-5">
            {selected && <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>Batal mengubah</Button>}
            <SubmitButton className="ml-auto bg-brand-blue px-5 font-bold text-white hover:bg-brand-blue-hover">{selected ? "Simpan perubahan" : "Buat tulisan"}</SubmitButton>
          </div>
        </form>

        {posts.length > 0 && (
          <div className="mt-8 border-t border-brand-border pt-5">
            <p className="mb-3 text-xs font-bold tracking-[0.08em] text-brand-text-body uppercase">Pilih untuk diubah</p>
            <div className="flex flex-wrap gap-2">
              {posts.map((post) => (
                <Button key={post.id} type="button" variant={post.id === selectedId ? "default" : "outline"} onClick={() => setSelectedId(post.id)}>
                  <Pencil className="size-3.5" />{post.title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { BlogPostEditor };
