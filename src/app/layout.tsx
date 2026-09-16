import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { getPublicCtaConfig } from "@/lib/public-data";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "REMAX Home of Giving",
  description:
    "REMAX Home of Giving menyalurkan donasi agent, rekan, dan mitra RE/MAX Indonesia ke satu penerima manfaat per proyek — dengan bukti penyaluran yang bisa dilacak sampai tuntas.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cta = await getPublicCtaConfig();

  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white">
        <SiteChrome cta={cta}>{children}</SiteChrome>
      </body>
    </html>
  );
}
