import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { targetsAPI } from "../../api/targets.api";

const LINE_COLOR = "#2563eb";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.value ?? 0;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[130px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${pct >= 100 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-rose-600"}`}>
        {pct}%
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Achievement</p>
    </div>
  );
}

function ColoredDot(props) {
  const { cx, cy, payload } = props;
  const color = payload.pct >= 100 ? "#10b981" : payload.pct >= 75 ? "#f59e0b" : "#f43f5e";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
}

function ChartInner({ data }) {
  const yDomain = [0, (max) => Math.max(120, Math.ceil(max / 10) * 10)];
  return (
    <>
      <defs>
        <linearGradient id="pctGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={LINE_COLOR} stopOpacity={0.55} />
          <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={6} />
      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} domain={yDomain} />
      <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} label={{ value: "100%", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }} />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: LINE_COLOR, strokeWidth: 1, strokeDasharray: "4 4" }} />
      <Area type="monotone" dataKey="pct" stroke={LINE_COLOR} strokeWidth={2.5} fill="url(#pctGrad)" dot={<ColoredDot />} activeDot={{ r: 6, fill: LINE_COLOR, stroke: "#fff", strokeWidth: 2.5 }} />
    </>
  );
}

export function TargetTrend({ metric, branchId }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const isRevenue = metric === "revenue";

  const load = useCallback(() => {
    setLoading(true);
    const p = branchId ? { branch: branchId } : {};
    const fn = isRevenue ? targetsAPI.revenueTrend : targetsAPI.registrationTrend;
    fn(p).then((res) => setData(res ?? [])).catch(() => setData([])).finally(() => setLoading(false));
  }, [isRevenue, branchId]);

  useEffect(() => { load(); }, [load]);

  const { avgPct, trend } = useMemo(() => {
    const withTarget = data.filter((d) => d.target > 0);
    if (!withTarget.length) return { avgPct: 0, trend: null };
    const avgPct = withTarget.reduce((s, d) => s + d.pct, 0) / withTarget.length;
    const trend = data.length >= 2 ? data[data.length - 1].pct - data[data.length - 2].pct : null;
    return { avgPct: Math.round(avgPct * 10) / 10, trend };
  }, [data]);

  const needsScroll = data.length > 8;
  const scrollWidth = data.length * (isRevenue ? 80 : 110);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/40 overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Achievement Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRevenue ? "Weekly" : "Monthly"} achievement % · historical view · not affected by period filter
            </p>
          </div>
          {data.length > 0 && (
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Avg Achievement</p>
                <p className={`text-lg font-black ${avgPct >= 100 ? "text-emerald-600" : avgPct >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                  {avgPct}%
                </p>
              </div>
              {trend !== null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last vs Prev</p>
                  <div className={`flex items-center gap-1 text-sm font-bold ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(trend).toFixed(1)}pp
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 pb-5">
        {loading ? (
          <div className="h-72 bg-gray-50 rounded-xl animate-pulse mx-4" />
        ) : !data.length ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
            <p className="text-sm font-medium">No trend data available</p>
            <p className="text-xs">Set targets to see trend data</p>
          </div>
        ) : needsScroll ? (
          <div className="overflow-x-auto overflow-y-hidden px-2">
            <AreaChart width={scrollWidth} height={288} data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <ChartInner data={data} />
            </AreaChart>
          </div>
        ) : (
          <div className="h-72 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <ChartInner data={data} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
