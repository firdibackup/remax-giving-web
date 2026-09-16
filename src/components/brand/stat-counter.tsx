"use client";

import { cn } from "@/lib/utils";

interface BrandStatCounterProps {
  value: string;
  label: string;
  tone?: "blue" | "red";
  className?: string;
}

function BrandStatCounter({ value, label, tone = "blue", className }: BrandStatCounterProps) {
  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <div
        className={cn(
          "font-sans text-[44px] leading-[1.1] font-extrabold",
          tone === "red" ? "text-brand-red" : "text-brand-blue"
        )}
      >
        {value}
      </div>
      <div className="font-sans text-base font-medium text-brand-text-body">{label}</div>
    </div>
  );
}

export { BrandStatCounter };
