"use client";

import { GenreDonut } from "@/components/charts/GenreDonut";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideGenres = ({ data }: Props) => (
  <SlideShell title="Genre Orbit" subtitle="Genres" badge={data.window.label}>
    <div className="grid flex-1 gap-6 lg:grid-cols-2">
      <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
        <GenreDonut data={data.genres.distribution.slice(0, 8)} />
      </div>
      <div className="space-y-3">
        {data.genres.top3.map((genre, i) => (
          <div key={genre.name} className="pw-panel flex items-center gap-3 bg-[var(--pw-cream-faint)] p-4">
            <span className="pw-num text-3xl text-[var(--pw-red)]">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[var(--pw-cream-dim)]">{genre.name}</p>
              <p className="pw-num text-2xl text-[var(--pw-cream)]">{genre.percent}%</p>
            </div>
          </div>
        ))}
        <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
          <p className="pw-tab px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.2em]">
            <span>Titles per genre</span>
          </p>
          <div className="mt-3 space-y-1.5 text-sm">
            {data.genres.frequency.slice(0, 5).map((genre) => (
              <div
                key={genre.name}
                className="flex items-center justify-between gap-3 border-l-2 border-[var(--pw-red)] bg-[var(--pw-cream-faint)] px-3 py-1.5"
              >
                <span className="font-semibold text-[var(--pw-cream)]">{genre.name}</span>
                <span className="text-[var(--pw-cream-dim)]">
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
