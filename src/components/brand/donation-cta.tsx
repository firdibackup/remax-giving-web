"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { brandButtonVariants } from "@/components/brand/button";
import type { PublicCtaConfig } from "@/lib/public-data";
import { cn } from "@/lib/utils";

const DonationCtaContext = createContext<PublicCtaConfig | null>(null);

function DonationCtaProvider({
  config,
  children,
}: {
  config: PublicCtaConfig;
  children: ReactNode;
}) {
  return (
    <DonationCtaContext.Provider value={config}>
      {children}
    </DonationCtaContext.Provider>
  );
}

function useDonationCtaConfig() {
  const config = useContext(DonationCtaContext);

  if (!config) {
    throw new Error("DonationCta harus digunakan di dalam DonationCtaProvider.");
  }

  return config;
}

function buildDonationHref(config: PublicCtaConfig, campaignTitle?: string) {
  if (!config.phone) return null;

  const message = campaignTitle
    ? `${config.message}\n\nSaya ingin berdonasi untuk proyek "${campaignTitle}".`
    : config.message;

  return `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;
}

type DonationCtaProps = VariantProps<typeof brandButtonVariants> & {
  campaignTitle?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
};

function DonationCta({
  campaignTitle,
  children = "Donasi Sekarang →",
  className,
  onClick,
  variant = "primary",
  size = "md",
}: DonationCtaProps) {
  const config = useDonationCtaConfig();
  const href = buildDonationHref(config, campaignTitle);
  const classes = cn(brandButtonVariants({ variant, size }), className);

  if (!href) {
    const unavailableLabel = campaignTitle
      ? `Donasi untuk ${campaignTitle} belum tersedia karena nomor WhatsApp belum dikonfigurasi`
      : "Donasi belum tersedia karena nomor WhatsApp belum dikonfigurasi";

    return (
      <button
        type="button"
        disabled
        aria-label={unavailableLabel}
        title="Nomor WhatsApp donasi belum tersedia"
        className={cn(classes, "cursor-not-allowed shadow-none")}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={classes}
    >
      {children}
    </a>
  );
}

export {
  DonationCta,
  DonationCtaProvider,
  buildDonationHref,
  useDonationCtaConfig,
};
