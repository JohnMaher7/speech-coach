# In-App Recording — Design

**Date:** 2026-06-10
**Status:** Approved

## Goal

Remove the upload-only friction: users' recordings usually live on their phone, so add a
second path — record directly in the browser (desktop or phone) — alongside the existing
file upload. The recorded audio rides the existing pipeline untouched:
`signUpload()` → `uploadToR2()` → `/analyzing/[key]`.

## UI

An **Upload | Record tab switcher** inside the existing upload card on the home page.
Both tabs share the speech-type selector, auth/plan gating, error alert, and the
analyze/submit path. The tab switcher is hand-rolled (no shadcn Tabs in the project),
styled like the existing speech-type pills, and disabled while recording or uploading.

### Recorder states

| State | UI |
|---|---|
| idle | Round primary mic button "Start recording" + hint "Records in your browser · auto-stops at 20:00" |
| requesting | Spinner, "Allow microphone access…" |
| recording | Pulsing red dot, mono timer, live level bars (real mic input via AnalyserNode), Pause / Stop |
| paused | Frozen timer, flat bars, Resume / Stop |
| stopped | `<audio controls>` preview, duration · size caption, Re-record, Analyze |

## Architecture

- `apps/web/lib/use-recorder.ts` — `useRecorder()` hook: MediaRecorder + AudioContext
  lifecycle, state machine (idle → requesting → recording ⇄ paused → stopped), timer,
  level meter, 20-minute auto-stop, friendly mic-error messages, full cleanup on unmount.
- `apps/web/components/record-panel.tsx` — Record tab UI. Knows nothing about auth or
  upload; hands a finished `File` up via `onAnalyze`.
- `apps/web/components/upload-form.tsx` — stays the orchestrator: gains tab state, an
  extracted `startAnalysis(file)` shared by both tabs, and renders `RecordPanel`.

### Format handling

MediaRecorder mime preference: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4`
(Safari/iOS). The mime is normalized to its base container once, and that one string is
used for the Blob, the presign request, and the R2 PUT header — required for the presigned
signature to match. The backend needs no pipeline changes: ffmpeg is already in the Modal
image and `acoustic.py` transcodes anything soundfile can't read; Deepgram detects format
from content.

### Backend hardening (only API change)

`POST /uploads/sign` rejects non-`audio/*` content types with a 400 — mirrors the
client-side guard, stops arbitrary content types from getting signed PUT URLs.

## Limits & edge cases

- Auto-stop at 20:00 (UI limit; server rejects > 25 min). 20-min opus ≈ 15–20 MB.
- Client guard for recordings under the server's 10-second minimum — no wasted analyze call.
- Mic denied / missing / unsupported browser → friendly message in the shared error alert.
- Mic unplugged mid-take → recording finalizes for preview instead of hanging.
- Tab switcher locked while recording; `beforeunload` prompt guards accidental tab close
  (client-side navigation mid-recording is a known MVP gap).
- Recording works signed-out; the Analyze click is where sign-in/plan redirects happen,
  same as upload.

## Costs

$0 in new fixed costs. MediaRecorder/Web Audio are free browser APIs; R2/Deepgram/Claude
per-analysis costs are unchanged. Lower friction may increase analysis volume, which
scales existing variable costs — a usage effect, not a feature cost.

## Out of scope

Input-device picker, downloadable recordings, draft persistence across navigation,
real-time analysis while recording.
