import type { PersonalityResult } from "./types";

export const ANALYTICS_YEAR = 2025;
export const ANALYTICS_START = new Date("2025-01-01T00:00:00.000Z");
export const ANALYTICS_END = new Date("2025-12-07T23:59:59.999Z");
export const MAL_API_BASE = "https://api.myanimelist.net/v2";
export const MAL_AUTH_BASE = "https://myanimelist.net/v1/oauth2";
export const SESSION_COOKIE = "mal_session";
export const VERIFIER_COOKIE = "mal_verifier";
export const MANGA_CHAPTER_MINUTES = 12;

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
    key: "neon-mind",
    archetype: "Neon Tactician",
    summary:
      "Analytical viewers who chase strategy-heavy shows and carefully tune their ratings.",
    badges: ["strategist", "sci-fi", "methodical"],
    swatch: "from-neon-cyan to-neon-violet",
  },
  {
    key: "shonen-spark",
    archetype: "Shōnen Spark",
    summary: "Adrenaline seekers fueled by hype battles, power-ups, and ensemble casts.",
    badges: ["battle lover", "ensemble watcher", "hype curator"],
    swatch: "from-flare to-neon-pink",
  },
  {
    key: "sakura-dream",
    archetype: "Sakura Dream",
    summary: "Slice-of-life sentimentalists who savor gentle pacing and polished art.",
    badges: ["dreamy", "comfy", "art lover"],
    swatch: "from-neon-pink to-aqua",
  },
  {
    key: "void-rhythm",
    archetype: "Void Rhythm",
    summary: "Avant-garde collectors chasing weird pacing, bold art, and niche genres.",
    badges: ["experimental", "arthouse", "genre alchemist"],
    swatch: "from-neon-violet to-night-soft",
  },
];
