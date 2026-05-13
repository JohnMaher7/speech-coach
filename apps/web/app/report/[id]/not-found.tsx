import Link from "next/link";
import { ArrowRight, FileX2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileX2 className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Report not found</h1>
      <p className="text-muted-foreground">
        This report doesn&apos;t exist, or it may have been removed. Upload your
        speech again to start a new analysis.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
      >
        Upload a new speech
        <ArrowRight className="size-4" />
      </Link>
    </main>
  );
}
