"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlidePersonality = ({ data }: Props) => (
  <SlideShell title="Persona" subtitle="Archetype" badge={data.window.label}>
    <motion.div
      className="pw-panel relative flex h-full flex-col justify-center gap-5 overflow-hidden bg-[var(--pw-cream-faint)] p-7 sm:p-9"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="pw-burst pointer-events-none absolute inset-0 opacity-30" />
      <div className="pw-dots pointer-events-none absolute -right-6 -bottom-8 h-44 w-44 opacity-20 [mask-image:radial-gradient(circle_at_70%_70%,#000,transparent_70%)]" />

      <p className="relative pw-tab inline-block w-fit px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.24em]">
        <span>Your archetype</span>
      </p>
      <h3 className="pw-title relative text-5xl text-[var(--pw-cream)] sm:text-7xl">
        {data.personality.archetype}
      </h3>
      <p className="relative max-w-xl text-lg leading-relaxed text-[var(--pw-cream-dim)]">
        {data.personality.summary}
      </p>
      <div className="relative flex flex-wrap gap-2">
        {data.personality.badges.map((badge) => (
          <span
            key={badge}
            className="pw-slab px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.14em]"
          >
            <span>{badge}</span>
          </span>
        ))}
      </div>
    </motion.div>
  </SlideShell>
);
