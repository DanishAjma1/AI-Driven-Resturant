"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenuePoint } from "@/lib/data/analytics";

export function RevenueVolumeChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e85d3d" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#e85d3d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#3a3128" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="bucket"
          stroke="#7d7266"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="revenue"
          stroke="#7d7266"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          stroke="#7d7266"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#201a15",
            border: "1px solid #3a3128",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: "#f3ede2" }}
        />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue ($)"
          stroke="#e85d3d"
          fill="url(#revenueFill)"
          strokeWidth={2}
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="#d9b382"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
