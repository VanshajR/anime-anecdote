import type { AnalyticsWindow, PersonalityResult, WindowKey } from "./types";

/* ===== Analysis window — presets + resolver =====
 * The recap is no longer hardcoded to a single 2025 season. A window is resolved from a preset key
 * (this/last season, this/last year, all time) or a custom date range, and threaded through analytics
 * + the API. `now` is injectable so callers stay testable. */

export const DEFAULT_WINDOW_KEY: WindowKey = "this-year";

export const WINDOW_PRESETS: { key: WindowKey; label: string }[] = [
  { key: "this-season", label: "This season" },
  { key: "last-season", label: "Last season" },
  { key: "this-year", label: "This year" },
  { key: "last-year", label: "Last year" },
  { key: "all-time", label: "All time" },
  { key: "custom", label: "Custom range" },
];

const SEASON_NAMES = ["Winter", "Spring", "Summer", "Fall"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const seasonIndex = (month: number) => Math.floor(month / 3); // 0..3 (Winter→Fall)

const seasonRange = (year: number, sIdx: number) => {
  const startMonth = sIdx * 3;
  return {
    name: SEASON_NAMES[sIdx],
    year,
    start: new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999)), // day 0 of next month = last day
  };
};

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtDay = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;

const customLabel = (start: Date, end: Date) => {
  const sy = start.getUTCFullYear();
  const ey = end.getUTCFullYear();
  return sy === ey
    ? `${fmtDay(start)} – ${fmtDay(end)}, ${ey}`
    : `${fmtDay(start)} ${sy} – ${fmtDay(end)} ${ey}`;
};

export const resolveWindow = (
  key: WindowKey,
  opts?: { now?: Date; start?: string | Date | null; end?: string | Date | null },
): AnalyticsWindow => {
  const now = opts?.now ?? new Date();
  const y = now.getUTCFullYear();
  const sIdx = seasonIndex(now.getUTCMonth());

  switch (key) {
    case "this-season": {
      const r = seasonRange(y, sIdx);
      return { key, presetLabel: "This season", label: `${r.name} ${r.year}`, mode: "airing", start: r.start, end: r.end };
    }
    case "last-season": {
      let ls = sIdx - 1;
      let ly = y;
      if (ls < 0) {
        ls = 3;
        ly = y - 1;
      }
      const r = seasonRange(ly, ls);
      return { key, presetLabel: "Last season", label: `${r.name} ${r.year}`, mode: "airing", start: r.start, end: r.end };
    }
    case "last-year":
      return {
        key,
        presetLabel: "Last year",
        label: `${y - 1}`,
        mode: "activity",
        start: new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59, 999)),
      };
    case "all-time":
      return {
        key,
        presetLabel: "All time",
        label: "All time",
        mode: "activity",
        start: new Date(Date.UTC(1960, 0, 1, 0, 0, 0, 0)),
        end: now,
      };
    case "custom": {
      const start = toDate(opts?.start) ?? new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      const endRaw = toDate(opts?.end) ?? now;
      // normalize custom end to end-of-day for inclusivity
      const end = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate(), 23, 59, 59, 999));
      return { key, presetLabel: "Custom", label: customLabel(start, end), mode: "activity", start, end };
    }
    case "this-year":
    default:
      return {
        key: "this-year",
        presetLabel: "This year",
        label: `${y}`,
        mode: "activity",
        start: new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0)),
        end: now,
      };
  }
};

export const MAL_API_BASE = "https://api.myanimelist.net/v2";
export const MAL_AUTH_BASE = "https://myanimelist.net/v1/oauth2";
export const SESSION_COOKIE = "mal_session";
export const VERIFIER_COOKIE = "mal_verifier";
export const MANGA_CHAPTER_MINUTES = 12;

// AniList (standard OAuth2 authorization-code flow — no PKCE-plain quirk like MAL).
export const ANILIST_AUTH_BASE = "https://anilist.co/api/v2/oauth";
export const ANILIST_GRAPHQL = "https://graphql.anilist.co";
export const ANILIST_SESSION_COOKIE = "anilist_session";
export const ANILIST_STATE_COOKIE = "anilist_state";

export const SLIDE_ORDER = [
  "welcome",
  "time",
  "genres",
  "top-rated",
  "personality",
  "binge",
  "heatmap",
  "ratings",
  "anime-of-year",
  "share",
] as const;

export type SlideId = (typeof SLIDE_ORDER)[number];

interface PersonalityBlueprint extends PersonalityResult {
  key: string;
}

export const PERSONALITY_BLUEPRINTS: PersonalityBlueprint[] = [
  {
    key: "cipher-mind",
    archetype: "Cipher Tactician",
    summary:
      "Analytical viewers who chase strategy-heavy shows and carefully tune their ratings.",
    badges: ["strategist", "sci-fi", "methodical"],
  },
  {
    key: "shonen-spark",
    archetype: "Shōnen Spark",
    summary: "Adrenaline seekers fueled by hype battles, power-ups, and ensemble casts.",
    badges: ["battle lover", "ensemble watcher", "hype curator"],
  },
  {
    key: "sakura-dream",
    archetype: "Sakura Dream",
    summary: "Slice-of-life sentimentalists who savor gentle pacing and polished art.",
    badges: ["dreamy", "comfy", "art lover"],
  },
  {
    key: "void-rhythm",
    archetype: "Void Rhythm",
    summary: "Avant-garde collectors chasing weird pacing, bold art, and niche genres.",
    badges: ["experimental", "arthouse", "genre alchemist"],
  },
  {
    key: "critic",
    archetype: "The Critic",
    summary: "Discerning taste — you rate tougher than the crowd and drop what doesn't land.",
    badges: ["discerning", "hard grader", "selective"],
  },
  {
    key: "completionist",
    archetype: "The Completionist",
    summary: "A relentless closer — you finish what you start and rarely leave a series hanging.",
    badges: ["finisher", "marathoner", "dedicated"],
  },
];
