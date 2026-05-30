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
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={active}
              className={`h-8 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-[color-mix(in_oklch,var(--primary)_35%,var(--border))] hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No reports of this type yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((report) => (
            <DashboardReportRow key={report.report_id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}
