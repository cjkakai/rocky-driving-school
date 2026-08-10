import { useRef, useEffect, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { fmt } from "../../utils/students.utils";
import { TYPE_CONFIG, HERO_ACCENTS } from "./paymentUtils";

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
      accent: HERO_ACCENTS.revenue,
      icon: DollarSign,
    },
    {
      label: "Total payments",
      value: cTotal,
      sub: "All types",
      accent: HERO_ACCENTS.total,
      icon: CreditCard,
    },
    {
      label: "Completed",
      value: cComp,
      sub: `${totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0}% of total`,
      accent: HERO_ACCENTS.completed,
      icon: CheckCircle2,
    },
    ...(isSuperAdmin
      ? [{
          label: "Orphaned",
          value: cOrph,
          sub: "Needs allocation",
          accent: HERO_ACCENTS.orphaned,
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
        {heroCards.map(({ label, value, sub, accent, icon: Icon }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-xl p-4 flex items-start gap-3"
            style={{ background: accent.bg, boxShadow: accent.shadow }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, transparent 55%)",
              }}
            />
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: accent.iconBg }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="relative min-w-0">
              <p className="text-xs text-white/70 uppercase tracking-wide font-semibold mb-0.5">
                {label}
              </p>
              <p className="text-2xl font-bold text-white tabular-nums leading-none">
                {value}
              </p>
              <p className="text-xs text-white/60 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom: donut + breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-3">

        {/* Donut */}
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex flex-col items-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3 self-start">
            By type
          </p>
          <div className="relative">
            <PieChart width={120} height={120}>
              <Pie
                data={
                  donutData.length
                    ? donutData
                    : [{ name: "None", value: 1, color: "#e5e7eb" }]
                }
                dataKey="value"
                nameKey="name"
                cx={60} cy={60}
                innerRadius={36}
                outerRadius={54}
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
              <span className="text-lg font-bold text-gray-900 tabular-nums leading-none">
                {cTotal}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mt-0.5">
                Total
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full mt-3">
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
                  <span className="font-semibold text-gray-700 tabular-nums">{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Breakdown table ── */}
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Payment breakdown
            </p>
            {totalCount > 0 && (
              <span className="text-xs text-gray-400 tabular-nums">
                {totalCount} total
              </span>
            )}
          </div>

          {breakdownRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-300">No data</div>
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
                const hex   = cfg.color;

                // Very light tint of type colour for row background
                const rowBg = `${hex}08`;
                const rowBgHover = `${hex}14`;

                return (
                  <div
                    key={key}
                    className="group px-4 py-3 transition-colors duration-150 cursor-default"
                    style={{ background: rowBg }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = rowBgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                  >
                    <div className="flex items-center gap-4">

                      {/* Colour bar + label */}
                      <div className="flex items-center gap-2.5 w-36 shrink-0">
                        <div
                          className="w-1 rounded-full shrink-0 self-stretch min-h-[32px]"
                          style={{ background: hex }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-none">
                            {cfg.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                            {count ?? 0}{" "}
                          </p>
                        </div>
                      </div>

                      {/* Revenue + bar */}
                      <div className="flex-1 min-w-0">
                        {revenue != null ? (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-sm font-bold tabular-nums"
                                style={{ color: hex }}
                              >
                                {fmt(revenue)}
                              </span>
                              <span
                                className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `${hex}18`,
                                  color: hex,
                                }}
                              >
                                {share}%
                              </span>
                            </div>
                            <AnimatedBar pct={revShare} color={hex} />
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300 italic">
                              Pending allocation
                            </span>
                            <span
                              className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: `${hex}18`,
                                color: hex,
                              }}
                            >
                              {share}%
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}