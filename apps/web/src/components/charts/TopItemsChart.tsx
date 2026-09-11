"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TopItemPoint } from "@/lib/data/analytics";

const CATEGORY_COLOR: Record<string, string> = {
  Starters: "#d9b382",
  Mains: "#e85d3d",
  Desserts: "#e8a13d",
  Drinks: "#5aa9e6",
};

export function TopItemsChart({ data }: { data: TopItemPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#3a3128" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" stroke="#7d7266" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#b6aa9b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={140}
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
        <Bar dataKey="unitsSold" name="Units sold" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={CATEGORY_COLOR[entry.category] ?? "#e85d3d"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
