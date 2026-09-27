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
        className="mb-4 inline-flex flex-wrap border-[1.5px] border-foreground"
      >
        {FILTERS.map(({ value, label }, i) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={active}
              className={`h-9 px-3.5 text-[15px] font-semibold transition-colors ${
                i > 0 ? "border-l-[1.5px] border-foreground" : ""
              } ${active ? "bg-foreground text-card" : "bg-card hover:bg-muted"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="border-t-[3px] border-foreground bg-card px-5 py-8 text-center text-[16px] text-muted-foreground">
          No reports of this type yet.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t-[3px] border-foreground bg-card">
          {visible.map((report) => (
            <DashboardReportRow key={report.report_id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}
