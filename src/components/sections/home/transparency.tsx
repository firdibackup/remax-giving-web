import Image from "next/image";
import { BrandBadge } from "@/components/brand/badge";
import { Reveal } from "@/components/brand/reveal";

const steps = [
  {
    num: "01",
    title: "Panitia memilih penerima",
    detail: "Survei kebutuhan, verifikasi lembaga atau keluarga penerima, lalu target donasi ditetapkan.",
  },
  {
    num: "02",
    title: "Donasi masuk & dicatat",
    detail: "Transfer dikonfirmasi admin sebelum dicatat di papan donatur. Nama donatur selalu disamarkan.",
  },
  {
    num: "03",
    title: "Dana diserahkan langsung",
    detail: "Penyerahan dilakukan di lokasi penerima, dicatat tanggalnya, dan didokumentasikan.",
  },
  {
    num: "04",
    title: "Laporan dibuka untuk publik",
    detail: "Rincian penggunaan dana, foto serah terima, dan laporan PDF tersedia di halaman proyek.",
  },
];

function Transparency() {
  return (
    <section id="transparansi" className="scroll-mt-20 overflow-hidden bg-brand-blue px-5 py-16 text-white sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Reveal className="mb-4 flex">
            <BrandBadge tone="red">Transparansi</BrandBadge>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mb-4 text-2xl leading-snug font-extrabold tracking-tight uppercase sm:text-[clamp(24px,3vw,32px)]">
              Setiap rupiah bisa dilacak
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mb-10 max-w-[520px] text-base leading-relaxed text-white/88 sm:text-lg">
              Donasi tidak digabung ke satu kas besar. Setiap proyek punya satu
              penerima, satu laporan penggunaan dana, dan satu album dokumentasi
              yang bisa dibuka siapa saja.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 90}>
                <div className="rounded-2xl border border-white/24 p-6">
                  <div className="mb-2.5 text-[15px] font-extrabold text-white/50">{step.num}</div>
                  <div className="mb-2 text-[17px] font-bold">{step.title}</div>
                  <div className="text-sm leading-relaxed text-white/82">{step.detail}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="relative pb-16">
          <div className="h-[300px] overflow-hidden rounded-3xl shadow-brand-card-hover sm:h-[520px]">
            <Image
              src="/photos/community-02-web.jpg"
              alt="Serah terima donasi kepada penerima manfaat"
              width={800}
              height={1040}
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          </div>
          <div className="relative mx-auto -mt-10 w-[calc(100%-32px)] max-w-[300px] rounded-2xl bg-white p-6 shadow-brand-card-hover sm:absolute sm:bottom-0 sm:-left-10 sm:mt-0 sm:w-[300px]">
            <div className="mb-2.5 font-sans text-xs font-bold tracking-[0.12em] text-brand-red uppercase">
              Proyek tuntas
            </div>
            <div className="mb-1.5 font-sans text-[17px] font-bold text-brand-navy">
              Renovasi Rumah Ibadah
            </div>
            <div className="font-sans text-sm leading-relaxed text-brand-text-body">
              Rp 80.000.000 diserahkan ke Masjid Al-Ikhlas, Cianjur · laporan dan
              12 foto tersedia.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Transparency };
