import Image from "next/image";
import { DonationCta } from "@/components/brand/donation-cta";
import { Reveal } from "@/components/brand/reveal";

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-brand-navy px-5 py-20 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute top-16 -left-16 hidden h-[280px] w-[220px] overflow-hidden rounded-3xl opacity-50 sm:block">
        <Image src="/photos/community-03-web.jpg" alt="" fill className="object-cover" />
      </div>
      <div className="pointer-events-none absolute -right-14 bottom-10 hidden h-[300px] w-[240px] overflow-hidden rounded-3xl opacity-50 sm:block">
        <Image src="/photos/community-02-web.jpg" alt="" fill className="object-cover" />
      </div>

      <div className="relative mx-auto max-w-[760px] text-center text-white">
        <Reveal>
          <div className="font-hand text-2xl leading-none font-bold opacity-80 sm:text-[32px]">
            Together we give
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-2.5 mb-4.5 text-3xl leading-[1.05] font-extrabold tracking-tight uppercase sm:text-[clamp(32px,4vw,48px)]">
            Satu donasi.
            <br />
            <span className="text-brand-red">Banyak harapan.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mb-7 max-w-[520px] text-base leading-relaxed opacity-85 sm:text-lg">
            Donasi berikutnya menentukan proyek mana yang bisa kami buka bulan
            depan.
          </p>
        </Reveal>
        <Reveal delay={220}>
          <div className="flex justify-center">
            <DonationCta size="lg" />
          </div>
        </Reveal>
        <Reveal delay={290}>
          <div className="mt-5 font-sans text-xs opacity-70">
            atau chat panitia untuk konfirmasi transfer &amp; pertanyaan program
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { FinalCta };
