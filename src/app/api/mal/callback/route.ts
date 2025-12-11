import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, VERIFIER_COOKIE } from "@/lib/constants";
import { encodeSession } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/mal";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const verifierCookie = request.cookies.get(VERIFIER_COOKIE)?.value;

  if (!code || !state || !verifierCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let parsed: { verifier: string; includeManga: boolean; state: string } | null = null;
  try {
    parsed = JSON.parse(verifierCookie);
  } catch {
    // ignore corrupt cookie
  }

  if (!parsed || parsed.state !== state) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const token = await exchangeCodeForToken(code, parsed.verifier);
    const session = encodeSession({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
      acquiredAt: Date.now(),
      includeManga: parsed.includeManga,
    });

    const response = NextResponse.redirect(new URL("/recap", request.url));
    response.cookies.set({
      name: SESSION_COOKIE,
      value: session,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.delete(VERIFIER_COOKIE);
    return response;
  } catch (error) {
    console.error("MAL callback failed", error);
    return NextResponse.redirect(new URL("/?error=oauth", request.url));
  }
}
