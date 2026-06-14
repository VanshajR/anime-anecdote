export type MediaType = "anime" | "manga";

export interface MalGenre {
  id: number;
  name: string;
}

export interface MalPicture {
  medium?: string;
  large?: string;
}

export interface MalListStatus {
  status: string;
  score: number;
  num_episodes_watched?: number;
  num_chapters_read?: number;
  is_rewatching?: boolean;
  updated_at?: string | null;
  start_date?: string | null;
  finish_date?: string | null;
}

/** One bar of the score-distribution fingerprint (score 1–10). */
export interface ScoreBin {
  score: number;
  count: number;
}

/** Breakdown by media format (TV / Movie / OVA / ONA / Special / Music). */
export interface FormatStat {
  format: string;
  count: number;
  hours: number;
}

/** Release-era distribution by decade (e.g. "2020s"). */
export interface EraStat {
  label: string;
  count: number;
}

/** Studio leaderboard entry. */
export interface StudioStat {
  name: string;
  count: number;
}

/** Status mix + derived health ratios. */
export interface ListHealth {
  completed: number;
  watching: number;
  dropped: number;
  planToWatch: number;
  onHold: number;
  total: number;
  completionRate: number; // 0..1
  dropRate: number; // 0..1
}

/** A you-vs-MAL outlier (over- or under-rated relative to the community). */
export interface ContrarianPick {
  id: number;
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
  cover?: string;
  userScore: number;
  malScore: number;
  delta: number; // userScore - malScore (negative = you rate it lower than MAL)
}

export interface MalAlternativeTitles {
  synonyms?: string[];
  en?: string | null;
  ja?: string | null;
}

export interface MalStudio {
  id: number;
  name: string;
}

export interface MalStartSeason {
  year: number;
  season: string;
}

export interface MalMediaNode {
  id: number;
  title: string;
  main_picture?: MalPicture;
  mean?: number;
  rank?: number;
  media_type?: string;
  num_episodes?: number;
  num_chapters?: number;
  num_volumes?: number;
  average_episode_duration?: number;
  start_date?: string | null;
  end_date?: string | null;
  genres?: MalGenre[];
  studios?: MalStudio[];
  start_season?: MalStartSeason;
  alternative_titles?: MalAlternativeTitles;
  list_status?: MalListStatus;
}

export type TitleLocale = "en" | "ja";

export type WindowKey =
  | "this-season"
  | "last-season"
  | "this-year"
  | "last-year"
  | "all-time"
  | "custom";

/** A resolved analysis window. `start`/`end` are live Dates (server-side); the serializable subset
 * carried on AnalyticsResult is `{ key, label, presetLabel }`. */
export interface AnalyticsWindow {
  key: WindowKey;
  /** Human label for the window, e.g. "Spring 2025", "2024", "All time", "Jan 1 – Jun 30, 2023". */
  label: string;
  /** The preset's UI name, e.g. "This season". */
  presetLabel: string;
  /** How an entry is matched to the window:
   *  - "airing": the anime must have AIRED in this window (by start_season / premiere). Used by the
   *    season presets — "last season" means shows that aired last season.
   *  - "activity": the entry must have list activity (start/finish/updated) in this window. Used by
   *    year / all-time / custom — i.e. what you logged during that period. */
  mode: "airing" | "activity";
  start: Date;
  end: Date;
}

export interface MalUserProfile {
  id: number;
  name: string;
  picture?: string | null;
  joined_at?: string | null;
}

export interface GenreStat {
  name: string;
  value: number;
  percent: number;
}

export interface GenreCountStat {
  name: string;
  animeCount: number;
  mangaCount: number;
  totalCount: number;
}

export interface RankedMedia {
  id: number;
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
  cover?: string;
  score: number;
  malScore: number;
  hours: number;
  mediaType: MediaType;
  detail: string;
}

export interface HiddenGem {
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
  userScore: number;
  malScore: number;
  delta: number;
  cover?: string;
}

export interface PersonalityResult {
  archetype: string;
  summary: string;
  badges: string[];
}

export interface BingeFact {
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
  pace: number;
  window: string;
}

export interface HeatmapCell {
  month: string;
  value: number;
}

export interface RatingBehavior {
  userAverage: number;
  malAverage: number;
  deviationScore: number;
}

export interface LibraryTotals {
  animeTitles: number;
  mangaTitles: number;
  animeEpisodes: number;
  mangaChapters: number;
  completedAnime: number;
  completedManga: number;
}

export interface AnalyticsResult {
  user: {
    name: string;
    avatar?: string | null;
  };
  includeManga: boolean;
  totals: {
    animeHours: number;
    mangaHours: number;
    combinedHours: number;
    combinedDays: number;
  };
  genres: {
    distribution: GenreStat[];
    top3: GenreStat[];
    frequency: GenreCountStat[];
  };
  hiddenGem: HiddenGem | null;
  topShows: RankedMedia[];
  mangaHighlights: RankedMedia[];
  personality: PersonalityResult;
  binge: {
    fastest: BingeFact | null;
    streak: number;
    streakTitle?: string;
  };
  heatmap: HeatmapCell[];
  rating: RatingBehavior;
  animeOfYear: RankedMedia | null;
  library: LibraryTotals;
  activitySummary: string;
  /** ── richer insights ── */
  scoreHistogram: ScoreBin[];
  formats: FormatStat[];
  eras: EraStat[];
  studios: StudioStat[];
  listHealth: ListHealth;
  longest: RankedMedia | null;
  overrated: ContrarianPick | null;
  underrated: ContrarianPick | null;
  /** The analysis window this recap was computed over (serializable subset of AnalyticsWindow). */
  window: {
    key: WindowKey;
    label: string;
    presetLabel: string;
  };
}

export interface MalSessionPayload {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  acquiredAt: number;
  includeManga: boolean;
}

export interface AniListSessionPayload {
  provider: "anilist";
  access_token: string;
  token_type: string;
  expires_in: number; // AniList tokens are long-lived (~1yr); we don't refresh.
  acquiredAt: number;
  includeManga: boolean;
}
