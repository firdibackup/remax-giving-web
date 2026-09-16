"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpenText,
  FolderHeart,
  HandCoins,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminSession } from "@/lib/auth/admin";

const navigation = [
  {
    label: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        available: true,
      },
      {
        label: "Donasi",
        href: "/admin/donasi",
        icon: HandCoins,
        available: true,
      },
      {
        label: "Proyek",
        href: "/admin/proyek",
        icon: FolderHeart,
        available: true,
      },
      // {
      //   label: "Laporan",
      //   href: "/admin/laporan",
      //   icon: FileCheck2,
      //   available: true,
      // },
    ],
  },
  {
    label: "Konten",
    items: [
      {
        label: "Blog",
        href: "/admin/konten/blog",
        icon: BookOpenText,
        available: true,
      },
      {
        label: "Media",
        href: "/admin/konten/media",
        icon: ImageIcon,
        available: true,
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        label: "Pengaturan",
        href: "/admin/pengaturan",
        icon: Settings,
        available: true,
      },
      {
        label: "Audit log",
        href: "/admin/audit",
        icon: ShieldCheck,
        available: true,
      },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[88px] items-center border-b border-brand-border px-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <Image
            src="/logo.svg"
            alt="REMAX Home of Giving"
            width={128}
            height={60}
            className="h-12 w-auto"
          />
        </Link>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label="Navigasi Super Admin"
      >
        {navigation.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.12em] text-brand-text-body uppercase">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(`${item.href}/`));

                if (!item.available) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-text-body/70"
                      aria-disabled="true"
                    >
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px] font-bold tracking-wide text-brand-text-body/60 uppercase">
                        Segera
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-brand-tint-blue text-brand-blue"
                        : "text-brand-text-body hover:bg-brand-bg-soft hover:text-brand-navy",
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-brand-border p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg bg-brand-bg-soft px-3 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-tint-blue"
        >
          <ShieldCheck className="size-5 text-brand-blue" />
          Lihat website publik
        </Link>
      </div>
    </div>
  );
}

function AdminShell({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f6fa] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-brand-border lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-brand-border bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet
              open={mobileNavigationOpen}
              onOpenChange={setMobileNavigationOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="lg:hidden"
                  aria-label="Buka navigasi"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                className="w-[288px] max-w-[84vw] gap-0 p-0"
              >
                <SheetTitle className="sr-only">
                  Navigasi Super Admin
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Menu pengelolaan Home of Giving
                </SheetDescription>
                <SidebarContent
                  onNavigate={() => setMobileNavigationOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-sm font-bold text-brand-navy">Super Admin</p>
              <p className="hidden text-xs text-brand-text-body sm:block">
                REMAX Home of Giving
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="flex size-10 cursor-not-allowed items-center justify-center rounded-lg border border-brand-border text-brand-text-body/45"
              aria-label="Notifikasi belum tersedia"
              disabled
            >
              <Bell className="size-[18px]" />
            </button>

            <div className="hidden h-9 w-px bg-brand-border sm:block" />

            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-sm font-bold text-brand-navy">
                {admin.displayName}
              </p>
              <p className="max-w-44 truncate text-xs text-brand-text-body">
                {admin.email}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-navy text-sm font-extrabold text-white">
              {admin.displayName.slice(0, 1).toUpperCase()}
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-lg"
                aria-label="Keluar"
              >
                <LogOut className="size-[18px]" />
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AdminShell };
