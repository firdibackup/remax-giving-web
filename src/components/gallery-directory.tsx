"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { BrandStatCounter } from "@/components/brand/stat-counter";
import { cn } from "@/lib/utils";
import type { PublicGalleryAlbum, PublicGalleryItem } from "@/lib/public-data";

function GalleryDirectory({ media, albums }: { media: PublicGalleryItem[]; albums: PublicGalleryAlbum[] }) {
  const filters = useMemo(() => ["Semua", ...Array.from(new Set(media.map((item) => item.album)))], [media]);
  const locations = new Set(media.map((item) => item.meta.split(" · ")[0]).filter(Boolean));
  const [album, setAlbum] = useState("Semua");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const list = album === "Semua" ? media : media.filter((item) => item.album === album);
  const current = openIndex !== null ? list[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowLeft") setOpenIndex((value) => value === null || list.length === 0 ? null : (value - 1 + list.length) % list.length);
      if (event.key === "ArrowRight") setOpenIndex((value) => value === null || list.length === 0 ? null : (value + 1) % list.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, list.length]);

  function step(delta: number) {
    if (openIndex === null || list.length === 0) return;
    setOpenIndex((openIndex + delta + list.length) % list.length);
  }

  return (
    <>
      <PageHeader breadcrumbLabel="Galeri" eyebrow="Galeri dokumentasi" title="Bukti yang bisa dilihat" description="Foto serah terima, kegiatan relawan, dan kondisi penerima manfaat dari setiap siklus. Klik foto untuk melihat versi besar beserta keterangannya." side={<div className="grid grid-cols-3 justify-items-center gap-4 sm:gap-5"><BrandStatCounter value={String(media.length)} label="Foto terdokumentasi" /><BrandStatCounter value={String(albums.length)} label="Album" tone="red" /><BrandStatCounter value={String(locations.size)} label="Lokasi kegiatan" /></div>} />
      <section className="bg-white px-5 py-12 sm:px-8 sm:py-16 sm:pb-24"><div className="mx-auto max-w-[1200px]"><div className="flex flex-wrap items-center justify-between gap-5 border-b border-brand-border pb-6"><div className="flex flex-wrap gap-2.5">{filters.map((label) => <button key={label} type="button" onClick={() => { setAlbum(label); setOpenIndex(null); }} className={cn("cursor-pointer rounded-full border-[1.5px] px-4.5 py-2 font-sans text-sm font-bold transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px", label === album ? "border-brand-blue bg-brand-blue text-white" : "border-brand-border bg-white text-brand-navy")}>{label}</button>)}</div><div className="font-sans text-xs text-brand-text-body">{list.length} foto ditampilkan</div></div>{list.length > 0 ? <div className="mt-9 grid auto-rows-[160px] grid-cols-2 gap-4 sm:auto-rows-[210px] sm:grid-cols-4 sm:gap-5">{list.map((photo, index) => <button key={photo.id} type="button" onClick={() => setOpenIndex(index)} className={cn("group relative cursor-pointer overflow-hidden rounded-2xl bg-brand-tint-blue text-left shadow-brand-card transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-brand-card-hover", photo.span === "wide" && "col-span-2", photo.span === "tall" && "row-span-2")}><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" style={{ objectPosition: photo.pos }} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/85 to-transparent px-4.5 pt-8 pb-4"><div className="text-[11px] font-bold tracking-[0.12em] text-white/80 uppercase">{photo.album}</div><div className="mt-0.5 text-sm leading-snug font-semibold text-white">{photo.caption}</div></div></button>)}</div> : <div className="py-16 text-center text-brand-text-body">Belum ada dokumentasi pada album ini.</div>}</div></section>
      {albums.length > 0 && <section className="bg-brand-bg-soft px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1200px]"><div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><div className="font-hand text-2xl leading-none font-bold text-brand-blue sm:text-[32px]">Album dokumentasi</div><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">Telusuri setiap kegiatan</h2></div><Link href="/program" className="flex-none font-sans text-base font-bold text-brand-blue">Semua program →</Link></div><div className="grid grid-cols-1 gap-7 sm:grid-cols-3">{albums.map((item) => { const content = <><div className="relative h-[190px] overflow-hidden"><Image src={item.image} alt={`Album ${item.title}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" style={{ objectPosition: item.imagePos }} /></div><div className="flex flex-col gap-2 p-5.5"><div className="font-sans text-xs font-bold tracking-[0.1em] text-brand-red uppercase">{item.photoCount} foto · {item.period}</div><div className="text-xl leading-snug font-bold text-brand-navy">{item.title}</div><div className="font-sans text-sm leading-relaxed text-brand-text-body">{item.description}</div></div></>; const classes = "flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-brand-card transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-brand-card-hover"; return item.slug ? <Link key={item.title} href={`/program/${item.slug}`} className={classes}>{content}</Link> : <article key={item.title} className={classes}>{content}</article>; })}</div></div></section>}
      {current && <div role="dialog" aria-modal="true" aria-label={current.caption} onClick={() => setOpenIndex(null)} className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-brand-navy/95 px-4 py-10 sm:px-16"><div onClick={(event) => event.stopPropagation()} className="flex w-full max-w-[1040px] flex-col items-center gap-4.5"><div className="relative h-[45vh] w-full overflow-hidden rounded-2xl bg-brand-navy shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:h-[68vh]"><Image src={current.src} alt={current.alt} fill className="object-contain" /></div><div className="flex w-full flex-col items-center gap-4 text-center text-white sm:flex-row sm:justify-between sm:text-left"><div><div className="text-xs font-bold tracking-[0.12em] text-brand-red uppercase">{current.album}</div><div className="mt-1.5 text-lg leading-snug font-bold sm:text-xl">{current.caption}</div><div className="mt-1 text-sm opacity-72">{current.meta}</div></div><div className="flex flex-none items-center gap-3"><button type="button" onClick={() => step(-1)} aria-label="Sebelumnya" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/40 text-white"><ChevronLeft size={20} /></button><div className="min-w-16 text-center text-sm font-semibold opacity-80">{openIndex !== null ? openIndex + 1 : 0} / {list.length}</div><button type="button" onClick={() => step(1)} aria-label="Berikutnya" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/40 text-white"><ChevronRight size={20} /></button></div></div></div><button type="button" onClick={() => setOpenIndex(null)} className="flex items-center gap-1.5 font-sans text-sm font-bold text-white/75"><X size={16} />Tutup (Esc)</button></div>}
    </>
  );
}

export { GalleryDirectory };
