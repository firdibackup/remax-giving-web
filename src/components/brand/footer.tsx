import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/program", label: "Program" },
  { href: "/riwayat-donasi", label: "Transparansi" },
  { href: "/blog", label: "Blog" },
  { href: "/galeri", label: "Galeri" },
];

function Footer() {
  return (
    <footer className="bg-brand-navy px-5 py-14 text-white sm:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 h-[3px] w-16 rounded-sm bg-brand-red" />
        <div className="flex flex-wrap items-center justify-between gap-8"><Image src="/logo.svg" alt="REMAX Home of Giving" width={160} height={44} className="h-11 w-auto brightness-0 invert" /><div className="flex flex-wrap gap-7">{footerLinks.map((link) => <Link key={link.href} href={link.href} className="font-sans text-sm text-white/85">{link.label}</Link>)}</div></div>
        <div className="mt-10 border-t border-white/15 pt-5 font-sans text-[13px] text-white/70">© 2026 REMAX Home of Giving. All rights reserved.</div>
      </div>
    </footer>
  );
}

export { Footer };
