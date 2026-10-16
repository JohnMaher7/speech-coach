"use client";

import { useState } from "react";

import { DashboardReportRow } from "@/components/dashboard-report-row";
import type { DashboardReport, SpeechType } from "@/lib/api";

type Filter = "all" | SpeechType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "prepared", label: "Prepared" },
  { value: "impromptu", label: "Impromptu" },
  { value: "presentation", label: "Presentation" },
];

export function DashboardReportList({
  reports,
}: {
  reports: DashboardReport[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  // Per-user lists are small, so filtering client-side is cheap; reports with
  // no speech_type only surface under "All".
  const visible =
    filter === "all"
      ? reports
      : reports.filter((report) => report.speech_type === filter);

  return (
    <div>
      <div
        role="group"
        aria-label="Filter by speech type"
        className="seg mb-4 flex-wrap"
      >
        {FILTERS.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={active}
              className="seg-item"
            >
              {label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="surface px-5 py-10 text-center text-[15px] text-muted-foreground">
          No reports of this type yet.
        </p>
      ) : (
        <ul className="surface divide-y divide-border overflow-hidden">
          {visible.map((report) => (
            <DashboardReportRow key={report.report_id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}
