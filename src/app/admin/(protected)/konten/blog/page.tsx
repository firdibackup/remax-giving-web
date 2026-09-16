import { Trash2 } from "lucide-react";
import { createBlogCategory, deleteBlogPost } from "@/app/admin/(protected)/konten/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { BlogPostEditor } from "@/components/admin/blog-post-editor";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { EmptyState } from "@/components/admin/empty-state";
import { FormField } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatShortDate } from "@/lib/format";
import { listBlogCategories, listBlogPosts, listCampaignOptions } from "@/lib/admin/queries";
import { contentStatusPresentation } from "@/lib/status";

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/konten/blog">) {
  const notice = await searchParams;
  const [posts, categories, campaigns] = await Promise.all([
    listBlogPosts(),
    listBlogCategories(),
    listCampaignOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Blog" description="Tulis kabar lapangan, hubungkan dengan proyek, dan atur tulisan utama situs." />
      <AdminNotice error={notice.error} success={notice.success} />

      <BlogPostEditor posts={posts} categories={categories} campaigns={campaigns} />

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6"><CardTitle className="font-bold text-brand-navy">Kategori blog</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={createBlogCategory} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_auto] sm:items-end">
            <FormField label="Nama" htmlFor="category_name"><Input id="category_name" name="name" required /></FormField>
            <FormField label="Slug" htmlFor="category_slug"><Input id="category_slug" name="slug" /></FormField>
            <FormField label="Urutan" htmlFor="category_order"><Input id="category_order" name="sort_order" type="number" defaultValue={categories.length} /></FormField>
            <SubmitButton className="h-10 bg-brand-blue font-bold text-white hover:bg-brand-blue-hover">Tambah</SubmitButton>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-border pt-5">
            {categories.map((category) => <span key={category.id} className="rounded-full border border-brand-border bg-brand-bg-soft px-3 py-1.5 text-sm font-semibold text-brand-navy">{category.name}</span>)}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 border-0 bg-white py-0 ring-1 ring-brand-border">
        <CardHeader className="border-b border-brand-border px-5 py-5 sm:px-6"><CardTitle className="font-bold text-brand-navy">Semua tulisan</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto px-0">
          {posts.length > 0 ? (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-brand-bg-soft text-[11px] tracking-[0.08em] text-brand-text-body uppercase"><tr><th className="px-6 py-3 font-bold">Judul</th><th className="px-4 py-3 font-bold">Kategori</th><th className="px-4 py-3 font-bold">Terbit</th><th className="px-4 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Aksi</th></tr></thead>
              <tbody className="divide-y divide-brand-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-brand-bg-soft/60">
                    <td className="px-6 py-4"><p className="font-bold text-brand-navy">{post.title}</p><p className="mt-1 text-xs text-brand-text-body">{post.author_name || "Tanpa penulis"}{post.is_featured ? " · Tulisan utama" : ""}</p></td>
                    <td className="px-4 py-4 text-brand-text-body">{post.categoryName || "-"}</td>
                    <td className="px-4 py-4 text-brand-text-body">{formatShortDate(post.published_at)}</td>
                    <td className="px-4 py-4"><AdminStatusBadge status={post.status} map={contentStatusPresentation} /></td>
                    <td className="px-6 py-4 text-right"><form action={deleteBlogPost}><input type="hidden" name="post_id" value={post.id} /><ConfirmSubmitButton variant="ghost" confirmMessage="Hapus tulisan ini?"><Trash2 className="size-4" /></ConfirmSubmitButton></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="Belum ada tulisan" description="Buat tulisan pertama melalui editor di atas." />}
        </CardContent>
      </Card>
    </div>
  );
}
