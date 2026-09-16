"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type ProgramDocumentationItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  pos: string;
};

function ProgramDocumentation({ items }: { items: ProgramDocumentationItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex !== null ? items[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowLeft") setOpenIndex((value) => value === null || items.length === 0 ? null : (value - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setOpenIndex((value) => value === null || items.length === 0 ? null : (value + 1) % items.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, items.length]);

  function step(delta: number) {
    if (openIndex === null || items.length === 0) return;
    setOpenIndex((openIndex + delta + items.length) % items.length);
  }

  return (
    <>
      <section className="bg-brand-bg-soft px-5 py-14 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 font-hand text-2xl leading-none font-bold text-brand-blue sm:text-[32px]">{items.length} dokumentasi</div>
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">Dokumentasi</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4.5">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenIndex(index)}
                title="Klik untuk memperbesar"
                className="relative h-[130px] cursor-zoom-in overflow-hidden rounded-2xl bg-brand-tint-blue transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:h-[170px]"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                  style={{ objectPosition: item.pos }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>
      {current && <div role="dialog" aria-modal="true" aria-label={current.caption} onClick={() => setOpenIndex(null)} className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-brand-navy/95 px-4 py-10 sm:px-16"><div onClick={(event) => event.stopPropagation()} className="flex w-full max-w-[1040px] flex-col items-center gap-4.5"><div className="relative h-[45vh] w-full overflow-hidden rounded-2xl bg-brand-navy shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:h-[68vh]"><Image src={current.src} alt={current.alt} fill className="object-contain" /></div><div className="flex w-full flex-col items-center gap-4 text-center text-white sm:flex-row sm:justify-between sm:text-left"><div className="text-lg leading-snug font-bold sm:text-xl">{current.caption}</div><div className="flex flex-none items-center gap-3"><button type="button" onClick={() => step(-1)} aria-label="Sebelumnya" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/40 text-white"><ChevronLeft size={20} /></button><div className="min-w-16 text-center text-sm font-semibold opacity-80">{openIndex !== null ? openIndex + 1 : 0} / {items.length}</div><button type="button" onClick={() => step(1)} aria-label="Berikutnya" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/40 text-white"><ChevronRight size={20} /></button></div></div></div><button type="button" onClick={() => setOpenIndex(null)} className="flex items-center gap-1.5 font-sans text-sm font-bold text-white/75"><X size={16} />Tutup (Esc)</button></div>}
    </>
  );
}

export { ProgramDocumentation };
