import { ReportView } from "@/components/report-view";
import { cleanSampleReport } from "@/lib/sample-reports";

export default function CleanSamplePage() {
  return <ReportView report={cleanSampleReport} sampleLabel="Sample · clean" />;
}
