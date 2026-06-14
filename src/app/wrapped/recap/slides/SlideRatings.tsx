"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideRatings = ({ data }: Props) => {
  const userPercent = (data.rating.userAverage / 10) * 100;
  const malPercent = (data.rating.malAverage / 10) * 100;
  const dev = data.rating.deviationScore;
  const harsh = dev < 0;
  const maxBin = Math.max(...data.scoreHistogram.map((b) => b.count), 1);
  const totalRated = data.scoreHistogram.reduce((s, b) => s + b.count, 0);

  return (
    <SlideShell title="Score Lines" subtitle="Ratings" badge={data.window.label}>
      <div className="space-y-5">
        {/* score histogram — the fingerprint */}
        <div className="pw-panel bg-[var(--pw-cream-faint)] p-5">
          <div className="flex items-end justify-between">
            <p className="pw-tab inline-block px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
              <span>Your score fingerprint</span>
            </p>
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">
              {totalRated} rated
            </span>
          </div>
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {data.scoreHistogram.map((bin) => (
              <div key={bin.score} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="pw-num text-[0.7rem] text-[var(--pw-cream-dim)]">{bin.count || ""}</span>
                <motion.div
                  className="w-full"
                  style={{ background: "var(--pw-red)" }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(bin.count / maxBin) * 100}%` }}
                  transition={{ duration: 0.5, delay: bin.score * 0.03, ease: "easeOut" }}
                />
                <span className="text-[0.6rem] font-bold text-[var(--pw-cream)]">{bin.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* averages + deviation */}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pw-panel space-y-3 bg-[var(--pw-cream-faint)] p-5">
            <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[var(--pw-cream-dim)]">Average score</p>
            {[
              { label: "You", value: data.rating.userAverage, percent: userPercent, filled: true },
              { label: "MAL", value: data.rating.malAverage, percent: malPercent, filled: false },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-[var(--pw-cream-dim)]">
                  <span>{row.label}</span>
                  <span className="pw-num text-sm text-[var(--pw-cream)]">{row.value.toFixed(2)}</span>
                </div>
                <div className="mt-1 h-2.5 bg-[var(--pw-cream-faint)]">
                  <motion.div
                    className="h-2.5"
                    style={{ background: row.filled ? "var(--pw-red)" : "rgba(246,241,230,0.45)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${row.percent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pw-panel relative flex flex-col justify-center overflow-hidden bg-[var(--pw-cream-faint)] p-5">
            <div className="pw-burst pointer-events-none absolute inset-0 opacity-20" />
            <p className="relative text-[0.56rem] font-bold uppercase tracking-[0.22em] text-[var(--pw-cream-dim)]">
              Deviation vs MAL
            </p>
            <h3 className="pw-num relative text-6xl" style={{ color: "var(--pw-red)" }}>
              {dev >= 0 ? "+" : ""}
              {dev}
            </h3>
            <p className="relative text-xs text-[var(--pw-cream-dim)]">
              {harsh ? "You rate tougher than the crowd." : dev === 0 ? "Dead-on the global average." : "More generous than the crowd."}
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
};
