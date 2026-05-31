import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ReportView } from "@/components/report-view";
import { ApiError, fetchReport, type Report } from "@/lib/api";

const FRESH_REPORT_RETRIES = 4;
const FRESH_REPORT_RETRY_MS = 750;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchReportWithRetry(
  id: string,
  token: string,
  fresh: boolean,
): Promise<Report> {
  const attempts = fresh ? FRESH_REPORT_RETRIES : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchReport(id, token);
    } catch (err) {
      lastError = err;
      if (
        !(err instanceof ApiError) ||
        err.status !== 404 ||
        attempt === attempts - 1
      ) {
        throw err;
      }
      await sleep(FRESH_REPORT_RETRY_MS);
    }
  }

  throw lastError;
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fresh?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // `proxy.ts` already gates this route, so a token is expected here.
  const { getToken } = await auth();
  const token = await getToken();

  let report: Report;
  try {
    if (!token) throw new ApiError("Not signed in.", 401);
    report = await fetchReportWithRetry(id, token, query.fresh === "1");
  } catch (err) {
    // The backend returns 404 for a missing report and for one the caller
    // doesn't own — either way, show the not-found page.
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return <ReportView report={report} />;
}
