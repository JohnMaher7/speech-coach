# Toastmasters Speech Coach

Free web tool: upload a speech → evaluator-style report (fillers, pacing, vocal variety, structure, top-3 actions) + pace/pitch timeline chart. Two-week MVP, public deploy, AI-engineering portfolio piece.

## Stack
- Frontend: Next.js 15 + TS + Tailwind + shadcn/ui — `apps/web/`
- Backend: FastAPI + Python 3.12 (managed by `uv`) — `apps/api/`
- Audio: Deepgram (STT), librosa + parselmouth (acoustic)
- LLM: Claude Sonnet via `anthropic` SDK with prompt caching + tool-use
- Storage: Cloudflare R2 (audio), Neon Postgres + SQLModel (reports)
- Hosting: Vercel (web), Modal (api)

## Commands
- `cd apps/api && uv sync` — install Python deps
- `cd apps/api && uv run uvicorn app.main:app --reload` — local API
- `cd apps/api && uv run modal deploy modal_app.py` — deploy API
- `cd apps/web && pnpm dev` — local web
- `cd apps/web && vercel deploy` — deploy web

## Architecture
Browser → R2 (presigned PUT) → `POST /analyze` (SSE): `asyncio.gather(transcribe, acoustic)` → derived metrics → Claude synthesis → persist → `done` event with `report_id`. Pydantic models in `apps/api/app/schemas.py` are the spine.

## Rules
- Owner is a beginner Python dev / beginner web dev. Teach Python + AI engineering deeply; stay brief on frontend/devops/infra.
- Type hints everywhere (3.10+: `list[X]`, `X | None`). Pydantic at every boundary (HTTP, DB, external APIs, LLM).
- `async def` for I/O. `asyncio.gather` for independent awaits.
- `uv add <pkg>` to install. `uv run <cmd>` to execute.
- Always cache the system prompt + few-shots. Always use tool-use for structured outputs. Log `cache_read_input_tokens`.
- Reference real docs when introducing a library — don't paraphrase.
- Don't add teaching comments in code. Teaching lives in chat + `notes/`.

## Working cadence (every stage — non-negotiable)
1. Explain the concept (2–3 sentences: why & what)
2. Write the smallest meaningful unit
3. Walk through it (1–2 sentences)
4. STOP — wait for "next" before advancing
5. Advise when to clear context and start a new session

Don't batch subsystems. Don't auto-continue across stages.

## Workflow
On "next stage" (or similar):
1. Read this file → `BUILD_STAGES.md` → pick next ☐
2. Open/create `stages/<NN>-<slug>.md` for the rich plan (concept, build unit, walkthrough, docs links, verification)
3. Run the cadence above
4. After: tick `BUILD_STAGES.md`, update `LEARNING_PLAN.md`, write/extend `notes/<concept>.md`

## Maps (where to look)
- `BUILD_STAGES.md` — one-line checklist (☐/⏳/✅). The map.
- `stages/` — rich per-stage walkthroughs (one `.md` per stage, created when started)
- `LEARNING_PLAN.md` — Python + AI-eng concepts mapped to stages, ✅ + "I can now…" added as taught
- `notes/` — concept distillations for review/upskilling. Scannable, well-formatted, **no verbosity**. One `.md` per concept; extend rather than duplicate. Format: gist · why it matters · API/pattern · mental model · gotchas.

## Out of scope (V1)
Browser recording, multi-speaker, accounts, queues, comparison reports, mobile app, real-time analysis.
