import { useEffect, useRef, useState } from "react";
import { Users, BookOpen, ClipboardList, AlertTriangle, CreditCard, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { PIPELINE_STAGES, fmt } from "../utils/students.utils";

/* ─── Count-up animation ─────────────────────────────────────────── */
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const raf = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(start + diff * ease));
      if (t < 1) requestAnimationFrame(raf);
      else prev.current = target;
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ─── Stat card ──────────────────────────────────────────────────── */
function StatCard({ label, icon: Icon, accent, value }) {
  const display = useCountUp(value);
  return (
    <div
      className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)" }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums leading-none">{display}</p>
        </div>
        <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${accent}15` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Animated pipeline segment ─────────────────────────────────── */
function PipelineSegment({ stage, pct, count, isFirst, isLast }) {
  const [hovered, setHovered] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (count === 0) return null;

  const radius = isFirst ? "rounded-l-full" : isLast ? "rounded-r-full" : "";

  return (
    <div
      className={`relative group h-full flex items-center justify-center cursor-default ${radius}`}
      style={{
        width: animated ? `${pct}%` : "0%",
        minWidth: "28px",
        background: stage.color,
        transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        opacity: hovered ? 1 : 0.9,
        transform: hovered ? "scaleY(1.08)" : "scaleY(1)",
        transformOrigin: "center",
        boxShadow: hovered ? `0 0 0 2px white, 0 0 0 3px ${stage.color}` : "none",
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {pct > 6 && (
        <span className="text-[11px] font-black text-white/90 tabular-nums select-none pointer-events-none">
          {count}
        </span>
      )}
      <div
        className="absolute bottom-full mb-2 left-1/2 pointer-events-none z-20
          bg-gray-900 text-white text-[11px] font-semibold rounded-xl px-2.5 py-1.5 whitespace-nowrap shadow-xl"
        style={{
          opacity: hovered ? 1 : 0,
          transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)`,
          transition: "opacity 0.15s, transform 0.15s",
        }}
      >
        <span style={{ color: stage.color }}>●</span> {stage.label}
        <span className="ml-1.5 text-white/60">{count} ({Math.round(pct)}%)</span>
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #111827" }}
        />
      </div>
    </div>
  );
}

/* ─── Pipeline bar + legend ──────────────────────────────────────── */
function CoursePipeline({ courseCounts, totalCourses }) {
  const activeStages = PIPELINE_STAGES.filter((s) => (courseCounts[s.key] ?? 0) > 0);

  if (totalCourses === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-gray-400 text-sm">
        No courses enrolled yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Course Pipeline
        </p>
        <p className="text-xs font-semibold text-gray-400 tabular-nums">{totalCourses} total courses</p>
      </div>

      <div
        className="w-full h-9 flex rounded-full overflow-hidden gap-px"
        style={{ background: "#f1f5f9", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.07)" }}
      >
        {activeStages.map((stage, i) => {
          const count = courseCounts[stage.key] ?? 0;
          return (
            <PipelineSegment
              key={stage.key}
              stage={stage}
              pct={(count / totalCourses) * 100}
              count={count}
              isFirst={i === 0}
              isLast={i === activeStages.length - 1}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2">
        {PIPELINE_STAGES.map((stage) => {
          const count = courseCounts[stage.key] ?? 0;
          if (count === 0) return null;
          const pct = Math.round((count / totalCourses) * 100);
          return (
            <div key={stage.key} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[11px] text-gray-500 font-medium truncate">{stage.label}</span>
                  <span className="text-[11px] font-black text-gray-800 tabular-nums shrink-0">{count}</span>
                </div>
                <div className="mt-0.5 w-full bg-gray-100 rounded-full h-0.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: stage.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Financial summary — white card, clean fintech feel ─────────── */

const FIN_CONFIG = [
  { key: "agreed",  label: "Total Agreed",  color: "#1a0a0b" },
  { key: "paid",    label: "Total Paid",    color: "#059669" },
  { key: "balance", label: "Outstanding",   color: "#f59e0b" },
];

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow text-xs font-medium text-gray-700">
      {payload[0].name}: <span className="text-gray-900 font-semibold">{fmt(payload[0].value)}</span>
    </div>
  );
}

function AnimatedBar({ pct, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{ width: `${width}%`, background: color }}
    />
  );
}

function FinancialSummary({ summary }) {
  const agreed  = summary?.total_agreed  ?? 0;
  const paid    = summary?.total_paid    ?? 0;
  const balance = Math.max(summary?.total_balance ?? 0, 0);

  const paidPct    = agreed > 0 ? Math.round((paid    / agreed) * 100) : 0;
  const balancePct = agreed > 0 ? Math.round((balance / agreed) * 100) : 0;

  const donutData = agreed > 0
    ? [
        { name: "Paid",        value: paid,    color: "#059669" },
        { name: "Outstanding", value: balance, color: "#f59e0b" },
      ]
    : [{ name: "None", value: 1, color: "#e2e8f0" }];

  const rows = [
    { key: "agreed",  label: "Total Agreed", value: agreed,  color: "#1a0a0b", pct: 100,        barPct: 100 },
    { key: "paid",    label: "Total Paid",   value: paid,    color: "#059669", pct: paidPct,    barPct: paidPct },
    { key: "balance", label: "Outstanding",  value: balance, color: "#f59e0b", pct: balancePct, barPct: balancePct },
  ];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Card header */}
      <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* brand-red accent line */}
          <div className="w-1 h-5 rounded-full" style={{ background: "#1a0a0b" }} />
          <p className="text-sm font-bold text-gray-800">Financial Overview</p>
        </div>
        {agreed > 0 && (
          <span className="text-[11px] text-gray-400 tabular-nums font-medium">
            {summary?.student_count ?? 0} students
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">

        {/* ── Donut panel ── */}
        <div className="flex flex-col items-center justify-center p-6 lg:border-r border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3 self-start">
            Payment split
          </p>
          <div className="relative">
            <PieChart width={130} height={130}>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx={65} cy={65}
                innerRadius={40}
                outerRadius={58}
                stroke="none"
                paddingAngle={donutData.length > 1 ? 2 : 0}
              >
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-gray-900 tabular-nums leading-none">{paidPct}%</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5">Paid</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full mt-3">
            {FIN_CONFIG.filter((c) => c.key !== "agreed").map(({ key, label, color }) => {
              const pct = key === "paid" ? paidPct : balancePct;
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-gray-500">{label}</span>
                  </div>
                  <span className="font-bold tabular-nums" style={{ color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Breakdown rows ── */}
        <div className="flex flex-col">
          {agreed === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-300">
              No financial data
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rows.map(({ key, label, value, color, pct, barPct }) => (
                <div key={key} className="px-6 py-4 flex items-center gap-5">
                  <div className="flex items-center gap-3 w-36 shrink-0">
                    <div className="w-1 self-stretch rounded-full min-h-[32px]" style={{ background: color }} />
                    <p className="text-sm font-semibold text-gray-600 leading-none">{label}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black tabular-nums text-gray-900">{fmt(value)}</span>
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#f1f5f9" }}
                    >
                      <AnimatedBar pct={barPct} color={color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat cards — rendered above filters ───────────────────────── */
export function StudentStatCards({ summary }) {
  const totalCourses = summary?.total_courses ?? 0;
  const courseCounts = summary?.course_counts ?? {};
  const examListed   = (courseCounts["exam_list"] ?? 0) + (courseCounts["exam_approved"] ?? 0);
  const failedRetake = (courseCounts["failed"] ?? 0) + (courseCounts["retake_booked"] ?? 0);
  const CARDS = [
    { label: "Students",           icon: Users,         accent: "#1a0a0b", value: summary?.student_count    ?? 0 },
    { label: "Total Courses",      icon: BookOpen,      accent: "#475569", value: totalCourses },
    { label: "Exam List/Approved", icon: ClipboardList, accent: "#0891b2", value: examListed },
    { label: "Failed / Retake",    icon: AlertTriangle, accent: "#f59e0b", value: failedRetake },
    { label: "Pending Payment",    icon: CreditCard,    accent: "#c41820", value: summary?.pending_payment  ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {CARDS.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
}

/* ─── Financial + pipeline — rendered below filters ─────────────── */
export function StudentSummary({ summary }) {
  const courseCounts = summary?.course_counts ?? {};
  const totalCourses = summary?.total_courses ?? 0;
  return (
    <div className="space-y-4">
      <FinancialSummary summary={summary} />
      <div
        className="bg-white rounded-2xl border border-gray-200 px-6 py-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)" }}
      >
        <CoursePipeline courseCounts={courseCounts} totalCourses={totalCourses} />
      </div>
    </div>
  );
}