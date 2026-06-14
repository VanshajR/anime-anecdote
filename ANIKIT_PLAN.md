# AniKit — Build Plan

> Evolving this repo (`anime-anecdote`) into **AniKit**: an umbrella "anime utilities"
> site. Public, legitimate, donation-supported. **Nothing about streaming.** Fully
> decoupled from any other project — talks only to the official MAL & AniList APIs.
>
> **Tools (the full scope):**
> 1. **Wrapped** — the existing Spotify-Wrapped-style recap (built).
> 2. **List Builder** — swipe-to-build-and-rate your list, export to MAL/AniList (to build).
> 3. **Stats Dashboard** — full-list analytics (port of RyuStream's pure engine, re-sourced).
> 4. **Recommendations** — "For You" engine (port of RyuStream's pure `@ryustream/recommend`).
> 5. **My List** — read + manage/edit your MAL/AniList lists from the site.
> 6. **Anime Details** — an AniList-driven detail page that every card links into.
> 7. **Search & Discovery** — search + trending/popular/seasonal/browse feeds. This is the glue
>    that turns AniKit from a "utility belt" into a full **anime discovery + list-management +
>    utilities platform**: discover → details → add to list / build a deck / get recs.
>
> RyuStream code reuse is limited to **two pure, dependency-free engines** copied in and
> re-sourced from the user's live list — see PART II. No DB, no Discord, no community
> coupling comes across. **Two hard rules govern everything new:** (a) compute
> **client-side** from the user's own IP (AniList rate limit), (b) **nothing stored
> server-side** (feedback/progress → localStorage only).

---

## 0. What already exists (reuse, don't rebuild)

| Piece | File | Reuse |
|---|---|---|
| Pure stats engine | `src/lib/analytics.ts` → `buildAnalytics()` | ✅ Keep as-is; it's a pure function, zero I/O |
| Wrapped slides (10) | `src/app/recap/slides/*` | ✅ Re-home under `/wrapped/recap` |
| Charts | `src/components/charts/{GenreDonut,Heatmap}.tsx` (echarts) | ✅ Keep |
| MAL OAuth (PKCE **plain**) | `src/app/api/mal/{auth,callback}/route.ts`, `src/lib/mal.ts` | ✅ Keep; generalize session |
| Encrypted session cookie | `src/lib/session.ts` (AES-256-GCM) | ✅ Generalize to multi-provider |
| Share card | `src/app/api/card/route.tsx` | ✅ Keep |
| Types | `src/lib/types.ts` | ➕ Extend |

**Stack:** Next 16, React 19, Tailwind 4, framer-motion, gsap, echarts, zustand, swr, zod,
canvas-confetti, qrcode. (List Builder swipe physics → framer-motion `drag` + `useMotionValue`;
state → zustand with `persist`.)

**Known gotchas carried in:**
- MAL OAuth requires PKCE `code_challenge_method=plain` (already handled in `mal.ts`).
- `buildAnalytics` window is hardcoded to a 2025 season in `src/lib/constants.ts`
  (`ANALYTICS_START/END`) — **parametrize** it (see §6).
- **AniList rate-limits per IP (currently ~30/min, degraded).** Anything that hits AniList in
  volume — the swipe deck and the export — **must run client-side from the user's own browser/IP**,
  never through a shared server. This is the single most important architectural constraint here.

---

## 1. Information architecture & routing

```
/                      AniKit hub — pick a tool (hero + tool cards)
/wrapped               Wrapped: intro + connect (manga toggle, season picker)   ← old "/"
/wrapped/recap         Wrapped: the 10-slide story                              ← old "/recap"
/builder               List Builder: single stateful flow (stages below)
/stats                 Stats Dashboard: full-list analytics (PART II §10)       ← needs a connection
/recommendations       For You: recommendation engine (PART II §11)             ← needs a connection
/mylist                My List: view + edit your MAL/AniList lists (PART II §12)  ← needs a connection
/anime/[id]            Anime detail page — id = AniList mediaId (PART II §13)    ← public; cards link here
/search                Search results + a global navbar typeahead (PART II §15) ← public
/browse                Discovery: trending/popular/seasonal + filters (§15)     ← public
/about, /support       About + donations (BuyMeACoffee + crypto)                ← public face
                        APIs: /api/mal/* (exists), /api/anilist/{auth,callback} (new),
                              /api/card (exists). No new data APIs — §10–12 compute client-side.
```

**Canonical id = AniList `mediaId` everywhere** (deck, recs, stats, details, My List). MAL ids are
mapped to AniList ids via AniList's `idMal` field on the fly. `/anime/mal/[malId]` is an optional
redirect alias (resolve → `/anime/[id]`), low priority.

**Hub layout grows:** the two headline cards (Wrapped, List Builder) stay as the hero pair; Stats /
Recommendations / My List sit in a secondary "your account" row that lights up once a tracker is
connected (greyed "connect to unlock" otherwise). Details is not a launchable tile — it's reached by
clicking any cover.

**`/builder` is one route with internal stages driven by zustand** (not sub-routes) — this makes
the flow resumable and avoids route/state sync pain. Stages: `setup → swipe → review → export → done`.
A stage indicator (stepper) sits at the top; state persists to localStorage so a refresh resumes.

---

## 2. Shared foundation (build first)

### 2.1 Multi-provider auth + session
- Generalize `MalSessionPayload` → `Session { mal?: ProviderTokens; anilist?: ProviderTokens }`.
  Keep the AES-GCM cookie; just widen the payload. Update `session.ts` encode/decode + expiry per provider.
- **AniList OAuth** (`/api/anilist/auth` + `/callback`): standard authorization-code flow (simpler than
  MAL — no PKCE-plain quirk). Store `access_token` (AniList tokens are long-lived ~1yr; no refresh dance).
- Connecting is **optional to browse**, **required to import/export** (see UX §4). A user can connect
  MAL, AniList, or both. Export targets = whichever are connected.

### 2.2 Unified Tracker interface (`src/lib/tracker.ts`)
```ts
interface Tracker {
  getProfile(): Promise<{ name: string; avatar?: string }>;
  getList(): Promise<NormalizedEntry[]>;            // for "exclude already-listed"
  saveEntries(updates: ListUpdate[]): Promise<SaveResult[]>; // batched export
}
```
- `MalTracker` (wraps existing `mal.ts`) + `AniListTracker` (new).
- `ListUpdate = { id, status, score? }` where `id` is provider-native (AniList mediaId / MAL id).
- **Export batching (critical):**
  - **AniList:** alias many `SaveMediaListEntry` mutations into **one** GraphQL request
    (`m0: SaveMediaListEntry(...){id} m1: ...`) — N entries per request → dodges the per-IP/min limit.
    Chunk ~25/request; run client-side. Fallback to single mutations if a batch errors.
  - **MAL:** no batch — one `PATCH /anime/{id}/my_list_status` per entry, throttled, client-side.
  - Run MAL + AniList **in parallel** (separate limits). Surface per-entry success/fail + retry.

### 2.3 AniList GraphQL client (`src/lib/anilist.ts`, client-side)
- Public (no token) queries: popular / trending / top-rated / filtered `Page(media:...)`; `relations`
  for franchise clustering; `search`.
- Authed queries: `Viewer`, `MediaListCollection` (import), `SaveMediaListEntry` (export).
- Pattern mirrors the swipe deck's needs: 20–30 media/page, prefetch ahead.

---

## 3. AniKit hub (`/`) — UX

Keep the neon aesthetic but make it **tool-neutral** (it's no longer "a MAL recap"). 

```
┌──────────────────────────────────────────────────────────┐
│  AniKit                                   [About] [Support]│
│                                                            │
│        ✦ your anime, leveled up ✦                          │
│        Free tools for your MAL / AniList life.             │
│                                                            │
│   ┌────────────────────┐     ┌────────────────────┐       │
│   │  📊  WRAPPED        │     │  🃏  LIST BUILDER   │       │
│   │  Your seasonal      │     │  Swipe to build &   │       │
│   │  anime recap,       │     │  rate your list,    │       │
│   │  Spotify-Wrapped    │     │  export to MAL/     │       │
│   │  style.             │     │  AniList.           │       │
│   │      [Open →]       │     │      [Open →]       │       │
│   └────────────────────┘     └────────────────────┘       │
│                                                            │
│   No account needed to explore. Nothing stored server-side.│
└──────────────────────────────────────────────────────────┘
```
- Two large tool cards, hover-lift (framer-motion), each routes to its tool.
- Footer reinforces trust ("processed on the fly, nothing persisted") and links Support.

---

## 4. List Builder — UX (the centerpiece)

### Design principles
1. **No wasted swipes** — import the user's existing list first and exclude those IDs from the deck.
2. **Low-friction start** — let them swipe the public deck *without connecting*; require auth only at
   export (and offer connect upfront only for the "hide already-seen" benefit).
3. **Swipe stays pure & fast** — swipe = just seen / plan / skip. *No* rating or franchise prompts
   mid-deck. All rating + franchise resolution is batched into the Review stage (matches the original
   "rate the seasons all in one place" intent and keeps the deck addictive).
4. **Resumable** — deck position + every decision persist to localStorage (zustand `persist`).
5. **Mobile-first, accessible** — every gesture has a button + keyboard equivalent; big thumb targets.

### Stage 1 — Setup (`/builder`, stage=setup)
```
┌──────────────────────────────────────────────┐
│  Build your list            ●──○──○──○  (1/4)  │
│                                                │
│  1. Pick a deck                                │
│   ( Most Popular ) ( Trending ) ( Top Rated )  │
│   ( Modern 2010s ) ( Classics ) ( Custom… )    │
│   Custom → genre chips, year range, format     │
│                                                │
│  2. Connect (optional now, needed to export)   │
│   [ Connect MAL ]   [ Connect AniList ]        │
│   ☑ Hide anime already on my list (needs ↑)    │
│   ☐ Include adult (18+)                         │
│                                                │
│                         [ Start swiping → ]    │
└──────────────────────────────────────────────┘
```
- Decks map to AniList sorts: Most Popular = `POPULARITY_DESC`, Trending = `TRENDING_DESC`,
  Top Rated = `SCORE_DESC`; Modern/Classics = year-range presets; Custom = `genre_in` + `seasonYear`
  range + `format`. SFW by default (this is the public/legit face).
- If connected + "hide already listed": import runs in background → builds an exclude-Set; show
  "Imported 247 — those won't show up."

### Stage 2 — Swipe deck (stage=swipe)
```
┌──────────────────────────────────────────────┐
│  ●──●──○──○   31 seen · 9 plan      [Review →] │
│                                                │
│        ╭───────────────────────────╮          │
│        │                           │  ← faint  │
│        │      [ cover art ]        │    next   │
│        │                           │    card   │
│        │  Frieren: Beyond…    8.9★ │    peek    │
│        │  TV · 2023 · 28 ep        │           │
│        │  Adventure · Drama · Fan… │           │
│        │  "After the hero party…"  │           │
│        ╰───────────────────────────╯          │
│   drag → SEEN(green)  ← SKIP(red)  ↑ PLAN(blue)│
│                                                │
│   [ ✕ Skip ]   [ ↑ Plan ]   [ ✓ Seen ]   [↺]   │
└──────────────────────────────────────────────┘
```
- **Swipe map:** → **Seen** (queues for rating), ← **Skip** (dismiss, no add),
  ↑ **Plan to watch** (adds `plan_to_watch`, no rating). (Down reserved/disabled v1.)
- **Drag feedback:** card tilts toward drag, colored overlay + label fades in past a threshold
  (green SEEN / red SKIP / blue PLAN). Spring-back if released under threshold.
- **Buttons** mirror swipes (desktop + a11y). **Keyboard:** ←/→/↑ = skip/seen/plan, `z` = undo.
- **Undo (`↺`)** pops the last decision back onto the stack — people misswipe; this is essential.
- **Deck loading:** fetch 20–30/page from AniList (client-side); prefetch next page at ≤5 remaining;
  preload the next card's cover image. Skeleton card while first page loads.
- **Always-available `Review →`** (floating) — never forced to exhaust the deck.
- **Empty deck:** "You've been through the top of this deck — review your picks, or try another deck."

### Stage 3 — Review & Rate (stage=review) — *the differentiator*
After swiping, cluster the **Seen** picks into franchises and let the user rate everything in one place.

**Franchise clustering:** for each Seen anime, lazily fetch its AniList `relations` (cached) and union
the connected component over `PREQUEL/SEQUEL/PARENT/SIDE_STORY` edges where `node.type === ANIME`
(ignore `ADAPTATION/CHARACTER/OTHER` so manga/spinoffs don't leak in). Group by cluster root.

```
┌──────────────────────────────────────────────┐
│  Rate your picks            ●──●──●──○  (3/4)  │
│  Adding 42: 31 completed · 11 plan to watch    │
│                                                │
│  ▸ ATTACK ON TITAN  (franchise)                │
│    You marked S1 seen. Seen the rest?          │
│    ☑ S1   [ 9 ]●────────  Completed ▾          │
│    ☑ S2   [ 9 ]●────────  Completed ▾          │
│    ☐ S3      (tap to add)                       │
│    ☑ Final  [10]●────────  Completed ▾          │
│      [ Rate whole franchise 9 ]                │
│  ────────────────────────────────────────────  │
│  ▸ FRIEREN                                      │
│    ☑ TV   [ 9 ]●────────  Completed ▾          │
│  ────────────────────────────────────────────  │
│  PLAN TO WATCH (11)                             │
│    Chainsaw Man · Dandadan · …      [edit]      │
│                                                │
│                         [ Export 42 → ]        │
└──────────────────────────────────────────────┘
```
- Each franchise shows **all** its anime entries; the ones the user swiped Seen are pre-checked.
  Unseen siblings appear unchecked with "tap to add" — this is the "oh yeah I saw that too" magic.
- Per entry: **score** (slider; respects target scale — AniList 1–100 / MAL & AniList POINT_10 / smiley
  — show as the user's tracker scale), **status** dropdown (default Completed; watching/dropped/on-hold).
- **"Rate whole franchise N"** quick-action sets every checked entry to one score.
- Plan-to-watch picks listed compactly, editable, no rating.
- Running tally updates live. Remove/skip any entry inline.

### Stage 4 — Export (stage=export → done)
```
┌──────────────────────────────────────────────┐
│  Exporting…                 ●──●──●──●  (4/4)  │
│  AniList  ████████████░░░  34/42               │
│  MAL      ██████░░░░░░░░░  18/42               │
│  3 failed — [ retry ]                          │
└──────────────────────────────────────────────┘
        ↓ on complete
┌──────────────────────────────────────────────┐
│         🎉  42 anime added!                    │
│   [ View on AniList ]  [ View on MAL ]         │
│   [ Build another deck ]   [ Get your Wrapped ]│
│   Like AniKit? [ ♥ Support ]                   │
└──────────────────────────────────────────────┘
```
- If not yet connected, prompt connect here (the only hard gate).
- Client-side batched export (§2.2): AniList aliased-mutation chunks + MAL per-entry, in parallel,
  with live progress. **Note for the build:** a 100-entry AniList export at ~30 req/min is multi-minute
  if done one-by-one — the aliased-batch approach collapses it to a few requests; implement that, don't
  loop single mutations.
- Confetti (canvas-confetti) + deep links to the user's lists + cross-sell Wrapped + Support.
- Partial-failure UX: list failed entries, one-tap retry, never lose the user's work (state persists).

### Cross-cutting states
- **Loading:** skeleton cards / shimmer; never a blank screen.
- **Error (AniList 429 / network):** non-blocking toast "AniList is busy, slowing down…"; auto-retry
  with backoff; deck keeps working from prefetched cards.
- **Resume:** on return, "Pick up where you left off? (31 seen, 12 cards swiped)".

---

## 5. State model (zustand, persisted)
```ts
type Decision = { id: number; action: 'seen'|'plan'|'skip'; at: number };
interface BuilderState {
  stage: 'setup'|'swipe'|'review'|'export'|'done';
  deckConfig: { sort; genres?; yearRange?; format?; adult: boolean };
  excludeIds: Set<number>;            // imported existing list
  deck: AniMedia[]; cursor: number;   // current deck + position
  decisions: Decision[];              // append-only; undo = pop
  franchises: Record<rootId, AniMedia[]>;   // resolved at review
  ratings: Record<id, { score?: number; status: string }>;
  connections: { mal: boolean; anilist: boolean };
}
```
Persist everything except in-flight fetches. Undo = pop last decision + decrement cursor.

---

## 6b. Wrapped — SHIPPED in the reskin pass (status)

Done and build-green:
- **Persona "Phantom" identity** (`globals.css` `.pw-*`): crimson/cream/ink, jagged angular panels,
  kinetic skewed type, halftone/speed-lines, motion transitions. Retired the old dark-neon skin.
- **Date-range presets + custom range** (`constants.ts resolveWindow`), threaded through OAuth →
  `getAnimeList` → window-aware analytics; intro picker + **live recap window switcher**.
  - **Airing semantics:** season presets (`this/last season`) match the anime's **air season**
    (`start_season`), not watch activity. Year/all-time/custom remain **activity**-based. Controlled by
    `AnalyticsWindow.mode` (`airing | activity`). *Open: should year presets also be airing-based?*
- **Richer insights:** score-distribution fingerprint, format breakdown, release-era distribution,
  studio leaderboard, list-health (completion/drop/backlog), longest watch, most over-/under-rated.
  New **Breakdown** slide + enhanced **Ratings** slide. (Added MAL fields `studios`, `start_season`.)
- **Custom accent color** (`useAccent.ts`, localStorage): preset swatches + custom picker on the recap;
  overrides `--pw-red`/`--pw-red-deep` on the stage; threaded into the export.
- **Share-image export** (§18): parametrized `/api/card` — landscape 16:9 + portrait/story, accent-aware,
  embeds the standout **cover art**; `SlideShare` is the hub (format toggle, live preview, download,
  copy-link, QR). *Follow-up: true multi-slide story SET (one image per slide).*
- **Mobile pass:** stage allows vertical scroll, responsive slide grids/charts/pickers.

**NEXT — AniList + global login (P1 backbone, §2):** AniList OAuth, multi-provider session, a global
"login with MAL **or** AniList" entry, and an AniList→analytics adapter so Wrapped runs from an AniList
account (the engine already takes generic entries — needs `fromAniListCollection` mapping to `MalMediaNode`-
shaped input or a normalized `PreparedEntry`).

## 6. Wrapped — light touches (don't rebuild)
- Re-home: `/` → `/wrapped`, `/recap` → `/wrapped/recap`. Update internal links + the OAuth
  `redirect`/return path.
- **Parametrize the window** (`constants.ts` `ANALYTICS_START/END`) → accept a season/year so Wrapped
  can run per-season or annually (UX: a small season/year selector on `/wrapped`).
- **Optional (post-v1):** AniList → normalized adapter so Wrapped also works from an AniList account,
  not just MAL. (`buildAnalytics` already takes generic-ish entries; add `fromAniListCollection`.)

---

## 7. Build order (suggested for the new session)

**Backbone first.** P1 (Tracker + AniList client) and the §13 details page are shared dependencies for
everything else, so they come before the feature tools. Suggested order:

- [x] **P0 — Rebrand + hub:** package.json `anikit`, layout metadata, neon-neutral `/` hub, re-home
      Wrapped under `/wrapped`. Site runs, both tools reachable. **(done)**
- [ ] **P1 — Auth/session/tracker (the backbone):** generalize session to multi-provider; add AniList
      OAuth; build the `Tracker` interface (MAL + AniList) with `getProfile`/`getList`/`saveEntries`
      (import + **batched** export, +progress/delete for My List); the client-side `anilist.ts`
      GraphQL client. **Blocks P2–P4, P10–P13.**
- [ ] **P2 — Deck + swipe:** public deck queries; swipe UI (framer-motion drag, overlays, buttons,
      keyboard, undo); zustand persist; prefetch.
- [ ] **P3 — Import + franchise + review:** exclude-already-listed; relation clustering; Review/Rate
      screen with per-entry score+status and "rate whole franchise".
- [ ] **P4 — Export + done:** client-side batched export (parallel MAL/AniList), progress, partial-fail
      retry, confetti/share/cross-sell.
- [ ] **P13 — Anime details page:** AniList detail + relations + add-to-list action (PART II §13). Build
      **early** (after P1) — recs/stats/list/builder all link into it.
- [ ] **P12 — My List:** view + inline-edit list (status/score/progress/remove) via the Tracker's
      batched writes (PART II §12).
- [ ] **P10 — Stats dashboard:** port `stats.ts`'s pure math → `lib/stats.ts`, source from
      `Tracker.getList()`, render with echarts (PART II §10).
- [ ] **P11 — Recommendations:** copy `@ryustream/recommend` verbatim, feed it the user's list +
      client-side AniList metadata, localStorage feedback (PART II §11).
- [ ] **P14 — Search & Discovery:** navbar typeahead + `/search` + `/browse` feeds over the §2.3
      AniList client (PART II §15). Reuses the deck queries — cheap once P1 lands. Can slot anytime
      after P1; pairs naturally with P13 (details).
- [ ] **P5 — Polish:** mobile pass, a11y (keyboard/ARIA), skeletons, error/empty/resume states, perf.

## 8. Env / config to add
```
# existing: MAL_CLIENT_ID, MAL_CLIENT_SECRET, MAL_REDIRECT_URI, SESSION_SECRET
ANILIST_CLIENT_ID=
ANILIST_CLIENT_SECRET=
ANILIST_REDIRECT_URI=http://localhost:3000/api/anilist/callback
```

## 9. Decisions — **FINALIZED** (was "open before P1")
All resolved to the recommended option (locked this session):
1. **Score scale** — ✅ **POINT_10 everywhere in the UI**, convert per provider on export (AniList 1–100,
   MAL 1–10). One mental model for the user.
2. **Deck dedupe** — ✅ **per-entry cards in v1**, franchise clustering happens at the Review stage (§4
   Stage 3). Revisit only if decks feel repetitive.
3. **Support/donation** — ✅ **footer (persistent) + post-export celebration**. No nag header.
4. **Brand & design** — ✅ **"AniKit" is final.** Design philosophy: **a shared family, not a single
   uniform skin.** AniKit keeps a common palette (vermilion `--accent` + indigo `--accent-2` + ink/paper)
   and primitives (`globals.css`: halftone, speed-lines, panel-cut, tab-block, holo-sheen), but **each
   tool is allowed — encouraged — to have its own strong identity.** Variety is wanted; the only hard
   rule is **nothing may look generic / AI-generated.**
   - **Wrapped** gets a **Persona-5-inspired** identity (its own bold skin): aggressive red/black/cream,
     jagged angular panels & masks, kinetic *diagonal* typography, halftone + speed-line bursts,
     motion-driven slide transitions, "all-out-attack" energy. It's a story-mode experience, so it
     leans hardest into character. The **old dark-neon recap skin is retired.**
   - The hub / discovery / account tools stay on the cleaner Manga-Ink layout; they can each take
     accent liberties. Think "same studio, different show."

---

# PART II — Account tools (Stats · Recommendations · My List · Details)

> These four are the new scope on top of the original plan. They all sit behind the **same backbone**
> (P1's `Tracker` + client-side `anilist.ts`) and obey the **same two rules**: compute **client-side**
> from the user's own IP, store **nothing server-side** (feedback/UI state → localStorage).
>
> **What's reused from RyuStream:** exactly two things, both pure and dependency-free — the
> recommendation engine and the math half of the stats engine. Everything they were wired to over
> there (Turso DB, `discordId`, XP/Fafnir, community rank, per-user server cache) is **dropped**; we
> re-feed them the user's live MAL/AniList list instead. Nothing else crosses over.

## 10. Stats Dashboard (`/stats`)

**Source of truth:** `RyuStream apps/api/src/services/stats.ts` (`computeStatsDashboard`, 578 LOC). It's
DB-coupled at the edges (pulls `watch_history` rows, enriches via `media-meta.ts`) but the **core math
is pure** over a row array: `dayKey`, status/score histograms, format/genre/year breakdowns, taste
profile, activity heatmap/streaks, list-health (backlog, completion rate, near-completion, stale).

**Port plan:**
- New **`src/lib/stats.ts`** — copy the pure computations, drop every `db`/Drizzle/`enrichListRows`
  call. Input = `NormalizedEntry[]` from `Tracker.getList()` + the per-title metadata AniList already
  returns on the list query (genres/format/year/episodes come back in one `MediaListCollection` call,
  so **no second metadata round-trip**). Output a trimmed `StatsDashboard` shape.
- **Drop the `community` section** (level/XP/rank — pure Discord/Fafnir, no population here). Replace
  the identity header with the MAL/AniList profile (name + avatar from `Tracker.getProfile()`).
- **Heatmap caveat — be explicit in the UI.** RyuStream had per-episode timestamps; MAL/AniList only
  give a per-entry `updated_at`/`updatedAt`. So the activity heatmap/streaks are **per-list-update**
  granularity (when you last touched a title), not per-episode. Either label it "list activity" or omit
  streaks in v1. **Decide in §14.**
- **Charts:** reuse the existing echarts wrappers (`components/charts/{GenreDonut,Heatmap}.tsx`); add a
  score-histogram + status-donut wrapper to match RyuStream's `ScoreHistogram`/`Donut`.
- **Gating:** requires a connection (needs the full list). No connection → the same "connect to unlock"
  empty state used elsewhere. Empty list → friendly zero-state.
- **Relation to Wrapped:** Wrapped's `buildAnalytics` stays the *season-windowed* recap; `lib/stats.ts`
  is the *whole-list* dashboard. Keep them separate functions; they can share small helpers but don't
  merge (different windows, different outputs).

## 11. Recommendations (`/recommendations` + a "For You" row on the hub)

**Source of truth:** `@ryustream/recommend` — already a **pure, zero-I/O, zero-dependency** engine
(`recommend({ ratings, metadata, prefs, options }) → ScoredRec[]`). Its public contract (`types.ts`:
`RatedEntry`, `RecMeta`, `MetadataProvider`, `RecPrefs`, `ScoredRec`) has **no RyuStream coupling** —
it was explicitly designed as a drop-in. **Copy the two files verbatim** into `src/lib/recommend/`
(`index.ts` + `types.ts`); do not modify the scorer.

**What we throw away:** `recommend-adapter.ts` (DB/AniList-server adapter) and the
`/api/users/me/recommendations` route. We write a thin **client-side** adapter instead.

**New `src/lib/recommend-adapter.ts` (client-side):**
1. `ratings`: map `Tracker.getList()` → `RatedEntry[]` (id, status, score→1–10, progress, total,
   updatedAt). Synthetic ratings from localStorage feedback, same as RyuStream did: like→completed/9,
   dislike/not_interested→dropped/2.
2. `metadata`: build the sync `MetadataProvider` from a metadata map assembled **client-side** —
   the list query already returns most fields; fetch `relations` + AniList `recommendations` edges for
   the user's top-rated/recent titles + the seed pool in batched AniList queries (respecting the
   rate limit, prefetched). Cache the map in memory + localStorage.
3. `seedCandidates`: trending/popular ids (public AniList query) for the popularity prior + cold start.
4. `prefs`: `showAdult`/`hideEcchi` from a local settings store; `preferredGenres` for cold start.
5. `excludeIds`: everything already on the list + "not interested" feedback.

**Feedback persistence = localStorage** (zustand `persist`, decided this session). Keeps thumbs
up/down learning across refreshes on the same device without breaking the no-server-storage promise.
A "reset my feedback" control clears it.

**UI:** port the *shape* of RyuStream's `RecommendationCard` + `ForYouRow` (buckets `continue`/`safe`/
`discovery`, human-readable `reasons`, feedback buttons), restyled to the neon aesthetic. Cards link to
`/anime/[id]` (§13). Cold start (no/short history) → popularity + declared-genre ranking, with a prompt
to swipe a deck (cross-sell List Builder).

## 12. My List (`/mylist`)

Manage the user's MAL/AniList list **from the site** — the read+write counterpart to the Builder's
write-only export.

- **Read:** `Tracker.getList()` → grouped by status (Watching / Completed / Plan / On-hold / Dropped),
  searchable + sortable (score, title, last-updated, progress). Show cover, title, status, score,
  progress (`x/total`).
- **Edit inline:** change status, score, episode progress; remove from list. Each edit is a
  `ListUpdate` (extend the Builder's type with `progress?` and a `delete` action) flushed through the
  **same batched writer** from §2.2 — AniList aliased mutations (`SaveMediaListEntry` / `DeleteMediaListEntry`),
  MAL per-entry `PATCH`/`DELETE`. **Optimistic UI** with rollback on failure + a retry affordance.
- **Provider switch:** if both MAL & AniList are connected, a toggle picks which list you're editing
  (they're separate accounts; no auto-merge in v1).
- **Gating:** requires a connection. All writes run **client-side** from the user's IP.
- Reuses the §2.3 AniList client + §2.2 Tracker — almost no new infra, mostly a screen + edit affordances.

## 13. Anime Details (`/anime/[id]`) — the shared connective tissue

A public, streaming-free detail page that every cover in the app links into. `id` = AniList `mediaId`.

- **Data (client-side AniList query, no token needed):** title (romaji/english/native), cover + banner,
  description, format, status, episodes, duration, season/year, genres, tags, studios, averageScore,
  trailer, `characters` (+ voice actors), `relations` (franchise graph), AniList `recommendations`
  ("liked this → liked that"). One `Media(id:)` GraphQL call covers nearly all of it.
- **Actions:** Add to list / change status + score (uses `Tracker.saveEntries` — same writer), and
  external links out to the AniList + MAL pages. **No playback, no streaming links** — this is a
  utility/info page only.
- **Navigation hub:** relations + recommendations render as cover rows that link to other
  `/anime/[id]` pages; "build a deck like this" cross-sells the Builder; the page is the click target
  from Stats (near-completion/stale rows), Recommendations, My List, and the deck.
- **Caching:** memoize the `Media` response in memory + localStorage (TTL) to spare the AniList quota
  when bouncing between details/recs.

## 14. PART II decisions — **FINALIZED** (was "open before P10/P11")
All locked to the recommended option:
1. **Stats heatmap** — ✅ ship **distributions + taste + list-health first**; add a clearly-labeled
   **"list activity"** heatmap (per-list-update granularity, *not* per-episode) as a fast follow-up,
   with copy that says so. No fake per-episode streaks.
2. **MAL vs AniList for Stats/Recs** — ✅ **provider toggle**, defaulting to whichever was connected
   first (fall back to the one with more entries).
3. **Rec feedback scope** — ✅ **single global localStorage store keyed by AniList id** (ids are
   canonical across the app), with a "reset feedback" control.
4. **Hub IA** — ✅ **headline pair (Wrapped + List Builder) + a secondary "your account" row** for
   Stats / Recommendations / My List that unlocks on connect. Details is reached via covers, not a tile.

## 15. Search & Discovery (`/search`, `/browse`, navbar typeahead)

The connective glue that makes AniKit a full **discovery + list-management + utilities** platform.
All of this is **public** (no auth) and **client-side** over the §2.3 AniList GraphQL client — so it
reuses the deck queries almost wholesale and costs little once P1 lands.

- **Global navbar typeahead** — debounced AniList `Page(media: { search })`, 2+ chars, small result
  count, keyboard-navigable, `/` shortcut to focus. Each result → `/anime/[id]`. Present on every page
  (lives in the shared layout/header).
- **`/search`** — full results page for a query: paginated grid, with the same filter rail as browse.
  *Note on the carried-over rate-limit gotcha:* RyuStream had to keep search **off** its shared server
  precisely because high-cardinality partial queries burn the AniList quota — here that's a non-issue,
  because every query runs from the **user's own IP**. Still debounce + cache recent queries.
- **`/browse`** — discovery feeds + advanced filters: **Trending** (`TRENDING_DESC`), **Popular**
  (`POPULARITY_DESC`), **Top Rated** (`SCORE_DESC`), **Seasonal** (current `season`+`seasonYear`), plus
  a filter rail (genre chips, year range, format, status, sort). These are the **same AniList sorts the
  deck uses** (§4 Stage 1) — share one query builder between `/browse` and the deck's "pick a deck".
- **Cross-links everywhere:** browse/search cards → `/anime/[id]`; details' relations/recommendations →
  more details; "build a deck from these filters" → `/builder` pre-seeded; add-to-list inline from any
  grid card (uses the Tracker). Discovery feeds can also seed the §11 recommendation `seedCandidates`.
- **SFW by default** (public face); `Include adult (18+)` opt-in mirrors the deck/setup toggle.
- **Caching:** memoize feed pages + the `Media` detail responses (memory + localStorage TTL) so
  bouncing discover ⇄ details ⇄ recs doesn't re-hit AniList.

**The full platform loop this creates:**
`discover/search → details → (add to list | build a deck | recommendations) → My List ⇄ Stats ⇄ Wrapped`
— one cohesive product instead of disconnected tools.

### §15 decision — **FINALIZED**
5. **`/browse` ⇄ deck overlap** — ✅ **one shared `lib/anilist.ts` `discoveryQuery(config)`** feeds both
   `/browse` (grid → detail) and the Builder deck (swipe). They differ only in presentation.

## 18. Shareable image export (Wrapped + Stats)

Users can export their recap/stats as **downloadable share images**, carrying the Persona-style Wrapped
identity (§9.4). Builds on the existing `src/app/api/card/route.tsx` (`next/og` → PNG).

- **Two formats:**
  - **Landscape 16:9** (e.g. 1200×675) — one big "hero card": headline stats (hours, titles, top genre,
    anime of the year, personality) composed into a single poster. Good for Twitter/X, Discord embeds.
  - **Portrait / story (9:16, e.g. 1080×1920)** — Instagram/TikTok story format. Either one tall card,
    **or a multi-slide set** (one image per key slide: Totals, Genres, Top Rated, Anime of Year,
    Personality, Share) the user can download as a batch / swipe-share.
- **How:** parametrize the `/api/card` route — `?format=landscape|portrait&slide=<id>&...stats`. Pass the
  analytics payload (or a compact signed/encoded subset) so the OG route renders server-side without
  re-fetching MAL. Edge runtime (`next/og`) as today. Keep the window label on the card ("Spring 2025",
  "2024", "All time").
- **UI:** the existing Share slide (`SlideShare`) becomes the export hub — preview + format toggle +
  "Download landscape" / "Download story set" / per-slide download + copy-link, with a QR (already wired)
  and the AniKit watermark. Confetti on export.
- **Design:** the cards must look like the Persona Wrapped skin, **not** a generic OG card — angular
  panels, halftone, kinetic type, vermilion/ink. This is the most-shared artifact, so it carries the
  brand. **Fonts:** `next/og` needs fonts loaded explicitly (fetch + `satori` font list) — register the
  display + mono faces used on screen so the export matches.
- **Stats parity (later):** the §10 Stats dashboard gets the same export (landscape summary card) once
  it lands. Same `/api/card` machinery, different template.

## 16. Persistence, accounts & DB — decision: **no DB / no native accounts in v1**

**AniKit needs no database and no native account system.** The "nothing stored server-side" pitch is a
stated trust + legitimacy point — a DB of accounts would undercut it, and nothing requires one:

- **Identity = OAuth.** MAL/AniList login *is* the account. Users connect a tracker; there is no
  AniKit-native signup. Their identity is the provider id returned by OAuth.
- **Canonical data lives on the tracker.** My List, Stats, and Recs read the user's live MAL/AniList
  list — that *is* the database. Nothing to duplicate or own.
- **Device-local state → localStorage** (zustand `persist`): rec feedback, Builder progress + decisions,
  settings (SFW/provider toggles). All small, all non-authoritative.
- **Session → the existing AES-GCM encrypted cookie** (`session.ts`), generalized to multi-provider
  in P1. Tokens live only there.

**Persistence matrix:**

| Data | Where | Why |
|---|---|---|
| Auth tokens (MAL/AniList) | encrypted cookie | already the pattern; per-provider expiry |
| The user's anime list | MAL/AniList (live) | source of truth; never copied server-side |
| Rec feedback (👍/👎/not-interested) | localStorage | keeps learning without a server (§11) |
| Builder deck progress + decisions | localStorage | resumable swipes (§5) |
| Settings (SFW, provider, score scale) | localStorage | UI prefs |
| Public AniList metadata cache | localStorage + memory (TTL) | spare the per-IP quota |

**The one real localStorage weakness — call it out in the UI:** it's per-device and mobile browsers
(esp. iOS Safari) can evict it under storage pressure or in private/incognito tabs. So Builder progress
and feedback can be lost between devices or after eviction. Acceptable for v1.

**Deferred (post-v1, only if "follow me across devices" is actually requested):** an **opt-in** tiny
per-user **KV** (Turso or Cloudflare KV) keyed by the MAL/AniList id we already have, storing *only* the
localStorage-shaped blobs (feedback / settings / Builder state). This is a sync bucket, **not** native
accounts and **not** a relational schema — and opt-in so the "nothing stored" promise still holds for
everyone who leaves it off. Explicitly out of scope for the initial build.

## 17. Mobile & responsiveness (cross-cutting — applies to every surface)

Mobile is a first-class target, not a fallback. The Builder is already mobile-first (§4); the rule
extends to all the PART II surfaces:

- **Layout:** mobile-first Tailwind; single-column stacks that expand to grids/rails at `sm`/`md`/`lg`.
  **My List** renders as **cards on mobile**, a denser table/row layout on desktop — never a horizontally
  scrolling table on a phone.
- **Charts (Stats):** echarts must `resize` on container/orientation change (`echarts-for-react`
  auto-resizes; verify on rotation); pick mobile-legible legends/labels; the **heatmap** scrolls or
  compresses gracefully on narrow screens.
- **Touch & a11y:** no hover-only affordances (every hover reveal has a tap/focus equivalent); ≥44px
  touch targets; the navbar **typeahead** works with the on-screen keyboard and dismisses cleanly;
  swipe gestures (Builder) always have button + keyboard mirrors (already specified §4).
- **Discovery grids:** 2-up on phones → more columns up; cover images lazy-loaded + correctly sized
  (`sizes`) so mobile data isn't wasted; infinite scroll or "load more" rather than tiny pagination.
- **Details page:** banner/cover collapse sensibly; character/relation/recommendation rails are
  horizontally swipeable carousels on mobile.
- **Performance on mobile data/CPU:** keep client AniList fetches lean (prefetch sparingly), memoize
  metadata (§16), defer non-critical animation (framer-motion/gsap) and heavy chart mounts (echarts is
  large — `next/dynamic` with `ssr:false` + a skeleton so it doesn't block first paint).
- **Test matrix:** verify the swipe deck, My List edit, Stats charts, and typeahead specifically on a
  real small viewport (iOS Safari + Android Chrome), since those are the riskiest on touch.
