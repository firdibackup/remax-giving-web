import { cn } from "@/lib/utils";

interface BrandProgressBarProps {
  percent: number;
  showLabel?: boolean;
  className?: string;
}

function BrandProgressBar({ percent, showLabel = true, className }: BrandProgressBarProps) {
  const pct = Math.max(0, Math.min(100, percent));

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-tint-blue">
        <div
          className="h-full rounded-full bg-brand-red transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 flex justify-between font-sans text-sm text-brand-text-body">
          <span className="font-bold text-brand-red">{pct}%</span>
          <span>terkumpul</span>
        </div>
      )}
    </div>
  );
}

export { BrandProgressBar };
