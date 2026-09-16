"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DonationCta } from "./donation-cta";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/program", label: "Program" },
  { href: "/riwayat-donasi", label: "Riwayat Donasi" },
  { href: "/blog", label: "Blog" },
  // { href: "/galeri", label: "Galeri" },
];

function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-[60] border-b border-brand-border bg-white">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="flex flex-none items-center"
          aria-label="REMAX Home of Giving"
        >
          <Image
            src="/logo.svg"
            alt="REMAX Home of Giving"
            width={160}
            height={46}
            className="block h-10 w-auto sm:h-[46px]"
            priority
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-sans text-[15px] font-semibold text-brand-navy transition-colors",
                  active &&
                    "border-b-2 border-brand-red pb-0.5 text-brand-blue",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:block">
          <DonationCta size="sm" />
        </div>

        <button
          type="button"
          aria-label="Buka menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-border bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "font-sans text-base font-semibold text-brand-navy",
                    active && "text-brand-blue",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <DonationCta
              size="sm"
              className="w-full"
              onClick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { Navbar };
