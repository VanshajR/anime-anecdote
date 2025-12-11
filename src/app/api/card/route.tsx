/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";

export const runtime = "edge";

interface CardPayload {
  user: { name: string };
  totals: { combinedHours: number; combinedDays: number };
  animeOfYear?: { title: string } | null;
  topGenres: string[];
  shareUrl?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CardPayload;
  const { user, totals, animeOfYear, topGenres, shareUrl } = body;

  let qrDataUrl: string | null = null;
  if (shareUrl) {
    try {
      qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 1,
        color: { dark: "#050314", light: "#ffffff" },
      });
    } catch (error) {
      console.error("Failed to render QR for recap card", error);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          fontSize: 48,
          fontFamily: "Space Grotesk, sans-serif",
          color: "#F5F5FF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#030014",
          padding: "80px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 20% 20%, rgba(255, 79, 216, 0.26), transparent 55%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 80% 0%, rgba(77, 255, 241, 0.2), transparent 55%)",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <p style={{ letterSpacing: "0.6em", fontSize: 24 }}>ANIME ANECDOTE</p>
          <h1 style={{ fontSize: 96, lineHeight: 1.05 }}>2025 RECAP</h1>
          <p style={{ fontSize: 40 }}>{user.name}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
          <p style={{ fontSize: 32, textTransform: "uppercase", letterSpacing: "0.4em" }}>Story time</p>
          <p style={{ fontSize: 72 }}>
            {totals.combinedHours.toFixed(1)} hrs • {totals.combinedDays.toFixed(1)} days
          </p>
          {animeOfYear ? (
            <div>
              <p style={{ fontSize: 28, letterSpacing: "0.4em" }}>Spotlight</p>
              <p style={{ fontSize: 60 }}>{animeOfYear.title}</p>
            </div>
          ) : null}
          <p style={{ fontSize: 28 }}>Top genres: {topGenres.join(" · ")}</p>
        </div>
        {shareUrl ? (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", position: "relative" }}>
            <div>
              <p style={{ fontSize: 28, letterSpacing: "0.4em" }}>SCAN TO REPLAY</p>
              <p style={{ fontSize: 40 }}>anime-anecdote.vercel.app</p>
            </div>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR"
                width={240}
                height={240}
                style={{
                  borderRadius: 32,
                  backgroundColor: "#ffffff",
                  padding: 16,
                }}
              />
            ) : (
              <div
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 32,
                  border: "2px dashed rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#F5F5FF",
                }}
              >
                QR unavailable
              </div>
            )}
          </div>
        ) : null}
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
