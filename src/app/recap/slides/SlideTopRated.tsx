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
  <SlideShell title="Top rated anime" subtitle="Slide 04">
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.topShows.map((show, index) => (
        <motion.div
          key={show.id}
          className="rounded-3xl border border-white/10 bg-white/5 p-4"
          whileHover={{ rotateY: 5, translateY: -8 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-snow/60">
            <span>Rank {index + 1}</span>
            <span>{show.score}/10</span>
          </div>
          <div className="mt-4 flex gap-4">
            {show.cover ? (
              <Image
                src={show.cover}
                alt={resolveTitle(show, titleLocale)}
                width={120}
                height={160}
                className="h-32 w-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="h-32 w-24 rounded-2xl border border-dashed border-white/20" />
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan">{show.detail}</p>
              <h3 className="text-xl font-semibold">{resolveTitle(show, titleLocale)}</h3>
              <p className="text-sm text-snow/70">MAL mean {show.malScore.toFixed(1)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    {data.hiddenGem ? (
      <div className="mt-6 rounded-3xl border border-dashed border-neon-cyan/40 bg-night-soft/40 p-6">
        <p className="text-sm uppercase tracking-[0.4em] text-neon-cyan">Hidden gem</p>
        <h4 className="text-2xl font-semibold">{resolveTitle(data.hiddenGem, titleLocale)}</h4>
        <p className="text-snow/70">
          You scored it {data.hiddenGem.userScore.toFixed(1)} while MAL sits at {data.hiddenGem.malScore.toFixed(1)} (Δ {data.hiddenGem.delta}). Pure contrarian energy.
        </p>
      </div>
    ) : null}
    {data.includeManga && data.mangaHighlights.length ? (
      <div className="mt-8 rounded-3xl border border-white/10 bg-night-soft/40 p-6">
        <p className="text-sm uppercase tracking-[0.4em] text-snow/70">Manga cameos</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {data.mangaHighlights.map((manga) => (
            <div key={manga.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-neon-pink">{manga.detail}</p>
              <h4 className="text-lg font-semibold">{resolveTitle(manga, titleLocale)}</h4>
              <p className="text-sm text-snow/70">Score {manga.score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </SlideShell>
);
