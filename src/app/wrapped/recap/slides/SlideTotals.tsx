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
      label: "Anime titles",
      value: data.library.animeTitles,
      detail: `${data.library.animeEpisodes.toLocaleString()} episodes`,
    },
    {
      key: "anime-complete",
      label: "Anime completed",
      value: data.library.completedAnime,
      detail: "Finished",
    },
  ];

  if (showManga) {
    statCards.push(
      {
        key: "manga-titles",
        label: "Manga titles",
        value: data.library.mangaTitles,
        detail: `${data.library.mangaChapters.toLocaleString()} chapters`,
      },
      {
        key: "manga-complete",
        label: "Manga completed",
        value: data.library.completedManga,
        detail: "Cleared",
      },
    );
  }

  return (
    <SlideShell title="Time Ledger" subtitle="Totals" badge={data.window.label}>
      <div className="grid gap-7 lg:grid-cols-2">
        {/* combined hours ring */}
        <div className="pw-panel relative flex flex-col items-center justify-center gap-5 overflow-hidden bg-[var(--pw-cream-faint)] p-7 text-center">
          <div className="pw-dots pointer-events-none absolute inset-0 opacity-15" />
          <div className="relative h-52 w-52">
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ rotate: -90, opacity: 0.4 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{
                background: `conic-gradient(var(--pw-red) 0% ${percentAnime}%, rgba(246,241,230,0.16) ${percentAnime}% 100%)`,
              }}
            />
            <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[#0d0a0e]">
              <p className="text-[0.6rem] uppercase tracking-[0.32em] text-[var(--pw-cream-dim)]">Combined</p>
              <p className="pw-num text-5xl text-[var(--pw-cream)]">
                <AnimatedNumber value={data.totals.combinedHours} decimals={1} />
              </p>
              <p className="text-sm text-[var(--pw-cream-dim)]">hours</p>
            </div>
          </div>
          <p className="relative text-base text-[var(--pw-cream-dim)]">
            ≈{" "}
            <span className="font-bold text-[var(--pw-cream)]">
              <AnimatedNumber value={data.totals.combinedDays} decimals={1} />
            </span>{" "}
            days of non-stop story.
          </p>
        </div>

        {/* breakdown */}
        <div className="space-y-3">
          <div className="pw-panel bg-[var(--pw-cream-faint)] p-5">
            <p className="pw-tab px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.22em]">
              <span>Anime</span>
            </p>
            <p className="pw-num mt-2 text-4xl text-[var(--pw-cream)]">
              <AnimatedNumber value={data.totals.animeHours} decimals={1} /> <span className="text-2xl">hrs</span>
            </p>
            <p className="text-sm text-[var(--pw-cream-dim)]">{percentAnime.toFixed(1)}% of your time</p>
          </div>

          {showManga ? (
            <div className="pw-panel bg-[var(--pw-cream-faint)] p-5">
              <p className="pw-slab inline-block px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.22em]">
                <span>Manga</span>
              </p>
              <p className="pw-num mt-2 text-4xl text-[var(--pw-cream)]">
                <AnimatedNumber value={data.totals.mangaHours} decimals={1} /> <span className="text-2xl">hrs</span>
              </p>
              <p className="text-sm text-[var(--pw-cream-dim)]">{percentManga.toFixed(1)}% of the recap</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {statCards.map((card) => (
              <div key={card.key} className="pw-panel bg-[var(--pw-cream-faint)] p-4">
                <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[var(--pw-cream-dim)]">{card.label}</p>
                <p className="pw-num mt-1.5 text-3xl text-[var(--pw-cream)]">
                  <AnimatedNumber value={card.value} decimals={0} />
                </p>
                <p className="text-xs text-[var(--pw-cream-dim)]">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-5 max-w-3xl text-sm text-[var(--pw-cream-dim)]">{data.activitySummary}</p>
    </SlideShell>
  );
};
