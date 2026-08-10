import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  DollarSign, Users, BookOpen, ClipboardCheck, MessageSquare, TrendingUp, TrendingDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { reportsAPI } from "../../api/reports.api";
import { BranchMultiSelect } from "./BranchMultiSelect";
import { fmt } from "../../utils/students.utils";

// ── Palette ────────────────────────────────────────────────────────────────

const BRANCH_COLORS = [
  "#2563eb","#10b981","#f59e0b","#8b5cf6",
  "#ec4899","#0891b2","#84cc16","#f97316",
];

const PAYMENT_COLORS = {
  REGISTRATION: "#10b981",
  TOP_UP:       "#2563eb",
  EXAM:         "#f59e0b",
  RETAKE:       "#ec4899",
  COURSE_PAYMENT:"#8b5cf6",
  BALANCE_PAYMENT:"#0891b2",
};
const DEFAULT_PAYMENT_COLOR = "#94a3b8";

// ── KPI Cards ──────────────────────────────────────────────────────────────

const KPI_DEFS = [
  { key: "revenue",       label: "Total revenue",     icon: DollarSign,    color: "emerald", fmt: (v) => fmt(v) },
  { key: "registrations", label: "Registrations",     icon: Users,         color: "blue",   fmt: (v) => v?.toLocaleString() ?? 0 },
  { key: "enrollments",  label: "Enrollments",       icon: BookOpen,      color: "blue",   fmt: (v) => v?.toLocaleString() ?? 0 },
  { key: "exam_bookings", label: "Exam bookings",     icon: ClipboardCheck,color: "rose",   fmt: (v) => v?.toLocaleString() ?? 0 },
  { key: "attendance",    label: "Attendance",        icon: TrendingUp,    color: "teal",   fmt: (v) => v?.toLocaleString() ?? 0 },
  { key: "inquiries",     label: "Inquiries",         icon: MessageSquare, color: "amber",  fmt: (v) => v?.toLocaleString() ?? 0 },
];

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "bg-emerald-500 text-white", label: "text-emerald-700", value: "text-gray-900" },
  blue:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: "bg-blue-600 text-white",    label: "text-blue-700",    value: "text-gray-900" },
  rose:    { bg: "bg-rose-50",    border: "border-rose-100",    icon: "bg-rose-500 text-white",    label: "text-rose-700",    value: "text-gray-900" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-100",    icon: "bg-teal-600 text-white",    label: "text-teal-700",    value: "text-gray-900" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-100",   icon: "bg-amber-500 text-white",   label: "text-amber-700",   value: "text-gray-900" },
};

function KpiCard({ def, value, loading }) {
  const Icon = def.icon;
  const c = COLOR_MAP[def.color];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex items-start gap-3`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${c.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.label} mb-1`}>{def.label}</p>
        {loading
          ? <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse" />
          : <p className={`text-xl font-black truncate ${c.value}`}>{def.fmt(value)}</p>}
      </div>
    </div>
  );
}

// ── Tooltip helpers ────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label, isCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-blue-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-black text-blue-700">
        {isCurrency ? fmt(payload[0].value) : payload[0].value?.toLocaleString()}
      </p>
    </div>
  );
}

function BarTooltip({ active, payload, label, isCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {isCurrency ? fmt(payload[0].value) : payload[0].value?.toLocaleString()}
      </p>
    </div>
  );
}

// ── Trend Chart ────────────────────────────────────────────────────────────

const METRICS_OPTIONS = [
  { value: "payment_total",                label: "Revenue",      isCurrency: true  },
  { value: "student_registrations",        label: "Registrations",isCurrency: false },
  { value: "student_course_registrations", label: "Enrollments",  isCurrency: false },
  { value: "exam_bookings_count",          label: "Exam bookings",isCurrency: false },
  { value: "attendance",                   label: "Attendance",   isCurrency: false },
  { value: "inquiries",                    label: "Inquiries",    isCurrency: false },
];

function TrendChart({ branches, apiFilters, isAdmin }) {
  const [metric, setMetric]   = useState("payment_total");
  const [branch, setBranch]   = useState("");
  const [data, setData]       = useState([]);
  const [gran, setGran]       = useState("monthly");
  const [loading, setLoading] = useState(false);

  // If no date range provided, default to last 90 days for a meaningful curve
  const effectiveFilters = useMemo(() => {
    if (apiFilters.date_from || apiFilters.date_to) return apiFilters;
    const to   = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
    return { date_from: from, date_to: to };
  }, [JSON.stringify(apiFilters)]);

  const load = useCallback(() => {
    setLoading(true);
    const params = { metric, ...effectiveFilters };
    if (isAdmin && branch) params.branch = branch;
    reportsAPI.timeSeries(params)
      .then((res) => { setData(res.data ?? []); setGran(res.granularity ?? "monthly"); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [metric, branch, JSON.stringify(effectiveFilters)]);

  useEffect(() => { load(); }, [load]);

  const metaDef    = METRICS_OPTIONS.find((m) => m.value === metric);
  const isCurrency = metaDef?.isCurrency;
  const total      = data.reduce((s, d) => s + d.value, 0);
  const peak       = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  const trend      = data.length >= 2
    ? ((data[data.length-1].value - data[data.length-2].value) / (data[data.length-2].value || 1)) * 100
    : null;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/40 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Trend over time</h3>
            <p className="text-xs text-gray-400 mt-0.5">{metaDef?.label} · {gran} view</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {METRICS_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {isAdmin && (
              <select value={branch} onChange={(e) => setBranch(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[140px]"
              >
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {data.length > 0 && (
          <div className="flex flex-wrap gap-5 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
              <p className="text-lg font-black text-gray-900">{isCurrency ? fmt(total) : total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Peak</p>
              <p className="text-lg font-black text-gray-900">{isCurrency ? fmt(peak) : peak.toLocaleString()}</p>
            </div>
            {trend !== null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last vs prev</p>
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
          <div className="h-72 bg-gray-50 rounded-xl animate-pulse mx-3" />
        ) : !data.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">No trend data for selected filters</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.08}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={46}
                  tickFormatter={(v) => isCurrency ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<AreaTooltip isCurrency={isCurrency} />} cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5}
                  fill="url(#reportTrendGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Branch Comparison Chart ────────────────────────────────────────────────

function BranchComparisonChart({ branches, courses, apiFilters }) {
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [metric, setMetric]   = useState("payment_total");
  const [courseId, setCourseId] = useState("");
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const metaDef = METRICS_OPTIONS.find((m) => m.value === metric);
  const isCurrency = metaDef?.isCurrency;

  const load = useCallback(() => {
    setLoading(true);
    const params = { metric, ...apiFilters };
    if (selectedBranches.length) params.branches = selectedBranches;
    if (courseId && metric === "student_course_registrations") params.course = courseId;
    reportsAPI.branchComparison(params)
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [metric, selectedBranches, courseId, JSON.stringify(apiFilters)]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Branch comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {metaDef?.label} · {selectedBranches.length ? `${selectedBranches.length} selected` : "all branches"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {METRICS_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {metric === "student_course_registrations" && courses.length > 0 && (
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            )}
            <BranchMultiSelect branches={branches} selected={selectedBranches} onChange={setSelectedBranches} placeholder="All branches" />
          </div>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ) : !data.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data for selected filters</div>
        ) : (() => {
          const needsScroll = data.length > 5;
          const chartWidth  = needsScroll ? data.length * 90 + 60 : undefined;
          const chart = (
            <BarChart
              {...(needsScroll ? { width: chartWidth, height: 256 } : {})}
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={44}
                tickFormatter={(v) => isCurrency ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip content={<BarTooltip isCurrency={isCurrency} />} cursor={{ fill: "#f8fafc", radius: 6 }} />
              <Bar dataKey="value" radius={[8,8,0,0]} maxBarSize={64}>
                {data.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} fillOpacity={0.9} />)}
              </Bar>
            </BarChart>
          );
          return needsScroll ? (
            <div className="overflow-x-auto overflow-y-hidden">{chart}</div>
          ) : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer></div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Payment Type Breakdown ─────────────────────────────────────────────────

function PaymentTypeChart({ apiFilters }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    reportsAPI.paymentTypeBreakdown(apiFilters)
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [JSON.stringify(apiFilters)]);

  useEffect(() => { load(); }, [load]);

  const total = data.reduce((s, r) => s + r.amount, 0);

  const fmtLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-base">Revenue by payment type</h3>
        <p className="text-xs text-gray-400 mt-0.5">Live from payment transactions</p>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !data.length ? (
          <div className="py-10 text-center text-gray-400 text-sm">No payment data for selected filters</div>
        ) : (
          <div className="space-y-3">
            {data.map((row) => {
              const color = PAYMENT_COLORS[row.payment_type] ?? DEFAULT_PAYMENT_COLOR;
              const pct   = total > 0 ? (row.amount / total * 100).toFixed(1) : 0;
              return (
                <div key={row.payment_type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm text-gray-700 font-medium">{fmtLabel(row.payment_type)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{row.count} txns</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(row.amount)}</span>
                      <span className="text-xs font-semibold text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</span>
              <span className="text-base font-black text-gray-900">{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Analytics Tab ─────────────────────────────────────────────────────

export function ReportsAnalyticsTab({ branches, courses, apiFilters }) {
  const { user } = useAuth();
  const isAdmin  = user?.role === "super_admin";
  const [kpis, setKpis]               = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const load = useCallback(() => {
    setKpisLoading(true);
    reportsAPI.kpiSummary(apiFilters)
      .then(setKpis)
      .catch(() => setKpis(null))
      .finally(() => setKpisLoading(false));
  }, [JSON.stringify(apiFilters)]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_DEFS.map((def) => (
          <KpiCard key={def.key} def={def} value={kpis?.[def.key]} loading={kpisLoading} />
        ))}
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <BranchComparisonChart branches={branches} courses={courses} apiFilters={apiFilters} />
          <PaymentTypeChart apiFilters={apiFilters} />
        </div>
      ) : (
        <PaymentTypeChart apiFilters={apiFilters} />
      )}

      <TrendChart branches={branches} apiFilters={apiFilters} isAdmin={isAdmin} />
    </div>
  );
}