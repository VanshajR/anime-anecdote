import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import {
  ANALYTICS_END,
  ANALYTICS_START,
  MANGA_CHAPTER_MINUTES,
  PERSONALITY_BLUEPRINTS,
} from "./constants";
import {
  AnalyticsResult,
  BingeFact,
  GenreCountStat,
  GenreStat,
  HiddenGem,
  LibraryTotals,
  MalMediaNode,
  PersonalityResult,
  RankedMedia,
} from "./types";
import { clamp, hoursToDays, isWithinWindow, parseMalDate } from "./utils";

interface PreparedEntry {
  id: number;
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
  mediaType: "anime" | "manga";
  cover?: string;
  userScore: number;
  malScore: number;
  durationHours: number;
  genres: string[];
  start: Date | null;
  finish: Date | null;
  updated: Date | null;
  count: number;
  status?: string;
}

const withLocalizedTitles = (entry: PreparedEntry) => ({
  title: entry.title,
  titleEn: entry.titleEn ?? null,
  titleJa: entry.titleJa ?? null,
});

const MAL_MEAN_DEFAULT = 7;

const prepareEntries = (nodes: MalMediaNode[], mediaType: "anime" | "manga") =>
  nodes
    .map<PreparedEntry | null>((node) => {
      const list = node.list_status;
      if (!list) return null;

      const start = parseMalDate(list.start_date ?? node.start_date);
      const finish = parseMalDate(list.finish_date ?? node.end_date);
      const updated = parseMalDate(list.updated_at);
      const relevant = [start, finish, updated].some((date) => date && isWithinWindow(date));
      if (!relevant) return null;

      const titleEn = node.alternative_titles?.en ?? null;
      const titleJa = node.alternative_titles?.ja ?? null;
      const userScore = list.score ?? 0;
      const malScore = node.mean ?? MAL_MEAN_DEFAULT;
      const count =
        mediaType === "anime"
          ? list.num_episodes_watched ?? node.num_episodes ?? 0
          : list.num_chapters_read ?? node.num_chapters ?? 0;

      const durationHours =
        mediaType === "anime"
          ? ((list.num_episodes_watched ?? node.num_episodes ?? 0) *
              (node.average_episode_duration ?? 24 * 60)) /
            3600
          : (count * MANGA_CHAPTER_MINUTES) / 60;

      return {
        id: node.id,
        title: node.title,
        titleEn,
        titleJa,
        mediaType,
        cover: node.main_picture?.large ?? node.main_picture?.medium,
        userScore,
        malScore,
        durationHours,
        genres: node.genres?.map((genre) => genre.name) ?? [],
        start,
        finish,
        updated,
        count,
        status: list.status ?? undefined,
      } satisfies PreparedEntry;
    })
    .filter((entry): entry is PreparedEntry => Boolean(entry));

const genreStats = (
  entries: PreparedEntry[],
): { distribution: GenreStat[]; top3: GenreStat[]; frequency: GenreCountStat[] } => {
  const bucket = new Map<string, { hours: number; animeCount: number; mangaCount: number }>();

  entries.forEach((entry) => {
    entry.genres.forEach((genre) => {
      const current = bucket.get(genre) ?? { hours: 0, animeCount: 0, mangaCount: 0 };
      current.hours += entry.durationHours;
      if (entry.mediaType === "anime") {
        current.animeCount += 1;
      } else {
        current.mangaCount += 1;
      }
      bucket.set(genre, current);
    });
  });

  const totalHours = Array.from(bucket.values()).reduce((sum, value) => sum + value.hours, 0) || 1;
  const distribution = Array.from(bucket.entries())
    .map(([name, detail]) => ({
      name,
      value: detail.hours,
      percent: Number(((detail.hours / totalHours) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);

  const frequency = Array.from(bucket.entries())
    .map(([name, detail]) => ({
      name,
      animeCount: detail.animeCount,
      mangaCount: detail.mangaCount,
      totalCount: detail.animeCount + detail.mangaCount,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  return { distribution, top3: distribution.slice(0, 3), frequency };
};

const calcHiddenGem = (entries: PreparedEntry[]): HiddenGem | null => {
  const candidate = entries
    .filter((entry) => entry.mediaType === "anime" && entry.userScore >= 8)
    .map((entry) => ({ ...entry, delta: entry.userScore - entry.malScore }))
    .filter((entry) => entry.delta >= 1 && entry.malScore <= 7.5)
    .sort((a, b) => b.delta - a.delta)[0];

  if (!candidate) return null;

  return {
    ...withLocalizedTitles(candidate),
    userScore: candidate.userScore,
    malScore: candidate.malScore,
    delta: Number(candidate.delta.toFixed(1)),
    cover: candidate.cover,
  } satisfies HiddenGem;
};

const topRanked = (entries: PreparedEntry[], limit: number, type: "anime" | "manga"): RankedMedia[] =>
  entries
    .filter((entry) => entry.mediaType === type && entry.userScore > 0)
    .sort((a, b) => {
      if (b.userScore === a.userScore) {
        return b.durationHours - a.durationHours;
      }
      return b.userScore - a.userScore;
    })
    .slice(0, limit)
    .map<RankedMedia>((entry) => ({
      id: entry.id,
      ...withLocalizedTitles(entry),
      cover: entry.cover,
      score: entry.userScore,
      malScore: entry.malScore,
      hours: Number(entry.durationHours.toFixed(1)),
      mediaType: entry.mediaType,
      detail: `${entry.count} ${entry.mediaType === "anime" ? "episodes" : "chapters"}`,
    }));

const calcPersonality = (entries: PreparedEntry[]): PersonalityResult => {
  const { distribution } = genreStats(entries);
  const topGenre = distribution[0]?.name ?? "Fantasy";
  const badgePool: Record<string, PersonalityResult> = Object.fromEntries(
    PERSONALITY_BLUEPRINTS.map((blueprint) => [blueprint.key, blueprint as PersonalityResult]),
  );

  if (["Psychological", "Sci-Fi", "Thriller"].includes(topGenre)) {
    return badgePool["neon-mind"];
  }
  if (["Action", "Adventure", "Shounen"].includes(topGenre)) {
    return badgePool["shonen-spark"];
  }
  if (["Slice of Life", "Romance", "Drama"].includes(topGenre)) {
    return badgePool["sakura-dream"];
  }
  return badgePool["void-rhythm"];
};

const ratingDeviation = (entries: PreparedEntry[]) => {
  const rated = entries.filter((entry) => entry.userScore > 0);
  if (!rated.length) return 0;
  const userAvg = rated.reduce((sum, entry) => sum + entry.userScore, 0) / rated.length;
  const malAvg = rated.reduce((sum, entry) => sum + entry.malScore, 0) / rated.length;
  return Number((userAvg - malAvg).toFixed(1));
};

const calcBinge = (entries: PreparedEntry[]) => {
  const bingeable = entries.filter((entry) => entry.mediaType === "anime" && entry.start && entry.finish);
  const fastest = bingeable
    .map((entry) => {
      const raw = Math.abs(differenceInCalendarDays(entry.finish!, entry.start!));
      const days = Math.max(1, raw);
      return {
        ...withLocalizedTitles(entry),
        pace: Number(((entry.count ?? 0) / days).toFixed(1)),
        window: `${format(entry.start!, "MMM d")} – ${format(entry.finish!, "MMM d")}`,
      } satisfies BingeFact;
    })
    .sort((a, b) => b.pace - a.pace)[0];

  const daySet = new Set<string>();
  entries.forEach((entry) => {
    const finish = entry.finish ?? entry.updated;
    if (!finish) return;
    if (!isWithinWindow(finish)) return;
    daySet.add(format(finish, "yyyy-MM-dd"));
  });
  const days = Array.from(daySet).sort();
  let best = 0;
  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = parseISO(days[i - 1]);
    const curr = parseISO(days[i]);
    if (!isValid(prev) || !isValid(curr)) continue;
    if (differenceInCalendarDays(curr, prev) === 1) {
      streak += 1;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }
  best = Math.max(best, streak);

  return {
    fastest: fastest ?? null,
    streak: best,
    streakTitle: best >= 5 ? `${best}-day completion streak` : undefined,
  };
};

const calcHeatmap = (entries: PreparedEntry[]) => {
  const base = Array.from({ length: 12 }, (_, index) => ({
    month: format(new Date(ANALYTICS_START.getUTCFullYear(), index, 1), "MMM"),
    value: 0,
  }));

  entries.forEach((entry) => {
    const finish = entry.finish ?? entry.updated;
    if (!finish) return;
    if (!isWithinWindow(finish)) return;
    const month = finish.getUTCMonth();
    base[month].value += 1;
  });

  return base;
};

const calcAnimeOfYear = (entries: PreparedEntry[]): RankedMedia | null => {
  const candidate = entries
    .filter((entry) => entry.mediaType === "anime")
    .map((entry) => {
      const recency = entry.finish ? 1 - clamp((ANALYTICS_END.getTime() - entry.finish.getTime()) / (1000 * 60 * 60 * 24 * 365), 0, 1) : 0.5;
      const hoursScore = clamp(entry.durationHours / 40, 0, 1);
      const blend =
        entry.userScore * 0.5 + entry.malScore * 0.2 + hoursScore * 10 + recency * 10;
      return { entry, blend };
    })
    .sort((a, b) => b.blend - a.blend)[0];

  if (!candidate) return null;

  const { entry } = candidate;
  return {
    id: entry.id,
    ...withLocalizedTitles(entry),
    cover: entry.cover,
    score: entry.userScore,
    malScore: entry.malScore,
    hours: Number(entry.durationHours.toFixed(1)),
    mediaType: "anime",
    detail: `${entry.count} episodes of pure 2025 energy`,
  } satisfies RankedMedia;
};

export const buildAnalytics = (
  profile: { name: string; avatar?: string | null },
  anime: MalMediaNode[],
  manga: MalMediaNode[],
  includeManga: boolean,
): AnalyticsResult => {
  const animeEntries = prepareEntries(anime, "anime");
  const mangaEntries = includeManga ? prepareEntries(manga, "manga") : [];
  const allEntries = [...animeEntries, ...mangaEntries];

  const animeHours = animeEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const mangaHours = mangaEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const combinedHours = animeHours + mangaHours;

  const genres = genreStats(allEntries);
  const hiddenGem = calcHiddenGem(animeEntries);
  const topShows = topRanked(animeEntries, 5, "anime");
  const mangaHighlights = includeManga ? topRanked(mangaEntries, 3, "manga") : [];
  const personality = calcPersonality(allEntries);
  const binge = calcBinge(allEntries);
  const heatmap = calcHeatmap(allEntries);
  const ratingDelta = ratingDeviation(allEntries);
  const animeOfYear = calcAnimeOfYear(allEntries);

  const userRated = allEntries.filter((entry) => entry.userScore > 0);
  const userAvg = userRated.length
    ? userRated.reduce((sum, entry) => sum + entry.userScore, 0) / userRated.length
    : 0;
  const malAvg = userRated.length
    ? userRated.reduce((sum, entry) => sum + entry.malScore, 0) / userRated.length
    : 0;

  const activitySummary = `${profile.name} spent ${combinedHours.toFixed(1)} hours immersed in ${genres.top3
    .map((genre) => genre.name)
    .join(", ")} stories during the 2025 season window.`;

  const library: LibraryTotals = {
    animeTitles: animeEntries.length,
    mangaTitles: mangaEntries.length,
    animeEpisodes: animeEntries.reduce((sum, entry) => sum + (entry.count ?? 0), 0),
    mangaChapters: mangaEntries.reduce((sum, entry) => sum + (entry.count ?? 0), 0),
    completedAnime: animeEntries.filter((entry) => entry.status === "completed").length,
    completedManga: mangaEntries.filter((entry) => entry.status === "completed").length,
  };

  return {
    user: { name: profile.name, avatar: profile.avatar },
    includeManga,
    totals: {
      animeHours: Number(animeHours.toFixed(1)),
      mangaHours: Number(mangaHours.toFixed(1)),
      combinedHours: Number(combinedHours.toFixed(1)),
      combinedDays: Number(hoursToDays(combinedHours).toFixed(1)),
    },
    genres,
    hiddenGem,
    topShows,
    mangaHighlights,
    personality,
    binge,
    heatmap,
    rating: {
      userAverage: Number(userAvg.toFixed(2)),
      malAverage: Number(malAvg.toFixed(2)),
      deviationScore: ratingDelta,
    },
    animeOfYear,
    library,
    activitySummary,
  } satisfies AnalyticsResult;
};
