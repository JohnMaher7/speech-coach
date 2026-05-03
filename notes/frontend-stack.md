# Frontend stack: Next.js App Router · Tailwind · shadcn/ui

## Next.js App Router

### Gist
The folder structure under `app/` **is** the URL structure. A folder = a route segment; `page.tsx` inside it = the page component.

### Key files
| File | Role |
|---|---|
| `app/layout.tsx` | Root layout — wraps every page. `<html>`, `<body>`, fonts, providers. |
| `app/page.tsx` | Home route (`/`). |
| `app/foo/page.tsx` | `/foo` |
| `app/foo/[id]/page.tsx` | `/foo/<dynamic>` — `id` is in `params`. |
| `app/loading.tsx` | Suspense fallback while a sibling page loads. |
| `app/error.tsx` | Error boundary. |

### Server vs client components
Components are **server-rendered by default**. Add `'use client'` at the top of a file to opt into client-side interactivity (state, effects, browser APIs). Keep `'use client'` boundaries small — only the leaves that need interactivity.

### Mental model
Think of the folder as a sitemap and `page.tsx` as the screen. Layouts compose top-down — every page nested under a folder inherits that folder's `layout.tsx`.

---

## Tailwind v4

### Gist
Utility-first CSS. Instead of writing `.btn-primary { padding: 8px 16px; ... }`, compose styles inline: `className="px-4 py-2 bg-blue-500"`.

### Why it sticks
- Styles co-located with markup → faster to read & change.
- No naming bikeshed (`.card-header__title-large--dark`).
- Dead CSS is impossible — unused utilities never ship.
- Design tokens (colors, spacing) become a vocabulary everyone shares.

### Tailwind v4 specifics
- Imported in `app/globals.css` via `@import "tailwindcss";` (not v3's `@tailwind base; @tailwind components; @tailwind utilities;`).
- Theme is configured in CSS now, not `tailwind.config.ts`.

### Patterns to know
- `min-h-screen flex items-center justify-center` — center anything vertically + horizontally.
- `text-muted-foreground`, `bg-background` — shadcn theme tokens (auto-themed for light/dark).
- `space-y-4` — vertical gap between children. Cleaner than margins.

---

## shadcn/ui

### Gist
**Not** an npm dependency. The CLI copies component source files (Button, Input, Card, Dialog, …) into your repo at `components/ui/`. You own them, edit them, version them with your code.

### Why this matters
- No version lock-in or breaking-change pain — you decide when to update each component.
- Customization is `git diff`-friendly. No CSS-in-JS theme overrides.
- Components are thin wrappers around accessible primitives (Radix, base-ui) styled with Tailwind + your theme tokens.

### Adding a component
```bash
pnpm dlx shadcn@latest add button input card dialog
```
This drops files into `components/ui/`. Import like `import { Button } from "@/components/ui/button"`.

### The `cn()` helper
Lives in `lib/utils.ts`. Merges class strings safely (later classes win on conflict). Every shadcn component uses it.
```ts
cn("px-4 py-2", isActive && "bg-blue-500", className)
```

## Gotchas
- **Don't** put `'use client'` on `layout.tsx` unless every page should be client-rendered.
- Tailwind v4's CSS-first config means examples on the web that mention `tailwind.config.ts` may be outdated.
- shadcn components live **in your repo** — when docs say "update Button," you edit `components/ui/button.tsx` directly.
