import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const DONATION_DISCLAIMER_TEXT =
  "Jika terdapat sisa donasi, akan disalurkan pada program berikutnya.";

function DonationDisclaimer({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-2xl bg-brand-tint-blue px-4 py-3 font-sans text-[13px] leading-relaxed font-medium text-brand-navy ring-1 ring-brand-border sm:text-sm",
        className,
      )}
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue"
        strokeWidth={2.25}
      />
      <span className="min-w-0">{DONATION_DISCLAIMER_TEXT}</span>
    </p>
  );
}

export { DonationDisclaimer };
