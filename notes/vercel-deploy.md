# Vercel deploys

## Gist
Vercel hosts Next.js apps. The CLI deploys from your terminal; the GitHub integration deploys on every push. Both produce the same artifact: a globally-cached HTTPS site backed by serverless functions for any dynamic routes.

## Mental model: dev vs build vs deploy

| Phase | Command | What happens |
|---|---|---|
| Dev | `pnpm dev` | Unoptimized bundle, hot reload, source maps. Localhost only. |
| Build | `pnpm build` | TypeScript check + production bundle. **What Vercel runs on its servers.** |
| Deploy | `vercel` / git push | Build artifact uploaded to Vercel's edge network. |

If `pnpm build` fails locally, the Vercel deploy will fail too. Always build before pushing.

## Two deploy paths

### Vercel CLI (`pnpm dlx vercel`)
- Interactive setup the first time (login, project name, scope).
- Subsequent runs deploy to a **preview URL** by default; `--prod` promotes.
- Creates `.vercel/` linking your local folder to the remote project. Gitignored.

### GitHub integration (recommended for ongoing work)
- Connect the repo on Vercel dashboard.
- Every push to `main` → production deploy.
- Every push to any other branch → preview URL with its own subdomain.
- This is what "CI/CD" means for a static-ish frontend.

## Env vars
Production env vars are set in **Vercel dashboard → Settings → Environment Variables**, not in `.env`. `.env` is local-only. Reasons:
- `.env` is gitignored, so Vercel never sees it.
- Different envs (preview vs prod) often need different values.
- Secrets like API keys must never live in source control.

`NEXT_PUBLIC_*` vars are bundled into the JS shipped to the browser; everything else stays server-side only.

## Custom domain
Free `*.vercel.app` URL ships immediately. Custom domain (e.g. `speechcoach.app`) is added in **Settings → Domains** with a DNS record. Stage 24 for that.

## Gotchas
- **Build fails on Vercel that succeed locally** — usually because Vercel uses a stricter Node version or different env vars. Match Node via `engines` in `package.json` if needed.
- **Preview URLs leak in commit messages** — if a repo is public, its preview URLs are guessable. Don't put secrets in pages that ship to preview.
- **Cold starts on free tier** — first request after idle can take a couple seconds while a serverless function spins up. Doesn't apply to fully-static pages (which is what the home page currently is).
