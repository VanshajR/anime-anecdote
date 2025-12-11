"use client";

import type { HeatmapCell } from "@/lib/types";

interface Props {
  data: HeatmapCell[];
}

export const Heatmap = ({ data }: Props) => {
  const max = Math.max(...data.map((cell) => cell.value), 1);
  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
      {data.map((cell) => {
        const intensity = Math.min(1, cell.value / max);
        const background = `rgba(255,79,216,${0.15 + intensity * 0.7})`;
        return (
          <div key={cell.month} className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-snow/60">{cell.month}</p>
            <p className="text-2xl font-semibold" style={{ color: background }}>
              {cell.value}
            </p>
            <p className="text-xs text-snow/60">completions</p>
          </div>
        );
      })}
    </div>
  );
};
