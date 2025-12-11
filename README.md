## Anime Anecdote

Anime Anecdote is a neon MAL recap experience powered by live MyAnimeList data. Users authenticate with MAL, we pull their anime (and optionally manga) history for 2025, run it through our analytics engine, and render a 10-slide recap with charts, carousels, and a shareable card.

### Tech Stack

- Next.js 15 App Router (TypeScript, strict mode)
- Tailwind CSS 4 + custom CSS for neon visuals
- Framer Motion, GSAP-ready animation pipeline
- ECharts for genre visualization, custom heatmap + rating bars
- SWR for client data fetching, Next.js API routes for MAL OAuth + analytics

### Key Features

- **MAL OAuth2 with PKCE** – secure login via `/api/mal/auth` + `/api/mal/callback` storing encrypted session cookies.
- **Stateless analytics** – `/api/mal/getAnimeList` fetches anime/manga lists, crunches 2025-only data in `src/lib/analytics.ts` (watch time, genres, title counts, episode/chapter totals, hidden gem, binge speed, heatmap, rating deviation, anime of the year, etc.).
- **Story-mode UI** – `/recap` renders 10 slides (welcome → share card) with desktop keyboard navigation + mobile scroll-snap.
- **Shareable recap card** – `/api/card` uses `next/og` to output a PNG-ready poster, including a QR code generated client-side.
- **Manga toggle** – landing page lets users opt into manga stats before we request authorization.

### Environment Variables

Create a `.env.local` with:

```
MAL_CLIENT_ID=your_mal_app_id
MAL_CLIENT_SECRET=your_mal_app_secret
MAL_REDIRECT_URI=https://your-domain.com/api/mal/callback
SESSION_SECRET=32+character_random_string
```

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the neon landing page. Clicking **Generate my recap** starts the MAL OAuth flow (be sure your redirect URI matches the one configured in MAL settings and `.env.local`).

### Preparing for GitHub

1. Install deps and validate locally: `npm install && npm run lint && npm run build`.
2. Review changes with `git status` / `git diff`.
3. Stage the app (skip artifacts like `.next`, `node_modules`, `.env.local` which are already ignored).
4. Commit and push to the origin repo (e.g., `git commit -m "feat: ship recap" && git push origin master`).

### Production

Deploy on Vercel for best results. Add the same env vars in the Vercel dashboard, enable the Edge runtime for `/api/card` automatically (handled via `export const runtime = "edge"`).


### Testing Checklist

- `npm run lint` – ESLint (Next.js core web vitals) with TypeScript
- Manual QA: MAL login, `/recap` navigation (desktop arrows + mobile scroll), PNG export button, manga toggle.

### Folder Highlights

- `src/lib` – MAL SDK helpers, analytics, session crypto helpers, constants/types.
- `src/app/api/mal/*` – auth, callback, analytics fetcher.
- `src/app/recap/slides` – slide-by-slide React components.
- `src/components/charts` – ECharts donut + custom heatmap; `components/AnimatedNumber` for counters.

Enjoy your 2025 Anime Anecdote. 🌌
