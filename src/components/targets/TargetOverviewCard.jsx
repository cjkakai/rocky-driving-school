import { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { targetsAPI } from "../../api/targets.api";
import { fmt } from "../../utils/students.utils";

const ACHIEVED_COLOR  = "#10b981";
const REMAINING_COLOR = "#e5e7eb";
const TARGET_COLOR    = "#2563eb";

const STATUS_STYLE = {
  "Above Target": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "On Target":    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  "Below Target": { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200"    },
};

function useAnimatedWidth(target, delay = 80) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return width;
}

function AnimatedBar({ pct, color }) {
  const width = useAnimatedWidth(Math.min(pct, 100));
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow text-xs font-medium text-gray-700">
      {payload[0].name}: <span className="font-semibold text-gray-900">{payload[0].value}%</span>
    </div>
  );
}

export function TargetOverviewCard({ metric, branchId, period = {} }) {
  const [kpi, setKpi]       = useState(null);
  const [loading, setLoading] = useState(true);
  const isRevenue = metric === "revenue";

  useEffect(() => {
    setLoading(true);
    const p = { ...period, ...(branchId ? { branch: branchId } : {}) };
    const fn = isRevenue ? targetsAPI.revenueKpi : targetsAPI.registrationKpi;
    fn(p).then(setKpi).catch(() => setKpi(null)).finally(() => setLoading(false));
  }, [isRevenue, branchId, JSON.stringify(period)]);

  const target   = kpi?.total_target   ?? 0;
  const achieved = kpi?.total_achieved ?? 0;
  const pct      = kpi?.pct            ?? 0;
  const remaining = Math.max(0, target - achieved);
  const clamped  = Math.min(pct, 100);
  const fmtFn    = isRevenue ? fmt : (v) => `${v ?? 0}`;
  const periodLabel = kpi ? (isRevenue ? kpi.week_label : kpi.month_label) : "—";
  const statusStyle = STATUS_STYLE[kpi?.status] ?? STATUS_STYLE["Below Target"];

  const donutData = target > 0
    ? [
        { name: "Achieved",  value: clamped },
        { name: "Remaining", value: Math.max(0, 100 - clamped) },
      ]
    : [{ name: "None", value: 100 }];

  const rows = [
    { label: "Target",    value: target,    color: TARGET_COLOR,    barPct: 100 },
    { label: "Achieved",  value: achieved,  color: ACHIEVED_COLOR,  barPct: target > 0 ? Math.min((achieved / target) * 100, 100) : 0 },
    { label: "Remaining", value: remaining, color: "#f59e0b",       barPct: target > 0 ? Math.min((remaining / target) * 100, 100) : 0 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 rounded-full ${isRevenue ? "bg-blue-600" : "bg-violet-600"}`} />
          <p className="text-sm font-bold text-gray-800">
            {isRevenue ? "Revenue Overview" : "Registration Overview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {kpi?.status && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {kpi.status}
            </span>
          )}
          <span className="text-[11px] text-gray-400 font-medium">{periodLabel}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-6"><div className="h-40 bg-gray-50 rounded-xl animate-pulse" /></div>
      ) : !kpi || target === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No target set for this period
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr]">

          {/* Donut panel */}
          <div className="flex flex-col items-center justify-center p-5 lg:border-r border-gray-100 border-b lg:border-b-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3 self-start">Achievement</p>
            <div className="relative">
              <PieChart width={120} height={120}>
                <Pie
                  data={donutData}
                  dataKey="value"
                  cx={60} cy={60}
                  innerRadius={36}
                  outerRadius={54}
                  stroke="none"
                  paddingAngle={donutData.length > 1 ? 2 : 0}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill={ACHIEVED_COLOR} />
                  <Cell fill={REMAINING_COLOR} />
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xl font-black tabular-nums leading-none ${pct >= 100 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                  {pct}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5">done</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full mt-2">
              {[{ label: "Achieved", color: ACHIEVED_COLOR, pct: clamped }, { label: "Remaining", color: "#f59e0b", pct: Math.max(0, 100 - clamped) }].map(({ label, color, pct: p }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-gray-500">{label}</span>
                  </div>
                  <span className="font-bold tabular-nums" style={{ color }}>{p}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown rows */}
          <div className="divide-y divide-gray-50">
            {rows.map(({ label, value, color, barPct }) => (
              <div key={label} className="px-6 py-4 flex items-center gap-5">
                <div className="flex items-center gap-3 w-28 shrink-0">
                  <div className="w-1 self-stretch rounded-full min-h-[28px]" style={{ background: color }} />
                  <p className="text-sm font-semibold text-gray-600 leading-none">{label}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-black tabular-nums text-gray-900">{fmtFn(value)}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                      {barPct.toFixed(0)}%
                    </span>
                  </div>
                  <AnimatedBar pct={barPct} color={color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
