"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SlideShellProps {
  title: string;
  subtitle?: string;
  /** Small skewed badge in the corner — used for the window label ("Spring 2025"). */
  badge?: string;
  children: ReactNode;
}

export const SlideShell = ({ title, subtitle, badge, children }: SlideShellProps) => (
  <motion.section
    className="pw-shard relative"
    style={{ background: "var(--pw-red)" }}
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -28 }}
    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
  >
    {/* inner stage panel — the 2px gap is the crimson edge */}
    <div
      className="pw-shard relative flex min-h-[26rem] flex-col overflow-hidden p-6 sm:min-h-[30rem] sm:p-9"
      style={{ margin: "2px", background: "linear-gradient(155deg,#161118,#0d0a0e)" }}
    >
      {/* textures */}
      <div className="pw-dots pointer-events-none absolute -right-6 -top-8 h-44 w-44 opacity-30 [mask-image:radial-gradient(circle_at_75%_25%,#000,transparent_70%)]" />
      <div className="pw-streaks pointer-events-none absolute inset-0 opacity-60" />

      {/* header */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle ? (
            <span className="pw-tab px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.28em]">
              <span>{subtitle}</span>
            </span>
          ) : null}
          <h2 className="pw-title mt-3 text-3xl text-[var(--pw-cream)] sm:text-5xl">{title}</h2>
        </div>
        {badge ? (
          <span className="pw-slab shrink-0 px-3 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.22em]">
            <span>{badge}</span>
          </span>
        ) : null}
      </div>
      <div className="pw-rule mt-4 w-20 sm:w-28" />

      <div className="relative mt-6 flex-1">{children}</div>
    </div>
  </motion.section>
);
