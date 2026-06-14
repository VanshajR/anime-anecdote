"use client";

import useSWR from "swr";
import { Suspense, useCallback, useEffect, useMemo, useState, type TouchEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlideWelcome } from "./slides/SlideWelcome";
import { SlideTotals } from "./slides/SlideTotals";
import { SlideGenres } from "./slides/SlideGenres";
import { SlideBreakdown } from "./slides/SlideBreakdown";
import { SlideTopRated } from "./slides/SlideTopRated";
import { SlidePersonality } from "./slides/SlidePersonality";
import { SlideBinge } from "./slides/SlideBinge";
import { SlideHeatmap } from "./slides/SlideHeatmap";
import { SlideRatings } from "./slides/SlideRatings";
import { SlideAnimeOfYear } from "./slides/SlideAnimeOfYear";
import { SlideShare } from "./slides/SlideShare";
import { DEFAULT_WINDOW_KEY, WINDOW_PRESETS } from "@/lib/constants";
import { ACCENT_PRESETS, useAccent } from "@/lib/useAccent";
import type { AnalyticsResult, TitleLocale, WindowKey } from "@/lib/types";

const SLIDE_LABELS: Record<string, string> = {
  welcome: "Arrival",
  time: "Time Ledger",
  genres: "Genre Orbit",
  breakdown: "Breakdown",
  top: "Top Rated",
  persona: "Persona",
  binge: "Binge Story",
  heatmap: "Activity Grid",
  ratings: "Score Lines",
  "anime-year": "Anime of the Window",
  share: "Share",
};

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 70 : -70, skewX: direction > 0 ? -4 : 4 }),
  center: { opacity: 1, x: 0, skewX: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -70 : 70, skewX: direction > 0 ? 4 : -4 }),
};

const fetcher = (url: string) =>
  fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error((await response.json().catch(() => ({ error: "" }))).error ?? "Failed");
    }
    return response.json();
  });

interface AnalyticsResponse {
  analytics: AnalyticsResult;
}

const StageFrame = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div className="pw-stage min-h-screen overflow-x-hidden px-4 py-6 sm:px-8 sm:py-8" style={style}>
    {children}
  </div>
);

const AccentPicker = ({
  accent,
  setAccent,
}: {
  accent: string;
  setAccent: (v: string) => void;
}) => (
  <div className="flex items-center gap-1.5">
    {ACCENT_PRESETS.map((preset) => (
      <button
        key={preset.value}
        onClick={() => setAccent(preset.value)}
        aria-label={`Accent ${preset.name}`}
        title={preset.name}
        className="h-5 w-5 rounded-full transition"
        style={{
          background: preset.value,
          outline: accent.toLowerCase() === preset.value.toLowerCase() ? "2px solid var(--pw-cream)" : "none",
          outlineOffset: 2,
        }}
      />
    ))}
    <label
      className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-[var(--pw-cream-faint)]"
      title="Custom color"
      style={{ background: "conic-gradient(red, magenta, blue, cyan, lime, yellow, red)" }}
    >
      <input
        type="color"
        value={accent}
        onChange={(e) => setAccent(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  </div>
);

function RecapInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accent, accentDeep, setAccent } = useAccent();
  const accentVars = { "--pw-red": accent, "--pw-red-deep": accentDeep } as React.CSSProperties;
  const windowKey = (searchParams.get("w") as WindowKey) || DEFAULT_WINDOW_KEY;
  const customStart = searchParams.get("s");
  const customEnd = searchParams.get("e");
  const provider = searchParams.get("provider");

  const swrKey = useMemo(() => {
    const qs = new URLSearchParams({ w: windowKey });
    if (customStart) qs.set("s", customStart);
    if (customEnd) qs.set("e", customEnd);
    if (provider) qs.set("provider", provider);
    return `/api/wrapped/data?${qs.toString()}`;
  }, [windowKey, customStart, customEnd, provider]);

  const { data, error, isLoading, isValidating } = useSWR<AnalyticsResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const analytics = data?.analytics;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [titleLocale, setTitleLocale] = useState<TitleLocale>("en");
  const [touchMeta, setTouchMeta] = useState<{ x: number; y: number; eligible: boolean } | null>(null);

  const setWindow = useCallback(
    (key: WindowKey) => {
      if (key === windowKey) return;
      const p = new URLSearchParams(searchParams.toString());
      p.set("w", key);
      if (key !== "custom") {
        p.delete("s");
        p.delete("e");
      }
      setIndex(0);
      router.replace(`/wrapped/recap?${p.toString()}`);
    },
    [router, searchParams, windowKey],
  );

  const slides = useMemo(() => {
    if (!analytics) return [];
    return [
      { id: "welcome", element: <SlideWelcome data={analytics} /> },
      { id: "time", element: <SlideTotals data={analytics} /> },
      { id: "genres", element: <SlideGenres data={analytics} /> },
      { id: "breakdown", element: <SlideBreakdown data={analytics} /> },
      { id: "top", element: <SlideTopRated data={analytics} titleLocale={titleLocale} /> },
      { id: "persona", element: <SlidePersonality data={analytics} /> },
      { id: "binge", element: <SlideBinge data={analytics} titleLocale={titleLocale} /> },
      { id: "heatmap", element: <SlideHeatmap data={analytics} /> },
      { id: "ratings", element: <SlideRatings data={analytics} /> },
      { id: "anime-year", element: <SlideAnimeOfYear data={analytics} titleLocale={titleLocale} /> },
      { id: "share", element: <SlideShare data={analytics} /> },
    ];
  }, [analytics, titleLocale]);

  const clampIndex = useCallback(
    (value: number) => {
      if (!slides.length) return 0;
      return Math.max(0, Math.min(slides.length - 1, value));
    },
    [slides],
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((prev) => clampIndex(prev + 1));
  }, [clampIndex]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => clampIndex(prev - 1));
  }, [clampIndex]);

  const handleIndicatorJump = useCallback(
    (targetIndex: number) => {
      if (!slides.length) return;
      setDirection(targetIndex > index ? 1 : -1);
      setIndex(clampIndex(targetIndex));
    },
    [clampIndex, index, slides.length],
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      setTouchMeta(null);
      return;
    }
    const point = event.touches[0];
    setTouchMeta({ x: point.clientX, y: point.clientY, eligible: true });
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!touchMeta?.eligible) {
        setTouchMeta(null);
        return;
      }
      const changed = event.changedTouches[0];
      const deltaX = changed.clientX - touchMeta.x;
      const deltaY = changed.clientY - touchMeta.y;
      if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX > 0) goPrev();
        else goNext();
      }
      setTouchMeta(null);
    },
    [goNext, goPrev, touchMeta],
  );

  const handleTouchCancel = useCallback(() => setTouchMeta(null), []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (isLoading && !analytics) {
    return (
      <StageFrame style={accentVars}>
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-5">
          <div className="pw-burst relative h-16 w-16">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[var(--pw-cream-faint)] border-t-[var(--pw-red)]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
          </div>
          <p className="pw-title text-2xl text-[var(--pw-cream)]">Summoning your data…</p>
        </div>
      </StageFrame>
    );
  }

  if (error && !analytics) {
    const notAuthed = error.message.includes("Not authenticated");
    return (
      <StageFrame style={accentVars}>
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center">
          <p className="pw-title text-3xl text-[var(--pw-cream)]">
            {notAuthed ? "Connect MyAnimeList to play" : "Couldn't pull your stats"}
          </p>
          <Link
            href="/wrapped"
            className="pw-tab px-6 py-2.5 text-sm font-extrabold uppercase tracking-[0.2em]"
            style={{ boxShadow: "5px 5px 0 var(--pw-red-deep)" }}
          >
            <span>← Back to connect</span>
          </Link>
        </div>
      </StageFrame>
    );
  }

  if (!slides.length) return null;

  // Nothing logged in this window → a friendly state with the switcher, not a sad "0 hours" recap.
  const isEmpty = !!analytics && analytics.library.animeTitles + analytics.library.mangaTitles === 0;
  if (isEmpty) {
    return (
      <StageFrame style={accentVars}>
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center">
          <span className="pw-tab px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.28em]">
            <span>{analytics!.window.label}</span>
          </span>
          <h2 className="pw-title max-w-xl text-3xl text-[var(--pw-cream)] sm:text-4xl">
            Nothing logged in this window.
          </h2>
          <p className="max-w-md text-sm text-[var(--pw-cream-dim)]">
            {analytics!.user.name}, there&apos;s no anime in <span className="text-[var(--pw-cream)]">{analytics!.window.label}</span>.
            Try a wider window:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {WINDOW_PRESETS.filter((p) => p.key !== "custom").map((preset) => {
              const active = preset.key === windowKey;
              return (
                <button
                  key={preset.key}
                  onClick={() => setWindow(preset.key)}
                  className={`px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-[var(--pw-red)] text-[var(--pw-cream)]"
                      : "bg-[var(--pw-cream-faint)] text-[var(--pw-cream-dim)] hover:text-[var(--pw-cream)]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <Link href="/wrapped" className="pw-tab px-5 py-2 text-xs font-extrabold uppercase tracking-[0.2em]">
            <span>← Back</span>
          </Link>
        </div>
      </StageFrame>
    );
  }

  const disablePrev = index === 0;
  const disableNext = index === slides.length - 1;
  const activeLabel = SLIDE_LABELS[slides[index].id] ?? slides[index].id;

  return (
    <StageFrame style={accentVars}>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* ===== header ===== */}
        <header className="pw-panel relative overflow-hidden bg-[#141015] p-5 sm:p-6">
          <div className="pw-dots pointer-events-none absolute -right-8 -top-10 h-40 w-40 opacity-25 [mask-image:radial-gradient(circle_at_75%_25%,#000,transparent_70%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <Link
                  href="/wrapped"
                  className="pw-tab px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.25em]"
                >
                  <span>← AniKit</span>
                </Link>
                <span className="text-[0.6rem] uppercase tracking-[0.4em] text-[var(--pw-cream-dim)]">
                  Wrapped
                </span>
              </div>
              <h1 className="pw-title mt-3 truncate text-3xl text-[var(--pw-cream)] sm:text-4xl">
                {analytics?.user.name ? `${analytics.user.name}'s recap` : "Your recap"}
              </h1>
              <p className="mt-1 text-sm text-[var(--pw-cream-dim)]">
                {analytics
                  ? `${analytics.library.animeTitles} anime${
                      analytics.includeManga ? ` · ${analytics.library.mangaTitles} manga` : ""
                    } · ${analytics.genres.top3.map((g) => g.name).join(", ") || "—"}`
                  : "—"}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <span className="text-[0.58rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Title</span>
                <div className="flex gap-1 bg-[var(--pw-cream-faint)] p-1">
                  {(["en", "ja"] as const).map((locale) => (
                    <button
                      key={locale}
                      onClick={() => setTitleLocale(locale)}
                      className={`px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] transition ${
                        titleLocale === locale
                          ? "bg-[var(--pw-red)] text-[var(--pw-cream)]"
                          : "text-[var(--pw-cream-dim)]"
                      }`}
                    >
                      {locale === "en" ? "EN" : "日本語"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.58rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Accent</span>
                <AccentPicker accent={accent} setAccent={setAccent} />
              </div>
            </div>
          </div>

          {/* window switcher */}
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Window</span>
            {WINDOW_PRESETS.filter((p) => p.key !== "custom" || windowKey === "custom").map((preset) => {
              const active = preset.key === windowKey;
              return (
                <button
                  key={preset.key}
                  onClick={() => setWindow(preset.key)}
                  disabled={preset.key === "custom"}
                  className={`px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition disabled:cursor-default ${
                    active
                      ? "bg-[var(--pw-red)] text-[var(--pw-cream)]"
                      : "bg-[var(--pw-cream-faint)] text-[var(--pw-cream-dim)] hover:text-[var(--pw-cream)]"
                  }`}
                  style={active ? { boxShadow: "3px 3px 0 var(--pw-red-deep)" } : undefined}
                >
                  {preset.label}
                </button>
              );
            })}
            {isValidating ? (
              <span className="text-[0.58rem] uppercase tracking-[0.25em] text-[var(--pw-red)]">syncing…</span>
            ) : analytics ? (
              <span className="ml-1 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">
                · {analytics.window.label}
              </span>
            ) : null}
          </div>
        </header>

        {/* ===== body ===== */}
        <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
          {/* slide atlas */}
          <aside className="pw-panel hidden bg-[#141015] p-4 lg:block">
            <p className="text-[0.58rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Slides</p>
            <div className="mt-4 flex flex-col gap-1.5">
              {slides.map((slide, idx) => {
                const active = idx === index;
                return (
                  <button
                    key={slide.id}
                    onClick={() => handleIndicatorJump(idx)}
                    aria-current={active}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${
                      active
                        ? "bg-[var(--pw-red)] text-[var(--pw-cream)]"
                        : "text-[var(--pw-cream-dim)] hover:bg-[var(--pw-cream-faint)]"
                    }`}
                    style={active ? { clipPath: "polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)" } : undefined}
                  >
                    <span className="pw-num text-base opacity-70">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.08em]">
                      {SLIDE_LABELS[slide.id] ?? slide.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* slide viewport */}
          <div className="flex flex-col items-center gap-5">
            <div
              className="relative w-full"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            >
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={slides[index].id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {slides[index].element}
                </motion.div>
              </AnimatePresence>

              {/* edge nav (desktop) */}
              <button
                type="button"
                aria-label="Previous slide"
                onClick={goPrev}
                disabled={disablePrev}
                className={`absolute left-0 top-0 hidden h-full w-[14%] items-center justify-start pl-2 transition-opacity md:flex ${
                  disablePrev ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <span className="pw-tab px-2 py-3 text-xs font-bold">
                  <span>‹</span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={goNext}
                disabled={disableNext}
                className={`absolute right-0 top-0 hidden h-full w-[14%] items-center justify-end pr-2 transition-opacity md:flex ${
                  disableNext ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <span className="pw-tab px-2 py-3 text-xs font-bold">
                  <span>›</span>
                </span>
              </button>
            </div>

            {/* progress */}
            <div className="w-full">
              <div className="relative h-1.5 w-full overflow-hidden bg-[var(--pw-cream-faint)]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[var(--pw-red)]"
                  animate={{ width: `${((index + 1) / slides.length) * 100}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.28em] text-[var(--pw-cream-dim)]">
                <span className="pw-num text-sm text-[var(--pw-cream)]">
                  {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
                <span>{activeLabel}</span>
              </div>
            </div>

            {/* mobile nav */}
            <div className="flex w-full gap-3 md:hidden">
              <button
                onClick={goPrev}
                disabled={disablePrev}
                className="flex-1 bg-[var(--pw-cream-faint)] py-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--pw-cream)] disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={goNext}
                disabled={disableNext}
                className="flex-1 bg-[var(--pw-red)] py-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--pw-cream)] disabled:opacity-30"
              >
                Next →
              </button>
            </div>

            {/* dots */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => handleIndicatorJump(idx)}
                  className={`h-2 w-2 transition ${
                    idx === index ? "scale-125 bg-[var(--pw-red)]" : "bg-[var(--pw-cream-faint)]"
                  }`}
                  aria-label={`Go to ${slide.id} slide`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </StageFrame>
  );
}

export default function RecapPage() {
  return (
    <Suspense
      fallback={
        <StageFrame>
          <div className="flex min-h-[80vh] items-center justify-center">
            <p className="pw-title text-2xl text-[var(--pw-cream)]">Loading…</p>
          </div>
        </StageFrame>
      }
    >
      <RecapInner />
    </Suspense>
  );
}
