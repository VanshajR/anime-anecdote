"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult } from "@/lib/types";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideTotals = ({ data }: Props) => {
  const percentAnime = (data.totals.animeHours / data.totals.combinedHours) * 100 || 0;
  const percentManga = 100 - percentAnime;
  const showManga = data.includeManga || data.library.mangaTitles > 0;
  const statCards = [
    {
      key: "anime-titles",
      label: "Anime titles logged",
      accent: "text-neon-pink",
      value: data.library.animeTitles,
      detail: `${data.library.animeEpisodes} episodes in total`,
    },
    {
      key: "anime-complete",
      label: "Anime completed",
      accent: "text-snow/80",
      value: data.library.completedAnime,
      detail: "Finished within 2025",
    },
  ];

  if (showManga) {
    statCards.push(
      {
        key: "manga-titles",
        label: "Manga titles logged",
        accent: "text-neon-cyan",
        value: data.library.mangaTitles,
        detail: `${data.library.mangaChapters} chapters read`,
      },
      {
        key: "manga-complete",
        label: "Manga completed",
        accent: "text-snow/80",
        value: data.library.completedManga,
        detail: "Cleared arcs this year",
      },
    );
  }

  return (
    <SlideShell title="Total watch + read time" subtitle="Slide 02">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-night/30 p-8 text-center">
          <div className="relative h-56 w-56">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(var(--neon-pink) 0% ${percentAnime}%, rgba(255,255,255,0.2) ${percentAnime}% 100%)` }}
            />
            <div className="absolute inset-8 rounded-full bg-night-soft/80 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-snow/70">Combined</p>
              <p className="text-4xl font-semibold">
                <AnimatedNumber value={data.totals.combinedHours} decimals={1} />
              </p>
              <p className="text-sm text-snow/70">hours</p>
            </div>
          </div>
          <p className="text-lg text-snow/70">
            Equivalent to <span className="text-snow font-semibold"><AnimatedNumber value={data.totals.combinedDays} decimals={1} /></span> days of non-stop story time.
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.4em] text-neon-pink">Anime</p>
            <p className="mt-2 text-3xl font-semibold">
              <AnimatedNumber value={data.totals.animeHours} decimals={1} /> hrs
            </p>
            <p className="text-sm text-snow/70">{percentAnime.toFixed(1)}% of your 2025 journey</p>
          </div>
          {showManga ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.4em] text-neon-cyan">Manga</p>
              <p className="mt-2 text-3xl font-semibold">
                <AnimatedNumber value={data.totals.mangaHours} decimals={1} /> hrs
              </p>
              <p className="text-sm text-snow/70">{percentManga.toFixed(1)}% of the recap</p>
            </div>
          ) : null}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 p-5">
            <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Highlight</p>
            <p className="text-xl">{data.activitySummary}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {statCards.map((card) => (
              <div key={card.key} className="rounded-3xl border border-white/10 bg-night-soft/40 p-4">
                <p className={`text-xs uppercase tracking-[0.3em] ${card.accent}`}>{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  <AnimatedNumber value={card.value} decimals={0} />
                </p>
                <p className="text-sm text-snow/70">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
};
