# SpeakGrade — AI speech coaching

Free web tool that turns a recorded talk into an evaluator-style report — filler words, pacing, vocal variety, structure, top-3 actions — plus a pace + pitch timeline chart.

## Stack
Next.js 16 · FastAPI · Deepgram · librosa + parselmouth · Claude Sonnet · Cloudflare R2 · Neon Postgres · Modal · Vercel

## Status
In active development — see [`BUILD_STAGES.md`](./BUILD_STAGES.md).

## Local development
1. `cp .env.example .env` and fill in keys.
2. Backend: `cd apps/api && uv sync && uv run uvicorn app.main:app --reload`
3. Frontend: `cd apps/web && pnpm install && pnpm dev`
