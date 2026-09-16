"use client";

import { usePathname } from "next/navigation";
import { DonationCtaProvider } from "@/components/brand/donation-cta";
import { Footer } from "@/components/brand/footer";
import { Navbar } from "@/components/brand/navbar";
import { WhatsAppCta } from "@/components/brand/whatsapp-cta";
import type { PublicCtaConfig } from "@/lib/public-data";

function SiteChrome({ children, cta }: { children: React.ReactNode; cta: PublicCtaConfig }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <DonationCtaProvider config={cta}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppCta />
    </DonationCtaProvider>
  );
}

export { SiteChrome };
