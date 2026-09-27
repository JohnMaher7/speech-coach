import Link from "next/link";

import { BrandMark } from "@/components/site-header";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-[3px] border-foreground bg-card">
      <div className="wrap flex flex-col gap-4 py-8 text-[14.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <p>
            SpeakGrade — an independent speech-coaching tool. Not affiliated
            with any public-speaking organisation.
          </p>
        </div>
        <p className="flex shrink-0 gap-5 font-medium">
          <Link
            href="/tips"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Speaking tips
          </Link>
          <Link
            href="/pricing"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Pricing
          </Link>
        </p>
      </div>
    </footer>
  );
}
