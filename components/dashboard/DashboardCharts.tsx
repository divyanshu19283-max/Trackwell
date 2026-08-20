"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function DashboardCharts({ statusData }: { statusData: { name: string; value: number }[] }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink-900">Tickets by status</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef2" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#636d84" }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#636d84" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d4d8e0" }} />
            <Bar dataKey="value" fill="#5570f4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
