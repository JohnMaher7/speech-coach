# Speaking Tips Section — Design

**Date:** 2026-06-09
**Status:** Approved

## Goal

A public, research-backed "Public Speaking Tips" section for SpeakGrade: an index page plus
eight topic sub-pages, matching the existing design language. Content is curated from
well-evidenced sources only; common myths are explicitly excluded (and debunked on a
dedicated page). Each page quietly funnels readers toward analyzing a real speech.

## Routes

All static, server-rendered, generated from one content module.

| Route | Purpose |
|---|---|
| `/tips` | Landing page: hero + card grid of the 8 sections, one-line summary each |
| `/tips/general` | General Tips |
| `/tips/fear` | Overcoming the Fear of Public Speaking |
| `/tips/delivery` | Delivery: Voice & Body |
| `/tips/prepared-speeches` | Prepared Speeches |
| `/tips/impromptu` | Impromptu Speaking |
| `/tips/presentations` | Presentations |
| `/tips/online` | Speaking Online |
| `/tips/myths` | Myths to Unlearn |

Section order above is canonical — it reads as a learning path (foundations → fear →
delivery → speech types → formats → myths).

## Content architecture

Single typed content module: `apps/web/lib/tips-content.ts`.

```ts
type Tip = {
  heading: string;
  body: string;          // 2–4 sentences, plain prose
  attribution?: string;  // short inline credit, e.g. "Alison Wood Brooks, Harvard Business School"
};

type TipsSection = {
  slug: string;
  title: string;       // page h1 + metadata title
  navLabel: string;    // short sidebar label
  summary: string;     // one-liner for index cards + meta description
  intro: string;       // 1–2 sentence section opener
  tips: Tip[];         // 4–6 per section
};

export const TIPS_SECTIONS: TipsSection[] = [ ... ];
```

Pages render purely from this array. `generateStaticParams` and `generateMetadata` both
read it; adding or editing a tip never touches a component. The Myths page reuses the
same shape: each tip's `heading` is the myth, `body` is why it's wrong.

## Content requirements

Every claim must trace to credible research or expert consensus. Where a claim is
research-backed, set the tip's `attribution` field; it renders as a small mono caption
under the tip body (e.g. "Alison Wood Brooks · Harvard Business School"). No footnote
apparatus, no links in body prose.

**Goes in (verified):**
- Anxiety reappraisal — relabel nerves as excitement (Alison Wood Brooks, Harvard, 2014).
- Graded exposure and repeated practice — gold-standard for speech anxiety in clinical literature (exposure-based CBT).
- Spontaneous-speaking structures — PREP; "What? / So what? / Now what?" (Matt Abrahams, Stanford GSB).
- Slide design from Mayer's multimedia-learning principles — cut decoration (coherence), don't read slides aloud (redundancy), one idea per slide (segmenting).
- Conversational rate ≈120–160 wpm; deliberate pauses; rule of three; strong open/close (primacy/recency); practice out loud; record yourself and review (product-relevant).
- Online speaking: look at the camera lens for "eye contact", camera at/just above eye level, notes adjacent to the lens.

**Stays out / appears only on the Myths page as debunked:**
- "93% of communication is nonverbal" (Mehrabian 7-38-55 misreading — Mehrabian disowns this usage).
- Power posing (failed replication; co-author Dana Carney retracted support).
- "Imagine the audience naked" (no evidence; works against audience connection).
- Untraceable content-mill statistics (e.g. "pauses improve retention by 38%") — no fabricated precision anywhere on the page.

## Layout & components

- `apps/web/app/tips/layout.tsx` — two-column shell inside the standard
  `max-w-[1240px] px-8` container: sticky left sidebar (~220px) + content column
  (~720px reading measure).
- Sidebar: the 8 section links with `font-mono` numbered micro-labels; active link
  highlighted. Active-state detection via `usePathname` in a small client component —
  the only client JS in the feature. On mobile the sidebar collapses to a horizontal
  scrollable pill row above the content.
- Section pages: pill badge above a serif `clamp()` h1, intro paragraph, tips as
  stacked blocks (heading + body + optional attribution line), prev/next links at the
  bottom so the section reads as a course.
- Product tie-in: quiet card at the bottom of each section page — "Reading is 10% of
  it — analyze a real speech" → `/#upload`.
- Index page (`/tips`): hero in the pricing-page idiom + card grid of sections.

## Design language

Existing idiom only: `max-w-[1240px] px-8` container, serif `clamp()` headlines with
tight tracking, pill badges, `muted-foreground` body text, `font-mono` micro-labels,
primary-indigo accents, existing radius variables. No new colors, no new shadcn
components.

## Nav changes

- Header: add `{ href: "/tips", label: "Speaking tips" }` to `NAV_LINKS` in
  `components/site-header.tsx`.
- Footer: add a `/tips` link in `components/site-footer.tsx`.

## Implementation notes

- `apps/web/AGENTS.md` warns this Next.js version diverges from training data: read the
  relevant guides under `node_modules/next/dist/docs/01-app` (routing, layouts,
  `generateStaticParams`, `generateMetadata`) before writing the route files.
- No backend, DB, or API changes. Pages are public (no auth gate).

## Out of scope

Search, MDX/CMS, comments, progress tracking, per-tip deep links, localization.
