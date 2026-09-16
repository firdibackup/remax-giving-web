"use client";

import { motion } from "motion/react";
import {
  buildDonationHref,
  useDonationCtaConfig,
} from "@/components/brand/donation-cta";

const classes = "fixed right-4 bottom-4 z-[70] flex items-center gap-2.5 rounded-full bg-brand-blue px-5 py-3.5 font-sans text-sm font-bold text-white shadow-[0_10px_30px_rgba(6,46,97,0.28)] sm:right-6 sm:bottom-6";

function WhatsAppCta() {
  const config = useDonationCtaConfig();
  const href = buildDonationHref(config);

  if (!href) {
    return (
      <motion.button
        type="button"
        disabled
        aria-label="Chat WhatsApp belum tersedia karena nomor belum dikonfigurasi"
        title="Nomor WhatsApp belum tersedia"
        className={`${classes} cursor-not-allowed opacity-55 shadow-none`}
      >
        <span className="h-2.5 w-2.5 flex-none rounded-full bg-white" />
        <span>{config.label}</span>
      </motion.button>
    );
  }

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={config.label}
      className={classes}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="h-2.5 w-2.5 flex-none rounded-full bg-white" />
      <span>{config.label}</span>
    </motion.a>
  );
}

export { WhatsAppCta };
