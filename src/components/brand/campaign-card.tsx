import Image from "next/image";
import Link from "next/link";
import { DonationCta } from "@/components/brand/donation-cta";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  slug: string;
  image: string;
  imagePos?: string;
  title: string;
  raised: string;
  target: string;
  percent: number;
  meta?: string;
  className?: string;
}

function CampaignCard({
  slug,
  image,
  imagePos = "center",
  title,
  raised,
  target,
  percent,
  meta,
  className,
}: CampaignCardProps) {
  return (
    <div
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-[20px] border border-brand-border bg-white shadow-brand-card transition-shadow duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-brand-card-hover",
        className
      )}
    >
      <div className="relative h-[190px] w-full overflow-hidden bg-brand-tint-blue">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          style={{ objectPosition: imagePos }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/program/${slug}`} className="font-sans text-lg leading-snug font-bold text-brand-navy hover:text-brand-blue transition-colors">
          {title}
        </Link>
        <div>
          <div className="mb-1 font-sans text-xs text-brand-text-body">Terkumpul</div>
          <div className="mb-2.5 font-sans text-lg font-bold text-brand-blue">{raised}</div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-tint-blue">
            <div
              className="h-full rounded-full bg-brand-red"
              style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-sans text-[13px] text-brand-text-body">
            <span className="font-bold text-brand-red">{percent}%</span>
            <span>Target {target}</span>
          </div>
        </div>
        {meta && <div className="font-sans text-xs text-brand-text-body">{meta}</div>}
        <DonationCta
          campaignTitle={title}
          size="sm"
          className="mt-1 w-full"
        >
          Donasi Sekarang
        </DonationCta>
      </div>
    </div>
  );
}

export { CampaignCard };
