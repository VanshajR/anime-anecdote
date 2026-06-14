"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { AnalyticsResult, TitleLocale } from "@/lib/types";
import { resolveTitle } from "@/lib/localizeTitle";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
  titleLocale: TitleLocale;
}

export const SlideTopRated = ({ data, titleLocale }: Props) => (
  <SlideShell title="Top Rated" subtitle="Favourites" badge={data.window.label}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.topShows.map((show, index) => (
        <motion.div
          key={show.id}
          className="pw-panel relative overflow-hidden bg-[var(--pw-cream-faint)] p-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -6 }}
        >
          <div className="flex gap-3">
            {show.cover ? (
              <Image
                src={show.cover}
                alt={resolveTitle(show, titleLocale)}
                width={120}
                height={160}
                className="h-28 w-20 shrink-0 object-cover"
                style={{ outline: "2px solid var(--pw-red)" }}
              />
            ) : (
              <div className="h-28 w-20 shrink-0 border-2 border-dashed border-[var(--pw-cream-faint)]" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="pw-num text-2xl text-[var(--pw-red)]">#{index + 1}</span>
                <span className="pw-slab px-1.5 py-0.5 text-[0.6rem] font-extrabold">
                  <span>{show.score}/10</span>
                </span>
              </div>
              <h3 className="mt-1 line-clamp-3 text-base font-bold leading-tight text-[var(--pw-cream)]">
                {resolveTitle(show, titleLocale)}
              </h3>
              <p className="mt-1 text-xs text-[var(--pw-cream-dim)]">MAL {show.malScore.toFixed(1)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {data.hiddenGem ? (
      <div className="pw-panel mt-5 border-l-4 border-[var(--pw-red)] bg-[var(--pw-cream-faint)] p-5">
        <p className="pw-tab px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
          <span>Hidden gem</span>
        </p>
        <h4 className="pw-title mt-2 text-2xl text-[var(--pw-cream)]">
          {resolveTitle(data.hiddenGem, titleLocale)}
        </h4>
        <p className="mt-1 text-sm text-[var(--pw-cream-dim)]">
          You gave it {data.hiddenGem.userScore.toFixed(1)} while MAL sits at {data.hiddenGem.malScore.toFixed(1)} (Δ{" "}
          {data.hiddenGem.delta}). Pure contrarian energy.
        </p>
      </div>
    ) : null}

    {data.includeManga && data.mangaHighlights.length ? (
      <div className="pw-panel mt-4 bg-[var(--pw-cream-faint)] p-5">
        <p className="pw-slab inline-block px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
          <span>Manga cameos</span>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {data.mangaHighlights.map((manga) => (
            <div key={manga.id} className="border-l-2 border-[var(--pw-red)] bg-[var(--pw-cream-faint)] p-3">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">{manga.detail}</p>
              <h4 className="text-sm font-bold text-[var(--pw-cream)]">{resolveTitle(manga, titleLocale)}</h4>
              <p className="text-xs text-[var(--pw-cream-dim)]">Score {manga.score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </SlideShell>
);
