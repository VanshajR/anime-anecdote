"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AnalyticsResult } from "@/lib/types";
import { useAccent } from "@/lib/useAccent";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

type CardFormat = "landscape" | "portrait";

export const SlideShare = ({ data }: Props) => {
  const [qr, setQr] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [format, setFormat] = useState<CardFormat>("portrait");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const { accent, accentDeep } = useAccent();

  useEffect(() => {
    const url = `${window.location.origin}/wrapped`;
    setShareUrl(url);
    QRCode.toDataURL(url, { width: 220, color: { dark: "#0b0a0d", light: "#f6f1e6" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  // Wrapped data is MAL-based (no banner). Fetch AniList's wide bannerImage for the standout
  // (by MAL id) so the share card's backdrop is a banner, not a cropped cover. Public AniList
  // GraphQL, no auth, one query — runs from the user's own IP. Falls back to the cover.
  useEffect(() => {
    const malId = data.animeOfYear?.id;
    if (!malId) return;
    let cancelled = false;
    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: "query($idMal:Int){Media(idMal:$idMal,type:ANIME){bannerImage}}",
        variables: { idMal: malId },
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const url = j?.data?.Media?.bannerImage;
        if (!cancelled && typeof url === "string" && url) setBanner(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [data.animeOfYear?.id]);

  const buildBlob = useCallback(
    async (fmt: CardFormat): Promise<Blob> => {
      const response = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: fmt,
          accent,
          accentDeep,
          user: data.user,
          windowLabel: data.window.label,
          totals: data.totals,
          library: {
            animeTitles: data.library.animeTitles,
            animeEpisodes: data.library.animeEpisodes,
            completedAnime: data.library.completedAnime,
          },
          rating: { userAverage: data.rating.userAverage, deviationScore: data.rating.deviationScore },
          genres: data.genres.top3.map((g) => ({ name: g.name, percent: g.percent })),
          scoreHistogram: data.scoreHistogram.map((b) => b.count),
          completionRate: data.listHealth.completionRate,
          studio: data.studios[0]?.name ?? null,
          personality: data.personality?.archetype ?? null,
          animeOfYear: data.animeOfYear
            ? {
                title: data.animeOfYear.title,
                cover: data.animeOfYear.cover ?? null,
                score: data.animeOfYear.score,
                malScore: data.animeOfYear.malScore,
              }
            : null,
          banner,
          shareUrl: `${window.location.origin}/wrapped`,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate card");
      return response.blob();
    },
    [data, accent, accentDeep, banner],
  );

  // (re)generate the preview when the format changes
  useEffect(() => {
    let revoked = "";
    let cancelled = false;
    setBusy(true);
    buildBlob(format)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoked = url;
        setPreviewUrl(url);
      })
      .catch(() => setPreviewUrl(""))
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [format, buildBlob]);

  const slug = data.window.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleDownload = async () => {
    try {
      setBusy(true);
      const blob = await buildBlob(format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `anikit-wrapped-${slug || "recap"}-${format}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Could not generate the card. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <SlideShell title="Share It" subtitle="Export" badge={data.window.label}>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* controls */}
        <div className="space-y-4">
          <div className="pw-panel bg-[var(--pw-cream-faint)] p-5">
            <p className="pw-tab inline-block px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
              <span>Format</span>
            </p>
            <div className="mt-3 flex gap-2">
              {([
                { key: "portrait", label: "Story 9:16" },
                { key: "landscape", label: "Wide 16:9" },
              ] as const).map((opt) => {
                const active = opt.key === format;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFormat(opt.key)}
                    className={`flex-1 px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.12em] transition ${
                      active ? "bg-[var(--pw-red)] text-[var(--pw-cream)]" : "bg-[var(--pw-cream-faint)] text-[var(--pw-cream-dim)]"
                    }`}
                    style={active ? { boxShadow: "3px 3px 0 var(--pw-red-deep)" } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleDownload}
              disabled={busy}
              className="mt-4 w-full bg-[var(--pw-red)] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--pw-cream)] transition disabled:opacity-50"
              style={{ boxShadow: "4px 4px 0 var(--pw-red-deep)" }}
            >
              {busy ? "Rendering…" : "Download image"}
            </button>

            <button
              onClick={handleCopy}
              className="mt-2 w-full bg-[var(--pw-cream-faint)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pw-cream)] transition"
            >
              {copied ? "Link copied ✓" : "Copy share link"}
            </button>
          </div>

          <div className="pw-panel flex items-center gap-4 bg-[var(--pw-cream-faint)] p-4">
            {qr ? (
              <img src={qr} alt="QR code" className="h-20 w-20" />
            ) : (
              <div className="h-20 w-20 animate-pulse bg-[var(--pw-cream-faint)]" />
            )}
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--pw-cream-dim)]">Scan to make yours</p>
              <p className="pw-num text-xl text-[var(--pw-cream)]">{data.totals.combinedHours.toFixed(1)} hrs</p>
              <p className="text-xs text-[var(--pw-cream-dim)]">{data.genres.top3.map((g) => g.name).join(" · ")}</p>
            </div>
          </div>
        </div>

        {/* live preview */}
        <div className="pw-panel flex items-center justify-center overflow-hidden bg-[#0d0a0e] p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Share card preview"
              className={format === "landscape" ? "w-full" : "max-h-[24rem] w-auto"}
              style={{ outline: "2px solid var(--pw-red)" }}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center">
              <p className="pw-title text-xl text-[var(--pw-cream-dim)]">{busy ? "Rendering preview…" : "No preview"}</p>
            </div>
          )}
        </div>
      </div>
    </SlideShell>
  );
};
