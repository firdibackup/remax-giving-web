import Image from "next/image";
import { BASE_PATH } from "@/lib/base-path";
import { DonationCta } from "@/components/brand/donation-cta";
import { Reveal } from "@/components/brand/reveal";

// Decorative photo collage framing the CTA. `reveal` gates each tile per
// breakpoint so smaller desktops stay light and only wide screens fill in.
const decorTiles = [
  { src: "community-03-web.jpg", tile: "top-20 left-[-48px] h-[250px] w-[190px] -rotate-6 opacity-60", reveal: "sm:block" },
  { src: "community-02-web.jpg", tile: "bottom-14 right-[-48px] h-[270px] w-[205px] rotate-6 opacity-60", reveal: "sm:block" },
  { src: "community-05-web.JPG", tile: "bottom-16 left-6 h-[160px] w-[128px] rotate-3 opacity-50", reveal: "xl:block" },
  { src: "community-01-web.jpg", tile: "top-16 right-8 h-[160px] w-[128px] -rotate-3 opacity-50", reveal: "xl:block" },
  { src: "community-07-web.JPG", tile: "top-12 left-[150px] h-[120px] w-[96px] rotate-6 opacity-45", reveal: "2xl:block" },
  { src: "community-06-web.JPG", tile: "bottom-10 right-[150px] h-[120px] w-[96px] -rotate-6 opacity-45", reveal: "2xl:block" },
];

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-brand-navy px-5 py-20 sm:px-8 sm:py-28">
      {decorTiles.map(({ src, tile, reveal }) => (
        <div
          key={src}
          aria-hidden
          className={`pointer-events-none absolute hidden overflow-hidden rounded-[20px] shadow-2xl shadow-black/40 ring-1 ring-white/10 ${tile} ${reveal}`}
        >
          <Image
            src={`${BASE_PATH}/photos/${src}`}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      ))}

      {/* vignette keeps the centered copy readable over the photos */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--brand-navy)_75%)]" />

      <div className="relative mx-auto max-w-[760px] text-center text-white">
        <Reveal>
          <div className="font-hand text-2xl leading-none font-bold opacity-80 sm:text-[32px]">
            Together, We Give
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-2.5 mb-4.5 text-3xl leading-[1.05] font-extrabold tracking-tight uppercase sm:text-[clamp(32px,4vw,48px)]">
            Satu Kebaikan,
            <br />
            <span className="text-brand-red">Berarti bagi Sesama.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mb-7 max-w-[520px] text-base leading-relaxed opacity-85 sm:text-lg">
            Mari hadirkan dukungan dan manfaat nyata bagi mereka yang
            membutuhkan.
          </p>
        </Reveal>
        <Reveal delay={220}>
          <div className="flex justify-center">
            <DonationCta size="lg" />
          </div>
        </Reveal>
        <Reveal delay={290}>
          <div className="mt-5 font-sans text-xs opacity-70">
            atau chat pengurus untuk konfirmasi transfer & pertanyaan program
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { FinalCta };
