"use client";

import { GenreDonut } from "@/components/charts/GenreDonut";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideGenres = ({ data }: Props) => (
  <SlideShell title="Genres Breakdown" subtitle="Slide 03">
    <div className="grid flex-1 gap-8 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-night/40 p-4">
        <GenreDonut data={data.genres.distribution.slice(0, 8)} />
      </div>
      <div className="space-y-4">
        {data.genres.top3.map((genre) => (
          <div key={genre.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-snow/70">{genre.name}</p>
            <p className="text-3xl font-semibold">{genre.percent}% share</p>
          </div>
        ))}
        <div className="rounded-3xl border border-white/10 bg-night-soft/40 p-4">
          <p className="text-sm uppercase tracking-[0.3em] text-snow/70">Titles per genre</p>
          <div className="mt-4 space-y-3 text-sm">
            {data.genres.frequency.slice(0, 5).map((genre) => (
              <div key={genre.name} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="font-semibold text-snow/90">{genre.name}</span>
                <span className="text-snow/70">
                  {genre.animeCount} anime{data.includeManga || genre.mangaCount ? ` · ${genre.mangaCount} manga` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
);
