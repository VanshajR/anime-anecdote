"use client";

import type { HeatmapCell } from "@/lib/types";

interface Props {
  data: HeatmapCell[];
}

export const Heatmap = ({ data }: Props) => {
  const max = Math.max(...data.map((cell) => cell.value), 1);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {data.map((cell) => {
        const intensity = Math.min(1, cell.value / max);
        return (
          <div
            key={cell.month}
            className="relative p-3"
            style={{
              background: `rgba(231,37,28,${0.1 + intensity * 0.8})`,
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)",
            }}
          >
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[var(--pw-cream-dim)]">
              {cell.month}
            </p>
            <p className="pw-num mt-0.5 text-2xl text-[var(--pw-cream)]">{cell.value}</p>
          </div>
        );
      })}
    </div>
  );
};
