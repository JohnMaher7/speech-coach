import Link from "next/link";

export default function ReportNotFound() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center px-5 pt-20 pb-28 text-center sm:pt-28">
        <p className="eyebrow">404 · Report</p>
        <h1 className="display mt-5 text-[clamp(48px,6vw,72px)] leading-[0.98] tracking-[-0.02em]">
          Report not found
        </h1>
        <p className="mt-5 max-w-[44ch] text-[17px] leading-[1.6] text-ink-2">
          This report doesn&apos;t exist, or it may have been removed. Upload your
          speech again to start a new analysis.
        </p>
        <div className="mt-9 flex gap-3">
          <Link href="/#upload" className="btn btn-ink">
            Upload a new speech
          </Link>
          <Link href="/dashboard" className="btn btn-line">
            Your reports
          </Link>
        </div>
      </div>
    </main>
  );
}
