"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";

import { deleteReport, type DashboardReport } from "@/lib/api";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function scoreTone(score: number): string {
  if (score >= 4) return "bg-primary/10 text-primary";
  if (score >= 3) return "bg-amber-500/10 text-amber-600";
  return "bg-destructive/10 text-destructive";
}

export function DashboardReportRow({ report }: { report: DashboardReport }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!confirm("Delete this report? This can't be undone.")) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        router.push("/sign-in");
        return;
      }
      await deleteReport(report.report_id, token);
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <li className="flex items-center gap-4 rounded-[14px] border border-border bg-card px-5 py-4 transition-colors hover:border-[color-mix(in_oklch,var(--primary)_35%,var(--border))]">
      <span
        className={`inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] font-mono text-[15px] font-semibold ${scoreTone(
          report.overall_score,
        )}`}
        title="Overall score out of 5"
      >
        {report.overall_score.toFixed(1)}
      </span>

      <Link
        href={`/report/${report.report_id}`}
        className="min-w-0 flex-1"
      >
        <div className="truncate text-[15px] font-medium text-foreground">
          {report.headline}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11.5px] tracking-wide text-muted-foreground">
          <span>{formatDate(report.created_at)}</span>
          <span>·</span>
          <span>{formatDuration(report.duration_sec)}</span>
          {report.speech_type && (
            <>
              <span>·</span>
              <span className="capitalize">{report.speech_type}</span>
            </>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete report"
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </button>
    </li>
  );
}
