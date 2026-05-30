import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";

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
    <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-16 sm:py-20">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Your reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Every speech you&apos;ve analyzed. Open one to revisit the coaching.
        </p>
      </div>

      <div className="mt-8">
        {loadError ? (
          <p className="rounded-[14px] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            We couldn&apos;t load your reports just now. Please refresh the page.
          </p>
        ) : reports.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-foreground">
              No reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Analyze your first speech and it&apos;ll show up here.
            </p>
            <Link
              href="/#upload"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[oklch(0.45_0.22_277)]"
            >
              Analyze a speech
              <ArrowRight className="size-[14px]" strokeWidth={2.4} />
            </Link>
          </div>
        ) : (
          <DashboardReportList reports={reports} />
        )}
      </div>
    </main>
  );
}
