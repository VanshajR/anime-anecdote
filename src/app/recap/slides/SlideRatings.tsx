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
  return (
    <SlideShell title="Rating behavior" subtitle="Slide 08">
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Average scores</p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm text-snow/70">
                <span>You</span>
                <span>{data.rating.userAverage.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-3 rounded-full bg-white/10">
                <motion.div
                  className="h-3 rounded-full bg-gradient-to-r from-neon-pink to-neon-cyan"
                  style={{ width: `${userPercent}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${userPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-snow/70">
                <span>MAL</span>
                <span>{data.rating.malAverage.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-3 rounded-full bg-white/10">
                <motion.div
                  className="h-3 rounded-full bg-white/30"
                  style={{ width: `${malPercent}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${malPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Deviation</p>
          <h3 className="text-5xl font-semibold">{data.rating.deviationScore >= 0 ? "+" : ""}{data.rating.deviationScore}</h3>
          <p className="text-snow/70">points compared to the global MAL community</p>
        </div>
      </div>
    </SlideShell>
  );
};
