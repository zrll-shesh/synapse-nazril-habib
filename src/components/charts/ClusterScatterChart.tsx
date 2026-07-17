"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from "recharts";

type Point = {
  x: number;
  y: number;
  cluster: number;
  name: string;
  flagged?: boolean;
};

type Props = {
  data: Point[];
  clusterColors: string[];
  height?: number;
};

export default function ClusterScatterChart({ data, clusterColors, height = 460 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
        <CartesianGrid stroke="#DAD5C8" strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="UMAP 1"
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#3D473F" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="UMAP 2"
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#3D473F" }}
          axisLine={{ stroke: "#DAD5C8" }}
          tickLine={false}
        />
        <ZAxis range={[40, 40]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            background: "#FBFAF6",
            border: "1px solid #DAD5C8",
            borderRadius: 6,
          }}
          formatter={(_value: number, _name: string, props: any) => [props.payload.name, "RS"]}
        />
        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={clusterColors[d.cluster % clusterColors.length]}
              stroke={d.flagged ? "#B8493F" : "none"}
              strokeWidth={d.flagged ? 2 : 0}
              r={d.flagged ? 6 : 4}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
