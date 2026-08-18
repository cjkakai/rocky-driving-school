import { useRef, useEffect, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { fmt } from "../../utils/students.utils";
import { TYPE_CONFIG } from "./paymentUtils";

const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)";

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    const raf = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(start + diff * easeOutQuart(progress)));
      if (progress < 1) requestAnimationFrame(raf);
      else prev.current = target;
    };
    requestAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ pct, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

// ─── Donut tooltip ─────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow text-xs font-medium text-gray-700">
      {payload[0].name}:{" "}
      <span className="text-gray-900 font-semibold">{payload[0].value}</span>
    </div>
  );
}

// ─── Stat tile — matches StatsCard.jsx / StudentSummary.jsx look ──────────────

function StatTile({ icon: Icon, label, value, subtext, accent }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ background: `${accent}14`, color: accent }}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">{value}</p>
        {subtext && <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{subtext}</p>}
      </div>
    </div>
  );
}

// ─── Summary ───────────────────────────────────────────────────────────────────

export function PaymentsSummary({ summary, isSuperAdmin }) {
  const byType       = summary?.by_type      ?? {};
  const totalCount   = summary?.total_count  ?? 0;
  const totalRevenue = summary?.total_revenue ?? 0;

  const reg     = byType["REGISTRATION"]     ?? {};
  const topUp   = byType["TOP_UP"]           ?? {};
  const ret     = byType["RETAKE"]           ?? {};
  const pdl     = byType["PDL_REACTIVATION"] ?? {};
  const unalloc = byType["UNALLOCATED"]      ?? {};

  const completed = Object.values(byType).reduce((a, t) => a + (t.completed ?? 0), 0);
  const orphaned  = Object.values(byType).reduce((a, t) => a + (t.orphaned  ?? 0), 0);

  const cTotal = useCountUp(totalCount);
  const cComp  = useCountUp(completed);
  const cOrph  = useCountUp(orphaned);

  const donutData = Object.entries(TYPE_CONFIG)
    .map(([key, cfg]) => ({
      name:  cfg.label,
      value: byType[key]?.count ?? 0,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0);

  const breakdownRows = [
    { key: "REGISTRATION",     count: reg.count,     revenue: reg.revenue     },
    { key: "TOP_UP",           count: topUp.count,   revenue: topUp.revenue   },
    { key: "RETAKE",           count: ret.count,     revenue: ret.revenue     },
    { key: "PDL_REACTIVATION", count: pdl.count,     revenue: pdl.revenue     },
    { key: "UNALLOCATED",      count: unalloc.count, revenue: unalloc.revenue ?? null },
  ].filter((r) => (r.count ?? 0) > 0);

  const heroCards = [
    {
      label: "Total collected",
      value: fmt(totalRevenue),
      sub: "This period",
      accent: "#1a0a0b",
      icon: DollarSign,
    },
    {
      label: "Total payments",
      value: cTotal,
      sub: "All types",
      accent: "#475569",
      icon: CreditCard,
    },
    {
      label: "Completed",
      value: cComp,
      sub: `${totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0}% of total`,
      accent: "#059669",
      icon: CheckCircle2,
    },
    ...(isSuperAdmin
      ? [{
          label: "Orphaned",
          value: cOrph,
          sub: "Needs allocation",
          accent: "#c41820",
          icon: AlertCircle,
        }]
      : []),
  ];

  // Largest revenue among rows with revenue — for bar scaling
  const maxRevenue = Math.max(
    ...breakdownRows.map((r) => (r.revenue != null ? r.revenue : 0)),
    1,
  );

  return (
    <div className="space-y-3">

      {/* ── Hero row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroCards.map(({ label, value, sub, accent, icon }) => (
          <StatTile key={label} label={label} value={value} subtext={sub} accent={accent} icon={icon} />
        ))}
      </div>

      {/* ── Bottom: donut + breakdown, one unified card ── */}
      <div
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Card header */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ background: "#1a0a0b" }} />
            <p className="text-sm font-bold text-gray-800">Payment breakdown</p>
          </div>
          {totalCount > 0 && (
            <span className="text-[11px] text-gray-400 tabular-nums font-medium">
              {totalCount} total
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">

          {/* Donut panel */}
          <div className="flex flex-col items-center p-6 lg:border-r border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3 self-start">
              By type
            </p>
            <div className="relative">
              <PieChart width={130} height={130}>
                <Pie
                  data={
                    donutData.length
                      ? donutData
                      : [{ name: "None", value: 1, color: "#e5e7eb" }]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx={65} cy={65}
                  innerRadius={40}
                  outerRadius={58}
                  stroke="none"
                  paddingAngle={donutData.length > 1 ? 2 : 0}
                >
                  {(donutData.length ? donutData : [{ color: "#e5e7eb" }]).map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-gray-900 tabular-nums leading-none">
                  {cTotal}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5">
                  Total
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full mt-3">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const val = byType[key]?.count ?? 0;
                if (!val) return null;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: cfg.color }}
                      />
                      <span className="text-gray-500">{cfg.label}</span>
                    </div>
                    <span className="font-bold tabular-nums" style={{ color: cfg.color }}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown rows */}
          <div className="flex flex-col">
            {breakdownRows.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-300">
                No data
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {breakdownRows.map(({ key, count, revenue }) => {
                  const cfg   = TYPE_CONFIG[key];
                  const share = totalCount > 0
                    ? Math.round(((count ?? 0) / totalCount) * 100)
                    : 0;
                  const revShare = revenue != null && maxRevenue > 0
                    ? Math.round((revenue / maxRevenue) * 100)
                    : 0;
                  const hex = cfg.color;

                  return (
                    <div key={key} className="px-6 py-4 flex items-center gap-5">
                      <div className="flex items-center gap-3 w-36 shrink-0">
                        <div className="w-1 self-stretch rounded-full min-h-[32px]" style={{ background: hex }} />
                        <div>
                          <p className="text-sm font-semibold text-gray-600 leading-none">{cfg.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{count ?? 0}</p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {revenue != null ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-black tabular-nums text-gray-900">
                                {fmt(revenue)}
                              </span>
                              <span
                                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${hex}18`, color: hex }}
                              >
                                {share}%
                              </span>
                            </div>
                            <AnimatedBar pct={revShare} color={hex} />
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300 italic">Pending allocation</span>
                            <span
                              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${hex}18`, color: hex }}
                            >
                              {share}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}