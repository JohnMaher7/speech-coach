import Link from "next/link";

export default function ReportNotFound() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[640px] px-4 py-16 sm:px-6 sm:py-24">
        <div aria-hidden className="mb-6 grid w-max gap-[5px]">
          <span className="lamp size-3.5 bg-lamp-off" />
          <span className="lamp size-3.5 bg-lamp-off" />
          <span className="lamp size-3.5 bg-stop" />
        </div>
        <h1 className="font-display text-[clamp(48px,6vw,68px)] leading-[0.9] font-bold">
          Report not found
        </h1>
        <p className="mt-4 max-w-[48ch] text-[18px] leading-[1.55] text-[#2D302D]">
          This report doesn&apos;t exist, or it may have been removed. Upload your
          speech again to start a new analysis.
        </p>
        <Link href="/" className="btn btn-ink mt-8">
          Upload a new speech
        </Link>
      </div>
    </main>
  );
}
