"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Layers, Lock, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KonamiConfetti } from "@/components/KonamiConfetti";

type Tool = {
  id: string;
  index: string;
  title: string;
  kana: string;
  type: string;
  blurb: string;
  href: string | null;
  status: "live" | "soon";
  Icon: typeof BarChart3;
  accent: string; // css var
  accentInk: string; // text on accent
};

const TOOLS: Tool[] = [
  {
    id: "wrapped",
    index: "01",
    title: "WRAPPED",
    kana: "ラップド",
    type: "RECAP-TYPE",
    blurb: "Your season in anime, remixed into a Spotify-Wrapped-style story straight from your MyAnimeList history.",
    href: "/wrapped",
    status: "live",
    Icon: BarChart3,
    accent: "var(--accent)",
    accentInk: "var(--accent-ink)",
  },
  {
    id: "builder",
    index: "02",
    title: "LIST BUILDER",
    kana: "リストビルダー",
    type: "DECK-TYPE",
    blurb: "Swipe a deck to build and rate your list, then export it straight to MAL or AniList in one shot.",
    href: null,
    status: "soon",
    Icon: Layers,
    accent: "var(--accent-2)",
    accentInk: "var(--accent-2-ink)",
  },
];

export default function Hub() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  const activate = useCallback(
    (i: number) => {
      const tool = TOOLS[i];
      if (tool.href) router.push(tool.href);
    },
    [router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        setSelected((s) => (s + 1) % TOOLS.length);
      } else if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        setSelected((s) => (s - 1 + TOOLS.length) % TOOLS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activate(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, activate]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-base px-5 py-7 sm:px-10 sm:py-9">
      <KonamiConfetti />
      {/* ===== background graphic furniture ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="diag-lines absolute inset-0" />
        <div
          className="kana-mega absolute -right-8 -top-16 text-[34vw] leading-none sm:text-[26rem]"
          aria-hidden
        >
          アニキット
        </div>
        <div className="halftone absolute -left-10 bottom-0 h-72 w-72 text-accent/40 [mask-image:radial-gradient(circle_at_20%_80%,#000,transparent_70%)]" />
      </div>

      {/* ===== header ===== */}
      <header className="relative mx-auto flex w-full max-w-6xl items-start justify-between">
        <div>
          <h1 className="text-5xl font-extrabold leading-none tracking-tighter sm:text-6xl">
            <span className="text-ink">Ani</span>
            <span className="text-accent">Kit</span>
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-2 w-16 -skew-x-12 bg-accent" />
            <span className="subtitle-bar text-[0.6rem] uppercase tracking-[0.35em] text-ink/50">
              アニキット
            </span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="subtitle-bar hidden items-center gap-2 border-2 border-ink/15 bg-panel px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-ink/60 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--accent-2)" }} />
            system online
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* ===== hero ===== */}
      <section className="relative mx-auto mt-14 w-full max-w-6xl sm:mt-20">
        {/* hanko ink stamp — 無料 / FREE */}
        <div
          className="absolute -top-2 right-0 hidden -rotate-12 select-none md:block"
          aria-hidden
          style={{ color: "var(--accent)" }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[3px] border-current opacity-90">
            <div className="flex h-[6.2rem] w-[6.2rem] flex-col items-center justify-center rounded-full border-2 border-current">
              <span className="text-3xl font-extrabold leading-none">無料</span>
              <span className="subtitle-bar mt-1 text-[0.6rem] font-bold tracking-[0.35em]">FREE</span>
            </div>
          </div>
        </div>

        <div className="tab-block inline-block px-4 py-1 pr-7" style={{ background: "var(--accent-2)" }}>
          <span className="subtitle-bar text-[0.7rem] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent-2-ink)" }}>
            ✦ anime utility belt
          </span>
        </div>
        <h2 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tighter sm:text-8xl">
          <span className="text-ink">Your anime,</span>
          <br />
          <span className="text-accent stroke-glow">leveled up</span>
          <span style={{ color: "var(--accent-2)" }}>.</span>
        </h2>

        {/* LV / EXP status bar — pays off "leveled up" */}
        <div className="mt-5 flex items-center gap-3">
          <span className="subtitle-bar text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
            LV.∞
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-5 -skew-x-12"
                style={{ background: i < 6 ? "var(--accent)" : "color-mix(in srgb, var(--ink) 14%, transparent)" }}
              />
            ))}
          </div>
          <span className="subtitle-bar text-[0.6rem] uppercase tracking-[0.3em] text-ink/45">EXP · MAX</span>
        </div>

        <p className="mt-5 max-w-xl text-lg text-ink/70">
          Free tools for your MyAnimeList &amp; AniList life. Pick a command —
          <span className="text-ink"> no account needed to look around.</span>
        </p>
      </section>

      {/* ===== command window ===== */}
      <section className="relative mx-auto mt-10 w-full max-w-6xl">
        {/* ゴゴゴ menacing aura SFX */}
        <span
          className="kana-tag pointer-events-none absolute -left-7 top-10 hidden text-4xl font-extrabold text-ink/[0.09] lg:block"
          aria-hidden
        >
          ゴゴゴゴ
        </span>
        <div className="flex items-end justify-between">
          <div className="tab-block px-4 py-1.5 pr-7" style={{ background: "var(--ink)" }}>
            <span className="subtitle-bar text-[0.7rem] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--bg)" }}>
              ▌ select a tool
            </span>
          </div>
          <span className="subtitle-bar hidden pb-1 text-[0.62rem] uppercase tracking-[0.3em] text-ink/40 sm:block">
            ↑ ↓ move · ⏎ open
          </span>
        </div>

        <div className="mt-3 grid gap-5 md:grid-cols-2">
          {TOOLS.map((tool, i) => {
            const active = selected === i;
            const isLive = tool.status === "live";
            return (
              <motion.button
                key={tool.id}
                type="button"
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                onClick={() => activate(i)}
                aria-label={`${tool.title} — ${isLive ? "open" : "coming soon"}`}
                className="panel-cut group relative block text-left"
                style={{
                  background: active ? tool.accent : "var(--ink)",
                  filter: active
                    ? `drop-shadow(0 12px 26px color-mix(in srgb, ${tool.accent} 45%, transparent))`
                    : undefined,
                }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* inner paper panel (the thick ink/accent border is the 3px gap) */}
                <div
                  data-active={active}
                  className="panel-cut speed-lines holo-sheen relative overflow-hidden bg-panel p-6 sm:p-7"
                  style={{ margin: "3px" }}
                >
                  <div
                    className="corner-flag absolute left-0 top-0 h-14 w-14"
                    style={{ background: active ? tool.accent : "var(--ink)" }}
                  />
                  <span className="subtitle-bar pointer-events-none absolute bottom-2 right-3 text-7xl font-extrabold text-ink/[0.06]">
                    {tool.index}
                  </span>
                  <div
                    className="halftone pointer-events-none absolute -right-6 -top-6 h-32 w-32 [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]"
                    style={{ color: tool.accent, opacity: active ? 0.5 : 0.22 }}
                  />

                  <div className="relative flex items-center justify-between">
                    <span
                      className="tab-block px-2.5 py-1 pr-5 text-[0.6rem] font-bold uppercase tracking-[0.25em]"
                      style={{ background: tool.accent, color: tool.accentInk }}
                    >
                      {tool.type}
                    </span>
                    {!isLive && (
                      <span className="subtitle-bar flex items-center gap-1 border-2 border-ink/15 bg-elev px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.25em] text-ink/55">
                        <Lock className="h-2.5 w-2.5" /> soon
                      </span>
                    )}
                  </div>

                  <div className="relative mt-6 flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center border-2"
                      style={{
                        borderColor: tool.accent,
                        background: active ? `color-mix(in srgb, ${tool.accent} 14%, transparent)` : "transparent",
                      }}
                    >
                      <tool.Icon className="h-5 w-5" style={{ color: tool.accent }} />
                    </span>
                    <div>
                      <h3
                        className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl"
                        style={{ color: active ? tool.accent : "var(--ink)" }}
                      >
                        {tool.title}
                      </h3>
                      <p className="mt-1.5 text-[0.7rem] tracking-[0.25em] text-ink/40">
                        {tool.kana}
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-5 min-h-[3.5rem] max-w-sm text-sm leading-relaxed text-ink/65">
                    {tool.blurb}
                  </p>

                  <div className="relative mt-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em]">
                    {isLive ? (
                      <>
                        <span
                          className={`cmd-cursor text-lg ${active ? "opacity-100" : "opacity-0"}`}
                          style={{ color: tool.accent }}
                        >
                          ▸
                        </span>
                        <span style={{ color: tool.accent }}>Open</span>
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          style={{ color: tool.accent }}
                        />
                      </>
                    ) : (
                      <span className="flex items-center gap-2 normal-case tracking-normal" style={{ color: tool.accent }}>
                        <span className="text-base font-extrabold">つづく</span>
                        <span className="subtitle-bar text-[0.7rem] uppercase tracking-[0.2em]">
                          to be continued
                        </span>
                        <span className="text-base">↗</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ===== fansub credit footer ===== */}
      <footer className="relative mx-auto mt-12 w-full max-w-6xl">
        <div className="eyecatch-rule mb-4 w-full" />
        <p className="subtitle-bar text-center text-[0.7rem] tracking-[0.15em] text-ink/45">
          アニキット // streamed live from MyAnimeList &amp; AniList · processed on the fly ·
          <span className="text-ink/65"> nothing stored server-side</span>
        </p>
      </footer>
    </main>
  );
}
