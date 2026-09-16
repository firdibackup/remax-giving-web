import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandBadgeProps extends React.ComponentProps<"span"> {
  tone?: "blue" | "red";
}

function BrandBadge({ tone = "blue", className, children, ...props }: BrandBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 font-sans text-xs font-semibold tracking-wide uppercase",
        tone === "red"
          ? "bg-brand-tint-red text-brand-red"
          : "bg-brand-tint-blue text-brand-blue",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { BrandBadge };
