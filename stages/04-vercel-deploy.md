# Stage 04 — Deploy frontend to Vercel

## Concept
Vercel runs Next.js as a managed service — push code, get a globally-cached HTTPS site with per-branch previews, free for personal projects. Vercel CLI = fastest first deploy; GitHub integration = auto-deploy on every push.

## Build unit
- **Pre-flight:** `pnpm build` locally (caught no issues; static `/` route generated).
- **First deploy:** `cd apps/web && pnpm dlx vercel --yes` (interactive login, project named `speech-coach` or similar).
- **Promote to prod:** `pnpm dlx vercel --prod` once happy.
- **CI/CD (recommended):** create a GitHub repo, `git push -u origin main`, then connect it on Vercel dashboard → auto-deploy on every push.

## Walkthrough
- The CLI creates a `.vercel/` folder in `apps/web/` that links the local code to the Vercel project. Already gitignored.
- Default deploy is a **preview** — only `--prod` updates the production alias.
- Vercel auto-detects Next.js, so no `vercel.json` config is needed.
- Env vars (e.g. `NEXT_PUBLIC_API_URL` later) must be added in **Vercel dashboard → Settings → Environment Variables** — `.env` files are not used in production.

## Notes / surprises
- Vercel's free tier covers personal projects but not commercial use — fine for a portfolio piece.
- Branch previews mean every PR gets its own URL (e.g. `speech-coach-git-feat-x.vercel.app`). Great for sharing WIP.
- The first prod deploy URL is what you share. You can also connect a custom domain later (Stage 24).

## Docs to skim
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel for Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Vercel — Environment Variables](https://vercel.com/docs/projects/environment-variables)

## Verification
- `vercel` finishes with two URLs printed; the preview URL loads the centered title + disabled upload form.
- `vercel --prod` promotes to the production URL; loads the same.
- (Later) On `git push`, Vercel dashboard shows a new deployment kicking off automatically.
