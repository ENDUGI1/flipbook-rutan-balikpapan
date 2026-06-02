"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = { tanggal: string; jumlah: number };

/** Grafik tren akses harian (jumlah panduan dibuka per hari). */
export default function DailyTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-navy-700/60">
        Belum ada data akses.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4A21E" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#F4A21E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4dcea" vertical={false} />
          <XAxis
            dataKey="tanggal"
            tick={{ fontSize: 11, fill: "#1F3864" }}
            tickLine={false}
            axisLine={{ stroke: "#d4dcea" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#1F3864" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #d4dcea",
              fontSize: 12,
            }}
            labelStyle={{ color: "#1F3864", fontWeight: 600 }}
            formatter={(v: number) => [`${v} kali`, "Akses"]}
          />
          <Area
            type="monotone"
            dataKey="jumlah"
            stroke="#1F3864"
            strokeWidth={2}
            fill="url(#gradGold)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
