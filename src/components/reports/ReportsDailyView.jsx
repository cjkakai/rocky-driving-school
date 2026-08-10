import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  Plus, DollarSign, Users, BookOpen, ClipboardCheck, TrendingUp,
  Calendar, Search, Filter, Download, RefreshCw, Building2,
  Eye, Clock, Sparkles, ArrowUpRight, FileText,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { reportsAPI } from "../../api/reports.api";
import { useAuth } from "../../context/AuthContext";
import { fmt } from "../../utils/students.utils";
import { Btn } from "../../ui";

/* ───────────────── helpers ───────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function prettyDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function relativeDay(dateStr) {
  const t = todayStr();
  if (dateStr === t) return "Today";
  if (dateStr === shiftDate(t, -1)) return "Yesterday";
  if (dateStr === shiftDate(t, 1)) return "Tomorrow";
  return null;
}

/* ───────────────── KPI Chip ───────────────── */
function KpiChip({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate:   "bg-slate-50 text-slate-700 border-slate-200 ring-slate-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",
    sky:     "bg-sky-50 text-sky-700 border-sky-200 ring-sky-100",
    blue:    "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
    rose:    "bg-rose-50 text-rose-700 border-rose-200 ring-rose-100",
  };
  return (
    <div className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:ring-4 ${tones[tone]}`}>
      <Icon className="w-3.5 h-3.5 opacity-80 group-hover:scale-110 transition-transform" />
      <span className="opacity-70">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

/* ───────────────── Stat Card ───────────────── */
function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/40 p-4 shadow-sm ${gradient}`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/30 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700/70">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {sub && <p className="text-[11px] mt-0.5 text-slate-700/70">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${iconBg}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Overview ───────────────── */
function Overview({ branches, date }) {
  const submitted = branches.filter(b => b.report).length;
  const total = branches.length;
  const missing = total - submitted;
  const rate = total ? Math.round((submitted / total) * 100) : 0;

  // Aggregate KPIs across all submitted branches
  const totals = branches.reduce((acc, b) => {
    if (!b.report) return acc;
    acc.revenue += Number(b.report.payment_total) || 0;
    acc.students += Number(b.report.student_registrations) || 0;
    acc.enroll += Number(b.report.student_course_registrations) || 0;
    acc.exams += Number(b.report.exam_bookings_count) || 0;
    return acc;
  }, { revenue: 0, students: 0, enroll: 0, exams: 0 });

  const data = [
    { name: "Submitted", value: submitted, color: "#10b981" },
    { name: "Missing", value: missing, color: "#fbbf24" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/50 shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6">
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Daily Reports Overview</h2>
            </div>
            <p className="text-sm text-slate-500 ml-10">
              Branch submission snapshot for {prettyDate(date)}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap ml-10">
              <KpiChip icon={Building2} label="Branches" value={total} tone="slate" />
              <KpiChip icon={CheckCircle2} label="Submitted" value={submitted} tone="emerald" />
              <KpiChip icon={AlertCircle} label="Missing" value={missing} tone="amber" />
              <KpiChip icon={TrendingUp} label="Rate" value={`${rate}%`} tone={rate >= 80 ? "emerald" : rate >= 50 ? "sky" : "rose"} />
            </div>
          </div>

          {/* Donut */}
          <div className="relative w-36 h-36 shrink-0 mx-auto lg:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={62}
                  stroke="none"
                  paddingAngle={2}
                >
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid #e2e8f0",
                    fontSize: 12, padding: "6px 10px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{rate}%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Complete</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>Submission progress</span>
            <span className="tabular-nums">{submitted} / {total}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        {/* Aggregate stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={DollarSign} label="Total Revenue" value={fmt(totals.revenue)}
            sub="across submitted branches"
            gradient="bg-gradient-to-br from-blue-50 to-blue-50"
            iconBg="bg-gradient-to-br from-blue-600 to-blue-600"
          />
          <StatCard
            icon={Users} label="New Students" value={totals.students}
            sub="registrations today"
            gradient="bg-gradient-to-br from-blue-50 to-blue-50"
            iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={BookOpen} label="Course Enrollments" value={totals.enroll}
            sub="across branches"
            gradient="bg-gradient-to-br from-blue-50 to-blue-50"
            iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={ClipboardCheck} label="Exam Bookings" value={totals.exams}
            sub="scheduled today"
            gradient="bg-gradient-to-br from-amber-50 to-orange-50"
            iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────── KPI Strip ───────────────── */
function KpiStrip({ report }) {
  const items = [
    { icon: DollarSign, label: "Revenue", value: fmt(report.payment_total), tone: "sky" },
    { icon: Users, label: "Students", value: report.student_registrations, tone: "sky" },
    { icon: BookOpen, label: "Enroll", value: report.student_course_registrations, tone: "blue" },
    { icon: ClipboardCheck, label: "Exams", value: report.exam_bookings_count, tone: "amber" },
    { icon: TrendingUp, label: "Attendance", value: report.attendance, tone: "blue" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <KpiChip key={i} icon={it.icon} label={it.label} value={it.value} tone={it.tone} />
      ))}
    </div>
  );
}

/* ───────────────── Branch Row (admin) ───────────────── */
function BranchRow({ entry, onView, onSubmit, isToday }) {
  const { branch_name, report } = entry;
  const submitted = !!report;

  return (
    <div className={`group relative bg-white border rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
      submitted ? "border-slate-200 hover:border-emerald-300" : "border-amber-200/60 bg-amber-50/30 hover:border-amber-300"
    }`}>
      {/* Status accent bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
        submitted ? "bg-gradient-to-b from-emerald-400 to-teal-500" : "bg-gradient-to-b from-amber-300 to-orange-400"
      }`} />

      <div className="flex items-center gap-4 pl-3">
        {/* Status icon */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
          submitted ? "bg-gradient-to-br from-emerald-50 to-teal-100" : "bg-gradient-to-br from-amber-50 to-orange-100"
        }`}>
          {submitted
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : <AlertCircle className="w-5 h-5 text-amber-600" />}
        </div>

        {/* Branch name */}
        <div className="w-44 shrink-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{branch_name}</p>
          <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${
            submitted ? "text-emerald-600" : "text-amber-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${submitted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
            {submitted ? "Report submitted" : "Awaiting report"}
          </p>
        </div>

        {/* KPIs */}
        <div className="flex-1 min-w-0">
          {submitted
            ? <KpiStrip report={report} />
            : <p className="text-sm text-amber-700/80 italic">No report has been submitted for this branch yet.</p>}
        </div>

        {/* Action */}
        <div className="shrink-0">
          {submitted ? (
            <button
              onClick={() => onView(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </button>
          ) : isToday ? (
            <Btn size="sm" onClick={() => onSubmit(entry)}>
              <Plus className="w-3 h-3" /> Submit
            </Btn>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 px-2">
              <Clock className="w-3 h-3" /> Closed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Branch User View ───────────────── */
function BranchUserDayView({ entry, onView, onSubmit, isToday }) {
  if (!entry) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <p className="text-slate-500">No branch assigned.</p>
      </div>
    );
  }
  const { branch_name, report } = entry;
  const submitted = !!report;

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900">Report Submitted</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3" /> {branch_name}
                </p>
              </div>
            </div>
            <Btn variant="outline" size="sm" onClick={() => onView(report)}>
              <Eye className="w-3.5 h-3.5" /> View Full Report
            </Btn>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard icon={DollarSign} label="Revenue" value={fmt(report.payment_total)}
              gradient="bg-gradient-to-br from-blue-50 to-blue-50"
              iconBg="bg-gradient-to-br from-blue-600 to-blue-600" />
            <StatCard icon={Users} label="Students" value={report.student_registrations}
              gradient="bg-gradient-to-br from-blue-50 to-blue-50"
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard icon={BookOpen} label="Enrollments" value={report.student_course_registrations}
              gradient="bg-gradient-to-br from-blue-50 to-blue-50"
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard icon={ClipboardCheck} label="Exams" value={report.exam_bookings_count}
              gradient="bg-gradient-to-br from-amber-50 to-orange-50"
              iconBg="bg-gradient-to-br from-amber-500 to-orange-600" />
            <StatCard icon={TrendingUp} label="Attendance" value={report.attendance}
              gradient="bg-gradient-to-br from-rose-50 to-pink-50"
              iconBg="bg-gradient-to-br from-rose-500 to-pink-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/40 p-10 text-center shadow-sm">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-4">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <p className="font-bold text-lg text-slate-900">
          {isToday ? "No report submitted for today" : "No report found"}
        </p>
        <p className="text-sm text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
          {isToday
            ? "Keep your branch on track — submit today's daily report to record activity, revenue and student data."
            : "There is no recorded report for the selected date."}
        </p>
        {isToday && (
          <Btn onClick={() => onSubmit(entry)}>
            <Plus className="w-4 h-4" /> Submit Today's Report
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Empty / Loading ───────────────── */
function SkeletonRow() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="w-44 space-y-2">
          <div className="h-3 bg-slate-100 rounded w-32" />
          <div className="h-2 bg-slate-100 rounded w-20" />
        </div>
        <div className="flex-1 flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-6 w-20 bg-slate-100 rounded-full" />)}
        </div>
        <div className="h-7 w-16 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

/* ───────────────── Main ───────────────── */
export function ReportsDailyView({ onViewReport, onSubmitReport }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";

  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | submitted | missing

  const isToday = date === todayStr();

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await reportsAPI.daily(d);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const filteredBranches = useMemo(() => {
    if (!data?.branches) return [];
    return data.branches.filter(b => {
      const matchSearch = !search || b.branch_name?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "submitted" && b.report) ||
        (filter === "missing" && !b.report);
      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const relLabel = relativeDay(date);

  return (
    <div className="space-y-5">
      {/* ── Header / Date control ───────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-blue-50/50 pointer-events-none" />
        <div className="relative p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          {/* Date nav */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setDate(shiftDate(date, -1))}
                className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-600 transition-all"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none px-2 cursor-pointer"
              />
              <button
                disabled={isToday}
                onClick={() => setDate(shiftDate(date, 1))}
                className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">{prettyDate(date)}</span>
              {relLabel && (
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  relLabel === "Today" ? "text-emerald-600" : "text-slate-500"
                }`}>{relLabel}</span>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isToday && (
              <button
                onClick={() => setDate(todayStr())}
                className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
              >
                Jump to Today
              </button>
            )}
            <button
              onClick={() => load(date)}
              className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Overview (admin) ───────────────── */}
      {isAdmin && data && <Overview branches={data.branches} date={date} />}

      {/* ── Admin filter bar ───────────────── */}
      {isAdmin && data && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            {[
              { k: "all", label: "All", icon: Filter },
              { k: "submitted", label: "Submitted", icon: CheckCircle2 },
              { k: "missing", label: "Missing", icon: AlertCircle },
            ].map(opt => (
              <button
                key={opt.k}
                onClick={() => setFilter(opt.k)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === opt.k
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ───────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-rose-200/60 p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-md mb-3">
            <AlertCircle className="w-7 h-7 text-white" />
          </div>
          <p className="font-bold text-slate-900">Failed to load reports</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Something went wrong while fetching the data.</p>
          <Btn variant="outline" size="sm" onClick={() => load(date)}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </Btn>
        </div>
      ) : isAdmin ? (
        filteredBranches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No branches match your filters</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting the search or filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredBranches.map(entry => (
              <BranchRow
                key={entry.branch_id}
                entry={entry}
                onView={onViewReport}
                onSubmit={onSubmitReport}
                isToday={isToday}
              />
            ))}
          </div>
        )
      ) : (
        <BranchUserDayView
          entry={data.branches[0]}
          onView={onViewReport}
          onSubmit={onSubmitReport}
          isToday={isToday}
        />
      )}
    </div>
  );
}
