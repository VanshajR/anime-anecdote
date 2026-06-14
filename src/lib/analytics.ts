import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { MANGA_CHAPTER_MINUTES, PERSONALITY_BLUEPRINTS } from "./constants";
import {
  AnalyticsResult,
  AnalyticsWindow,
  BingeFact,
  ContrarianPick,
  EraStat,
  FormatStat,
  GenreCountStat,
  GenreStat,
  HeatmapCell,
  HiddenGem,
  LibraryTotals,
  ListHealth,
  MalMediaNode,
  PersonalityResult,
  RankedMedia,
  ScoreBin,
  StudioStat,
} from "./types";
import { clamp, hoursToDays, isWithinWindow, parseMalDate } from "./utils";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  studios: string[];
  format: string;
  releaseYear: number | null;
  start: Date | null;
  finish: Date | null;
  updated: Date | null;
  count: number;
  status?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  tv: "TV",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
  music: "Music",
  manga: "Manga",
  manhwa: "Manhwa",
  novel: "Novel",
  one_shot: "One-shot",
  doujinshi: "Doujin",
  unknown: "Other",
};
const formatLabel = (raw?: string) => FORMAT_LABELS[raw ?? "unknown"] ?? (raw ? raw.toUpperCase() : "Other");

const SEASON_START_MONTH: Record<string, number> = { winter: 0, spring: 3, summer: 6, fall: 9 };

/** The anime's premiere date — preferred from start_season (reliable), else parsed start_date. */
const airDateOf = (node: MalMediaNode): Date | null => {
  if (node.start_season) {
    const m = SEASON_START_MONTH[node.start_season.season?.toLowerCase()] ?? 0;
    return new Date(Date.UTC(node.start_season.year, m, 1));
  }
  return parseMalDate(node.start_date);
};

const withLocalizedTitles = (entry: PreparedEntry) => ({
  title: entry.title,
  titleEn: entry.titleEn ?? null,
  titleJa: entry.titleJa ?? null,
});

const MAL_MEAN_DEFAULT = 7;

const prepareEntries = (nodes: MalMediaNode[], mediaType: "anime" | "manga", window: AnalyticsWindow) =>
  nodes
    .map<PreparedEntry | null>((node) => {
      const list = node.list_status;
      if (!list) return null;

      const start = parseMalDate(list.start_date ?? node.start_date);
      const finish = parseMalDate(list.finish_date ?? node.end_date);
      const updated = parseMalDate(list.updated_at);

      // "airing" windows (season presets) match the anime's PREMIERE; "activity" windows match
      // when the user actually logged it (start/finish/updated).
      const relevant =
        window.mode === "airing"
          ? (() => {
              const air = airDateOf(node);
              return !!air && isWithinWindow(air, window);
            })()
          : [start, finish, updated].some((date) => date && isWithinWindow(date, window));
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

      const releaseYear =
        node.start_season?.year ??
        (node.start_date ? Number(node.start_date.slice(0, 4)) || null : null);

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
        studios: node.studios?.map((studio) => studio.name) ?? [],
        format: formatLabel(node.media_type),
        releaseYear,
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
  const badgePool: Record<string, PersonalityResult> = Object.fromEntries(
    PERSONALITY_BLUEPRINTS.map((blueprint) => [blueprint.key, blueprint as PersonalityResult]),
  );

  // Behavioral signals take precedence over genre — they're more distinctive.
  const rated = entries.filter((e) => e.userScore > 0 && e.malScore > 0);
  if (rated.length >= 8) {
    const dev = rated.reduce((s, e) => s + (e.userScore - e.malScore), 0) / rated.length;
    if (dev <= -1) return badgePool["critic"]; // rates notably tougher than the crowd
  }
  const tracked = entries.filter((e) => e.status);
  if (tracked.length >= 12) {
    const completed = tracked.filter((e) => e.status === "completed").length;
    if (completed / tracked.length >= 0.85) return badgePool["completionist"];
  }

  // Otherwise, genre-driven.
  const { distribution } = genreStats(entries);
  const topGenre = distribution[0]?.name ?? "Fantasy";
  if (["Psychological", "Sci-Fi", "Thriller", "Mystery"].includes(topGenre)) return badgePool["cipher-mind"];
  if (["Action", "Adventure", "Shounen", "Sports"].includes(topGenre)) return badgePool["shonen-spark"];
  if (["Slice of Life", "Romance", "Drama", "Comedy"].includes(topGenre)) return badgePool["sakura-dream"];
  return badgePool["void-rhythm"];
};

const ratingDeviation = (entries: PreparedEntry[]) => {
  const rated = entries.filter((entry) => entry.userScore > 0);
  if (!rated.length) return 0;
  const userAvg = rated.reduce((sum, entry) => sum + entry.userScore, 0) / rated.length;
  const malAvg = rated.reduce((sum, entry) => sum + entry.malScore, 0) / rated.length;
  return Number((userAvg - malAvg).toFixed(1));
};

const calcBinge = (entries: PreparedEntry[], window: AnalyticsWindow) => {
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
    if (!isWithinWindow(finish, window)) return;
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

/** Window-aware activity buckets: monthly across the span, or yearly when the span exceeds ~2 years
 * (e.g. "All time"). Each bucket carries its own label so the slide can render a variable count. */
const calcHeatmap = (entries: PreparedEntry[], window: AnalyticsWindow): HeatmapCell[] => {
  const spanMonths =
    (window.end.getUTCFullYear() - window.start.getUTCFullYear()) * 12 +
    (window.end.getUTCMonth() - window.start.getUTCMonth());

  const tally = (
    buckets: HeatmapCell[],
    indexFor: (date: Date) => number | undefined,
  ): HeatmapCell[] => {
    entries.forEach((entry) => {
      const finish = entry.finish ?? entry.updated;
      if (!finish || !isWithinWindow(finish, window)) return;
      const i = indexFor(finish);
      if (i !== undefined && buckets[i]) buckets[i].value += 1;
    });
    return buckets;
  };

  // >2 years → yearly buckets
  if (spanMonths > 23) {
    const y0 = window.start.getUTCFullYear();
    const y1 = window.end.getUTCFullYear();
    const buckets: HeatmapCell[] = [];
    for (let y = y0; y <= y1; y += 1) buckets.push({ month: String(y), value: 0 });
    return tally(buckets, (d) => d.getUTCFullYear() - y0);
  }

  // monthly buckets from window.start month → window.end month
  const multiYear = window.start.getUTCFullYear() !== window.end.getUTCFullYear();
  const buckets: HeatmapCell[] = [];
  const idx = new Map<string, number>();
  const cur = new Date(Date.UTC(window.start.getUTCFullYear(), window.start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(window.end.getUTCFullYear(), window.end.getUTCMonth(), 1));
  while (cur <= last) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const label = multiYear ? `${MONTHS_SHORT[m]} '${String(y).slice(2)}` : MONTHS_SHORT[m];
    idx.set(`${y}-${m}`, buckets.length);
    buckets.push({ month: label, value: 0 });
    cur.setUTCMonth(m + 1);
  }
  return tally(buckets, (d) => idx.get(`${d.getUTCFullYear()}-${d.getUTCMonth()}`));
};

const calcAnimeOfYear = (entries: PreparedEntry[], window: AnalyticsWindow): RankedMedia | null => {
  const candidate = entries
    .filter((entry) => entry.mediaType === "anime")
    .map((entry) => {
      const recency = entry.finish ? 1 - clamp((window.end.getTime() - entry.finish.getTime()) / (1000 * 60 * 60 * 24 * 365), 0, 1) : 0.5;
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
    detail: `${entry.count} episodes`,
  } satisfies RankedMedia;
};

const scoreHistogram = (entries: PreparedEntry[]): ScoreBin[] => {
  const counts = new Array(11).fill(0) as number[]; // index 1..10
  entries.forEach((entry) => {
    const s = Math.round(entry.userScore);
    if (s >= 1 && s <= 10) counts[s] += 1;
  });
  return Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: counts[i + 1] }));
};

const formatStats = (entries: PreparedEntry[]): FormatStat[] => {
  const bucket = new Map<string, { count: number; hours: number }>();
  entries.forEach((entry) => {
    const cur = bucket.get(entry.format) ?? { count: 0, hours: 0 };
    cur.count += 1;
    cur.hours += entry.durationHours;
    bucket.set(entry.format, cur);
  });
  return Array.from(bucket.entries())
    .map(([format, v]) => ({ format, count: v.count, hours: Number(v.hours.toFixed(1)) }))
    .sort((a, b) => b.count - a.count);
};

const eraStats = (entries: PreparedEntry[]): EraStat[] => {
  const bucket = new Map<number, number>();
  entries.forEach((entry) => {
    if (!entry.releaseYear) return;
    const decade = Math.floor(entry.releaseYear / 10) * 10;
    bucket.set(decade, (bucket.get(decade) ?? 0) + 1);
  });
  return Array.from(bucket.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ label: `${decade}s`, count }));
};

const studioStats = (entries: PreparedEntry[]): StudioStat[] => {
  const bucket = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.mediaType !== "anime") return;
    entry.studios.forEach((name) => bucket.set(name, (bucket.get(name) ?? 0) + 1));
  });
  return Array.from(bucket.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const computeListHealth = (entries: PreparedEntry[]): ListHealth => {
  const tally = { completed: 0, watching: 0, dropped: 0, planToWatch: 0, onHold: 0 };
  entries.forEach((entry) => {
    switch (entry.status) {
      case "completed":
        tally.completed += 1;
        break;
      case "watching":
      case "reading":
        tally.watching += 1;
        break;
      case "dropped":
        tally.dropped += 1;
        break;
      case "plan_to_watch":
      case "plan_to_read":
        tally.planToWatch += 1;
        break;
      case "on_hold":
        tally.onHold += 1;
        break;
    }
  });
  const total = entries.length;
  return {
    ...tally,
    total,
    completionRate: total ? Number((tally.completed / total).toFixed(3)) : 0,
    dropRate: total ? Number((tally.dropped / total).toFixed(3)) : 0,
  };
};

const longestSeries = (entries: PreparedEntry[]): RankedMedia | null => {
  const top = entries
    .filter((e) => e.mediaType === "anime" && (e.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
  if (!top) return null;
  return {
    id: top.id,
    ...withLocalizedTitles(top),
    cover: top.cover,
    score: top.userScore,
    malScore: top.malScore,
    hours: Number(top.durationHours.toFixed(1)),
    mediaType: "anime",
    detail: `${top.count} episodes`,
  };
};

const contrarianPick = (entries: PreparedEntry[], direction: "over" | "under"): ContrarianPick | null => {
  const rated = entries
    .filter((e) => e.userScore > 0 && e.malScore > 0)
    .map((e) => ({ e, delta: e.userScore - e.malScore }));
  if (!rated.length) return null;
  // over = you rate it far below MAL (most negative); under = far above MAL (most positive)
  const sorted = rated.sort((a, b) => (direction === "over" ? a.delta - b.delta : b.delta - a.delta));
  const pick = sorted[0];
  if (!pick || (direction === "over" ? pick.delta >= 0 : pick.delta <= 0)) return null;
  return {
    id: pick.e.id,
    ...withLocalizedTitles(pick.e),
    cover: pick.e.cover,
    userScore: pick.e.userScore,
    malScore: pick.e.malScore,
    delta: Number(pick.delta.toFixed(1)),
  };
};

export const buildAnalytics = (
  profile: { name: string; avatar?: string | null },
  anime: MalMediaNode[],
  manga: MalMediaNode[],
  includeManga: boolean,
  window: AnalyticsWindow,
): AnalyticsResult => {
  const animeEntries = prepareEntries(anime, "anime", window);
  const mangaEntries = includeManga ? prepareEntries(manga, "manga", window) : [];
  const allEntries = [...animeEntries, ...mangaEntries];

  const animeHours = animeEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const mangaHours = mangaEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const combinedHours = animeHours + mangaHours;

  const genres = genreStats(allEntries);
  const hiddenGem = calcHiddenGem(animeEntries);
  const topShows = topRanked(animeEntries, 5, "anime");
  const mangaHighlights = includeManga ? topRanked(mangaEntries, 3, "manga") : [];
  // For airing windows, the activity (finish) dates span beyond the season, so derive a window from
  // the selected entries' actual completion dates for cadence/heatmap; activity windows use themselves.
  const activityWindow: AnalyticsWindow =
    window.mode === "activity"
      ? window
      : (() => {
          const dates = allEntries
            .map((e) => e.finish ?? e.updated)
            .filter((d): d is Date => !!d)
            .sort((a, b) => a.getTime() - b.getTime());
          return dates.length ? { ...window, start: dates[0], end: dates[dates.length - 1] } : window;
        })();

  const personality = calcPersonality(allEntries);
  const binge = calcBinge(allEntries, activityWindow);
  const heatmap = calcHeatmap(allEntries, activityWindow);
  const ratingDelta = ratingDeviation(allEntries);
  const animeOfYear = calcAnimeOfYear(allEntries, window);

  const userRated = allEntries.filter((entry) => entry.userScore > 0);
  const userAvg = userRated.length
    ? userRated.reduce((sum, entry) => sum + entry.userScore, 0) / userRated.length
    : 0;
  const malAvg = userRated.length
    ? userRated.reduce((sum, entry) => sum + entry.malScore, 0) / userRated.length
    : 0;

  const topGenreNames = genres.top3.map((genre) => genre.name).join(", ");
  const activitySummary = `${profile.name} spent ${combinedHours.toFixed(1)} hours immersed in ${
    topGenreNames || "all kinds of"
  } stories — ${window.label}.`;

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
    scoreHistogram: scoreHistogram(allEntries),
    formats: formatStats(allEntries),
    eras: eraStats(allEntries),
    studios: studioStats(animeEntries),
    listHealth: computeListHealth(allEntries),
    longest: longestSeries(animeEntries),
    overrated: contrarianPick(allEntries, "over"),
    underrated: contrarianPick(allEntries, "under"),
    window: { key: window.key, label: window.label, presetLabel: window.presetLabel },
  } satisfies AnalyticsResult;
};
