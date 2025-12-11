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
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 12,
          borderColor: "#050314",
          borderWidth: 4,
        },
        label: {
          show: true,
          formatter: "{b}\n{d}%",
          fontSize: 14,
        },
        data: data.map((genre) => ({ name: genre.name, value: genre.value })),
      },
    ],
    color: ["#ff4fd8", "#4dfff1", "#7c6bff", "#ffaa31", "#48afff", "#ff85a1"],
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
};
