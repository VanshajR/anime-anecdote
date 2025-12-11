"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";
import type { AnalyticsResult, TitleLocale } from "@/lib/types";
import { resolveTitle } from "@/lib/localizeTitle";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
  titleLocale: TitleLocale;
}

export const SlideAnimeOfYear = ({ data, titleLocale }: Props) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      void confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.2 },
        colors: ["#ff4fd8", "#4dfff1", "#ffaa31"],
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  if (!data.animeOfYear) {
    return (
      <SlideShell title="Anime of the year" subtitle="Slide 09">
        <p className="text-sm text-snow/70">Watch more in 2025 to unlock this card.</p>
      </SlideShell>
    );
  }

  const animeTitle = resolveTitle(data.animeOfYear, titleLocale);

  return (
    <SlideShell title="Anime of the year" subtitle="Slide 09">
      <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-neon-pink/30 via-neon-violet/30 to-neon-cyan/20 p-8 text-center">
        {data.animeOfYear.cover ? (
          <Image
            src={data.animeOfYear.cover}
            alt={animeTitle}
            width={240}
            height={320}
            className="h-72 w-52 rounded-3xl object-cover shadow-2xl"
          />
        ) : null}
        <h3 className="text-4xl font-semibold">{animeTitle}</h3>
        <p className="text-snow/80">{data.animeOfYear.detail}</p>
        <div className="flex gap-6 text-sm uppercase tracking-[0.4em] text-snow/70">
          <span>User {data.animeOfYear.score.toFixed(1)}</span>
          <span>MAL {data.animeOfYear.malScore.toFixed(1)}</span>
        </div>
      </div>
    </SlideShell>
  );
};
