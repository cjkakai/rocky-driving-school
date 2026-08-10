import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { dashboardAPI } from "../../api/dashboard.api";
import { fmt } from "../../utils/students.utils";

const COLOR = "#2563eb";
const GRAD_ID = "revBlueGrad";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: COLOR }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getCurrentMonthDailyRevenue()
      .then((res) => {
        const rows = res?.data ?? [];
        setData(rows.map((d) => ({ period: d.period, value: d.revenue })));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const total   = data.reduce((s, d) => s + d.value, 0);
  const peak    = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  const avg     = data.length ? total / data.length : 0;
  const trend   = data.length >= 2
    ? ((data[data.length - 1].value - data[data.length - 2].value) / (Math.abs(data[data.length - 2].value) || 1)) * 100
    : null;

  const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/40 overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Revenue Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Daily revenue · {monthLabel}</p>
        </div>

        {data.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
              <p className="text-lg font-black text-gray-900">{fmt(total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Peak</p>
              <p className="text-lg font-black text-gray-900">{fmt(peak)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Avg / Day</p>
              <p className="text-lg font-black text-gray-900">{fmt(Math.round(avg))}</p>
            </div>
            {trend !== null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last vs Prev</p>
                <div className={`flex items-center gap-1 text-sm font-bold ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(trend).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-2 pb-5 pt-4">
        {loading ? (
          <div className="h-80 bg-gray-50 rounded-xl animate-pulse mx-3" />
        ) : !data.length ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-sm">No revenue data for this month</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={COLOR} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={COLOR} stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  width={46}
                />
                {avg > 0 && (
                  <ReferenceLine
                    y={avg}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: "avg", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }}
                  />
                )}
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: COLOR, strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLOR}
                  strokeWidth={2.5}
                  fill={`url(#${GRAD_ID})`}
                  dot={false}
                  activeDot={{ r: 5, fill: COLOR, stroke: "#fff", strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
