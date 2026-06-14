import { NextRequest, NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { ANILIST_SESSION_COOKIE, DEFAULT_WINDOW_KEY, resolveWindow, SESSION_COOKIE } from "@/lib/constants";
import { fetchAnimeList, fetchMangaList, fetchProfile, refreshMalToken } from "@/lib/mal";
import { fetchAniListData } from "@/lib/anilist";
import { decodeSession, encodeSession, isSessionExpired } from "@/lib/session";
import type { AniListSessionPayload, MalSessionPayload, WindowKey } from "@/lib/types";

/**
 * Provider-agnostic Wrapped data. Reads whichever session cookie is present (MAL or AniList),
 * fetches + normalizes that provider's list into the shared MalMediaNode shape, and runs the one
 * `buildAnalytics` engine. `?provider=` (set by the OAuth callbacks) disambiguates when both
 * cookies exist; otherwise we infer from which cookie is present.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const windowKey = (params.get("w") as WindowKey) || DEFAULT_WINDOW_KEY;
  const window = resolveWindow(windowKey, { start: params.get("s"), end: params.get("e") });

  const malCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const anilistCookie = request.cookies.get(ANILIST_SESSION_COOKIE)?.value;
  const provider = params.get("provider") || (malCookie ? "mal" : anilistCookie ? "anilist" : null);

  if (!provider) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── AniList ──────────────────────────────────────────────────────────────
  if (provider === "anilist") {
    const session = decodeSession<AniListSessionPayload>(anilistCookie);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    try {
      const { profile, anime, manga } = await fetchAniListData(session.access_token, session.includeManga);
      const analytics = buildAnalytics(
        { name: profile.name, avatar: profile.picture },
        anime,
        manga,
        session.includeManga,
        window,
      );
      return NextResponse.json({ analytics });
    } catch (error) {
      console.error("Failed to fetch AniList data", error);
      return NextResponse.json({ error: "Failed to load AniList data" }, { status: 500 });
    }
  }

  // ── MAL (default) ──────────────────────────────────────────────────────────
  const decoded = decodeSession<MalSessionPayload>(malCookie);
  if (!decoded) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let session = decoded;
  try {
    if (isSessionExpired(session)) {
      const refreshed = await refreshMalToken(session.refresh_token);
      session = {
        ...session,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        token_type: refreshed.token_type,
        expires_in: refreshed.expires_in,
        acquiredAt: Date.now(),
      };
    }

    const [profile, anime, manga] = await Promise.all([
      fetchProfile(session),
      fetchAnimeList(session),
      session.includeManga ? fetchMangaList(session) : Promise.resolve([]),
    ]);

    const analytics = buildAnalytics(
      { name: profile.name, avatar: profile.picture },
      anime,
      manga,
      session.includeManga,
      window,
    );

    const response = NextResponse.json({ analytics });
    if (session !== decoded) {
      response.cookies.set({
        name: SESSION_COOKIE,
        value: encodeSession(session),
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  } catch (error) {
    console.error("Failed to fetch MAL data", error);
    return NextResponse.json({ error: "Failed to load MAL data" }, { status: 500 });
  }
}
