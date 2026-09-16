import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  breadcrumbLabel: string;
  eyebrow: string;
  eyebrowTone?: "blue" | "red";
  title: string;
  description: string;
  tone?: "soft" | "navy";
  side?: ReactNode;
  className?: string;
}

function PageHeader({
  breadcrumbLabel,
  eyebrow,
  eyebrowTone = "red",
  title,
  description,
  tone = "soft",
  side,
  className,
}: PageHeaderProps) {
  const dark = tone === "navy";

  return (
    <section
      className={cn(
        "relative overflow-hidden px-5 pt-14 pb-16 sm:px-8 sm:pt-16 sm:pb-[72px]",
        dark ? "bg-brand-navy text-white" : "bg-brand-bg-soft",
        className
      )}
    >
      {tone === "soft" && (
        <div className="pointer-events-none absolute -top-32 -right-20 hidden h-[400px] w-[400px] rounded-full bg-brand-tint-blue sm:block sm:-top-[200px] sm:-right-[140px] sm:h-[520px] sm:w-[520px]" />
      )}
      {dark && (
        <div className="pointer-events-none absolute -top-40 -right-24 h-[300px] w-[300px] rounded-full bg-white/6 sm:h-[480px] sm:w-[480px]" />
      )}
      <div className="relative mx-auto max-w-[1200px]">
        <div
          className={cn(
            "mb-6 flex items-center gap-2 font-sans text-xs font-medium sm:mb-7",
            dark ? "text-white/80" : "text-brand-text-body"
          )}
        >
          <Link href="/" className={dark ? "text-white" : undefined}>
            Beranda
          </Link>
          <span>›</span>
          <span className={dark ? "opacity-70" : undefined}>{breadcrumbLabel}</span>
        </div>

        <div className={cn(side && "grid items-end gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14")}>
          <div>
            <div
              className={cn(
                "font-hand text-2xl leading-none font-bold sm:text-[32px]",
                eyebrowTone === "blue" ? "text-brand-blue" : "text-brand-red",
                dark && "text-white/90"
              )}
            >
              {eyebrow}
            </div>
            <h1
              className={cn(
                "mt-2.5 mb-4 max-w-[760px] text-3xl leading-[1.04] font-extrabold tracking-tight uppercase text-balance sm:text-[clamp(32px,4vw,48px)]",
                dark ? "text-white" : "text-brand-navy"
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                "max-w-[560px] text-base leading-relaxed text-pretty sm:text-lg",
                dark ? "text-white/86" : "text-brand-text-body"
              )}
            >
              {description}
            </p>
          </div>
          {side && <div className="mt-8 lg:mt-0">{side}</div>}
        </div>
      </div>
    </section>
  );
}

export { PageHeader };
