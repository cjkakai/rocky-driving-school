import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { expensesAPI } from "../../api/expenses.api";
import { fmt } from "../../utils/students.utils";
import { SearchableSelect } from "../../ui/SearchableSelect";

const GRANULARITIES = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const METRICS = [
  { value: "revenue", label: "Revenue", color: "#16a34a", gradId: "trendRevGrad", gradFrom: "#16a34a" },
  { value: "expense", label: "Expense", color: "#e11d48", gradId: "trendExpGrad", gradFrom: "#e11d48" },
  { value: "profit",  label: "Profit",  color: "#7c3aed", gradId: "trendProfGrad", gradFrom: "#7c3aed" },
];

const GENERAL_VALUE = "__GENERAL__";

function CustomTooltip({ active, payload, label, metricColor }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const isNeg = value < 0;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: isNeg ? "#dc2626" : metricColor }}>
        {fmt(value)}
      </p>
    </div>
  );
}

export function ExpenseTimeSeries({ branches, globalFilters, branchId }) {
  const [selected, setSelected] = useState("");
  const [granularity, setGranularity] = useState("daily");
  const [metric, setMetric] = useState("revenue");
  const [seriesMap, setSeriesMap] = useState({ revenue: [], expense: [], profit: [] });
  const [loading, setLoading] = useState(false);

  const { dateFrom, dateTo } = globalFilters;
  const activeMetric = METRICS.find((m) => m.value === metric);

  const load = useCallback(() => {
    setLoading(true);
    const base = { granularity };
    if (dateFrom) base.date_from = dateFrom;
    if (dateTo)   base.date_to   = dateTo;

    // branch user — always scope to their branch
    if (branchId) {
      base.branch = branchId;
    } else if (selected === GENERAL_VALUE) {
      base.branch = GENERAL_VALUE;
    } else if (selected) {
      base.branch = selected;
    }

    Promise.all([
      expensesAPI.revenueTimeSeries({ ...base }).catch(() => ({ data: [] })),
    ]).then(([res]) => {
      const merged = res?.data ?? [];
      setSeriesMap({
        revenue: merged.map((d) => ({ period: d.period, value: d.revenue })),
        expense: merged.map((d) => ({ period: d.period, value: d.expense })),
        profit:  merged.map((d) => ({ period: d.period, value: d.profit })),
      });
    }).finally(() => setLoading(false));
  }, [selected, granularity, dateFrom, dateTo, branchId]);

  useEffect(() => { load(); }, [load]);

  const data = seriesMap[metric] ?? [];

  const { total, peak, trend, avgValue } = useMemo(() => {
    if (!data.length) return { total: 0, peak: 0, trend: null, avgValue: 0 };
    const total = data.reduce((s, d) => s + d.value, 0);
    const peak  = Math.max(...data.map((d) => Math.abs(d.value)));
    const trend = data.length >= 2
      ? ((data[data.length - 1].value - data[data.length - 2].value) / (Math.abs(data[data.length - 2].value) || 1)) * 100
      : null;
    const avgValue = total / data.length;
    return { total, peak, trend, avgValue };
  }, [data]);

  const scopeLabel = useMemo(() => {
    if (selected === GENERAL_VALUE) return "General";
    if (!selected) return "All branches";
    return branches.find((b) => String(b.id) === selected)?.name ?? "Branch";
  }, [selected, branches]);

  // For profit, trend up is good; for expense, trend up is bad
  const trendIsGood = metric === "expense" ? (trend !== null && trend < 0) : (trend !== null && trend >= 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Performance Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeMetric.label} · {scopeLabel} · {granularity} view
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    metric === m.value
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={metric === m.value ? { color: m.color } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Branch/scope dropdown — admin only */}
            {!branchId && (
              <div className="w-44">
                <SearchableSelect
                  value={selected}
                  onChange={setSelected}
                  options={[
                    { value: "__GENERAL__", label: "General Only" },
                    ...branches.map((b) => ({ value: String(b.id), label: b.name })),
                  ]}
                  placeholder="All Branches"
                  triggerClassName="py-2"
                />
              </div>
            )}

            {/* Granularity pills */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGranularity(g.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    granularity === g.value
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {data.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Total {activeMetric.label}
              </p>
              <p className="text-lg font-black text-gray-900">{fmt(total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Peak</p>
              <p className="text-lg font-black text-gray-900">{fmt(peak)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Avg / Period</p>
              <p className="text-lg font-black text-gray-900">{fmt(Math.round(avgValue))}</p>
            </div>
            {trend !== null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last vs Prev</p>
                <div className={`flex items-center gap-1 text-sm font-bold ${trendIsGood ? "text-emerald-600" : "text-rose-600"}`}>
                  {trendIsGood
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(trend).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 pb-5 pt-4">
        {loading ? (
          <div className="h-80 bg-gray-50 rounded-xl animate-pulse mx-3" />
        ) : !data.length ? (
          <div className="h-80 flex flex-col items-center justify-center text-gray-400 gap-2">
            <p className="text-sm font-medium">No trend data for selected filters</p>
            <p className="text-xs">Try adjusting the date range or scope</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  {METRICS.map((m) => (
                    <linearGradient key={m.gradId} id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={m.gradFrom} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={m.gradFrom} stopOpacity={0.08} />
                    </linearGradient>
                  ))}
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
                {avgValue !== 0 && (
                  <ReferenceLine
                    y={avgValue}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: "avg", position: "insideTopRight", fontSize: 9, fill: "#94a3b8" }}
                  />
                )}
                <Tooltip
                  content={<CustomTooltip metricColor={activeMetric.color} />}
                  cursor={{ stroke: activeMetric.color, strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeMetric.color}
                  strokeWidth={2.5}
                  fill={`url(#${activeMetric.gradId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: activeMetric.color, stroke: "#fff", strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}