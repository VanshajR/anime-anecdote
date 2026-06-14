import { ANILIST_AUTH_BASE, ANILIST_GRAPHQL } from "./constants";
import type { MalMediaNode, MalUserProfile } from "./types";

// ── OAuth (authorization-code flow; no PKCE quirk like MAL) ──────────────────

export function buildAniListAuthUrl(state: string): string {
  const url = new URL(`${ANILIST_AUTH_BASE}/authorize`);
  url.searchParams.set("client_id", process.env.ANILIST_CLIENT_ID ?? "");
  url.searchParams.set(
    "redirect_uri",
    process.env.ANILIST_REDIRECT_URI ?? "http://localhost:3000/api/anilist/callback",
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}

interface AniListToken {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
}

export async function exchangeAniListCode(code: string): Promise<AniListToken> {
  const res = await fetch(`${ANILIST_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.ANILIST_CLIENT_ID ?? "",
      client_secret: process.env.ANILIST_CLIENT_SECRET ?? "",
      redirect_uri: process.env.ANILIST_REDIRECT_URI ?? "http://localhost:3000/api/anilist/callback",
      code,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Failed to exchange AniList code (${res.status}): ${detail}`);
  }
  return (await res.json()) as AniListToken;
}

// ── GraphQL fetch ────────────────────────────────────────────────────────────

async function gql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AniList GraphQL ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`AniList GraphQL error: ${json.errors[0].message}`);
  return json.data as T;
}

type ScoreFormat = "POINT_100" | "POINT_10_DECIMAL" | "POINT_10" | "POINT_5" | "POINT_3";

interface ViewerResp {
  Viewer: { id: number; name: string; avatar?: { large?: string | null } | null; mediaListOptions?: { scoreFormat?: ScoreFormat } | null };
}

interface FuzzyDate { year: number | null; month: number | null; day: number | null }
interface AniListEntry {
  status: string;
  score: number;
  progress: number | null;
  repeat: number | null;
  startedAt: FuzzyDate;
  completedAt: FuzzyDate;
  updatedAt: number | null;
  media: {
    id: number;
    idMal: number | null;
    episodes: number | null;
    duration: number | null;
    genres: string[] | null;
    averageScore: number | null;
    season: string | null;
    seasonYear: number | null;
    startDate: FuzzyDate;
    format: string | null;
    studios?: { nodes?: { name: string }[] } | null;
    title?: { romaji?: string | null; english?: string | null; native?: string | null } | null;
    coverImage?: { large?: string | null; medium?: string | null } | null;
    bannerImage?: string | null;
  };
}
interface CollectionResp {
  MediaListCollection: { lists: { entries: AniListEntry[] }[] } | null;
}

const VIEWER_Q = `query { Viewer { id name avatar { large } mediaListOptions { scoreFormat } } }`;

const COLLECTION_Q = `
query ($userId: Int, $type: MediaType) {
  MediaListCollection(userId: $userId, type: $type) {
    lists {
      entries {
        status score progress repeat updatedAt
        startedAt { year month day }
        completedAt { year month day }
        media {
          id idMal episodes duration genres averageScore season seasonYear
          startDate { year month day }
          format
          studios(isMain: true) { nodes { name } }
          title { romaji english native }
          coverImage { large medium }
          bannerImage
        }
      }
    }
  }
}`;

// ── normalization → MalMediaNode (so buildAnalytics works unchanged) ─────────

const STATUS_MAP: Record<string, string> = {
  CURRENT: "watching",
  PLANNING: "plan_to_watch",
  COMPLETED: "completed",
  DROPPED: "dropped",
  PAUSED: "on_hold",
  REPEATING: "watching",
};

const FORMAT_MAP: Record<string, string> = {
  TV: "tv",
  TV_SHORT: "tv",
  MOVIE: "movie",
  SPECIAL: "special",
  OVA: "ova",
  ONA: "ona",
  MUSIC: "music",
  MANGA: "manga",
  NOVEL: "novel",
  ONE_SHOT: "one_shot",
};

/** Convert a user's AniList score (in their chosen scale) to MAL's 1–10. 0 = unrated. */
function normalizeScore(score: number, fmt?: ScoreFormat): number {
  if (!score) return 0;
  switch (fmt) {
    case "POINT_100":
      return Math.round(score / 10);
    case "POINT_5":
      return score * 2;
    case "POINT_3":
      return score === 1 ? 3 : score === 2 ? 6 : 9;
    case "POINT_10_DECIMAL":
    case "POINT_10":
    default:
      return Math.round(score);
  }
}

const pad = (n: number) => String(n).padStart(2, "0");
function fuzzyToStr(d: FuzzyDate | null | undefined): string | null {
  if (!d?.year) return null;
  return `${d.year}-${pad(d.month ?? 1)}-${pad(d.day ?? 1)}`;
}

const ANILIST_SEASON: Record<string, string> = { WINTER: "winter", SPRING: "spring", SUMMER: "summer", FALL: "fall" };

function toMalNode(entry: AniListEntry, fmt: ScoreFormat | undefined, mediaType: "anime" | "manga"): MalMediaNode {
  const m = entry.media;
  return {
    // Key on the MAL id when present so downstream (banner-by-malId, links) stays uniform; else the
    // AniList id (banner enrichment simply misses, which is fine).
    id: m.idMal ?? m.id,
    title: m.title?.romaji || m.title?.english || "Unknown",
    main_picture: { large: m.coverImage?.large ?? undefined, medium: m.coverImage?.medium ?? undefined },
    mean: typeof m.averageScore === "number" ? m.averageScore / 10 : undefined,
    media_type: m.format ? FORMAT_MAP[m.format] ?? m.format.toLowerCase() : undefined,
    num_episodes: m.episodes ?? undefined,
    average_episode_duration: m.duration ? m.duration * 60 : undefined, // AniList minutes → seconds
    start_date: fuzzyToStr(m.startDate),
    genres: (m.genres ?? []).map((name) => ({ id: 0, name })),
    studios: (m.studios?.nodes ?? []).map((s) => ({ id: 0, name: s.name })),
    start_season: m.seasonYear && m.season ? { year: m.seasonYear, season: ANILIST_SEASON[m.season] ?? m.season.toLowerCase() } : undefined,
    alternative_titles: { en: m.title?.english ?? null, ja: m.title?.native ?? null },
    list_status: {
      status: STATUS_MAP[entry.status] ?? entry.status.toLowerCase(),
      score: normalizeScore(entry.score, fmt),
      num_episodes_watched: entry.progress ?? 0,
      num_chapters_read: mediaType === "manga" ? entry.progress ?? 0 : undefined,
      is_rewatching: (entry.repeat ?? 0) > 0,
      start_date: fuzzyToStr(entry.startedAt),
      finish_date: fuzzyToStr(entry.completedAt),
      updated_at: entry.updatedAt ? new Date(entry.updatedAt * 1000).toISOString() : null,
    },
  };
}

export interface AniListData {
  profile: MalUserProfile;
  anime: MalMediaNode[];
  manga: MalMediaNode[];
}

/** Fetch + normalize the viewer's AniList lists into the MAL-shaped nodes buildAnalytics expects. */
export async function fetchAniListData(token: string, includeManga: boolean): Promise<AniListData> {
  const viewer = (await gql<ViewerResp>(token, VIEWER_Q)).Viewer;
  const fmt = viewer.mediaListOptions?.scoreFormat;

  const animeCol = await gql<CollectionResp>(token, COLLECTION_Q, { userId: viewer.id, type: "ANIME" });
  const anime = (animeCol.MediaListCollection?.lists ?? []).flatMap((l) => l.entries).map((e) => toMalNode(e, fmt, "anime"));

  let manga: MalMediaNode[] = [];
  if (includeManga) {
    const mangaCol = await gql<CollectionResp>(token, COLLECTION_Q, { userId: viewer.id, type: "MANGA" });
    manga = (mangaCol.MediaListCollection?.lists ?? []).flatMap((l) => l.entries).map((e) => toMalNode(e, fmt, "manga"));
  }

  return {
    profile: { id: viewer.id, name: viewer.name, picture: viewer.avatar?.large ?? null },
    anime,
    manga,
  };
}
