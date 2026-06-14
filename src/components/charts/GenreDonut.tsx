"use client";

import dynamic from "next/dynamic";
import type { GenreStat } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  data: GenreStat[];
}

export const GenreDonut = ({ data }: Props) => {
  const option = {
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Genres",
        type: "pie",
        radius: ["42%", "72%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderColor: "#0d0a0e",
          borderWidth: 3,
        },
        label: {
          show: true,
          color: "#f6f1e6",
          formatter: "{b}\n{d}%",
          fontSize: 13,
          fontWeight: 600,
        },
        labelLine: { lineStyle: { color: "rgba(246,241,230,0.4)" } },
        data: data.map((genre) => ({ name: genre.name, value: genre.value })),
      },
    ],
    // crimson → cream Phantom family
    color: ["#e7251c", "#f6f1e6", "#a50f0a", "#d98a2b", "#8a4039", "#c9bfae", "#ef6a5e", "#5e1410"],
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
};
