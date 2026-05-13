# Rhetor — AI speech coach

Free web tool: upload a speech → evaluator-style report (fillers, pacing, vocal variety, structure, top-3 actions) + pace/pitch timeline chart. Two-week MVP, public deploy, AI-engineering portfolio piece. (Product name: **Rhetor** — the classical word for a teacher of oratory. Renamed from "Toastmasters Speech Coach" in Stage 24; the evaluation methodology is still evaluator-style.)

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
1. Explain the concept in plain English a non-technical beginner can follow (no jargon dumps).
2. Build the **entire stage** end-to-end in one go.
3. Walk through what was built, in the same beginner-friendly language.
4. STOP — wait for "next stage" before advancing to the next one.
5. Advise when to clear context and start a new session.

One stage = one turn, completed in full. **Don't sub-divide a stage into 9a/9b/9c units.** Don't batch multiple stages together either — finish stage N, stop, wait for the user.

## Writing style for `stages/` and `notes/`
The reader is a non-technical person becoming technical. Optimise for *learning*, not for being thorough.
- Plain English first; code second. Lead with the idea, then show the code.
- Short sentences. One idea per sentence. Cut hedges ("likely", "perhaps", "in some cases").
- Define every jargon word the first time it appears — a five-word definition is fine.
- Use analogies a non-technical reader will recognise.
- Show the smallest example that makes the point. Skip "advanced nuance" sections.
- No verbosity. If a paragraph repeats itself, cut it. If a sentence has a sub-clause that doesn't earn its keep, cut it.
- Skim-friendly beats comprehensive: clear headings, short paragraphs, lists over prose where it fits.

## Workflow
On "next stage" (or similar):
1. Read this file → `BUILD_STAGES.md` → pick next ☐
2. Open/create `stages/<NN>-<slug>.md` for the rich plan (concept, build unit, walkthrough, docs links, verification)
3. Run the cadence above
4. After: tick `BUILD_STAGES.md`, update `LEARNING_PLAN.md`, write/extend `notes/<concept>.md`

## Maps (where to look)
- `BUILD_STAGES.md` — one-line checklist (☐/⏳/✅). The map.
- `stages/` — rich per-stage walkthroughs (one `.md` per stage, created when started), clearly explain to break down abstraction for beginner to learn.
- `LEARNING_PLAN.md` — Python + AI-eng concepts mapped to stages, ✅ + "I can now…" added as taught
- `notes/` — concept distillations for learning/upskilling. Scannable, well-formatted, **no verbosity but clear explanations for beginners**. One `.md` per concept; extend rather than duplicate. Format: gist · why it matters · AI eng or Python key learning to upskill (if applicable) · mental model ·

## Out of scope (V1)
Browser recording, multi-speaker, accounts, queues, comparison reports, mobile app, real-time analysis.
