# Build Stages

Legend: ☐ todo · ⏳ in progress · ✅ done

Rich walkthroughs live in `stages/<NN>-<slug>.md` (created when a stage starts).

## Phase A — Skeleton & deploy
- ✅ 01 — Repo init + docs scaffold
- ✅ 02 — Next.js 15 + Tailwind + shadcn/ui scaffold
- ✅ 03 — Upload form UI (no backend wiring)
- ✅ 04 — Deploy frontend to Vercel
- ✅ 05 — FastAPI + `uv` hello-world (`/health`)
- ✅ 06 — Deploy backend to Modal
- ✅ 07 — Cloudflare R2 + presigned PUT endpoint
- ✅ 08 — End-to-end stub: browser → R2 → fake report → `/report/[id]`

## Phase B — Real pipeline
- ✅ 09 — Pydantic schema spine (`schemas.py`)
- ✅ 10 — Deepgram transcription module
- ✅ 11 — Claude synthesis: prompt caching + tool-use
- ✅ 12 — Neon Postgres + SQLModel persistence

## Phase C — Acoustic features
- ✅ 13 — librosa + parselmouth standalone script
- ✅ 14 — Derived metrics (WPM, fillers, monotone, pauses)
- ✅ 15 — Wire acoustic + derived into `/analyze`

## Phase D — Async + UX
- ✅ 16 — `asyncio.gather` parallelism
- ✅ 17 — SSE streaming `/analyze` (`StreamingResponse`)
- ✅ 18 — Frontend SSE progress UI (`analyzing/[id]`)
- ✅ 19 — Timeline chart (Recharts dual-axis)
- ✅ 20 — Score cards + top-3 actions report layout

## Phase E — Quality & launch
- ✅ 21 — Empty/error states + validation
- ✅ 22 — Few-shots + eval harness
- ✅ 23 — Two-pass prompting + cost engineering
- ✅ 24 — Full UI polish + branding (rename → Rhetor, since renamed SpeakGrade; design tokens, shell, all 4 surfaces)
- ✅ 25 — Hardening (rate limit, Sentry, min_containers, smoke test, launch)

## Phase F — Evaluation Engine v2
Per `spec.md`. Turn the four-category rubric scorer into a placement-aware coach.
- ✅ 26 — Acoustic segmentation + per-segment prosody (semitones, intensity, pause inventory)
- ✅ 27 — Emphasis detection, boundary tone, Haiku lexical filler pass
- ✅ 28 — Annotated transcript builder
- ✅ 29 — Rubric expansion, schema v2, prompt rewrite — first user-visible turn
- ✅ 30 — Deterministic evidence verification
- ✅ 31 — Weighted server-side overall score + `speech_type` + speaker-relative variety
- ✅ 32 — Report UI restructure (Headline → Walk-through → conditional Habits → Priorities → Rewrites → Scorecard)
- ⏳ 33 — Evaluation harness (seed: 3 speeches)
- ☐ 34 — (optional) Haiku critic pass — only if Stage 33 shows deterministic verification misses real hallucinations

## Phase G — Speech-type tailoring
Make the three upload types (prepared / impromptu / presentation) evaluate and present differently. Prepared is unchanged. Brief at the bottom of this file.
- ✅ 35 — Per-type evaluation tuning (three focused system prompts + presentation weight profile)
- ☐ 36 — Per-type sample reports + sample-page toggle
- ✅ 37 — Dashboard filter by speech type
- ✅ 38 — Merge delivery-habits into the scorecard + stat dashboard + pause stats

---

# Phase F brief — Evaluation Engine v2

## Context

Today the report scores four broad categories from aggregates: a filler count, one global pitch std-dev, a long-pause count, and the raw transcript. The evaluator can tell you that pitch moved, but not whether it moved on the *right word*; that there were three pauses, but not whether they landed *where they mattered*. `spec.md` calls this out as three structural gaps — half-blind evaluator, presence-not-placement rubric, no output verification — and prescribes a rebuild that gives Layer 2 segment-level placement data, expands the rubric to cover content/craft, and adds deterministic evidence checks plus an eval harness.

The work is large, so it ships as nine stages (one optional). Each stage is a single complete turn, leaves the app shippable, and produces something testable end-to-end. Stages are ordered so user-visible changes only land after the data backing them is in place.

## Upfront PM decisions

1. **One Sonnet call, not split.** Spec allows splitting if quality drops on later categories. Stay single-pass until Stage 33's harness shows truncation or category drift. Splitting now is premature optimisation and forfeits the cross-category ranking the priorities section needs.
2. **Verification flags, not blocks.** Stage 30 attaches a `verification` field to the Report (`{passed, issues[]}`); persistence still happens. Blocking risks losing reports for cosmetic quote mismatches; the harness tracks the pass rate over time.
3. **Lexical filler pass uses Haiku 4.5** (`claude-haiku-4-5-20251001`). Runs concurrently with transcribe + acoustic (third `asyncio.gather` task).
4. **Drop v1 reports.** Bump `schema_version: 2`, wipe the DB at the Stage 29 deploy. No reader compat code.
5. **Seed eval set = 3 speeches.** Two existing prompt few-shots get extracted to fixtures; draft a third mid-band example. Harness runs but coverage is thin until the set grows.
6. **Stage cadence**: nine stages, each one complete turn. Stages 26–28 are signal/data plumbing the user never sees. Stage 29 is when reports visibly change. Stages 30–34 are tightening and ergonomics.
7. **Schema versioning lives on `Report.schema_version`**, not URL path. `/reports/{id}` returns v2 only; 410 Gone for v1.

## Cross-cutting design choices

- **Segments are the new spine.** A `Segment` (sentence/clause) carries its own words, prosody, prominent word, boundary tone, and local WPM. Every later signal hangs off it.
- **Pitch in semitones**, not raw Hz. Reference = the speaker's own voiced-frame mean for that recording. Makes "variety" speaker-relative instead of biased against low voices.
- **Single audio pass.** Extract pitch + intensity arrays once over the whole file in `acoustic.py`, then slice per segment by time index. No per-segment reload.
- **Annotated transcript** is a pure function of `(Transcript, Segments, Pauses, lexical_fillers)` → string. Golden-snapshot tested. This is what the prompt actually sees.
- **Frontend overall score is removed.** Replaced by `report.overall.score` (server-computed, weighted, persisted).
- **Lexical fillers merge into `metrics.fillers`** so `filler_per_min` is finally accurate.

---

## Stage 26 — Acoustic segmentation + per-segment prosody

**Goal:** Layer 1 produces segments with semitone-based prosody and a full pause inventory. Nothing user-visible yet.

**Changes:**
- `apps/api/app/schemas.py`: add `Segment {start, end, text, word_indices, pitch_mean_st, pitch_range_st, intensity_mean_db, intensity_peak_db, wpm_local, boundary_tone?}` (boundary_tone stays optional until Stage 27). Extend `Pause` to carry `prev_word`, `next_word`, `duration_sec`. Add `Acoustic.segments: list[Segment]`. Lower `MIN_PAUSE_SEC` from 0.4 → 0.3.
- `apps/api/app/acoustic.py`: extract intensity via `parselmouth.Sound.to_intensity()` once over the whole file alongside pitch. Convert pitch arrays to semitones relative to the recording's voiced-mean. Slice per-segment by timestamp index — no per-segment audio reload.
- `apps/api/app/metrics.py`: new `build_segments(transcript, features)` that uses Deepgram utterance/punctuation boundaries with pause-based fallback.
- `apps/api/app/transcribe.py`: ensure utterance/punctuation hints are preserved on the `Transcript` (read first; add fields only if missing).
- `apps/api/tests/test_acoustic.py` (new): synthetic-audio unit tests — sine at 220 Hz → detector returns 220 ±2 Hz; two tones an octave apart → semitone delta = 12 ±0.5; constant tone → intensity_peak ≈ intensity_mean.

**Verify:** `uv run pytest apps/api/tests/test_acoustic.py` green. Run pipeline on a 30s fixture and inspect `report.acoustic.segments` JSON — segment count matches sentence count, prosody numbers are sensible, total duration matches.

---

## Stage 27 — Emphasis, boundary tone, and lexical filler pass

**Goal:** Each segment knows its prominent word and boundary tone. Lexical fillers ("like", "you know", "kind of") are counted alongside interjections.

**Changes:**
- `apps/api/app/acoustic.py`: per segment, find prominent word by combining local pitch peak (semitone z-score within the segment) and intensity peak. Classify boundary tone from the terminal ~200ms pitch contour: rising / falling / flat.
- `apps/api/app/schemas.py`: `Segment.prominent_word: {text, t} | None`, `Segment.boundary_tone: Literal["rising","falling","flat"]`.
- `apps/api/app/lexical_fillers.py` (new): Haiku 4.5 call. Input = transcript with timestamps; output (structured) = `list[{word, t, category: "hedge"|"verbal_pause"|"tic"}]`. Use Anthropic structured outputs, prompt-cache the system prompt.
- `apps/api/app/main.py`: third concurrent task in the `asyncio.gather`-style fan-out. Don't block transcribe/acoustic if it fails — log and continue with token-match only.
- `apps/api/app/metrics.py`: merge lexical hits into `metrics.fillers`; recompute `filler_per_min`. De-dupe by `t` within 50ms.
- `apps/api/app/cost.py`: account for the Haiku call in `LlmCost`. Surface in the "Details" UI section.
- `apps/api/tests/test_lexical_fillers.py` (new): fixture transcript with "like" used both as filler and as comparison ("flew like a bird"); only the filler use is flagged.
- `apps/api/tests/test_acoustic.py`: extend with synthetic uptalk fixture → terminal contour classifies as rising.

**Verify:** Pytest green. Run on a sample with deliberate uptalk and a "you know" — check `acoustic.segments[*].boundary_tone` and `metrics.fillers`. Confirm Haiku cost line in logs.

---

## Stage 28 — Annotated transcript builder

**Goal:** Pure function that turns enriched signals into the prompt-ready string. Wired into `synthesize()` but the prompt still uses raw text; this stage adds it alongside.

**Changes:**
- `apps/api/app/annotate.py` (new): single function `build_annotated_transcript(transcript, acoustic, metrics) -> AnnotatedTranscript`. `AnnotatedTranscript` = `{text: str, segment_table: list[dict]}`.
- Annotation syntax (committed for stability — Stage 29 prompt refers to it):
  - `[pause 1.4s]` inline at the pause's real position
  - `*keyword*` around prominent word per segment
  - `[pace 175 wpm]` between segments where local WPM changes ≥25% from previous
  - `<um>` / `<like>` inline filler markers
  - Segment table: `| t | dur | wpm | pitch_range_st | intensity_db | tone | prominent |`
- `apps/api/app/synthesize.py`: build annotated transcript and pass both raw and annotated. Prompt not changed yet (kept for diff cleanliness — Stage 29 rewrites it).
- `apps/api/tests/test_annotate.py` (new): golden snapshot for a fixture report — `inline-syntax`, `pace-shift`, `fillers-inline`, `uptalk-marked`.

**Verify:** Pytest green. Print annotated transcript for the existing fixture speech and read it end-to-end — should read like the speech with stage directions.

---

## Stage 29 — Rubric expansion, schema v2, prompt rewrite

**Goal:** This is the user-visible turning point. New `Synthesis` shape, new prompt, annotated transcript replaces raw text. Reports look different from here on.

**Changes:**
- `apps/api/app/schemas.py`: replace `Synthesis` with v2 shape:
  ```
  headline: str
  message_sentence: str  # one-sentence statement of the core idea; null if unfindable
  walkthrough: { opening: Beat, body: list[Beat], close: Beat }
      # Beat = {start_t, end_t, observation, praise?, critique?, quote_t?}
  categories: {
      hook: CategoryScore
      message_focus: CategoryScore
      structure: CategoryScore
      closing: CategoryScore
      pacing: CategoryScore
      pauses: CategoryScore           # placement-aware
      vocal_variety: CategoryScore    # speaker-relative
      language: CategoryScore         # incl. lexical fillers
  }
  delivery_habits: {
      fillers: HabitSection | None    # None if score == 5
      pauses: HabitSection | None
      pace: HabitSection | None
      vocal_variety: HabitSection | None
      language: HabitSection | None
  }
  priorities: list[Priority]          # 2 or 3, ranked by impact
  rewrites: list[Rewrite]             # 0–4
  ```
  - `CategoryScore { score: 1|2|3|4|5 | "n/a", rationale: str, evidence: list[Evidence] }`. Validator: `score < 5` ⇒ `len(evidence) >= 1`. `"n/a"` requires `applicability_reason: str`.
  - `Evidence { quote: str, t: float }`.
  - `Priority { title, observation, example_quote, example_t, why_it_matters, drill }`.
  - `HabitSection { score, summary, examples: list[Evidence], counts?: dict }`.
- `apps/api/app/schemas.py`: `Report.schema_version: Literal[2] = 2`.
- `apps/api/app/synthesize.py`: rewrite system prompt around the new schema. Anchors:
  - Quantitative for fillers/pacing/pauses/vocal_variety where possible (semitone-CoV bands for variety).
  - Strict evidence rule: any sub-5 score must cite at least one `(quote, t)`. Restate in the prompt.
  - Three few-shots: keep the two existing (low-end + high-end), add a new **mid-band** example (mostly 3s) drafted from a real transcript.
  - User content = annotated transcript + segment table only; raw transcript is dropped from the prompt.
- `apps/api/app/main.py`: rip out v1 persistence path — fail loud on read of any v1 report.
- `apps/api/app/db.py` / deploy: wipe the reports table at deploy (one-line `truncate` migration).
- `apps/api/tests/test_synthesize_eval.py`: replace v1 fixtures with v2; assert evidence rule holds.
- `apps/api/tests/test_report_back_compat.py`: rewrite to assert v2 schema only; remove v1 cases (deliberately, with comment pointing at this stage).
- `apps/web/lib/api.ts` & report page: update TS types to match v2 shape. **UI not restructured yet** (that's Stage 32); show new fields in a temporary expandable JSON block + keep the old four-category card rendering for the four overlapping categories. This keeps the stage atomic without bundling UI design.

**Verify:** Smoke test on the fixture speech. `pytest` green. Hit `/analyze` end-to-end; inspect report JSON for shape correctness; eyeball that scores cite real timestamps. Confirm cost stays in range (log line).

---

## Stage 30 — Deterministic evidence verification

**Goal:** Post-synthesis check catches hallucinated quotes and out-of-range timestamps. Result attached to report; non-blocking.

**Changes:**
- `apps/api/app/verify.py` (new):
  - `normalise(s) = lower → strip punct → collapse whitespace`.
  - `find_quote(quote, transcript_text) -> (start_idx, end_idx, ratio) | None` using a Levenshtein ratio (`rapidfuzz`); accept ≥ 0.85.
  - Validators: every `Evidence.quote` resolves; every `Evidence.t` ∈ `[0, duration]`; every sub-5 category has ≥1 evidence; every `priorities[].example_t` resolves.
  - Returns `Verification { passed: bool, issues: list[{kind, location, detail}] }`.
- `apps/api/app/schemas.py`: `Report.verification: Verification`.
- `apps/api/app/main.py`: call `verify()` after `synthesize()`, before DB write. Log issue count.
- `apps/api/pyproject.toml`: add `rapidfuzz`.
- `apps/api/tests/test_verify.py` (new): hand-crafted Synthesis with one good quote, one whitespace-mangled quote (must pass), one fully invented quote (must fail), one out-of-range timestamp (must fail), one sub-5 with empty evidence (must fail).

**Verify:** Pytest green. Run pipeline on the fixture; inspect `report.verification.passed = true` and `issues = []`. Deliberately corrupt a synthesis test fixture and confirm flags appear.

---

## Stage 31 — Weighted overall score (server-side) + speech_type + speaker-relative variety

**Goal:** Overall score is server-computed, persisted, weighted, and respects "n/a". Speech type is optional input from the upload form.

**Changes:**
- `apps/api/app/schemas.py`:
  - `AnalyzeRequest.speech_type: Literal["prepared","impromptu","presentation"] | None = None`.
  - `Report.overall: { score: float, weights_version: int, weights: dict[str, float], applicable_categories: list[str] }`.
- `apps/api/app/scoring.py` (new): `compute_overall(categories, speech_type) -> Overall`. Documented default weights (content-heavy):
  - `message_focus: 0.18, structure: 0.15, hook: 0.10, closing: 0.10` (content/craft = 0.53)
  - `pacing: 0.10, pauses: 0.10, vocal_variety: 0.10, language: 0.07` (delivery = 0.37)
  - Impromptu profile drops `closing` and reweights remainder proportionally.
- `apps/api/app/synthesize.py`: prompt receives speech_type hint when present; anchors flex on it.
- `apps/api/app/main.py`: compute and persist `Report.overall`.
- `apps/api/tests/test_scoring.py` (new): table-driven; weights sum to 1.0; `"n/a"` redistributes weight; impromptu profile excludes closing.
- `apps/web/components/upload-form.tsx`: optional speech-type select (default "prepared"). Pass through to `/analyze`.
- `apps/web/app/report/[id]/page.tsx`: stop computing `overall` client-side; read `report.overall.score`. Update `verdict()` thresholds if new scale shifts (keep current thresholds for now).

**Verify:** Pytest green. Upload one prepared and one impromptu sample. Confirm `overall.score` and `weights` are persisted, impromptu version excludes closing.

---

## Stage 32 — Report UI restructure

**Goal:** New report layout matches the spec's frame: Headline → Walk-through → Delivery & habits (conditional) → Priorities → Rewrites (conditional) → Scorecard.

**Changes:**
- `apps/web/app/report/[id]/page.tsx`: restructure top-to-bottom:
  - `<Headline>` — uses `synthesis.headline` and `report.overall`.
  - `<Walkthrough>` — opening / body[] / close with timestamps; each beat links to chart time.
  - `<DeliveryHabits>` — render only sections where `delivery_habits[k] != null`. Filler section shows clustering on the timeline.
  - `<Priorities>` — numbered cards with observation, quote, drill.
  - `<Rewrites>` — only if `rewrites.length > 0` (existing component, reused).
  - `<Scorecard>` — moves to bottom: all eight category cards + the timeline chart + raw stats.
- Reuse existing card components and the `TimelineChart`. Don't introduce new styling primitives.
- Per `apps/web/AGENTS.md`: read `node_modules/next/dist/docs/` before touching app-router files; preserve existing data-fetching pattern.
- Add a `report/sample/` fixture that hits each conditional branch (clean speech with no delivery issues; messy speech with all sections) for visual QA.

**Verify:** Start `pnpm dev`, open both fixtures in the browser. Confirm clean speech has a one-line filler note (no big block); messy speech has the full deep-dive. Chart still renders. Mobile viewport sanity check.

---

## Stage 33 — Evaluation harness (seed set: 3 speeches)

**Goal:** A `make eval`-style command that runs the pipeline against labelled fixtures and reports score-vs-human delta, test-retest variance, and evidence-validity rate. Wired so a regression fails visibly.

**Changes:**
- `apps/api/eval/` (new):
  - `labels.json` — 3 entries: the two existing prompt few-shots (extract audio to R2-equivalent local fixtures + human scores per category) + one new mid-band example drafted in this stage.
  - `run.py` — for each labelled speech:
    1. Run the full pipeline 3× (test-retest).
    2. Compare each category score to the human label, allow ±1 tolerance, report MAE.
    3. Compute per-category variance across the 3 runs.
    4. Re-run `verify()` on each output; report evidence-pass rate.
  - Output: a printed table + JSON summary at `apps/api/eval/results/<timestamp>.json`.
  - Failing thresholds (documented): MAE > 1.0, variance > 1.0, evidence-pass < 0.95.
- `apps/api/pyproject.toml`: add an `[project.scripts]` entry `speakgrade-eval = "eval.run:main"`.
- Note for grow-later: a `labels.json` schema doc so speeches can be added without touching code.

**Verify:** `uv run speakgrade-eval` on the seed set. Confirm it runs end-to-end, prints a sensible table, and writes a results JSON. The pass/fail line at the bottom should match the documented thresholds.

---

## Stage 34 (optional) — LLM critic pass

**Goal:** A second Haiku pass that re-checks evidence grounding and flags invented stats. Only worth doing if Stage 33 shows deterministic verification misses real hallucinations.

**Changes (if pursued):**
- `apps/api/app/critic.py` (new): Haiku call; input = annotated transcript + Synthesis JSON; output (structured) = `list[{location, concern, severity}]`.
- Append findings into `report.verification.issues` with a `source: "critic"` tag.
- Add to `LlmCost`; surface in UI details.
- Gate behind a config flag (`ENABLE_LLM_CRITIC`) so cost regressions are reversible.

**Decision rule:** Skip this stage if Stage 33 shows the deterministic check catches ≥ 95% of evidence faults across the seed set. Re-evaluate when the labelled set grows.

---

## Critical files to know (Phase F)

- `apps/api/app/schemas.py` — Pydantic spine; touched in stages 26, 27, 29, 30, 31.
- `apps/api/app/acoustic.py` — touched heavily in 26 and 27.
- `apps/api/app/metrics.py` — segments + merged fillers.
- `apps/api/app/synthesize.py` — prompt and input shape; rewritten in 29.
- `apps/api/app/main.py` — concurrency fan-out (Stage 27), verification hook (Stage 30), overall score (Stage 31).
- `apps/web/app/report/[id]/page.tsx` — typed against new shape in 29, restructured in 32.
- `apps/web/lib/scores.ts` — overall score derivation moves server-side in Stage 31; this file shrinks to verdict thresholds only.
- `apps/api/tests/test_*.py` — extended per stage; v1 back-compat removed in Stage 29.

## Reused utilities to keep

- `compute_wpm_timeline` in `metrics.py` — keep; segment WPM is a separate per-segment compute, the rolling timeline still powers the chart.
- `_intervals_to_pauses` in `acoustic.py` — extend with `prev_word`/`next_word`; don't replace.
- `usage_cost` in `cost.py` — extend with Haiku model entries; don't fork.
- `TimelineChart` in `apps/web/components/` — reused in the Stage 32 scorecard section.

## End-to-end verification (across the whole phase)

Once Stage 33 lands:
1. `uv run speakgrade-eval` is green on the seed set.
2. Upload a 60s prepared speech via the live UI. Confirm: headline + walk-through render; conditional habit sections hide cleanly when scores are 5; priorities cite quotes that resolve when you scrub the audio; overall score matches the weighted sum; report JSON has `schema_version: 2`, `verification.passed: true`, `overall.weights_version: 1`.
3. Upload an impromptu (≤45s). Confirm: `closing` shows as `"n/a"` with reason; overall reweights cleanly.
4. Check Modal logs: Haiku + Sonnet cost lines present, total per report stays in a sensible range (target: ≤ 2× current).

## Open notes (not blocking)

- Labelled set grows from 3 → 10–15 as a follow-up. Stage 33's `labels.json` schema is the contract that lets that happen without code changes.
- Critic pass (Stage 34) is conditional on Stage 33 evidence; don't pre-commit.
- If Stage 33 ever shows Sonnet output truncating or category drift on the later fields, the spec's "clean split" (mechanical + content in two calls, plus a short synthesis) is the documented fallback — defer until evidence demands it.

---

# Phase G brief — Speech-type tailoring

## Context

The upload form already lets the user pick **prepared / impromptu / presentation**, and `speech_type` flows end-to-end (form → `/analyze` → `synthesize()` + `compute_overall()` → persisted in the JSONB payload → shown on the dashboard row and report header). Stage 31 wired the plumbing but the tailoring was thin: a one-line prompt hint per type and one weight tweak (impromptu drops `closing`). The three types still read almost identically.

Phase G makes each type evaluate and present on its own terms — **without touching the prepared report or its samples**. What "good" looks like differs by type: an impromptu answer is judged on composure and answering the actual question (not a polished hook/close); a presentation lives on signposting and a landed takeaway. Decisions locked with the owner: keep the same 8-category rubric and report layout (no schema/UI fork, headings unchanged) — *tune the judgement, not the structure* — and ship **one** sample report per new type. Impromptu criteria are grounded in Toastmasters Table Topics judging, the PREP framework, Minto's answer-first principle, and composure guidance (calm, deliberate, **not** fast). Presentation criteria are grounded in standard oral-presentation rubrics (signposting, transitions, clear take-home message, audience adaptation).

No DB migration: `speech_type` already persists in the payload, and the scoring change only affects new analyses.

## Stage 35 — Per-type evaluation tuning ✅

**Goal:** Impromptu and presentation analyses are judged by their own standard; prepared is unchanged.

**Changes:**
- `apps/api/app/synthesize.py` — split the single shared prompt into **three focused system prompts** selected by `speech_type` (`_SYSTEM_PROMPTS` dict; `None` → prepared). `_SYSTEM_PROMPT_PREPARED` is the original literal, only renamed — byte-for-byte unchanged. `_SYSTEM_PROMPT_IMPROMPTU` and `_SYSTEM_PROMPT_PRESENTATION` are built from shared `_INPUT_FORMAT_SECTION` + `_RULES_SECTION` constants plus a per-type intro, scoring rubric, and **one tailored worked example** each. Each prompt is cached (`ephemeral`) on its own. The old user-message `_SPEECH_TYPE_HINTS` injection is removed. Rationale (owner's call): a shorter single-type prompt keeps the model's attention on the rubric that applies and avoids it missing the type. Impromptu rubric is explicit that composure/fluidity beat speed and a thinking pause is a virtue; presentation centres on signposting + a strict close.
- `apps/api/app/scoring.py` — added a `presentation` branch to `_profile_for()` that lifts `structure` by 0.06 (signposting is the centerpiece), drawing the increment proportionally from the other seven. Impromptu branch unchanged. Bumped `WEIGHTS_VERSION` 1 → 2.

**Verify (done):** profiles sum to 1.0 for all four cases (`None`/prepared structure 0.18 + closing 0.10; impromptu drops closing, 7 cats; presentation structure 0.24). Modules compile; prepared prompt unchanged (239 lines, 3 examples); the two new prompts are ~125 lines each (one example), and both worked examples validate against the `Synthesis` schema. Full LLM behaviour confirmed by the owner against live audio (prepared baseline unchanged; impromptu shows lenient structure/closing + composure-framed pacing; presentation emphasises signposting + a strict, takeaway-focused close).

## Stage 36 — Per-type sample reports + sample-page toggle ☐

**Goal:** `/report/sample` offers a 3-way toggle; impromptu and presentation each have one rendered sample in the existing report format.

**Changes:**
- `apps/web/lib/sample-reports.ts` — add `impromptuSampleReport` (an "answering a tough question in a meeting" answer, ~75–110s, composed pacing, a thinking pause, answer-first PREP spine) and `presentationSampleReport` (~5–7 min, explicit signposting, landed takeaway). Mirror the exact `Report` shape of `cleanSampleReport`.
- `apps/web/app/report/sample/impromptu/page.tsx` and `.../presentation/page.tsx` — thin pages rendering `<ReportView report={…} sampleLabel="Sample · impromptu|presentation" />`, like `clean/page.tsx`.
- `apps/web/app/report/sample/page.tsx` — restructure into a 3-way segmented toggle (small `"use client"` component, lightweight buttons in the page's existing Tailwind style — no shadcn Tabs exist). Prepared shows the existing clean + messy pair unchanged; impromptu/presentation each show their single sample card.

**Verify:** `pnpm dev`; open `/report/sample`, toggle all three, open each sample, confirm the new ones render fully and the prepared pair is untouched.

## Stage 37 — Dashboard filter by speech type ✅

**Goal:** Users can filter their report list by type.

**Changes:**
- `apps/web/app/dashboard/page.tsx` keeps fetching server-side, then passes the array to a new `"use client"` component (`apps/web/components/dashboard-report-list.tsx`) holding the active-type filter state and rendering the existing `DashboardReportRow`s.
- Filter chips: **All · Prepared · Impromptu · Presentation**, client-side filtering (per-user lists are small — no backend param). `speech_type === null` reports appear under "All". The per-row label already exists.

**Verify:** `pnpm dev`; on `/dashboard` with mixed types, each chip narrows the list and "All" restores it.

## Notes

- Prepared's behaviour is the safety baseline. Any change that would move a prepared report's score or prompt is out of scope for Phase G.
- Stage 33's eval harness can attribute a presentation/impromptu score shift to the new `WEIGHTS_VERSION` 2 vs. a prompt change.
- If the owner later wants type-native section headings (e.g. impromptu "Hook" → "Framing"), that's a display-only follow-up keyed on `report.speech_type` in `report-view.tsx` — deferred by decision.
