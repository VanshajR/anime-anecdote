"use client";

import { Heatmap } from "@/components/charts/Heatmap";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideHeatmap = ({ data }: Props) => (
  <SlideShell title="Activity Grid" subtitle="Cadence" badge={data.window.label}>
    <p className="mb-5 max-w-2xl text-sm text-[var(--pw-cream-dim)]">
      Every completion across <span className="font-semibold text-[var(--pw-cream)]">{data.window.label}</span>,
      mapped period by period. Hotter tiles mean you blitzed through more.
    </p>
    <Heatmap data={data.heatmap} />
  </SlideShell>
);
