import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { BillingSummary } from "@/components/billing-summary";
import { BrandMark } from "@/components/site-header";
import { DashboardReportList } from "@/components/dashboard-report-list";
import { fetchMyReports, type DashboardReport } from "@/lib/api";

export const metadata = {
  title: "Your reports — SpeakGrade",
};

export default async function DashboardPage() {
  // `proxy.ts` already requires a signed-in user on this route.
  const { getToken } = await auth();
  const token = await getToken();

  let reports: DashboardReport[] = [];
  let loadError = false;
  try {
    if (!token) throw new Error("Not signed in.");
    reports = await fetchMyReports(token);
  } catch {
    loadError = true;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[920px] px-5 pt-12 pb-24 sm:px-8 sm:pt-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="display mt-3 text-[clamp(44px,6vw,64px)] leading-none tracking-[-0.02em]">
              Your reports
            </h1>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              Every speech you&apos;ve analyzed. Open one to revisit the coaching.
            </p>
          </div>
          {!loadError && reports.length > 0 && (
            <Link href="/#upload" className="btn btn-ink shrink-0 self-start sm:self-auto">
              New analysis
            </Link>
          )}
        </div>

        <BillingSummary />

        <div className="mt-8">
          {loadError ? (
            <p role="alert" className="alert-stop px-4 py-3 text-[14.5px]">
              We couldn&apos;t load your reports just now. Please refresh the page.
            </p>
          ) : reports.length === 0 ? (
            <div className="surface flex flex-col items-center px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-full border border-border bg-background">
                <BrandMark className="size-7 text-foreground" />
              </span>
              <p className="display mt-6 text-[34px] leading-none">No reports yet</p>
              <p className="mt-3 max-w-[40ch] text-[15px] text-muted-foreground">
                Analyze your first speech and it&apos;ll show up here, ready to
                compare against your next rehearsal.
              </p>
              <Link href="/#upload" className="btn btn-ink mt-7">
                Analyze a speech
              </Link>
            </div>
          ) : (
            <DashboardReportList reports={reports} />
          )}
        </div>
      </div>
    </main>
  );
}
