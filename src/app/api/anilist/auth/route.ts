import { NextRequest, NextResponse } from "next/server";
import { ANILIST_STATE_COOKIE, DEFAULT_WINDOW_KEY } from "@/lib/constants";
import { buildAniListAuthUrl } from "@/lib/anilist";

export async function GET(request: NextRequest) {
  if (!process.env.ANILIST_CLIENT_ID || !process.env.ANILIST_REDIRECT_URI) {
    return NextResponse.json({ error: "Missing AniList configuration" }, { status: 500 });
  }

  const params = request.nextUrl.searchParams;
  const includeManga = params.get("includeManga") === "1";
  const w = params.get("w") || DEFAULT_WINDOW_KEY;
  const s = params.get("s") || undefined;
  const e = params.get("e") || undefined;

  const statePayload = Buffer.from(
    JSON.stringify({ nonce: crypto.randomUUID?.() ?? Date.now().toString(), ts: Date.now(), includeManga, w, s, e }),
  ).toString("base64url");

  const response = NextResponse.redirect(buildAniListAuthUrl(statePayload));
  response.cookies.set({
    name: ANILIST_STATE_COOKIE,
    value: JSON.stringify({ includeManga, w, s, e, state: statePayload, createdAt: Date.now() }),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
