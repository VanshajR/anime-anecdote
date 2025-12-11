"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult, TitleLocale } from "@/lib/types";
import { resolveTitle } from "@/lib/localizeTitle";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
  titleLocale: TitleLocale;
}

export const SlideBinge = ({ data, titleLocale }: Props) => {
  const pace = data.binge.fastest?.pace ?? 0;
  const gauge = Math.min(100, (pace / 12) * 100);
  const fastestTitle = data.binge.fastest
    ? resolveTitle(data.binge.fastest, titleLocale)
    : "No data";

  return (
    <SlideShell title="Binge metrics" subtitle="Slide 06">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative rounded-3xl border border-white/10 bg-night-soft/60 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Fastest binge</p>
          <h3 className="mt-2 text-3xl font-semibold">{fastestTitle}</h3>
          <p className="text-sm text-snow/70">{data.binge.fastest?.window}</p>
          <div className="relative mt-8 flex items-center justify-center">
            <div className="relative h-48 w-48">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(var(--neon-pink) ${gauge}%, rgba(255,255,255,0.1) ${gauge}%)` }}
              />
              <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-night-soft/90">
                <p className="text-4xl font-semibold">{pace.toFixed(1)}</p>
                <p className="text-sm text-snow/70">episodes/day</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-flare/30 to-neon-pink/20 p-8">
          <div className="absolute inset-0 animate-pulseGlow rounded-3xl" />
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Streak</p>
          <h3 className="text-6xl font-semibold">{data.binge.streak} days</h3>
          <p className="text-lg text-snow/80">{data.binge.streakTitle ?? "Hit play more days to trigger a streak"}</p>
          <div className="mt-8 flex gap-3">
            {Array.from({ length: Math.min(10, data.binge.streak || 1) }).map((_, idx) => (
              <span key={idx} className="h-3 flex-1 rounded-full bg-white/30" />
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
};
