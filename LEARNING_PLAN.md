# Learning Plan

Concepts mapped to the stage where they first appear. Tick ✅ once taught and add a one-line **I can now…** below.

Legend: ☐ pending · ✅ taught

## Python (deep)
- ☐ **Stage 05** — `uv` project mgmt, `pyproject.toml`, lockfile model
- ☐ **Stage 05** — Modern type hints (`list[X]`, `X | None`, `Annotated`)
- ☐ **Stage 05** — FastAPI route handlers, ASGI lifecycle
- ☐ **Stage 07** — `pydantic-settings` for env config
- ☐ **Stage 07** — `boto3` + presigned URLs
- ☐ **Stage 09** — Pydantic v2 fundamentals (`BaseModel`, validators, `model_dump`)
- ☐ **Stage 10** — `async`/`await` mental model
- ☐ **Stage 10** — External SDK async clients (Deepgram)
- ☐ **Stage 12** — SQLModel (Pydantic + SQLAlchemy unified), sessions
- ☐ **Stage 13** — numpy fundamentals (1-D arrays, slicing, audio as samples)
- ☐ **Stage 13** — `librosa.load`, frames vs samples vs hop length
- ☐ **Stage 13** — `parselmouth` Sound + To Pitch (Praat bindings)
- ☐ **Stage 14** — Rolling windows, `np.std` → normalized score
- ☐ **Stage 14** — Regex on tokenised words with timing alignment
- ☐ **Stage 16** — `asyncio.gather` for fan-out
- ☐ **Stage 17** — FastAPI `StreamingResponse` + async generators
- ☐ **Stage 22** — pytest fixtures, integration testing FastAPI

## AI engineering (deep)
- ☐ **Stage 11** — Anthropic SDK: system vs user, message shape
- ☐ **Stage 11** — Tool-use as a structured-output mechanism (vs JSON-mode)
- ☐ **Stage 11** — Prompt caching: `cache_control`, ephemeral, what counts as a hit
- ☐ **Stage 11** — `cache_read_input_tokens` & cost math
- ☐ **Stage 17** — SSE streaming UX for LLM apps
- ☐ **Stage 22** — Few-shot collection methodology (real > synthetic)
- ☐ **Stage 22** — Eval harness: golden set, regression diffing
- ☐ **Stage 23** — Two-pass prompting (extract → synthesize)
- ☐ **Stage 23** — Cost engineering: model selection, cache ROI

## Frontend / devops (brief, high-level)
- ✅ **Stage 01** — `.env.example` / 12-factor config, `NEXT_PUBLIC_*` vs server-only vars
- ✅ **Stage 02** — Next.js App Router, Tailwind v4 utility-first, shadcn/ui copy-source model
- ✅ **Stage 03** — `'use client'` boundary, `useState` + `useRef`, controlled vs uncontrolled inputs, file-input quirks
- ☐ **Stage 04** — Vercel deploy
- ☐ **Stage 06** — Modal deploy & cold starts
- ☐ **Stage 07** — Cloudflare R2 + presigned uploads
- ☐ **Stage 18** — Browser `EventSource` + SSE
- ☐ **Stage 19** — Recharts dual-axis chart
- ☐ **Stage 25** — slowapi rate limiting, Sentry

---

## I can now… (running log)

- **Stage 01** — explain why `.env.example` is committed but `.env` isn't, and identify which Next.js env vars are browser-exposed.
- **Stage 02** — describe the App Router's folder-to-URL mapping, write JSX with Tailwind utility classes, and add a shadcn component via the CLI knowing the source lives in my repo.
- **Stage 03** — decide when a component needs `'use client'`, manage UI state with `useState`, and explain why file inputs can't be fully controlled.
