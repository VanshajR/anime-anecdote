"use client";

import { motion } from "framer-motion";
import type { AnalyticsResult, ContrarianPick } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

const MiniBars = ({
  items,
  max,
}: {
  items: { label: string; value: number }[];
  max: number;
}) => (
  <div className="space-y-1.5">
    {items.map((item, i) => (
      <div key={item.label} className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--pw-cream-dim)]">
          {item.label}
        </span>
        <div className="h-3 flex-1 bg-[var(--pw-cream-faint)]">
          <motion.div
            className="h-3"
            style={{ background: "var(--pw-red)" }}
            initial={{ width: 0 }}
            animate={{ width: `${(item.value / max) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
          />
        </div>
        <span className="pw-num w-7 shrink-0 text-right text-sm text-[var(--pw-cream)]">{item.value}</span>
      </div>
    ))}
  </div>
);

const Contrarian = ({ pick, kind }: { pick: ContrarianPick; kind: "over" | "under" }) => (
  <div className="border-l-2 border-[var(--pw-red)] bg-[var(--pw-cream-faint)] p-3">
    <p className="text-[0.56rem] font-bold uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">
      {kind === "under" ? "You loved · crowd didn't" : "Crowd loved · you didn't"}
    </p>
    <p className="line-clamp-1 text-sm font-bold text-[var(--pw-cream)]">{pick.titleEn ?? pick.title}</p>
    <p className="text-xs text-[var(--pw-cream-dim)]">
      You {pick.userScore.toFixed(0)} · MAL {pick.malScore.toFixed(1)} ({pick.delta > 0 ? "+" : ""}
      {pick.delta})
    </p>
  </div>
);

export const SlideBreakdown = ({ data }: Props) => {
  const formatMax = Math.max(...data.formats.map((f) => f.count), 1);
  const eraMax = Math.max(...data.eras.map((e) => e.count), 1);
  const health = data.listHealth;

  return (
    <SlideShell title="The Breakdown" subtitle="Breakdown" badge={data.window.label}>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* formats */}
        <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
          <p className="pw-tab inline-block px-2.5 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.2em]">
            <span>By format</span>
          </p>
          <div className="mt-3">
            <MiniBars items={data.formats.slice(0, 5).map((f) => ({ label: f.format, value: f.count }))} max={formatMax} />
          </div>
        </div>

        {/* eras */}
        <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
          <p className="pw-tab inline-block px-2.5 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.2em]">
            <span>By era</span>
          </p>
          <div className="mt-3">
            {data.eras.length ? (
              <MiniBars items={data.eras.map((e) => ({ label: e.label, value: e.count }))} max={eraMax} />
            ) : (
              <p className="text-xs text-[var(--pw-cream-dim)]">No release-year data.</p>
            )}
          </div>
        </div>

        {/* list health */}
        <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
          <p className="pw-slab inline-block px-2.5 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.2em]">
            <span>List health</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="pw-num text-3xl text-[var(--pw-cream)]">{Math.round(health.completionRate * 100)}%</p>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[var(--pw-cream-dim)]">Completion</p>
            </div>
            <div>
              <p className="pw-num text-3xl" style={{ color: "var(--pw-red)" }}>
                {Math.round(health.dropRate * 100)}%
              </p>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[var(--pw-cream-dim)]">Drop rate</p>
            </div>
            <div>
              <p className="pw-num text-3xl text-[var(--pw-cream)]">{health.planToWatch}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[var(--pw-cream-dim)]">Plan backlog</p>
            </div>
            <div>
              <p className="pw-num text-3xl text-[var(--pw-cream)]">{health.watching}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[var(--pw-cream-dim)]">Watching</p>
            </div>
          </div>
        </div>

        {/* studio + longest + contrarian */}
        <div className="space-y-3">
          {data.studios.length ? (
            <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
              <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">Top studio</p>
              <p className="pw-title text-2xl text-[var(--pw-cream)]">{data.studios[0].name}</p>
              <p className="text-xs text-[var(--pw-cream-dim)]">{data.studios[0].count} titles</p>
            </div>
          ) : null}
          {data.longest ? (
            <div className="pw-panel bg-[var(--pw-cream-faint)] p-4">
              <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[var(--pw-cream-dim)]">Biggest watch</p>
              <p className="line-clamp-1 text-sm font-bold text-[var(--pw-cream)]">
                {data.longest.titleEn ?? data.longest.title}
              </p>
              <p className="text-xs text-[var(--pw-cream-dim)]">{data.longest.detail}</p>
            </div>
          ) : null}
          {data.underrated ? <Contrarian pick={data.underrated} kind="under" /> : null}
          {data.overrated ? <Contrarian pick={data.overrated} kind="over" /> : null}
        </div>
      </div>
    </SlideShell>
  );
};
