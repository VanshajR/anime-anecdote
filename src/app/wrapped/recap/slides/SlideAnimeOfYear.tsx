"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";
import { motion } from "framer-motion";
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
        particleCount: 130,
        spread: 75,
        origin: { y: 0.25 },
        colors: ["#e7251c", "#f6f1e6", "#a50f0a", "#d98a2b"],
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  if (!data.animeOfYear) {
    return (
      <SlideShell title="The Standout" subtitle="Spotlight" badge={data.window.label}>
        <p className="text-sm text-[var(--pw-cream-dim)]">Log a bit more in this window to unlock the spotlight.</p>
      </SlideShell>
    );
  }

  const animeTitle = resolveTitle(data.animeOfYear, titleLocale);

  return (
    <SlideShell title="The Standout" subtitle="Spotlight" badge={data.window.label}>
      <motion.div
        className="pw-panel relative flex flex-col items-center gap-5 overflow-hidden bg-[var(--pw-red)] p-7 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="pw-burst pointer-events-none absolute inset-0 opacity-40" />
        <div className="pw-dots pointer-events-none absolute inset-0 opacity-15" />
        {data.animeOfYear.cover ? (
          <Image
            src={data.animeOfYear.cover}
            alt={animeTitle}
            width={240}
            height={320}
            className="relative h-64 w-44 object-cover"
            style={{ outline: "3px solid var(--pw-cream)", boxShadow: "8px 8px 0 var(--pw-red-deep)" }}
          />
        ) : null}
        <h3 className="pw-title relative text-3xl text-[var(--pw-cream)] sm:text-4xl">{animeTitle}</h3>
        <p className="relative text-sm text-[var(--pw-cream)]/85">{data.animeOfYear.detail}</p>
        <div className="relative flex gap-3">
          <span className="pw-slab px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.14em]">
            <span>You {data.animeOfYear.score.toFixed(1)}</span>
          </span>
          <span className="pw-slab px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.14em]">
            <span>MAL {data.animeOfYear.malScore.toFixed(1)}</span>
          </span>
        </div>
      </motion.div>
    </SlideShell>
  );
};
