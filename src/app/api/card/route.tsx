/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";

export const runtime = "edge";

type CardFormat = "landscape" | "portrait";

interface CardPayload {
  format?: CardFormat;
  accent?: string;
  accentDeep?: string;
  user: { name: string };
  windowLabel?: string;
  totals: { combinedHours: number; combinedDays: number };
  library?: { animeTitles?: number; animeEpisodes?: number; completedAnime?: number };
  rating?: { userAverage?: number; deviationScore?: number };
  genres?: { name: string; percent: number }[];
  scoreHistogram?: number[];
  completionRate?: number;
  studio?: string | null;
  personality?: string | null;
  animeOfYear?: { title: string; cover?: string | null; score?: number; malScore?: number } | null;
  /** Optional wide backdrop (AniList bannerImage / TMDB / TVDB). Falls back to the cover. */
  banner?: string | null;
  shareUrl?: string;
}

const INK = "#0b0a0d";
const CREAM = "#f6f1e6";

const FONTS = {
  anton: "https://cdn.jsdelivr.net/npm/@fontsource/anton@5/files/anton-latin-400-normal.woff",
  archivo700: "https://cdn.jsdelivr.net/npm/@fontsource/archivo@5/files/archivo-latin-700-normal.woff",
  archivo800: "https://cdn.jsdelivr.net/npm/@fontsource/archivo@5/files/archivo-latin-800-normal.woff",
};

const fetchFont = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch {
    return null;
  }
};

// rarity tier derived from real stats (the "earned flex")
const rarity = (userAvg: number, completion: number, titles: number) => {
  const s = (Math.min(10, Math.max(0, userAvg)) / 10) * 0.4 + Math.min(1, completion) * 0.35 + Math.min(1, titles / 300) * 0.25;
  if (s >= 0.8) return { name: "SECRET RARE", pips: 5 };
  if (s >= 0.66) return { name: "ULTRA RARE", pips: 4 };
  if (s >= 0.5) return { name: "SUPER RARE", pips: 3 };
  if (s >= 0.32) return { name: "RARE", pips: 2 };
  return { name: "COMMON", pips: 1 };
};

const svgUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const halftone = (w: number, h: number) =>
  svgUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><pattern id='d' width='22' height='22' patternUnits='userSpaceOnUse'><circle cx='3' cy='3' r='1.7' fill='${CREAM}' opacity='0.07'/></pattern></defs><rect width='100%' height='100%' fill='url(#d)'/></svg>`,
  );

const sparkles = (w: number, h: number, accent: string) => {
  const marks = [
    [0.18, 0.2, 26, -30],
    [0.7, 0.12, 18, 20],
    [0.84, 0.46, 30, -15],
    [0.3, 0.62, 16, 40],
    [0.58, 0.78, 22, -25],
    [0.12, 0.84, 20, 10],
    [0.46, 0.34, 14, -40],
    [0.9, 0.74, 16, 30],
  ];
  const rects = marks
    .map(([fx, fy, len, rot], i) => {
      const x = fx * w;
      const y = fy * h;
      const fill = i % 2 === 0 ? CREAM : accent;
      return `<rect x='${x}' y='${y}' width='${len}' height='2.4' fill='${fill}' opacity='0.5' transform='rotate(${rot} ${x} ${y})'/>`;
    })
    .join("");
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${rects}</svg>`);
};

const sawtooth = (w: number, accent: string) => {
  const teeth = Math.ceil(w / 28);
  let d = `M0 24 `;
  for (let i = 0; i < teeth; i += 1) d += `L${i * 28 + 14} 0 L${i * 28 + 28} 24 `;
  d += `L${w} 36 L0 36 Z`;
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='36'><path d='${d}' fill='${INK}'/><path d='${d.replace("L0 36 Z", "")}' fill='none' stroke='${accent}' stroke-width='2' opacity='0.5'/></svg>`);
};

export async function POST(request: Request) {
  const body = (await request.json()) as CardPayload;
  const {
    format = "portrait",
    accent = "#e7251c",
    accentDeep = "#a50f0a",
    user,
    windowLabel = "Wrapped",
    totals,
    library = {},
    rating = {},
    genres = [],
    scoreHistogram = [],
    completionRate = 0,
    studio,
    personality,
    animeOfYear,
    banner,
    shareUrl,
  } = body;

  const landscape = format === "landscape";
  const W = landscape ? 1200 : 1080;
  const H = landscape ? 675 : 1920;
  const cover = animeOfYear?.cover ?? null;
  // Full-bleed backdrop: prefer a wide banner (AniList bannerImage / TMDB / TVDB) when supplied,
  // else fall back to the cover scaled up. The card ART WINDOW always uses the portrait cover.
  const backdrop = banner || cover;
  // Guarantees title legibility over any cover/banner — a scrim alone can't.
  const TITLE_SHADOW = "0 3px 12px rgba(0,0,0,0.96), 0 0 4px rgba(0,0,0,0.92)";
  const tier = rarity(rating.userAverage ?? 0, completionRate, library.animeTitles ?? 0);
  const dev = rating.deviationScore ?? 0;

  const [anton, arch700, arch800] = await Promise.all([
    fetchFont(FONTS.anton),
    fetchFont(FONTS.archivo700),
    fetchFont(FONTS.archivo800),
  ]);
  const fonts = [
    anton && { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
    arch700 && { name: "Archivo", data: arch700, weight: 700 as const, style: "normal" as const },
    arch800 && { name: "Archivo", data: arch800, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: "normal" }[];

  let qr: string | null = null;
  if (shareUrl) {
    try {
      qr = await QRCode.toDataURL(shareUrl, { width: 240, margin: 1, color: { dark: INK, light: CREAM } });
    } catch {
      /* ignore */
    }
  }

  const D = "Anton"; // display
  const B = "Archivo"; // body
  const maxBin = Math.max(...scoreHistogram, 1);
  const peakIdx = scoreHistogram.indexOf(maxBin);

  // ---- shared pieces ----
  const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div
      style={{
        display: "flex",
        backgroundColor: "rgba(11,10,13,0.76)",
        border: `1px solid ${accent}`,
        ...style,
      }}
    >
      {children}
    </div>
  );

  const Histogram = ({ w, barH }: { w: number; barH: number }) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: w > 600 ? 10 : 5, height: barH }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const c = scoreHistogram[i] ?? 0;
        const isPeak = i === peakIdx && maxBin > 0;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                width: "100%",
                height: `${Math.max(4, (c / maxBin) * (barH - 18))}px`,
                backgroundImage: `linear-gradient(180deg, ${isPeak ? CREAM : accent}, ${accent})`,
                borderTop: isPeak ? `3px solid ${CREAM}` : "none",
              }}
            />
            <span style={{ fontFamily: B, fontWeight: 700, fontSize: w > 600 ? 14 : 11, color: CREAM, opacity: 0.55, marginTop: 3 }}>
              {i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ---------- PORTRAIT ----------
  if (!landscape) {
    return new ImageResponse(
      (
        <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", backgroundColor: INK, fontFamily: B }}>
          {/* z0 spotlight */}
          <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `radial-gradient(60% 42% at 50% 34%, ${accent}40, ${accent}10 34%, ${INK} 72%)` }} />
          {/* z2 cover ground */}
          {backdrop ? <img src={backdrop} width={W} height={H} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover", transform: "scale(1.1)" }} /> : null}
          {/* z3 scrim */}
          <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `linear-gradient(180deg, rgba(11,10,13,0.94) 0%, rgba(11,10,13,0.78) 46%, rgba(11,10,13,0.97) 100%)` }} />
          {/* z1 halftone */}
          <img src={halftone(W, H)} width={W} height={H} alt="" style={{ position: "absolute", inset: 0 }} />

          {/* z5/6 CARD */}
          <div
            style={{
              position: "absolute",
              top: 92,
              left: 86,
              width: 908,
              height: 1736,
              display: "flex",
              padding: 14,
              borderRadius: 40,
              transform: "rotate(-2.5deg)",
              backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${CREAM} 38%, ${accent} 66%, #1a1820 100%)`,
              boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 70px ${accent}55`,
            }}
          >
            {/* bezel */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: INK, borderRadius: 28, overflow: "hidden" }}>
              {/* z7 art window */}
              {cover ? <img src={cover} width={880} height={1708} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              {/* z8 darkening */}
              <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `linear-gradient(180deg, ${INK}f5 0%, ${INK}d0 16%, transparent 36%, transparent 48%, ${INK}f2 76%, ${INK} 100%)` }} />
              {/* z9 holo sheen */}
              <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.22, backgroundImage: `linear-gradient(35deg, transparent 0%, ${CREAM}00 38%, ${CREAM}77 47%, ${accent}55 52%, ${CREAM}00 62%, transparent 100%)` }} />
              {/* z10 sparkles */}
              <img src={sparkles(880, 1708, accent)} width={880} height={1708} alt="" style={{ position: "absolute", inset: 0 }} />

              {/* furniture column */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 30, justifyContent: "space-between" }}>
                {/* TOP: rarity + kicker + title */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", height: 8, width: 360, backgroundImage: `linear-gradient(90deg, ${accent}, ${CREAM}, ${accent})` }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(11,10,13,0.8)", border: `1px solid ${accent}`, padding: "8px 16px" }}>
                      <span style={{ fontFamily: D, fontSize: 36, color: accent, letterSpacing: 1 }}>{tier.name}</span>
                      <span style={{ fontFamily: B, fontWeight: 800, fontSize: 28, color: CREAM }}>{"★".repeat(tier.pips)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: B, fontWeight: 700, fontSize: 26, letterSpacing: 8, color: accent, textShadow: TITLE_SHADOW }}>ANIME OF {windowLabel.toUpperCase()}</span>
                    <span style={{ fontFamily: D, fontSize: 84, lineHeight: 0.92, color: CREAM, marginTop: 4, textShadow: TITLE_SHADOW }}>
                      {(animeOfYear?.title ?? "Your Standout").slice(0, 42)}
                    </span>
                    {studio ? <span style={{ fontFamily: B, fontWeight: 700, fontSize: 24, color: CREAM, opacity: 0.7, marginTop: 6 }}>STUDIO · {studio}</span> : null}
                  </div>
                </div>

                {/* MIDDLE: score gem + archetype slab over the art */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {animeOfYear ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 196, height: 196, borderRadius: 100, backgroundColor: "rgba(11,10,13,0.82)", border: `2px solid ${accent}`, justifyContent: "center", boxShadow: `0 0 40px ${accent}66` }}>
                      <span style={{ fontFamily: D, fontSize: 88, color: CREAM, lineHeight: 0.9 }}>{(animeOfYear.score ?? 0).toFixed(0)}</span>
                      <span style={{ fontFamily: B, fontWeight: 700, fontSize: 20, color: accent, letterSpacing: 3 }}>YOU</span>
                      <span style={{ fontFamily: B, fontWeight: 700, fontSize: 18, color: CREAM, opacity: 0.6 }}>MAL {(animeOfYear.malScore ?? 0).toFixed(1)}</span>
                    </div>
                  ) : <div style={{ display: "flex" }} />}
                  {personality ? (
                    <div style={{ display: "flex", backgroundColor: accent, padding: "12px 22px", transform: "rotate(-4deg)" }}>
                      <span style={{ fontFamily: D, fontSize: 40, color: CREAM }}>{personality.toUpperCase()}</span>
                    </div>
                  ) : null}
                </div>

                {/* BOTTOM cluster */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* genre pills */}
                  <div style={{ display: "flex", gap: 12 }}>
                    {genres.slice(0, 3).map((g, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(11,10,13,0.74)", border: `2px solid ${accent}`, padding: "8px 16px", transform: `rotate(${i === 1 ? 1 : -1}deg)` }}>
                        <span style={{ fontFamily: B, fontWeight: 800, fontSize: 24, color: CREAM }}>{g.name}</span>
                        <span style={{ fontFamily: D, fontSize: 24, color: accent }}>{g.percent}%</span>
                      </div>
                    ))}
                  </div>

                  {/* fingerprint */}
                  <Panel style={{ flexDirection: "column", padding: 16, gap: 8 }}>
                    <span style={{ fontFamily: B, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: accent }}>RATING FINGERPRINT</span>
                    <Histogram w={820} barH={92} />
                  </Panel>

                  {/* stat ledger */}
                  <div style={{ display: "flex", border: `1px solid ${accent}`, backgroundColor: "rgba(11,10,13,0.78)" }}>
                    {[
                      { big: totals.combinedHours.toFixed(1), lab: "HOURS", sub: `${totals.combinedDays.toFixed(1)} DAYS` },
                      { big: `${library.animeEpisodes ?? 0}`, lab: "EPISODES", sub: studio ? `via ${studio}` : "watched" },
                      { big: `${library.completedAnime ?? 0}/${library.animeTitles ?? 0}`, lab: "DONE / LIST", sub: `${Math.round(completionRate * 100)}% DONE` },
                      { big: (rating.userAverage ?? 0).toFixed(1), lab: "AVG SCORE", sub: `${dev >= 0 ? "+" : ""}${dev} vs MAL` },
                    ].map((c, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "14px 12px", borderLeft: i === 0 ? "none" : `1px solid ${accent}55` }}>
                        <span style={{ fontFamily: D, fontSize: 50, color: "transparent", lineHeight: 0.95, backgroundImage: `linear-gradient(180deg, ${CREAM}, ${accent})`, backgroundClip: "text", WebkitBackgroundClip: "text" }}>
                          {c.big}
                        </span>
                        <span style={{ fontFamily: B, fontWeight: 800, fontSize: 18, color: CREAM, letterSpacing: 1, marginTop: 2 }}>{c.lab}</span>
                        <span style={{ fontFamily: B, fontWeight: 700, fontSize: 16, color: accent }}>{c.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* brand + QR nameplate */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${accent}55`, paddingTop: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontFamily: D, fontSize: 40, color: CREAM }}>ANIKIT · WRAPPED</span>
                      <span style={{ fontFamily: B, fontWeight: 700, fontSize: 22, color: CREAM, opacity: 0.7 }}>{user.name} · {windowLabel}</span>
                    </div>
                    {qr ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img src={qr} width={104} height={104} alt="" style={{ backgroundColor: CREAM, padding: 6 }} />
                        <span style={{ fontFamily: B, fontWeight: 700, fontSize: 15, color: accent, marginTop: 4, letterSpacing: 2 }}>SCAN TO MAKE YOURS</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: W, height: H, fonts: fonts.length ? fonts : undefined },
    );
  }

  // ---------- LANDSCAPE ----------
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", backgroundColor: INK, fontFamily: B }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `radial-gradient(50% 60% at 34% 50%, ${accent}3a, ${accent}0d 36%, ${INK} 72%)` }} />
        {backdrop ? <img src={backdrop} width={W} height={H} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover", transform: "scale(1.1)" }} /> : null}
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `linear-gradient(90deg, rgba(11,10,13,0.96) 30%, rgba(11,10,13,0.82) 70%, rgba(11,10,13,0.97) 100%)` }} />
        <img src={halftone(W, H)} width={W} height={H} alt="" style={{ position: "absolute", inset: 0 }} />

        {/* CARD (left) */}
        <div style={{ position: "absolute", top: 38, left: 56, width: 360, height: 560, display: "flex", padding: 12, borderRadius: 26, transform: "rotate(-1.5deg)", backgroundImage: `linear-gradient(135deg, ${accent}, ${CREAM} 40%, ${accent} 70%, #1a1820)`, boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 50px ${accent}55` }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: INK, borderRadius: 18, overflow: "hidden", justifyContent: "space-between", padding: 18 }}>
            {cover ? <img src={cover} width={336} height={536} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `linear-gradient(180deg, ${INK}f2 0%, ${INK}c8 20%, transparent 44%, ${INK}f2 84%)` }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.22, backgroundImage: `linear-gradient(35deg, transparent 38%, ${CREAM}77 47%, ${accent}55 52%, transparent 62%)` }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: B, fontWeight: 700, fontSize: 16, letterSpacing: 4, color: accent, textShadow: TITLE_SHADOW }}>ANIME OF {windowLabel.toUpperCase()}</span>
              <div style={{ display: "flex", backgroundColor: "rgba(11,10,13,0.8)", border: `1px solid ${accent}`, padding: "4px 10px" }}>
                <span style={{ fontFamily: D, fontSize: 24, color: accent }}>{tier.name}</span>
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: D, fontSize: 48, lineHeight: 0.92, color: CREAM, textShadow: TITLE_SHADOW }}>{(animeOfYear?.title ?? "Your Standout").slice(0, 32)}</span>
              <span style={{ fontFamily: B, fontWeight: 700, fontSize: 18, color: CREAM, opacity: 0.7 }}>YOU {(animeOfYear?.score ?? 0).toFixed(0)} · MAL {(animeOfYear?.malScore ?? 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* OFF-CARD stat sheet (right) */}
        <div style={{ position: "absolute", top: 40, right: 48, width: 700, height: 520, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: D, fontSize: 64, color: CREAM, lineHeight: 0.9 }}>{user.name}</span>
            {personality ? <span style={{ fontFamily: B, fontWeight: 800, fontSize: 26, color: accent }}>{personality.toUpperCase()}</span> : null}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { big: totals.combinedHours.toFixed(1), lab: "HOURS" },
              { big: `${library.animeEpisodes ?? 0}`, lab: "EPISODES" },
              { big: `${library.completedAnime ?? 0}/${library.animeTitles ?? 0}`, lab: "DONE/LIST" },
              { big: (rating.userAverage ?? 0).toFixed(1), lab: "AVG" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "rgba(11,10,13,0.76)", border: `1px solid ${accent}`, padding: "10px 12px" }}>
                <span style={{ fontFamily: D, fontSize: 42, color: "transparent", lineHeight: 0.95, backgroundImage: `linear-gradient(180deg, ${CREAM}, ${accent})`, backgroundClip: "text", WebkitBackgroundClip: "text" }}>{c.big}</span>
                <span style={{ fontFamily: B, fontWeight: 800, fontSize: 14, color: CREAM, letterSpacing: 1 }}>{c.lab}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", backgroundColor: "rgba(11,10,13,0.76)", border: `1px solid ${accent}`, padding: 14, gap: 8 }}>
            <span style={{ fontFamily: B, fontWeight: 800, fontSize: 16, letterSpacing: 3, color: accent }}>RATING FINGERPRINT · {dev >= 0 ? "+" : ""}{dev} vs MAL</span>
            <Histogram w={700} barH={88} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {genres.slice(0, 3).map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 6, backgroundColor: "rgba(11,10,13,0.74)", border: `2px solid ${accent}`, padding: "6px 12px" }}>
                <span style={{ fontFamily: B, fontWeight: 800, fontSize: 18, color: CREAM }}>{g.name}</span>
                <span style={{ fontFamily: D, fontSize: 18, color: accent }}>{g.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* footer band */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", backgroundColor: INK, borderTop: `2px solid ${accent}` }}>
          <span style={{ fontFamily: D, fontSize: 30, color: CREAM }}>ANIKIT · WRAPPED — {windowLabel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: B, fontWeight: 700, fontSize: 18, color: accent, letterSpacing: 2 }}>SCAN TO MAKE YOURS</span>
            {qr ? <img src={qr} width={48} height={48} alt="" style={{ backgroundColor: CREAM, padding: 4 }} /> : null}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
}
