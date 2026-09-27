"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";

import { Lamp } from "@/components/signal";
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
    <li className="group relative grid grid-cols-[62px_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-muted sm:px-5">
      <span
        className="flex items-center gap-2 font-display text-[34px] leading-none font-bold"
        title="Overall score out of 5"
      >
        <Lamp tone={scoreTone(report.overall_score)} />
        {report.overall_score.toFixed(1)}
      </span>

      <Link
        href={`/report/${report.report_id}`}
        className="min-w-0 after:absolute after:inset-0 after:content-['']"
      >
        <div className="line-clamp-2 text-[17px] leading-snug font-semibold">
          {report.headline}
        </div>
        <div className="mt-1 text-[14.5px] text-muted-foreground">
          {formatDate(report.created_at)} · {formatDuration(report.duration_sec)}
          {specType && <span className="capitalize"> · {specType}</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete report"
        className="relative z-10 flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-stop/10 hover:text-stop-ink disabled:opacity-50"
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
