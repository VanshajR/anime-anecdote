# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

**AniKit** — a public "anime utilities" site (currently still named `anime-anecdote` in
`package.json`; rebrand is task P0). Two tools under one umbrella:
- **Wrapped** — a Spotify-Wrapped-style seasonal anime recap (already built).
- **List Builder** — swipe-to-build-and-rate your anime list, export to MAL/AniList (to build).

It is a standalone, legitimate, donation-supported project. It only talks to the official
**MyAnimeList** and **AniList** APIs. Keep it fully self-contained — do **not** add couplings to or
references to any other project.

**📋 The build plan lives in [`ANIKIT_PLAN.md`](./ANIKIT_PLAN.md). Read it first.** It has the
UI/UX design (wireframes), architecture, phased build order (P0–P5), and open decisions. This file is
just the operational quick-reference.

## Commands

```bash
npm run dev      # next dev (localhost:3000)
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
```
No test suite. `npm run build` (or `npx tsc --noEmit`) is the type-check.

## Stack

Next 16 (App Router) · React 19 · TypeScript · Tailwind 4 · framer-motion + gsap (animation) ·
echarts (charts) · zustand (state) · swr (data) · zod (validation) · canvas-confetti · qrcode.

## Architecture & key files

- `src/app/` — App Router pages. Currently: `/` (Wrapped landing — moving to `/wrapped`),
  `/recap` (the 10 slides — moving to `/wrapped/recap`). List Builder will live at `/builder`.
- `src/app/recap/slides/*` — the 10 Wrapped slides (Totals, Genres, Ratings, AnimeOfYear, Binge,
  Heatmap, Personality, Share, …).
- `src/lib/analytics.ts` — **`buildAnalytics()` is a pure function** (list in → stats out, no I/O).
  This is the reusable engine; keep it pure.
- `src/lib/mal.ts` — MAL OAuth + paginated list/profile fetch.
- `src/lib/session.ts` — AES-256-GCM encrypted session cookie (`SESSION_SECRET`).
- `src/lib/types.ts`, `constants.ts`, `utils.ts` — shared types/config/helpers.
- `src/app/api/mal/*` — MAL OAuth routes. `src/app/api/card/route.tsx` — share-card image.
- `src/components/charts/*` — echarts wrappers.

## Conventions & gotchas (read before coding)

- **AniList rate-limits per IP (~30/min, degraded).** Anything hitting AniList in volume — the swipe
  **deck** and the **export** — MUST run **client-side from the user's browser/IP**, never server-side.
  For export, alias many `SaveMediaListEntry` mutations into **one** GraphQL request (don't loop single
  mutations). This is the most important constraint in the project.
- **MAL OAuth uses PKCE `code_challenge_method=plain`** (MAL doesn't support S256). Already handled in
  `mal.ts` — don't "fix" it to S256.
- **Nothing is stored server-side.** Stats/lists stream from MAL/AniList, processed on the fly. Keep it
  that way (it's a trust + legitimacy point stated to users). Session tokens live only in the encrypted
  cookie. List Builder progress persists to **localStorage** (zustand `persist`), not a server DB.
- `buildAnalytics`'s analysis window is hardcoded in `constants.ts` (`ANALYTICS_START/END`) — parametrize
  it rather than hardcoding a new year (plan §6).
- TypeScript strict; prefer the existing functional, pure-helper style in `lib/`.
- Match the existing neon aesthetic and Tailwind token usage (`bg-night`, `text-snow`, `neon-*`, glass
  panels) unless intentionally restyling.

## Env

```
MAL_CLIENT_ID=        MAL_CLIENT_SECRET=        MAL_REDIRECT_URI=
SESSION_SECRET=
ANILIST_CLIENT_ID=    ANILIST_CLIENT_SECRET=    ANILIST_REDIRECT_URI=   # to add for List Builder
```
