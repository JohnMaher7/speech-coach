import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ReportView } from "@/components/report-view";
import { fetchReport, type Report } from "@/lib/api";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // `proxy.ts` already gates this route, so a token is expected here.
  const { getToken } = await auth();
  const token = await getToken();

  let report: Report;
  try {
    if (!token) throw new Error("Not signed in.");
    report = await fetchReport(id, token);
  } catch {
    // The backend returns 404 for a missing report and for one the caller
    // doesn't own — either way, show the not-found page.
    notFound();
  }

  return <ReportView report={report} />;
}
