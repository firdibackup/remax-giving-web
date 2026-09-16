import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = "Kembali",
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-text-body transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.035em] text-brand-navy sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-text-body">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Button asChild className="h-10 bg-brand-blue px-4 font-bold text-white hover:bg-brand-blue-hover">
          <Link href={actionHref}>
            <Plus className="size-4" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}

export { AdminPageHeader };
