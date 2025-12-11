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
  <SlideShell title={`${data.user.name}, welcome back`} subtitle="Slide 01">
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="text-4xl font-semibold">Your Anime Anecdote 2025</h3>
        <p className="text-lg text-snow/80">
          Every stat you are about to see is carved from your official MyAnimeList history between {describeWindow()}. We wired MAL OAuth with PKCE, fetched fresh data, and spun it into a neon slideshow tuned for {data.includeManga ? "anime + manga" : "anime"} vibes.
        </p>
        <div className="wrap-grid">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-snow/60">Playback mode</p>
            <p className="text-2xl font-semibold">{data.includeManga ? "Fusion" : "Anime"} story</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-snow/60">Scope</p>
            <p className="text-2xl font-semibold">2025 · up to Dec 7</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="relative flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0 p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {data.user.avatar ? (
          <Image
            src={data.user.avatar}
            alt={data.user.name}
            width={180}
            height={180}
            className="h-36 w-36 rounded-3xl border border-white/20 object-cover"
          />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-dashed border-white/20 text-5xl">
            {data.user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="text-sm uppercase tracking-[0.3em] text-snow/70">Press → or scroll to continue</p>
      </motion.div>
    </div>
  </SlideShell>
);
