import { useEffect, useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { expensesAPI } from "../../api/expenses.api";
import { fmt } from "../../utils/students.utils";

const COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#0891b2", "#84cc16", "#f97316",
  "#6366f1", "#14b8a6",
];

const METRICS = [
  { value: "profit",  label: "Profit",  color: "blue"    },
  { value: "revenue", label: "Revenue", color: "emerald" },
  { value: "expense", label: "Expense", color: "rose"    },
];

const METRIC_COLORS = {
  profit:  { active: "bg-blue-600 text-white border-blue-600",    inactive: "bg-white text-gray-600 border-gray-200" },
  revenue: { active: "bg-emerald-600 text-white border-emerald-600", inactive: "bg-white text-gray-600 border-gray-200" },
  expense: { active: "bg-rose-600 text-white border-rose-600",    inactive: "bg-white text-gray-600 border-gray-200" },
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-gray-500 mb-1">{name}</p>
      <p className="text-base font-black text-gray-900">{fmt(value)}</p>
      <p className="text-xs text-gray-400">{inner.percent}% share</p>
    </div>
  );
}

function renderCenterLabel({ cx, cy, total, label }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.7em" fontSize="9" fill="#9ca3af" fontWeight="700" letterSpacing="1">
        {label.toUpperCase()}
      </tspan>
      <tspan x={cx} dy="1.6em" fontSize="13" fill="#111827" fontWeight="800">
        {fmt(total)}
      </tspan>
    </text>
  );
}

export function ProfitabilityDonut({ globalFilters }) {
  const [metric, setMetric] = useState("profit");
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { dateFrom, dateTo } = globalFilters;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;

    expensesAPI.branchProfitability(params)
      .then((res) => setRawData(res ?? []))
      .catch(() => setRawData([]))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const { slices, total } = useMemo(() => {
    // For profit donut, only show positive-profit branches
    // (negative profit branches shown as 0 — not meaningful in a share chart)
    const rows = rawData
      .map((b) => ({ name: b.branch, value: Math.max(0, b[metric]) }))
      .filter((b) => b.value > 0);

    const total = rows.reduce((s, r) => s + r.value, 0);
    const slices = rows.map((r) => ({
      ...r,
      percent: total > 0 ? ((r.value / total) * 100).toFixed(1) : "0",
    }));
    return { slices, total };
  }, [rawData, metric]);

  const negativeCount = metric === "profit"
    ? rawData.filter((b) => b.profit < 0).length
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Distribution by Branch</h3>
            <p className="text-xs text-gray-400 mt-0.5">Share of total {metric}</p>
          </div>
          {/* Metric toggle */}
          <div className="flex gap-1">
            {METRICS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  metric === m.value
                    ? METRIC_COLORS[m.value].active
                    : METRIC_COLORS[m.value].inactive
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-5">
          <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      ) : !slices.length ? (
        <div className="h-72 flex flex-col items-center justify-center text-gray-400 gap-1">
          <p className="text-sm font-medium">No positive {metric} data</p>
          {metric === "profit" && negativeCount > 0 && (
            <p className="text-xs">{negativeCount} branch{negativeCount > 1 ? "es" : ""} operating at a loss</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row">
          {/* LEFT — legend */}
          <div className="md:w-44 shrink-0 flex flex-col justify-center px-5 py-5 border-b md:border-b-0 md:border-r border-gray-50 gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Breakdown</p>
            {slices.slice(0, 6).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-600 truncate">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-700 shrink-0">{s.percent}%</span>
              </div>
            ))}
            {slices.length > 6 && (
              <p className="text-[10px] text-gray-400 mt-1">+{slices.length - 6} more</p>
            )}
            {metric === "profit" && negativeCount > 0 && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-[10px] font-semibold text-rose-600">
                  {negativeCount} branch{negativeCount > 1 ? "es" : ""} at a loss
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — donut */}
          <div className="flex-1 p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {slices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                {/* Center label via invisible 0-radius Pie */}
                <Pie
                  data={[{ value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={0}
                  dataKey="value"
                  label={(props) => renderCenterLabel({ ...props, total, label: metric })}
                  labelLine={false}
                  fill="none"
                  stroke="none"
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}