const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type SignResponse = {
  url: string;
  key: string;
  expires_at: string;
};

export type AnalyzeEvent =
  | { event: "started"; data: Record<string, never> }
  | { event: "transcribed"; data: { words: number; duration_sec: number } }
  | { event: "acoustic_done"; data: { pitch_mean_hz: number } }
  | {
      event: "metrics_done";
      data: { wpm: number; fillers: number; long_pauses: number };
    }
  | { event: "synthesis_done"; data: { actions: number } }
  | { event: "done"; data: { report_id: string } }
  | { event: "error"; data: { message: string } };

export type Word = {
  text: string;
  start: number;
  end: number;
  confidence: number;
};

export type Transcript = {
  text: string;
  words: Word[];
  duration_sec: number;
};

export type TimelinePoint = {
  t: number;
  pitch_hz: number | null;
  wpm_local: number;
};

export type Pause = {
  start: number;
  end: number;
};

export type Acoustic = {
  timeline: TimelinePoint[];
  pauses: Pause[];
  pitch_mean_hz: number;
  pitch_std_hz: number;
};

export type FillerHit = {
  word: string;
  t: number;
};

export type Metrics = {
  wpm: number;
  fillers: FillerHit[];
  filler_per_min: number;
  long_pauses: number;
  monotone_score: number;
};

export type CategoryScore = {
  score: number;
  rationale: string;
};

export type Action = {
  title: string;
  detail: string;
};

export type Rewrite = {
  original: string;
  suggested: string;
  why: string;
};

export type Synthesis = {
  fillers: CategoryScore;
  pacing: CategoryScore;
  vocal_variety: CategoryScore;
  structure: CategoryScore;
  top_actions: Action[];
  rewrites: Rewrite[];
  summary: string;
};

export type LlmCost = {
  total_usd: number;
};

export type Report = {
  report_id: string;
  audio_key: string;
  created_at: string;
  duration_sec: number;
  transcript: Transcript;
  acoustic: Acoustic;
  metrics: Metrics;
  synthesis: Synthesis;
  cost: LlmCost | null;
};

export async function signUpload(contentType: string): Promise<SignResponse> {
  const res = await fetch(`${API_URL}/uploads/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Upload failed (${res.status}).`);
  }
  return res.json();
}

export async function uploadToR2(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}

export async function* streamAnalyze(
  key: string,
): AsyncGenerator<AnalyzeEvent> {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Analysis failed (${res.status}).`);
  }
  if (!res.body) throw new Error("Analysis returned an empty response.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      let event = "";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (event) {
        yield { event, data: JSON.parse(data || "null") } as AnalyzeEvent;
      }
    }
  }
}

export async function fetchReport(id: string): Promise<Report> {
  const res = await fetch(`${API_URL}/reports/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch report failed: ${res.status}`);
  return res.json();
}
