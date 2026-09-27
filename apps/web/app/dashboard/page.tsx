import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

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
      <div className="mx-auto w-full max-w-[880px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[clamp(48px,6vw,68px)] leading-[0.9] font-bold">
              Your reports
            </h1>
            <p className="mt-3 text-[17px] text-muted-foreground">
              Every speech you&apos;ve analyzed. Open one to revisit the coaching.
            </p>
          </div>
          {!loadError && reports.length > 0 && (
            <Link href="/#upload" className="btn btn-ink shrink-0 self-start sm:self-auto">
              Analyze a speech
            </Link>
          )}
        </div>

        <div className="mt-8">
          {loadError ? (
            <p
              role="alert"
              className="border-l-[3px] border-stop bg-stop/10 px-4 py-3 text-[15.5px] text-stop-ink"
            >
              We couldn&apos;t load your reports just now. Please refresh the page.
            </p>
          ) : reports.length === 0 ? (
            <div className="border-t-[3px] border-foreground bg-card px-6 py-12 text-center">
              <div aria-hidden className="mx-auto mb-5 grid w-max gap-[5px]">
                <span className="lamp size-3 bg-lamp-off" />
                <span className="lamp size-3 bg-lamp-off" />
                <span className="lamp size-3 bg-lamp-off" />
              </div>
              <p className="font-display text-[30px] leading-none font-bold">
                No reports yet
              </p>
              <p className="mt-2 text-[16px] text-muted-foreground">
                Analyze your first speech and it&apos;ll show up here.
              </p>
              <Link href="/#upload" className="btn btn-ink mt-6">
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
