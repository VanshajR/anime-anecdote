import { randomBytes } from "crypto";
import { MAL_API_BASE, MAL_AUTH_BASE } from "./constants";
import { MalListStatus, MalMediaNode, MalSessionPayload, MalUserProfile } from "./types";

const MAL_FIELDS = [
  "id",
  "title",
  "main_picture",
  "alternative_titles{synonyms,en,ja}",
  "start_date",
  "end_date",
  "mean",
  "rank",
  "media_type",
  "num_episodes",
  "num_chapters",
  "num_volumes",
  "average_episode_duration",
  "genres",
  "studios",
  "start_season",
  "list_status{start_date,finish_date,status,updated_at,num_episodes_watched,num_chapters_read,score,is_rewatching}",
].join(",");

export const generateVerifier = () => randomBytes(48).toString("base64url");

export const buildAuthUrl = (codeChallenge: string, state: string) => {
  const root = new URL(`${MAL_AUTH_BASE}/authorize`);
  root.searchParams.set("response_type", "code");
  root.searchParams.set("client_id", process.env.MAL_CLIENT_ID ?? "");
  root.searchParams.set(
    "redirect_uri",
    process.env.MAL_REDIRECT_URI ?? "http://localhost:3000/api/mal/callback",
  );
  root.searchParams.set("code_challenge", codeChallenge);
  root.searchParams.set("code_challenge_method", "plain");
  root.searchParams.set("state", state);
  return root.toString();
};

interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

export const exchangeCodeForToken = async (
  code: string,
  verifier: string,
): Promise<TokenResponse> => {
  const response = await fetch(`${MAL_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MAL_CLIENT_ID ?? "",
      client_secret: process.env.MAL_CLIENT_SECRET ?? "",
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: process.env.MAL_REDIRECT_URI ?? "http://localhost:3000/api/mal/callback",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Failed to exchange MAL authorization code (${response.status} ${response.statusText}): ${detail}`,
    );
  }

  return (await response.json()) as TokenResponse;
};

export const refreshMalToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await fetch(`${MAL_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.MAL_CLIENT_ID ?? "",
      client_secret: process.env.MAL_CLIENT_SECRET ?? "",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Failed to refresh MAL token (${response.status} ${response.statusText}): ${detail}`);
  }

  return (await response.json()) as TokenResponse;
};

const fetchPaginated = async (
  accessToken: string,
  path: string,
  params: Record<string, string>,
): Promise<MalMediaNode[]> => {
  const results: MalMediaNode[] = [];
  let url = new URL(`${MAL_API_BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch MAL list ${path}`);
    }
    const payload = (await response.json()) as {
      data: { node: MalMediaNode; list_status?: MalListStatus }[];
      paging?: { next?: string };
    };

    payload.data.forEach((item) =>
      results.push({
        ...item.node,
        list_status: item.list_status ?? item.node.list_status,
      }),
    );
    if (payload.paging?.next) {
      url = new URL(payload.paging.next);
    } else {
      break;
    }
  }

  return results;
};

export const fetchAnimeList = async (session: MalSessionPayload) =>
  fetchPaginated(session.access_token, "users/@me/animelist", {
    limit: "1000",
    fields: MAL_FIELDS,
    nsfw: "true",
  });

export const fetchMangaList = async (session: MalSessionPayload) =>
  fetchPaginated(session.access_token, "users/@me/mangalist", {
    limit: "1000",
    fields: MAL_FIELDS,
    nsfw: "true",
  });

export const fetchProfile = async (session: MalSessionPayload): Promise<MalUserProfile> => {
  const response = await fetch(`${MAL_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch MAL profile");
  }

  return (await response.json()) as MalUserProfile;
};
