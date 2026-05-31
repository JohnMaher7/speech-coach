const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Every backend call is now behind Clerk auth. Callers pass the session
// token (client: `useAuth().getToken()`; server: `(await auth()).getToken()`)
// and we attach it as a Bearer header.
function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type SignResponse = {
  url: string;
  key: string;
  expires_at: string;
};

export type AnalyzeEvent =
  | { event: "started"; data: Record<string, never> }
  | { event: "transcribed"; data: { words: number; duration_sec: number } }
  | { event: "acoustic_done"; data: { pitch_mean_hz: number } }
  | { event: "lexical_done"; data: { fillers: number } }
  | {
      event: "metrics_done";
      data: { wpm: number; fillers: number; long_pauses: number };
    }
  | { event: "synthesis_done"; data: { priorities: number } }
  | { event: "saving_report"; data: Record<string, never> }
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
  pitch_st: number | null;
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
  pitch_std_st: number;
};

export type FillerCategory =
  | "interjection"
  | "hedge"
  | "verbal_pause"
  | "tic";

export type FillerHit = {
  word: string;
  t: number;
  category: FillerCategory;
};

export type Metrics = {
  wpm: number;
  fillers: FillerHit[];
  filler_per_min: number;
  long_pauses: number;
  pauses_over_0_6: number;
  pauses_over_2: number;
  total_pause_sec: number;
  monotone_score: number;
};

// Schema v2 (Stage 29) — replaces the four-category v1 Synthesis.
export type CategoryScoreValue = 1 | 2 | 3 | 4 | 5 | "n/a";

export type Evidence = {
  quote: string;
  t: number;
};

export type CategoryScore = {
  score: CategoryScoreValue;
  rationale: string;
  evidence: Evidence[];
  counts: HabitCountItem[];
  applicability_reason: string | null;
};

export type HabitCountItem = {
  label: string;
  count: number;
};

export type Beat = {
  start_t: number;
  end_t: number;
  observation: string;
  praise: string | null;
  critique: string | null;
  quote_t: number | null;
};

export type Walkthrough = {
  opening: Beat;
  body: Beat[];
  close: Beat;
};

export type CategoryKey =
  | "hook"
  | "message_focus"
  | "structure"
  | "closing"
  | "pacing"
  | "pauses"
  | "vocal_variety"
  | "language";

export type Categories = Record<CategoryKey, CategoryScore>;

export type Priority = {
  title: string;
  observation: string;
  example_quote: string;
  example_t: number;
  why_it_matters: string;
  drill: string;
};

export type Rewrite = {
  original: string;
  suggested: string;
  why: string;
};

export type Synthesis = {
  headline: string;
  message_sentence: string | null;
  walkthrough: Walkthrough;
  categories: Categories;
  priorities: Priority[];
  rewrites: Rewrite[];
};

export type LlmCost = {
  total_usd: number;
  synthesis_usd: number;
  lexical_fillers_usd: number;
};

export type SpeechType = "prepared" | "impromptu" | "presentation";

export type Overall = {
  score: number;
  weights_version: number;
  weights: Record<string, number>;
  applicable_categories: string[];
};

export type Report = {
  report_id: string;
  audio_key: string;
  created_at: string;
  duration_sec: number;
  schema_version: 5;
  speech_type: SpeechType | null;
  transcript: Transcript;
  acoustic: Acoustic;
  metrics: Metrics;
  synthesis: Synthesis;
  overall: Overall;
  cost: LlmCost | null;
};

// One-line summary of a report, shown as a row on the dashboard.
export type DashboardReport = {
  report_id: string;
  created_at: string;
  duration_sec: number;
  speech_type: SpeechType | null;
  headline: string;
  overall_score: number;
};

export async function signUpload(
  contentType: string,
  token: string,
): Promise<SignResponse> {
  const res = await fetch(`${API_URL}/uploads/sign`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(token) },
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

export async function warmUpApi(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/warmup`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(`warmup failed: ${res.status}`, res.status);
}

export async function* streamAnalyze(
  key: string,
  token: string,
  speechType?: SpeechType | null,
): AsyncGenerator<AnalyzeEvent> {
  const body: { key: string; speech_type?: SpeechType } = { key };
  if (speechType) body.speech_type = speechType;
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
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

export async function fetchReport(id: string, token: string): Promise<Report> {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(`fetch report failed: ${res.status}`, res.status);
  return res.json();
}

export async function fetchMyReports(token: string): Promise<DashboardReport[]> {
  const res = await fetch(`${API_URL}/reports`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`fetch reports failed: ${res.status}`);
  return res.json();
}

export async function deleteReport(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/reports/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`delete report failed: ${res.status}`);
  }
}
