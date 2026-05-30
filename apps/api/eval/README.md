# SpeakGrade eval harness

Operational reference for the eval harness. The conceptual deep dive lives in
[`notes/eval-harness-deep-dive.md`](../../../notes/eval-harness-deep-dive.md) —
read that first if you haven't.

## Running the harness

```
uv run speakgrade-eval
```

What you'll see:

1. Per-case progress lines (`run 1/3...`, `run 2/3...`, etc.) with overall
   score, verify pass/fail, and cost per run.
2. A summary table at the end with:
   - **MAE per category** — how far the model's score is from your grade
   - **Variance per (case, category)** — stddev across the 3 runs
   - **Evidence-pass rate** — fraction of runs where `verify()` passed
   - Total cost and skipped-run count
3. A `RESULT: PASS` or `RESULT: FAIL` line. Non-zero exit code on FAIL.

The detailed payload — every run's model scores, headlines, verification
issues, costs — lands in `results/<UTC-timestamp>.json`.

### Failure thresholds

The harness fails if any of:

| Metric | Threshold |
|---|---|
| Any category MAE | > 1.0 |
| Any (case, category) variance | > 1.0 |
| Evidence-pass rate | < 0.95 |

See [the deep-dive notes](../../../notes/eval-harness-deep-dive.md#9-thresholds-and-how-to-read-a-failure)
for what each failure means and how to diagnose it.

## Adding a new speech to the eval set

Five steps.

### 1. Pick a source

- **Fixture** (synthetic): cheap, deterministic, but doesn't exercise Deepgram
  or librosa. Use for adding tightly-controlled edge cases.
- **Audio**: real `.wav` (or `.flac`) under `audio/`. Slower and costs Deepgram
  + Haiku per run. Use for real-world generalisation tests.

Mono, 16 kHz, ~30–90 seconds is the sweet spot. A 60-second mono 16 kHz WAV is
~1.5 MB; commit it directly.

### 2. Add the source

**Fixture path:** add a new `GoldenCase` to `apps/api/tests/fixtures.py`,
export the symbol, then reference it in `labels.json` via `fixture_name`.

**Audio path:** drop the file at `apps/api/eval/audio/<your-id>.wav`. The
filename stem becomes the value of `audio_path` in the label entry (with the
`audio/` prefix).

### 3. Grade the speech

Open the rubric — it's [in the deep-dive notes](../../../notes/eval-harness-deep-dive.md#6-the-rubric-quick-reference-for-grading)
— and grade each of the 8 categories on a 1–5 scale (or `"n/a"` if the
category genuinely doesn't apply).

Grading principles (the *thinking* behind grading is in §7 of the deep-dive):

- **Grade independently.** Don't run the eval first and then grade against the
  model's output. That defeats the point.
- **Grade honestly.** Especially for your own recordings, resist both flattery
  and excessive harshness.
- **Write `notes`** in the label entry capturing why you scored the way you
  did. Future-you reviewing the eval table will need this.

Plan to spend ~5 minutes per case if you're rubric-literate, ~15 minutes if
you're new to it.

### 4. Add the entry to `labels.json`

Append a new object. Shape:

```json
{
  "id": "your_case_id",
  "source": "fixture",
  "fixture_name": "YOUR_FIXTURE",
  "speech_type": "prepared",
  "human_label": {
    "graded_by": "your-name",
    "graded_at": "2026-05-19",
    "categories": {
      "hook": 3,
      "message_focus": 4,
      "structure": 3,
      "closing": 3,
      "pacing": 4,
      "pauses": 3,
      "vocal_variety": 3,
      "language": 4
    },
    "notes": "Why each score is what it is. Especially the borderline ones."
  }
}
```

For audio cases, swap `fixture_name` for `audio_path` (e.g. `"audio/foo.wav"`).

The schema is documented in `labels.schema.json` — every field, every type. If
you have a JSON-aware editor it'll validate as you type.

### 5. Run and commit

```
uv run speakgrade-eval
```

Confirm the new case appears in the output table, then commit the audio file
(if any), the fixture (if any), and the `labels.json` change together.

## Recording your own audio

For the third seed case (`mid_band.wav`) or future growth:

**Mic and room.** Any decent mic — laptop mic in a quiet room is fine for the
seed. Don't over-engineer; we're not optimising audio quality, we're testing
the pipeline's behaviour on plausible-quality input.

**Format.** Save as 16 kHz mono WAV (or FLAC if you want compression). On
macOS, QuickTime's "New Audio Recording" saves m4a — convert with `ffmpeg`:

```
ffmpeg -i recording.m4a -ar 16000 -ac 1 audio/mid_band.wav
```

**Length.** ~60 seconds for the seed mid-band case. Long enough to have
opening / body / close; short enough to grade quickly.

**Content.** Pick a topic you can speak about for a minute without prep.
Examples:
- A book or article you read recently and what you took from it
- Something you'd change about how a team you've been on worked
- A skill you've been learning and what surprised you about it

**Defect profile for the seed mid-band case.** Aim for mostly 3s on the
rubric. That means:
- A hook that sets up the topic but doesn't grab — fine
- A clear-ish thesis but you wander once or twice
- Three points loosely held together, no explicit signposting
- A closing that ends the speech but doesn't echo or call back
- 140–160 WPM, with one or two rushes
- A couple of audible "um"s — not a lot, not zero
- Average pitch variety — you're not flat but not lively
- Some pauses, but not deliberately placed

Record the take, listen to it, grade it honestly (not generously). If the
take comes in too clean (mostly 4s) or too rough (mostly 2s), re-record. The
mid-band is where the eval's signal is.

## Directory layout

```
apps/api/eval/
  audio/               .wav files committed to the repo
  results/             eval output JSONs (gitignored except .gitkeep)
  __init__.py
  labels.json          the seed set
  labels.schema.json   JSON Schema for labels.json
  README.md            this file
  run.py               the harness CLI
```

## Cost expectations

Per `uv run speakgrade-eval` invocation with the current seed (2 fixture + 1 audio):

| Cost component | Approx |
|---|---|
| Sonnet (synthesis) × 9 runs | $0.40 – $0.80 |
| Haiku (lexical fillers) × 3 audio runs | $0.05 – $0.10 |
| Deepgram (transcribe) × 3 audio runs | $0.05 – $0.10 |
| **Total** | **$0.50 – $1.00** |

If costs creep above this materially, the report JSON's per-run breakdown is
the first place to look — a single anomalous run usually accounts for it.
