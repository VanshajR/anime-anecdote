"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlidePersonality = ({ data }: Props) => (
  <SlideShell title="Your anime personality" subtitle="Slide 05">
    <motion.div
      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Archetype</p>
      <h3 className="text-5xl font-semibold">{data.personality.archetype}</h3>
      <p className="text-lg text-snow/80">{data.personality.summary}</p>
      <div className="flex flex-wrap gap-3">
        {data.personality.badges.map((badge) => (
          <span key={badge} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.2em]">
            {badge}
          </span>
        ))}
      </div>
    </motion.div>
  </SlideShell>
);
