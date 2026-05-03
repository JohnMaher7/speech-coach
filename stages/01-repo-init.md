# Stage 01 — Repo init + docs scaffold

## Concept
Sibling apps (`apps/web`, `apps/api`) under one git repo — no workspace tool needed for two apps. `.env.example` is the schema of required secrets; `.env` itself is gitignored. The three living docs (`CLAUDE.md`, `BUILD_STAGES.md`, `LEARNING_PLAN.md`) were pre-created; this stage finishes the skeleton.

## Build unit
- `git init -b main`
- `.gitignore` — secrets, Python, Node/Next, Vercel/Modal, OS, editors
- `.env.example` — placeholders for Anthropic, Deepgram, R2 (×4), Neon, `NEXT_PUBLIC_API_URL`
- `README.md` — short blurb, stack list, local dev steps
- `notes/env-conventions.md` — note on the 12-factor `.env.example` pattern

## Walkthrough
`.env.example` is committed; `.env` never is. Anyone cloning runs `cp .env.example .env` and fills in their own values. The `NEXT_PUBLIC_` prefix on `NEXT_PUBLIC_API_URL` is Next.js's signal that this var is safe to expose to the browser — anything without that prefix stays server-side only.

## Docs to skim
- [Twelve-Factor App: Config](https://12factor.net/config)
- [Next.js — environment variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Verification
- `git status` shows the new files; `.env` is **not** present (never committed).
- `cat .env.example` lists every secret used across the 25 stages.
- Repo tree: `CLAUDE.md`, `BUILD_STAGES.md`, `LEARNING_PLAN.md`, `README.md`, `.env.example`, `.gitignore`, `stages/01-repo-init.md`, `notes/env-conventions.md`.
