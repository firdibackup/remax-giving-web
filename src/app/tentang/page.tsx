import Image from "next/image";
import { PageHeader } from "@/components/brand/page-header";
import { Reveal } from "@/components/brand/reveal";
import { BrandBadge } from "@/components/brand/badge";
import { DonationCta } from "@/components/brand/donation-cta";
import { BASE_PATH } from "@/lib/base-path";

export const metadata = {
  title: "Tentang · REMAX Home of Giving",
  description:
    "REMAX Home of Giving adalah program sosial REMAX Indonesia untuk berbagi kasih, kepedulian, dan dampak positif bagi mereka yang membutuhkan.",
};

const values = [
  {
    image: "/about-value/1.webp",
    title: "Rasa aman & nyaman",
    body: "Layaknya sebuah rumah, program ini menghadirkan rasa aman dan nyaman bagi siapa pun yang ingin berbuat baik.",
  },
  {
    image: "/about-value/2.webp",
    title: "Berbagi kasih & kepedulian",
    body: "Ruang untuk berbagi kasih, kepedulian, dan semangat kepada sesama yang membutuhkan.",
  },
  {
    image: "/about-value/3.webp",
    title: "Dampak positif nyata",
    body: "Kebaikan yang dapat dirasakan dan memberikan dampak positif bagi masyarakat dan lingkungan sekitar.",
  },
];

const participants = [
  {
    image: "/guardiant-agent.png",
    tag: "Guardian Agents",
    title: "Keluarga besar REMAX Indonesia",
    body: "Para Guardian Agents — agen REMAX Indonesia — dapat turut berbagi dan memberikan dukungan kepada mereka yang membutuhkan.",
  },
  {
    image: "/masyarakat-umum.png",
    tag: "Masyarakat umum",
    title: "Terbuka untuk semua",
    body: "Program ini juga terbuka untuk masyarakat umum yang ingin ikut berpartisipasi melalui donasi maupun bentuk dukungan lainnya.",
  },
];

export default function TentangPage() {
  return (
    <>
      <PageHeader
        breadcrumbLabel="Tentang"
        eyebrow="Tentang kami"
        title="REMAX Home of Giving"
        description="Program sosial yang menjadi bagian dari komitmen REMAX Indonesia untuk memberikan dampak positif bagi masyarakat dan lingkungan sekitar."
        side={
          <div className="relative h-[240px] w-full overflow-hidden rounded-3xl border border-brand-border shadow-brand-card sm:h-[320px]">
            <Image
              src={`${BASE_PATH}/photos/community-04-web.jpg`}
              alt="Kegiatan sosial REMAX Home of Giving"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          </div>
        }
      />

      {/* Cerita */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <div className="relative h-[300px] w-full overflow-hidden rounded-3xl border border-brand-border bg-brand-tint-blue shadow-brand-card sm:h-[420px]">
              <Image
                src={`${BASE_PATH}/photos/community-02-web.jpg`}
                alt="Berbagi bersama keluarga besar REMAX"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div>
              <div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">
                Rumah untuk berbagi
              </div>
              <h2 className="mt-2 mb-5 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">
                Rumah yang memberi rasa aman, nyaman, dan penuh arti
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-brand-text-body text-pretty sm:text-lg">
                <p>
                  Program ini mulai berjalan pada tahun 2026, dengan semangat
                  untuk mengajak keluarga besar REMAX berkontribusi dan berbagi
                  melalui berbagai kegiatan sosial dan kemanusiaan.
                </p>
                <p>
                  Bagi kami, REMAX Home of Giving layaknya sebuah rumah yang
                  memberikan rasa aman dan nyaman, sekaligus menjadi ruang untuk
                  berbagi kasih, kepedulian, dan semangat kepada sesama.
                </p>
                <p>
                  Melalui program ini, kami ingin menghadirkan kebaikan yang
                  dapat dirasakan dan memberikan dampak positif bagi mereka yang
                  membutuhkan.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Nilai */}
      <section className="bg-brand-bg-soft px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Reveal className="mb-10 max-w-[640px]">
            <div className="font-hand text-2xl leading-none font-bold text-brand-blue sm:text-[32px]">
              Semangat kami
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">
              Nilai yang kami rawat
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 90}>
                <div className="flex h-full flex-col gap-4 rounded-3xl border border-brand-border bg-white p-7 shadow-brand-card">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-bg-soft">
                    <Image
                      src={`${BASE_PATH}${value.image}`}
                      alt={value.title}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-brand-navy">
                    {value.title}
                  </h3>
                  <p className="text-base leading-relaxed text-brand-text-body text-pretty">
                    {value.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Siapa yang berpartisipasi */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Reveal className="mb-10 max-w-[640px]">
            <div className="font-hand text-2xl leading-none font-bold text-brand-red sm:text-[32px]">
              Bersama kita memberi
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">
              Siapa yang bisa ikut berbagi
            </h2>
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            {participants.map((p, i) => (
              <Reveal key={p.tag} delay={i * 90}>
                <div className="flex h-full flex-col gap-5 rounded-3xl border border-brand-border bg-white p-6 shadow-brand-card sm:flex-row sm:items-center sm:gap-6 sm:p-7">
                  <div className="relative aspect-square w-full flex-none overflow-hidden rounded-2xl bg-brand-tint-blue sm:h-40 sm:w-40">
                    <Image
                      src={`${BASE_PATH}${p.image}`}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 160px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <BrandBadge tone={i === 0 ? "blue" : "red"}>
                      {p.tag}
                    </BrandBadge>
                    <h3 className="text-xl font-extrabold tracking-tight text-brand-navy">
                      {p.title}
                    </h3>
                    <p className="text-base leading-relaxed text-brand-text-body text-pretty">
                      {p.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Penutup */}
      <section className="relative overflow-hidden bg-brand-navy px-5 py-20 sm:px-8 sm:py-28">
        <div className="pointer-events-none absolute -right-14 bottom-10 hidden h-[300px] w-[240px] overflow-hidden rounded-3xl opacity-50 sm:block">
          <Image
            src={`${BASE_PATH}/photos/community-03-web.jpg`}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-[760px] text-center text-white">
          <Reveal>
            <div className="font-hand text-2xl leading-none font-bold opacity-80 sm:text-[32px]">
              Together we give
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-2.5 mb-4.5 text-3xl leading-[1.05] font-extrabold tracking-tight uppercase sm:text-[clamp(32px,4vw,48px)]">
              Bersama, kita berbagi.
              <br />
              <span className="text-brand-red">
                Bersama, kita memberi arti.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-6 flex justify-center">
              <DonationCta size="lg" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
