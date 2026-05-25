import { ReportView } from "@/components/report-view";
import { messySampleReport } from "@/lib/sample-reports";

export default function MessySamplePage() {
  return <ReportView report={messySampleReport} sampleLabel="Sample · messy" />;
}
