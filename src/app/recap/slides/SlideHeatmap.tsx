"use client";

import { Heatmap } from "@/components/charts/Heatmap";
import type { AnalyticsResult } from "@/lib/types";
import { SlideShell } from "./SlideShell";

interface Props {
  data: AnalyticsResult;
}

export const SlideHeatmap = ({ data }: Props) => (
  <SlideShell title="Monthly activity" subtitle="Slide 07">
    <p className="text-snow/70">
      We tracked every completion timestamp in 2025 and mapped it month by month. Brighter tiles mean you blitzed through more shows and chapters.
    </p>
    <Heatmap data={data.heatmap} />
  </SlideShell>
);
