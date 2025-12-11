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

export interface MalAlternativeTitles {
  synonyms?: string[];
  en?: string | null;
  ja?: string | null;
}

export interface MalMediaNode {
  id: number;
  title: string;
  main_picture?: MalPicture;
  mean?: number;
  media_type?: string;
  num_episodes?: number;
  num_chapters?: number;
  num_volumes?: number;
  average_episode_duration?: number;
  start_date?: string | null;
  end_date?: string | null;
  genres?: MalGenre[];
  alternative_titles?: MalAlternativeTitles;
  list_status?: MalListStatus;
}

export type TitleLocale = "en" | "ja";

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
  swatch: string;
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
}

export interface MalSessionPayload {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  acquiredAt: number;
  includeManga: boolean;
}
