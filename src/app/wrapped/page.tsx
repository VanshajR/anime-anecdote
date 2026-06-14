"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, BarChart3, PlayCircle, BookOpenCheck, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DEFAULT_WINDOW_KEY, WINDOW_PRESETS, resolveWindow } from "@/lib/constants";
import type { WindowKey } from "@/lib/types";

const features = [
  {
    icon: Sparkles,
    title: "Cinematic story mode",
    copy: "Ten kinetic, Persona-styled slides you can swipe, share, and screenshot.",
  },
  {
    icon: BarChart3,
    title: "Deep analytics",
    copy: "Watch time, genre balance, heatmaps, and your rating fingerprint.",
  },
  {
    icon: PlayCircle,
    title: "Secure MAL OAuth",
    copy: "PKCE sign-in pulls your official watch history — nothing stored.",
  },
  {
    icon: BookOpenCheck,
    title: "Any window",
    copy: "This season, last year, all time, or a custom date range — your call.",
  },
];

export default function WrappedIntro() {
  const [includeManga, setIncludeManga] = useState(false);
  const [windowKey, setWindowKey] = useState<WindowKey>(DEFAULT_WINDOW_KEY);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const previewLabel = resolveWindow(windowKey, {
    start: customStart || undefined,
    end: customEnd || undefined,
  }).label;

  const connect = (provider: "mal" | "anilist") => {
    const url = new URL(`${window.location.origin}/api/${provider}/auth`);
    url.searchParams.set("includeManga", includeManga ? "1" : "0");
    url.searchParams.set("w", windowKey);
    if (windowKey === "custom") {
      if (customStart) url.searchParams.set("s", customStart);
      if (customEnd) url.searchParams.set("e", customEnd);
    }
    window.location.href = url.toString();
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-base px-5 py-7 sm:px-10 sm:py-9">
      {/* ===== background graphic furniture ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="diag-lines absolute inset-0" />
        <div
          className="kana-mega absolute -right-10 -top-20 text-[36vw] leading-none sm:text-[28rem]"
          aria-hidden
        >
          ラップド
        </div>
        <div className="halftone absolute -left-10 bottom-0 h-72 w-72 text-accent/40 [mask-image:radial-gradient(circle_at_20%_80%,#000,transparent_70%)]" />
      </div>

      {/* ===== header ===== */}
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="subtitle-bar group inline-flex items-center gap-1.5 border-2 border-ink/15 bg-panel px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-ink/60 transition hover:border-accent hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          AniKit
        </Link>
        <div className="flex items-center gap-2">
          <div className="tab-block px-4 py-1.5 pr-7" style={{ background: "var(--accent)" }}>
            <span className="subtitle-bar text-[0.62rem] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent-ink)" }}>
              recap-type
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="relative mx-auto mt-12 grid w-full max-w-6xl gap-10 sm:mt-16 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ===== title card / press start ===== */}
        <motion.div
          className="panel-cut relative"
          style={{ background: "var(--accent)" }}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="panel-cut relative overflow-hidden bg-panel p-7 sm:p-10" style={{ margin: "3px" }}>
            <div className="corner-flag absolute left-0 top-0 h-16 w-16" style={{ background: "var(--accent)" }} />
            <div className="halftone pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-accent/60 [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]" />

            <p className="subtitle-bar relative text-xs uppercase tracking-[0.4em]" style={{ color: "var(--accent-2)" }}>
              ✦ your anime, wrapped
            </p>
            <div className="relative mt-3 flex items-end gap-4">
              <h1 className="text-6xl font-extrabold leading-[0.9] tracking-tighter sm:text-8xl">
                <span className="text-accent stroke-glow">WRAPPED</span>
              </h1>
              <span className="kana-tag mb-2 text-sm font-semibold text-ink/45">ラップド</span>
            </div>
            <p className="relative mt-6 max-w-xl text-lg text-ink/75">
              Everything you logged on MyAnimeList over{" "}
              <span className="text-ink">{previewLabel}</span>, remixed into a dramatic ten-scene
              recap you can share.
            </p>

            {/* analysis window picker */}
            <div className="relative mt-8 border-2 border-ink/15 bg-elev/50 p-5">
              <p className="subtitle-bar text-[0.65rem] uppercase tracking-[0.3em] text-ink/55">
                analysis window
              </p>
              <p className="mt-1 text-sm text-ink/60">
                Pick the period your recap covers — currently{" "}
                <span className="font-semibold text-ink">{previewLabel}</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {WINDOW_PRESETS.map((preset) => {
                  const active = preset.key === windowKey;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setWindowKey(preset.key)}
                      aria-pressed={active}
                      className="border-2 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--line)",
                        background: active ? "var(--accent)" : "transparent",
                        color: active ? "var(--accent-ink)" : "var(--ink)",
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {windowKey === "custom" ? (
                <div className="mt-3 flex flex-wrap gap-4">
                  <label className="flex flex-col gap-1 text-[0.6rem] uppercase tracking-[0.2em] text-ink/55">
                    From
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="border-2 border-ink/15 bg-panel px-3 py-1.5 text-sm text-ink"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[0.6rem] uppercase tracking-[0.2em] text-ink/55">
                    To
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="border-2 border-ink/15 bg-panel px-3 py-1.5 text-sm text-ink"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            {/* manga toggle */}
            <div className="relative mt-5 flex flex-col gap-5 border-2 border-ink/15 bg-elev/50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="subtitle-bar text-[0.65rem] uppercase tracking-[0.3em] text-ink/55">
                  manga insights
                </p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {includeManga ? "Manga included" : "Anime-only recap"}
                </p>
                <p className="mt-0.5 max-w-xs text-sm text-ink/60">
                  Default is anime, so your reading secrets stay hidden unless you opt in.
                </p>
              </div>
              <button
                onClick={() => setIncludeManga((p) => !p)}
                aria-pressed={includeManga}
                aria-label="Toggle manga in recap"
                className="relative flex h-12 w-32 shrink-0 items-center border-2 border-ink/20 px-1.5 transition"
                style={{ background: includeManga ? "var(--accent)" : "var(--bg)" }}
              >
                <motion.span
                  layout
                  className="inline-flex h-9 w-9 items-center justify-center text-sm font-bold"
                  style={{
                    order: includeManga ? 2 : 1,
                    background: "var(--ink)",
                    color: "var(--bg)",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  {includeManga ? "ON" : "OFF"}
                </motion.span>
                <span
                  className="subtitle-bar flex-1 text-center text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: includeManga ? "var(--accent-ink)" : "var(--ink)" }}
                >
                  {includeManga ? "Manga" : "Anime"}
                </span>
              </button>
            </div>

            {/* press start — connect MAL or AniList */}
            <div className="relative mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => connect("mal")}
                aria-label="Connect your MyAnimeList account and generate your recap"
                className="group relative inline-flex items-center gap-3 px-7 py-3.5 text-base font-extrabold uppercase tracking-[0.15em]"
                style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "5px 5px 0 var(--ink)" }}
              >
                <span className="cmd-cursor">▸</span>
                MyAnimeList
                <motion.span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--accent-ink) 25%, transparent)" }}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  →
                </motion.span>
              </button>
              <button
                onClick={() => connect("anilist")}
                aria-label="Connect your AniList account and generate your recap"
                className="group relative inline-flex items-center gap-3 px-7 py-3.5 text-base font-extrabold uppercase tracking-[0.15em]"
                style={{ background: "var(--accent-2)", color: "var(--accent-2-ink)", boxShadow: "5px 5px 0 var(--ink)" }}
              >
                <span className="cmd-cursor">▸</span>
                AniList
                <motion.span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--accent-2-ink) 25%, transparent)" }}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  →
                </motion.span>
              </button>
              <p className="subtitle-bar press-start w-full text-[0.65rem] uppercase tracking-[0.35em] text-ink/55 sm:w-auto">
                press start to connect
              </p>
            </div>
            <p className="subtitle-bar relative mt-4 text-xs text-ink/45">
              You&apos;ll be bounced to MyAnimeList or AniList to sign in, then dropped right back here.
            </p>
          </div>
        </motion.div>

        {/* ===== what's inside ===== */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        >
          <div className="tab-block w-fit px-4 py-1.5 pr-7" style={{ background: "var(--ink)" }}>
            <span className="subtitle-bar text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--bg)" }}>
              ▌ what&apos;s inside
            </span>
          </div>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative flex items-center gap-4 border-2 border-ink/12 bg-panel p-4 transition-colors hover:border-accent"
              whileHover={{ x: 5 }}
            >
              <span className="subtitle-bar text-3xl font-extrabold text-ink/[0.08]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink/15">
                <feature.icon className="h-5 w-5" style={{ color: "var(--accent-2)" }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">{feature.title}</h3>
                <p className="mt-0.5 text-sm text-ink/60">{feature.copy}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="relative mx-auto mt-12 w-full max-w-6xl">
        <div className="eyecatch-rule mb-4 w-full" />
        <p className="subtitle-bar text-center text-[0.7rem] tracking-[0.15em] text-ink/45">
          We only read scrobbles from your chosen window · processed on the fly ·
          <span className="text-ink/65"> nothing stored server-side</span>
        </p>
      </footer>
    </main>
  );
}
