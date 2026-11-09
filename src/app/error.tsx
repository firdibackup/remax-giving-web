"use client";

export default function PageError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div role="alert" className="w-full max-w-md py-12 text-center">
        <h1 className="text-xl font-extrabold tracking-[-0.02em] text-brand-navy">
          HALAMAN BELUM DAPAT DIMUAT
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-body">
          Terjadi gangguan saat memuat data. Silakan coba lagi dalam beberapa saat.
        </p>
        {error.digest && (
          <p className="mt-4 text-xs text-brand-text-body">
            Kode bantuan: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-blue px-6 font-bold text-white transition-colors hover:bg-brand-blue-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
