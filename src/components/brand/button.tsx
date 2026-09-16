import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brandButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] font-sans font-bold whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-red text-white shadow-brand-button",
        secondary:
          "bg-transparent text-brand-blue border-[1.5px] border-brand-blue hover:shadow-brand-card",
        dark: "bg-brand-blue text-white",
      },
      size: {
        sm: "h-[42px] px-5 text-sm",
        md: "h-[50px] px-7 text-base",
        lg: "h-[56px] px-[34px] text-[17px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type BrandButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof brandButtonVariants> & {
    asChild?: boolean;
    href?: string;
  };

function BrandButton({
  className,
  variant,
  size,
  href,
  children,
  ...props
}: BrandButtonProps) {
  const classes = cn(brandButtonVariants({ variant, size }), className);

  if (href) {
    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={classes}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export { BrandButton, brandButtonVariants };
