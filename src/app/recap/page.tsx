"use client";

import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState, type TouchEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { SlideWelcome } from "./slides/SlideWelcome";
import { SlideTotals } from "./slides/SlideTotals";
import { SlideGenres } from "./slides/SlideGenres";
import { SlideTopRated } from "./slides/SlideTopRated";
import { SlidePersonality } from "./slides/SlidePersonality";
import { SlideBinge } from "./slides/SlideBinge";
import { SlideHeatmap } from "./slides/SlideHeatmap";
import { SlideRatings } from "./slides/SlideRatings";
import { SlideAnimeOfYear } from "./slides/SlideAnimeOfYear";
import { SlideShare } from "./slides/SlideShare";
import type { AnalyticsResult, TitleLocale } from "@/lib/types";

const NAV_CURSOR_LEFT =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2732%27 height=%2732%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ffffff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M15 18l-6-6 6-6%27/%3E%3C/svg%3E") 12 12, pointer';
const NAV_CURSOR_RIGHT =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2732%27 height=%2732%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ffffff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M9 6l6 6-6 6%27/%3E%3C/svg%3E") 12 12, pointer';

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.97 }),
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

export default function RecapPage() {
  const { data, error, isLoading } = useSWR<AnalyticsResponse>("/api/mal/getAnimeList", fetcher, {
    revalidateOnFocus: false,
  });
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [titleLocale, setTitleLocale] = useState<TitleLocale>("en");
  const [touchMeta, setTouchMeta] = useState<{ x: number; y: number; eligible: boolean } | null>(null);

  const slides = useMemo(() => {
    if (!data?.analytics) return [];
    return [
      { id: "welcome", element: <SlideWelcome data={data.analytics} /> },
      { id: "time", element: <SlideTotals data={data.analytics} /> },
      { id: "genres", element: <SlideGenres data={data.analytics} /> },
      { id: "top", element: <SlideTopRated data={data.analytics} titleLocale={titleLocale} /> },
      { id: "persona", element: <SlidePersonality data={data.analytics} /> },
      { id: "binge", element: <SlideBinge data={data.analytics} titleLocale={titleLocale} /> },
      { id: "heatmap", element: <SlideHeatmap data={data.analytics} /> },
      { id: "ratings", element: <SlideRatings data={data.analytics} /> },
      { id: "anime-year", element: <SlideAnimeOfYear data={data.analytics} titleLocale={titleLocale} /> },
      { id: "share", element: <SlideShare data={data.analytics} /> },
    ];
  }, [data, titleLocale]);

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
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = event.touches[0];
    const edgeThreshold = Math.min(120, bounds.width * 0.18);
    const relativeX = point.clientX - bounds.left;
    const eligible = relativeX <= edgeThreshold || bounds.width - relativeX <= edgeThreshold;
    setTouchMeta({ x: point.clientX, y: point.clientY, eligible });
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
      if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX > 0) {
          goPrev();
        } else {
          goNext();
        }
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <motion.div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-neon-pink" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} />
        <p className="text-snow/70">Summoning your MAL data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg text-snow/80">{error.message.includes("Not authenticated") ? "You need to connect your MAL before viewing Anime Anecdote." : "We hit a snag pulling your MAL stats."}</p>
        <Link className="rounded-full bg-gradient-to-r from-neon-pink to-neon-cyan px-6 py-3 font-semibold text-night" href="/">
          Back to login
        </Link>
      </div>
    );
  }

  if (!slides.length) return null;

  const disablePrev = index === 0;
  const disableNext = index === slides.length - 1;

  return (
    <div className="px-4 py-10">
      <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-snow/60">
          <span>Title language</span>
          <div className="flex gap-1 rounded-full bg-white/10 p-1 text-[0.7rem] tracking-normal">
            {["en", "ja"].map((locale) => (
              <button
                key={locale}
                onClick={() => setTitleLocale(locale as TitleLocale)}
                className={`rounded-full px-3 py-1 font-semibold ${
                  titleLocale === locale ? "bg-neon-pink text-night" : "text-snow/70"
                }`}
              >
                {locale === "en" ? "English" : "日本語"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
        <div
          className="relative w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-night-soft/40 p-4 shadow-[0_40px_120px_rgba(3,0,20,0.35)] md:p-10">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={slides[index].id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              >
                {slides[index].element}
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              disabled={disablePrev}
              style={{ cursor: NAV_CURSOR_LEFT }}
              className={`absolute left-0 top-0 hidden h-full w-[18%] items-center justify-start bg-gradient-to-r from-night via-night/40 to-transparent pl-4 text-left text-sm font-semibold text-snow/80 transition-opacity md:flex ${disablePrev ? "pointer-events-none opacity-0" : "opacity-100"}`}
            >
              <span className="rounded-full border border-white/20 px-4 py-1 uppercase tracking-[0.4em] text-white/70">Prev</span>
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              disabled={disableNext}
              style={{ cursor: NAV_CURSOR_RIGHT }}
              className={`absolute right-0 top-0 hidden h-full w-[18%] items-center justify-end bg-gradient-to-l from-night via-night/40 to-transparent pr-4 text-right text-sm font-semibold text-snow/80 transition-opacity md:flex ${disableNext ? "pointer-events-none opacity-0" : "opacity-100"}`}
            >
              <span className="rounded-full border border-white/20 px-4 py-1 uppercase tracking-[0.4em] text-white/70">Next</span>
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-8 top-6 hidden justify-between text-[0.6rem] uppercase tracking-[0.6em] text-white/40 md:flex">
            <span>Tap left</span>
            <span>Tap right</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-snow/60">
          <span className="rounded-full border border-white/15 px-4 py-1">Swipe or tap the edges</span>
          <span className="rounded-full border border-white/15 px-4 py-1">Arrow keys work too</span>
        </div>
        <div className="flex w-full flex-col gap-3 md:hidden">
          <div className="flex gap-3">
            <button
              onClick={goPrev}
              className="flex-1 rounded-full border border-white/20 bg-white/5 py-3 text-sm font-semibold text-snow"
              disabled={disablePrev}
            >
              ← Previous
            </button>
            <button
              onClick={goNext}
              className="flex-1 rounded-full border border-white/20 bg-white/5 py-3 text-sm font-semibold text-snow"
              disabled={disableNext}
            >
              Next →
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => handleIndicatorJump(idx)}
              className={`h-2.5 w-2.5 rounded-full transition ${idx === index ? "bg-neon-pink" : "bg-white/20"}`}
              aria-label={`Go to ${slide.id} slide`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
