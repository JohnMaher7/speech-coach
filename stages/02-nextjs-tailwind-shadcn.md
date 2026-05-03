# Stage 02 — Next.js 15 + Tailwind + shadcn/ui scaffold

## Concept
Next.js's **App Router** maps folder structure to URLs (`app/foo/page.tsx` → `/foo`). **Tailwind v4** is utility-first CSS — compose styles inline via class names. **shadcn/ui** copies component source into your repo (no npm dep) so you can edit Button, Card, etc. freely.

## Build unit
- `apps/web/` scaffolded via `pnpm create next-app@latest` with TS, Tailwind v4, App Router, ESLint, Turbopack (no `src/`, `@/*` import alias).
- `.npmrc` at repo root: `package-import-method=copy` (works around pnpm hardlink failures on /mnt/c).
- shadcn initialized via `pnpm dlx shadcn@latest init --defaults --yes`: created `components.json`, `lib/utils.ts` (the `cn()` helper), `components/ui/button.tsx`, and updated `app/globals.css` with theme tokens.
- `app/page.tsx` replaced with a clean placeholder using Tailwind utilities + shadcn `Button`.
- `app/layout.tsx` metadata updated (title, description).

## Walkthrough
- `app/layout.tsx` is the root shell wrapping every page (fonts, `<html>`, `<body>`); `app/page.tsx` is the home route.
- Tailwind classes you'll see often: `flex`, `items-center`, `justify-center`, `min-h-screen`, `text-muted-foreground` (a shadcn theme token).
- The `cn()` helper in `lib/utils.ts` merges classes safely — used by every shadcn component.

## Notes / surprises
- Next 16 (not 15) was scaffolded — Next 15 was superseded; App Router contract is unchanged. Heeded the `AGENTS.md` warning to read `node_modules/next/dist/docs/` before writing Next-specific code.
- Tailwind 4 — uses `@import "tailwindcss";` in `globals.css` (vs v3's `@tailwind` directives) and configures via CSS, not `tailwind.config.ts`.
- pnpm install on `/mnt/c` requires `package-import-method=copy` — DrvFs can't hardlink+rename.

## Docs to skim
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind v4 docs](https://tailwindcss.com/docs)
- [shadcn/ui — installation](https://ui.shadcn.com/docs/installation/next)

## Verification
- `cd apps/web && pnpm dev` → open `http://localhost:3000` → see the centered title + disabled "Upload coming next stage" button.
- `pnpm exec tsc --noEmit` → no output (clean).
