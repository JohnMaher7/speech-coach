# SpeakGrade — AI speech coach

Free web tool: upload a speech → evaluator-style report (fillers, pacing, vocal variety, structure, top-3 actions) + pace/pitch timeline chart. Two-week MVP, public deploy, AI-engineering portfolio piece. (Product name: **SpeakGrade**, on the domain **speakgrade.com**. Renamed "Toastmasters Speech Coach" → "Rhetor" (Stage 24) → "SpeakGrade" (for the Clerk production domain); the evaluation methodology is still evaluator-style.)

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


## Resuming work across sessions
- `BUILD_STAGES.md` (root) is the source of truth for what's done and what's next. Checklist on top (☐ todo · ⏳ in progress · ✅ done), detailed brief for the active phase below.
- When the owner says **"next stage"**, read `BUILD_STAGES.md`, find the first ☐ in the checklist, and execute that stage's `Goal` + `Changes` + `Verify` block. When they say **"stage N"**, jump to that stage's block.
- Mark the stage ⏳ when starting and ✅ when its `Verify` block passes. Append a teaching walkthrough at `stages/<NN>-<slug>.md` after the stage runs (existing Phase A–E pattern).
- Advise when to clear context and start a new session.


## Out of scope (V1)
Browser recording, multi-speaker, accounts, queues, comparison reports, mobile app, real-time analysis.
