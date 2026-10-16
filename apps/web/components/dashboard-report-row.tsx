"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";

import { ScoreRing } from "@/components/signal";
import { deleteReport, type DashboardReport } from "@/lib/api";
import { scoreTone } from "@/lib/scores";

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

  const specType = report.speech_type;

  return (
    <li className="group relative grid grid-cols-[52px_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-background sm:gap-5 sm:px-6">
      <span title="Overall score out of 5">
        <ScoreRing
          score={report.overall_score}
          tone={scoreTone(report.overall_score)}
          size={52}
          stroke={3.5}
        />
      </span>

      <Link
        href={`/report/${report.report_id}`}
        className="min-w-0 after:absolute after:inset-0 after:content-['']"
      >
        <div className="line-clamp-2 text-[15.5px] leading-snug font-medium tracking-[-0.005em]">
          {report.headline}
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">
          {formatDate(report.created_at)} · {formatDuration(report.duration_sec)}
          {specType && <span className="capitalize"> · {specType}</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete report"
        className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-60 transition-[color,background-color,opacity] group-hover:opacity-100 hover:bg-stop/10 hover:text-stop-ink focus-visible:opacity-100 disabled:opacity-50"
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
