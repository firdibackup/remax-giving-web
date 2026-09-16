import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandBadge } from "@/components/brand/badge";
import { MarkdownContent } from "@/components/markdown-content";
import { getPublicBlogDetail } from "@/lib/public-data";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicBlogDetail(slug);

  if (!detail) return { title: "Tulisan tidak ditemukan" };

  const socialImage = detail.post.image.startsWith("http") ? [detail.post.image] : undefined;

  return {
    title: `${detail.post.title} | REMAX Home of Giving`,
    description: detail.post.excerpt,
    openGraph: {
      title: detail.post.title,
      description: detail.post.excerpt,
      images: socialImage,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const detail = await getPublicBlogDetail(slug);

  if (!detail) notFound();

  const { post, related } = detail;

  return (
    <>
      <section className="bg-brand-bg-soft px-5 pt-14 pb-10 sm:px-8 sm:pt-16"><div className="mx-auto max-w-[800px]"><div className="mb-6 flex items-center gap-2 font-sans text-xs font-medium text-brand-text-body"><Link href="/">Beranda</Link><span>›</span><Link href="/blog">Blog</Link><span>›</span><span>{post.title}</span></div><div className="mb-4 flex flex-wrap gap-2"><BrandBadge tone="blue">{post.category}</BrandBadge></div><h1 className="mb-4 text-3xl leading-tight font-extrabold tracking-tight text-brand-navy text-balance sm:text-[clamp(30px,4vw,44px)]">{post.title}</h1><div className="flex flex-wrap items-center gap-3 font-sans text-sm text-brand-text-body"><span className="font-semibold text-brand-navy">{post.author}</span><span>·</span><span>{post.date}</span>{post.readTime && <><span>·</span><span>{post.readTime}</span></>}</div></div></section>
      <section className="bg-white px-5 pb-14 sm:px-8 sm:pb-24"><article className="mx-auto max-w-[800px]"><div className="relative mb-10 h-[240px] overflow-hidden rounded-3xl bg-brand-tint-blue sm:h-[420px]"><Image src={post.image} alt={post.imageAlt} fill sizes="800px" className="object-cover" style={{ objectPosition: post.imagePos }} priority /></div><p className="mb-6 text-lg leading-relaxed font-semibold text-brand-navy sm:text-xl">{post.excerpt}</p>{post.bodyMarkdown ? <MarkdownContent source={post.bodyMarkdown} /> : <p className="text-base leading-relaxed text-brand-text-body sm:text-lg">Isi tulisan sedang dilengkapi oleh panitia.</p>}</article></section>
      {related.length > 0 && <section className="bg-brand-bg-soft px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-[800px]"><div className="mb-6 text-lg font-bold text-brand-navy">Tulisan lainnya</div><div className="flex flex-col gap-4">{related.map((item) => <Link key={item.id} href={`/blog/${item.slug}`} className="flex items-center gap-4 rounded-xl border border-brand-border bg-white p-4 transition-shadow hover:shadow-brand-card"><div className="relative h-14 w-20 flex-none overflow-hidden rounded-lg bg-brand-tint-blue"><Image src={item.image} alt={item.imageAlt} fill className="object-cover" style={{ objectPosition: item.imagePos }} /></div><div><div className="font-sans text-xs text-brand-text-body">{item.date}</div><div className="mt-0.5 font-sans text-sm font-semibold text-brand-navy">{item.title}</div></div></Link>)}</div></div></section>}
    </>
  );
}
