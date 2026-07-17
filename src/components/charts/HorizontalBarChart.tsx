"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

type HBarDatum = {
  name: string;
  value: number;
  significant?: boolean;
};

type Props = {
  data: HBarDatum[];
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  insignificantColor?: string;
  valueLabel?: string;
};

export default function HorizontalBarChart({
  data,
  height = 380,
  positiveColor = "#0F6B5C",
  negativeColor = "#B8493F",
  insignificantColor = "#C9C3B4",
  valueLabel = "Nilai",
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#DAD5C8" strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#3D473F" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#16211D" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <ReferenceLine x={0} stroke="#16211D" />
        <Tooltip
          formatter={(v: number) => [v.toFixed(3), valueLabel]}
          contentStyle={{
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            background: "#FBFAF6",
            border: "1px solid #DAD5C8",
            borderRadius: 6,
          }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.significant === false
                  ? insignificantColor
                  : d.value >= 0
                  ? positiveColor
                  : negativeColor
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
