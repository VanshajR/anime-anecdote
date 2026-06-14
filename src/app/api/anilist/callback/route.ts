import { NextRequest, NextResponse } from "next/server";
import { ANILIST_SESSION_COOKIE, ANILIST_STATE_COOKIE } from "@/lib/constants";
import { encodeSession } from "@/lib/session";
import { exchangeAniListCode } from "@/lib/anilist";
import type { AniListSessionPayload } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const stateCookie = request.cookies.get(ANILIST_STATE_COOKIE)?.value;

  if (!code || !state || !stateCookie) {
    return NextResponse.redirect(new URL("/wrapped", request.url));
  }

  let parsed: { includeManga: boolean; w?: string; s?: string; e?: string; state: string } | null = null;
  try {
    parsed = JSON.parse(stateCookie);
  } catch {
    // ignore corrupt cookie
  }
  if (!parsed || parsed.state !== state) {
    return NextResponse.redirect(new URL("/wrapped", request.url));
  }

  try {
    const token = await exchangeAniListCode(code);
    const session: AniListSessionPayload = {
      provider: "anilist",
      access_token: token.access_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
      acquiredAt: Date.now(),
      includeManga: parsed.includeManga,
    };

    const recapUrl = new URL("/wrapped/recap", request.url);
    recapUrl.searchParams.set("provider", "anilist");
    if (parsed.w) recapUrl.searchParams.set("w", parsed.w);
    if (parsed.s) recapUrl.searchParams.set("s", parsed.s);
    if (parsed.e) recapUrl.searchParams.set("e", parsed.e);

    const response = NextResponse.redirect(recapUrl);
    response.cookies.set({
      name: ANILIST_SESSION_COOKIE,
      value: encodeSession(session),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.delete(ANILIST_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("AniList callback failed", error);
    return NextResponse.redirect(new URL("/wrapped?error=oauth", request.url));
  }
}
