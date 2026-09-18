"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 text-center shadow-[0_16px_44px_rgba(6,46,97,0.08)]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-tint-red text-brand-red">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold tracking-[-0.02em] text-brand-navy">
          Halaman gagal dimuat
        </h1>
        <p className="mt-2 text-sm leading-6 text-brand-text-body">
          Terjadi kesalahan di server saat memuat data. Coba muat ulang. Jika
          masih gagal, periksa koneksi ke Supabase dan log server.
        </p>
        {error.digest && (
          <p className="mt-4 rounded-lg bg-brand-bg-soft px-3 py-2 font-mono text-xs text-brand-text-body">
            digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-5 font-bold text-white transition-colors hover:bg-brand-blue-hover"
        >
          <RotateCw className="size-4" />
          Muat ulang
        </button>
      </div>
    </div>
  );
}
