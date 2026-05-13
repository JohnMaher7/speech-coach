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
- ✅ 24 — Full UI polish + Rhetor branding (rename, design tokens, shell, all 4 surfaces)
- ✅ 25 — Hardening (rate limit, Sentry, min_containers, smoke test, launch)
