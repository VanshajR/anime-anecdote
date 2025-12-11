"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, BarChart3, PlayCircle, BookOpenCheck } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Neon Story Mode",
    copy: "Swipe through bespoke slides animated with Framer Motion + GSAP energy.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    copy: "Watch time, genre balance, heatmaps, and a rating fingerprint for 2025.",
  },
  {
    icon: PlayCircle,
    title: "MAL OAuth",
    copy: "Secure PKCE sign-in pulls your official watch + read history instantly.",
  },
  {
    icon: BookOpenCheck,
    title: "Manga Toggle",
    copy: "Fold manga into the recap whenever you want even if anime stays primary.",
  },
];

export default function Home() {
  const [includeManga, setIncludeManga] = useState(false);

  const handleStart = () => {
    const url = new URL(window.location.origin + "/api/mal/auth");
    url.searchParams.set("includeManga", includeManga ? "1" : "0");
    window.location.href = url.toString();
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,79,216,0.25),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(77,255,241,0.18),transparent_50%),radial-gradient(circle_at_50%_90%,rgba(124,107,255,0.28),transparent_50%)]" />
      <section className="mx-auto flex max-w-6xl flex-col gap-14 lg:flex-row">
        <motion.div
          className="glass-panel grid-overlay relative flex-1 p-8 sm:p-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan">MAL Neon Recap</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your <span className="gradient-text">Anime Anecdote</span> for 2025 is ready to play.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-snow/80">
            We look at everything you watched on MyAnimeList from January 1st to December 7th, 2025 and remix it into a dramatic 10-scene recap with neon mecha energy.
          </p>
          <div className="mt-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-snow/60">Manga Insights</p>
              <p className="mt-1 text-lg font-semibold">{includeManga ? "Manga included" : "Anime-only recap"}</p>
              <p className="text-sm text-snow/70">Toggle before connecting. We default to anime so reading secrets stay hidden unless you say otherwise.</p>
            </div>
            <button
              onClick={() => setIncludeManga((prev) => !prev)}
              className={`relative flex h-12 w-32 items-center rounded-full border border-white/20 px-2 transition ${includeManga ? "bg-gradient-to-r from-neon-pink to-neon-cyan" : "bg-night-soft"}`}
            >
              <motion.span
                layout
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-night font-semibold"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {includeManga ? "On" : "Off"}
              </motion.span>
              <span className="flex-1 text-center text-sm font-medium">
                {includeManga ? "Manga" : "Anime"}
              </span>
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={handleStart}
              aria-label="Connect your MyAnimeList account and generate your recap"
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-neon-pink via-neon-violet to-neon-cyan px-8 py-3 text-lg font-semibold text-night shadow-[0_20px_60px_rgba(255,79,216,0.35)]"
            >
              Connect with MyAnimeList
              <motion.span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-night/20"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                →
              </motion.span>
              <span className="absolute inset-0 rounded-full border border-white/25 opacity-0 transition group-hover:opacity-100" />
            </button>
            <div className="text-sm text-snow/70">
              <p className="font-semibold uppercase tracking-[0.3em] text-snow/60">Secure MAL OAuth</p>
              <p>You will be redirected to MyAnimeList to sign in or create an account, then bounced back here automatically.</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="flex flex-1 flex-col gap-6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-panel relative overflow-hidden p-6"
              whileHover={{ y: -6 }}
            >
              <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(120deg, var(--neon-pink), var(--neon-cyan))`, filter: "blur(90px)" }} />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <feature.icon className="h-6 w-6 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-base font-semibold uppercase tracking-[0.24em] text-snow/60">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-snow/70">{feature.copy}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
      <p className="mx-auto mt-12 max-w-4xl text-center text-sm text-snow/60">
        We only analyze scrobbles completed in 2025 up to the first week of December (UTC). Nothing is stored server-side—your stats stream directly from MyAnimeList, processed on the fly, and vanish once you close the tab.
      </p>
    </main>
  );
}
