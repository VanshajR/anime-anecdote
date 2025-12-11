"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SlideShellProps {
  title: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
}

export const SlideShell = ({ title, subtitle, accent = "from-neon-pink to-neon-cyan", children }: SlideShellProps) => (
  <motion.section
    layout
    className="story-slide glass-panel relative isolate flex min-h-[70vh] flex-col gap-6 p-6 sm:p-10"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -40 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <div className="absolute inset-0 opacity-25" style={{ background: `linear-gradient(120deg, var(--neon-pink), var(--neon-cyan))`, filter: "blur(160px)" }} />
    <div className="relative">
      <p className={cn("text-xs uppercase tracking-[0.5em] text-snow/60", `bg-gradient-to-r ${accent} bg-clip-text text-transparent`)}>
        {subtitle ?? "Anime Anecdote"}
      </p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
    </div>
    <div className="relative flex-1">{children}</div>
  </motion.section>
);
