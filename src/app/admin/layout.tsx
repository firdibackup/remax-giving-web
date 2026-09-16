import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin | REMAX Home of Giving",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
