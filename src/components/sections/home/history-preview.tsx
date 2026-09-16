import Link from "next/link";
import { Reveal } from "@/components/brand/reveal";
import { formatNumber } from "@/lib/format";
import type { PublicDonationItem } from "@/lib/public-data";

function HistoryPreview({
  donations,
  totalDonations,
}: {
  donations: PublicDonationItem[];
  totalDonations: number;
}) {
  return (
    <section id="riwayat" className="scroll-mt-20 bg-brand-bg-soft px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[920px]">
        <Reveal>
          <div className="rounded-2xl border border-brand-border bg-white px-6 pt-8 pb-6 shadow-brand-card sm:px-8">
            <div className="mb-5.5 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <div className="font-hand text-2xl leading-none font-bold text-brand-blue sm:text-[30px]">
                  Transparansi donasi
                </div>
                <h3 className="mt-2 text-xl font-bold text-brand-navy">Donatur terbaru</h3>
              </div>
              <Link href="/riwayat-donasi" className="font-sans text-sm font-bold text-brand-red">
                Riwayat lengkap →
              </Link>
            </div>
            <div className="flex flex-col">
              {donations.length > 0 ? donations.map((donation) => (
                <div key={donation.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-brand-border py-3.5">
                  <div className="min-w-0">
                    <div className="font-sans text-base font-semibold text-brand-navy">{donation.name}</div>
                    <div className="mt-0.5 font-sans text-xs text-brand-text-body">
                      {donation.project} · {donation.date}
                    </div>
                  </div>
                  <div className="font-sans text-base font-bold text-brand-blue">{donation.amount}</div>
                </div>
              )) : (
                <p className="border-t border-brand-border py-7 text-sm text-brand-text-body">
                  Belum ada donasi tercatat.
                </p>
              )}
            </div>
            <div className="mt-4.5 border-t border-brand-border pt-4 font-sans text-xs text-brand-text-body">
              {formatNumber(totalDonations)} transaksi tercatat · nama donatur selalu disamarkan sebelum dipublikasikan.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { HistoryPreview };
