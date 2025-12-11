"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideShare = ({ data }: Props) => {
  const [qr, setQr] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.origin}/recap`;
    setShareUrl(url);
    QRCode.toDataURL(url, { width: 220, color: { dark: "#050314", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: data.user,
          totals: data.totals,
          animeOfYear: data.animeOfYear,
          topGenres: data.genres.top3.map((genre) => genre.name),
          shareUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate card");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "anime-anecdote-2025.png";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Could not generate the card. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SlideShell title="Shareable recap card" subtitle="Slide 10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Summary</p>
          <p className="mt-3 text-4xl font-semibold">{data.totals.combinedHours.toFixed(1)} hrs watched/ read</p>
          <p className="text-snow/70">Top genres: {data.genres.top3.map((genre) => genre.name).join(" · ")}</p>
          <button
            onClick={handleDownload}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-cyan px-6 py-3 font-semibold text-night"
            disabled={downloading || !shareUrl}
          >
            {downloading ? "Generating..." : "Export PNG"}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Scan to replay</p>
          {qr ? <img src={qr} alt="QR code" className="h-40 w-40" /> : <div className="h-40 w-40 animate-pulse rounded-3xl border border-dashed border-white/20" />}
        </div>
      </div>
    </SlideShell>
  );
};
