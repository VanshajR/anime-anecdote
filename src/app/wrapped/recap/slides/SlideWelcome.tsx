"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { describeWindow } from "@/lib/utils";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideWelcome = ({ data }: Props) => (
  <SlideShell title={`${data.user.name},`} subtitle="Arrival" badge={data.window.label}>
    <div className="grid gap-7 lg:grid-cols-[1.45fr_0.8fr]">
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="pw-slab inline-block px-3 py-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span>welcome back.</span>
        </div>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--pw-cream-dim)]">
          Everything ahead is carved from your official MyAnimeList history —{" "}
          <span className="font-semibold text-[var(--pw-cream)]">{describeWindow(data.window)}</span>. Fetched
          fresh, processed on the fly, and remixed into a{" "}
          <span className="font-semibold text-[var(--pw-red)]">
            {data.includeManga ? "anime + manga" : "anime"}
          </span>{" "}
          highlight reel.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Mode</p>
            <p className="pw-title mt-1 text-2xl text-[var(--pw-cream)]">
              {data.includeManga ? "Fusion" : "Anime"}
            </p>
          </div>
          <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">Window</p>
            <p className="pw-title mt-1 text-2xl text-[var(--pw-cream)]">{data.window.presetLabel}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pw-panel relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--pw-cream-faint)] p-6"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.22, type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="pw-burst pointer-events-none absolute inset-0 opacity-40" />
        {data.user.avatar ? (
          <Image
            src={data.user.avatar}
            alt={data.user.name}
            width={180}
            height={180}
            className="pw-panel relative h-32 w-32 object-cover"
            style={{ outline: "2px solid var(--pw-red)" }}
          />
        ) : (
          <div className="pw-panel relative flex h-32 w-32 items-center justify-center bg-[var(--pw-red)] text-5xl font-extrabold text-[var(--pw-cream)]">
            {data.user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="relative text-center text-[0.62rem] uppercase tracking-[0.3em] text-[var(--pw-cream-dim)]">
          → / scroll / swipe to continue
        </p>
      </motion.div>
    </div>
  </SlideShell>
);
