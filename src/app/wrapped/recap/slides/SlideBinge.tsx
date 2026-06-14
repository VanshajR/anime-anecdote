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
  const fastestTitle = data.binge.fastest ? resolveTitle(data.binge.fastest, titleLocale) : "No data";
  const pips = Math.min(10, data.binge.streak || 1);

  return (
    <SlideShell title="Binge Story" subtitle="Velocity" badge={data.window.label}>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* fastest binge gauge */}
        <div className="pw-panel relative overflow-hidden bg-[var(--pw-cream-faint)] p-6">
          <p className="pw-tab inline-block px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
            <span>Fastest binge</span>
          </p>
          <h3 className="pw-title mt-2 line-clamp-2 text-2xl text-[var(--pw-cream)]">{fastestTitle}</h3>
          <p className="text-xs text-[var(--pw-cream-dim)]">{data.binge.fastest?.window ?? "—"}</p>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative h-44 w-44">
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.6 }}
                style={{ background: `conic-gradient(var(--pw-red) ${gauge}%, rgba(246,241,230,0.12) ${gauge}%)` }}
              />
              <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[#0d0a0e]">
                <p className="pw-num text-4xl text-[var(--pw-cream)]">{pace.toFixed(1)}</p>
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">eps / day</p>
              </div>
            </div>
          </div>
        </div>

        {/* streak */}
        <div className="pw-panel relative flex flex-col justify-center overflow-hidden bg-[var(--pw-red)] p-6">
          <div className="pw-dots pointer-events-none absolute inset-0 opacity-20" />
          <p className="relative text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[var(--pw-cream)]/80">
            Longest streak
          </p>
          <h3 className="pw-num relative mt-1 text-6xl text-[var(--pw-cream)] sm:text-7xl">
            {data.binge.streak}
            <span className="pw-title ml-2 text-2xl">days</span>
          </h3>
          <p className="relative mt-2 text-sm text-[var(--pw-cream)]/85">
            {data.binge.streakTitle ?? "Watch on more consecutive days to light a streak."}
          </p>
          <div className="relative mt-5 flex gap-1.5">
            {Array.from({ length: pips }).map((_, idx) => (
              <motion.span
                key={idx}
                className="h-2.5 flex-1 bg-[var(--pw-cream)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.05 }}
                style={{ transformOrigin: "left" }}
              />
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
};
