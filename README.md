# AniKit

**AniKit** is a free, donation-supported anime-utilities site. It talks only to the official
**MyAnimeList** and **AniList** APIs — nothing about streaming, no other-project coupling, and
**nothing is stored server-side** (lists/stats stream live and are processed on the fly; the
session lives only in an encrypted cookie).

## Tools

- **Wrapped** *(live)* — a Spotify-Wrapped-style anime recap. Connect **MAL or AniList**, pick an
  analysis window (this/last season, this/last year, all time, or a custom range), and get a
  kinetic, Persona-styled 12-slide recap: totals, genres, breakdown (formats / eras / studios /
  list-health), top-rated, archetype, binge, activity, score fingerprint, the standout, and a
  shareable card. Per-user accent color + light/dark theme.
- **List Builder** *(planned)* — swipe to build & rate a list, export to MAL/AniList.
- *(Roadmap: Stats dashboard, Recommendations, My List, Anime Details, Search/Discovery — see `ANIKIT_PLAN.md`.)*

## Stack

Next 16 (App Router) · React 19 · TypeScript · Tailwind 4 · framer-motion · echarts · zustand ·
swr · zod · `next/og` (share card) · canvas-confetti · qrcode.

## Key pieces

- `src/lib/analytics.ts` — **`buildAnalytics()` is a pure function** (provider-normalized list in →
  stats out, no I/O). The reusable engine; keep it pure.
- `src/lib/mal.ts` — MAL OAuth (PKCE **plain** — don't "fix" to S256) + paginated list/profile fetch.
- `src/lib/anilist.ts` — AniList OAuth (standard code flow) + GraphQL list fetch + the normalizer
  that maps AniList entries into the same `MalMediaNode` shape `buildAnalytics` consumes.
- `src/lib/session.ts` — generic AES-256-GCM encrypted session cookie (one per provider).
- `src/lib/constants.ts` — `resolveWindow()` (analysis-window presets + airing-vs-activity mode),
  personality blueprints, provider config.
- `src/app/api/{mal,anilist}/{auth,callback}` — OAuth. `src/app/api/wrapped/data` — provider-agnostic
  recap data. `src/app/api/card` — the `next/og` share card (Holo Pull; landscape + portrait).
- `src/app/wrapped/recap/*` — the recap shell + slides (the "Phantom" Persona skin, `.pw-*` in `globals.css`).

## Environment

Create `.env.local`:

```
SESSION_SECRET=                       # 32+ char random string (encrypts the session cookie)

# MyAnimeList
MAL_CLIENT_ID=
MAL_CLIENT_SECRET=
MAL_REDIRECT_URI=http://localhost:3000/api/mal/callback

# AniList
ANILIST_CLIENT_ID=
ANILIST_CLIENT_SECRET=
ANILIST_REDIRECT_URI=http://localhost:3000/api/anilist/callback
```

Register the AniList client at <https://anilist.co/settings/developer> (set its redirect URL to match
`ANILIST_REDIRECT_URI`). In production, point both redirect URIs at your deployed domain.

## Development

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production build (also the type-check; or `npx tsc --noEmit`)
npm run lint
```

No test suite. Deploy on Vercel.
