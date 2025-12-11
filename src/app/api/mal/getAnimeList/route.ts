import { NextRequest, NextResponse } from "next/server";
import { buildAnalytics } from "@/lib/analytics";
import { SESSION_COOKIE } from "@/lib/constants";
import { fetchAnimeList, fetchMangaList, fetchProfile, refreshMalToken } from "@/lib/mal";
import { decodeSession, encodeSession, isSessionExpired } from "@/lib/session";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const decoded = decodeSession(cookie);

  if (!decoded) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
