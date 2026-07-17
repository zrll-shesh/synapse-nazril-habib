"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

type Props = {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; color: string; label: string }[];
  height?: number;
};

export default function ComparisonBarChart({ data, xKey, bars, height = 340 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="#DAD5C8" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#16211D" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#3D473F" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            background: "#FBFAF6",
            border: "1px solid #DAD5C8",
            borderRadius: 6,
          }}
        />
        <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
