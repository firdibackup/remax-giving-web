import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/brand/reveal";
import type { PublicBlogItem } from "@/lib/public-data";

function Stories({ posts }: { posts: PublicBlogItem[] }) {
  const [main, second, third] = posts;

  if (!main) return null;

  return (
    <section
      id="cerita"
      className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-hand text-2xl leading-none font-bold text-brand-blue sm:text-[32px]">
              Cerita &amp; Dokumentasi
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy uppercase sm:text-[clamp(24px,3vw,32px)]">
              Apa yang berubah setelahnya
            </h2>
          </div>
          <Link
            href="/blog"
            className="flex-none font-sans text-base font-bold text-brand-blue"
          >
            baca cerita lainnya →
          </Link>
        </Reveal>
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3">
          <Link href={`/blog/${main.slug}`} className="block">
            <div className="h-[220px] overflow-hidden rounded-2xl bg-brand-tint-blue sm:h-[300px]">
              <Image
                src={main.image}
                alt={main.imageAlt}
                width={640}
                height={780}
                className="h-full w-full object-cover"
                style={{ objectPosition: main.imagePos }}
              />
            </div>
            <div className="mt-4 font-sans text-xs text-brand-text-body">
              {main.date} · {main.author}
            </div>
            <div className="mt-1.5 text-xl leading-snug font-bold text-brand-navy">
              {main.title}
            </div>
            <div className="mt-2 text-base leading-relaxed text-brand-text-body text-pretty">
              {main.excerpt}
            </div>
          </Link>
          {second && (
            <Link href={`/blog/${second.slug}`} className="block sm:mt-7">
              <div className="h-[180px] overflow-hidden rounded-2xl bg-brand-tint-blue sm:h-[230px]">
                <Image
                  src={second.image}
                  alt={second.imageAlt}
                  width={480}
                  height={560}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: second.imagePos }}
                />
              </div>
              <div className="mt-3.5 font-sans text-xs text-brand-text-body">
                {second.date}
              </div>
              <div className="mt-1 text-[17px] leading-snug font-bold text-brand-navy">
                {second.title}
              </div>
            </Link>
          )}
          {third && (
            <Link href={`/blog/${third.slug}`} className="block sm:mt-14">
              <div className="h-[180px] overflow-hidden rounded-2xl bg-brand-tint-blue sm:h-[230px]">
                <Image
                  src={third.image}
                  alt={third.imageAlt}
                  width={480}
                  height={560}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: third.imagePos }}
                />
              </div>
              <div className="mt-3.5 font-sans text-xs text-brand-text-body">
                {third.date}
              </div>
              <div className="mt-1 text-[17px] leading-snug font-bold text-brand-navy">
                {third.title}
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export { Stories };
