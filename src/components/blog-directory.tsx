"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { BrandBadge } from "@/components/brand/badge";
import { cn } from "@/lib/utils";
import type { PublicBlogItem } from "@/lib/public-data";

function BlogDirectory({ posts }: { posts: PublicBlogItem[] }) {
  const [category, setCategory] = useState("Semua");
  const featured = posts.find((post) => post.featured) || posts[0];
  const rest = posts.filter((post) => post.id !== featured?.id);
  const categories = ["Semua", ...Array.from(new Set(posts.map((post) => post.category)))];
  const filtered = category === "Semua" ? rest : rest.filter((post) => post.category === category);

  return (
    <>
      <PageHeader breadcrumbLabel="Blog" eyebrow="Cerita & Kabar" eyebrowTone="blue" title="Apa yang berubah setelahnya" description="Catatan panitia dari lapangan: siapa yang menerima, bagaimana dana dipakai, dan pelajaran yang kami bawa ke siklus berikutnya." />
      {featured ? <section className="bg-brand-bg-soft px-5 pb-16 sm:px-8 sm:pb-24"><div className="mx-auto max-w-[1200px]"><Link href={`/blog/${featured.slug}`} className="grid overflow-hidden rounded-3xl border border-brand-border bg-white shadow-brand-card transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-brand-card-hover md:grid-cols-[1.15fr_1fr]"><div className="relative h-[220px] w-full overflow-hidden bg-brand-tint-blue sm:h-[320px] md:h-auto md:min-h-[400px]"><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover" style={{ objectPosition: featured.imagePos }} /></div><div className="flex flex-col justify-center gap-4 p-6 sm:p-11"><div className="flex flex-wrap gap-2"><BrandBadge tone="red">Tulisan utama</BrandBadge><BrandBadge tone="blue">{featured.category}</BrandBadge></div><h2 className="text-2xl leading-tight font-extrabold tracking-tight text-brand-navy text-balance sm:text-[34px]">{featured.title}</h2><p className="text-base leading-relaxed text-brand-text-body text-pretty sm:text-lg">{featured.excerpt}</p><div className="flex flex-wrap items-center gap-3.5 font-sans text-xs text-brand-text-body"><span className="font-semibold text-brand-navy">{featured.author}</span><span>·</span><span>{featured.date}</span>{featured.readTime && <><span>·</span><span>{featured.readTime}</span></>}</div><div className="mt-1.5 font-sans text-base font-bold text-brand-red">Baca cerita ini →</div></div></Link></div></section> : <section className="bg-brand-bg-soft px-5 pb-16 sm:px-8 sm:pb-24"><div className="mx-auto max-w-[1200px] rounded-2xl bg-white px-6 py-16 text-center text-brand-text-body">Belum ada tulisan yang dipublikasikan.</div></section>}
      <section className="bg-white px-5 py-14 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1200px]"><div className="flex flex-wrap items-end justify-between gap-5 border-b border-brand-border pb-6"><h2 className="text-xl font-bold text-brand-navy">Semua tulisan</h2><div className="flex flex-wrap gap-2.5">{categories.map((label) => <button key={label} type="button" onClick={() => setCategory(label)} className={cn("cursor-pointer rounded-full border-[1.5px] px-4.5 py-2 font-sans text-sm font-bold transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px", label === category ? "border-brand-blue bg-brand-blue text-white" : "border-brand-border bg-white text-brand-navy")}>{label}</button>)}</div></div><div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((post) => <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-brand-card transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-brand-card-hover"><div className="relative h-[190px] overflow-hidden bg-brand-tint-blue"><Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" style={{ objectPosition: post.imagePos }} /></div><div className="flex flex-1 flex-col gap-2.5 p-6"><div className="flex items-center gap-2.5 font-sans text-xs font-bold tracking-[0.08em] text-brand-blue uppercase"><span>{post.category}</span><span className="text-brand-border">|</span><span className="tracking-wide text-brand-text-body">{post.date}</span></div><h3 className="text-lg leading-snug font-bold text-brand-navy text-pretty">{post.title}</h3><p className="text-sm leading-relaxed text-brand-text-body text-pretty">{post.excerpt}</p><div className="mt-auto pt-3.5 font-sans text-sm font-bold text-brand-red">Baca selengkapnya →</div></div></Link>)}</div>{filtered.length === 0 && <div className="py-16 text-center text-brand-text-body">Belum ada tulisan pada kategori ini.</div>}</div></section>
    </>
  );
}

export { BlogDirectory };
