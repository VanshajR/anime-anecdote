import { NextRequest, NextResponse } from "next/server";
import { VERIFIER_COOKIE } from "@/lib/constants";
import { buildAuthUrl, generateVerifier } from "@/lib/mal";

export async function GET(request: NextRequest) {
  if (!process.env.MAL_CLIENT_ID || !process.env.MAL_REDIRECT_URI) {
    return NextResponse.json({ error: "Missing MAL configuration" }, { status: 500 });
  }

  const includeManga = request.nextUrl.searchParams.get("includeManga") === "1";
  const verifier = generateVerifier();
  const statePayload = Buffer.from(
    JSON.stringify({ nonce: crypto.randomUUID?.() ?? Date.now().toString(), ts: Date.now(), includeManga }),
  ).toString("base64url");
  const redirect = buildAuthUrl(verifier, statePayload);

  const response = NextResponse.redirect(redirect);
  response.cookies.set({
    name: VERIFIER_COOKIE,
    value: JSON.stringify({ verifier, includeManga, state: statePayload, createdAt: Date.now() }),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
