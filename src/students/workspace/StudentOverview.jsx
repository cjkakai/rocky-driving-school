import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CreditCard, TrendingUp, Calendar, GraduationCap, Clock,
  XCircle, MinusCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { lessonsAPI } from "../../api/lessons.api";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate, computeCourseBalance, getCourseStatus } from "../../utils/students.utils";

const ACCENT = {
  blue:   "#c41820",
  green:  "#059669",
  red:    "#e11d48",
  amber:  "#d97706",
  indigo: "#475569",
  purple: "#c41820",
};

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const accent = ACCENT[color];
  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)" }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const EVENT_CONFIG = {
  lesson_completed: { icon: GraduationCap, color: "#c41820", tint: "#fdf1f1" },
  lesson_other:     { icon: MinusCircle,   color: "#94a3b8", tint: "#f8fafc" },
  lesson_no_show:   { icon: XCircle,       color: "#e11d48", tint: "#fff1f2" },
  payment:          { icon: CreditCard,    color: "#059669", tint: "#ecfdf5" },
};

function TimelineItem({ item, isLast }) {
  const cfg = EVENT_CONFIG[item.type] ?? EVENT_CONFIG.lesson_other;
  const Icon = cfg.icon;
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10"
          style={{ background: cfg.tint, color: cfg.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
          <span className="text-[11px] text-gray-400 shrink-0 tabular-nums mt-0.5">{fmtDate(item.date)}</span>
        </div>
        {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
      </div>
    </div>
  );
}

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const hoursTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-bold text-gray-800">{p.day}</p>
      <p className="text-xs font-extrabold text-[#c41820]">{fmtDuration(p.minutes)}</p>
    </div>
  );
};

const METHOD_LABEL = { bank: "Bank", coop_stk: "Co-op STK", bank_ipn: "Bank IPN", bank_b2b: "Bank B2B" };

export default function StudentOverview() {
  const { student, setStudent, selectedCourse: sc } = useOutletContext();
  const [lessonSummary, setLessonSummary] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    if (!sc) return;
    setLessonSummary(null);
    setLessons([]);
    setRecentPayments([]);

    lessonsAPI.getSummary(student.id, sc.id).then(setLessonSummary).catch(() => {});
    lessonsAPI.getAll({ student_id: student.id, student_course_id: sc.id })
      .then((d) => setLessons(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => {});
    paymentsAPI.getByStudentCourse(sc.id)
      .then((d) => setRecentPayments(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => {});
  }, [sc?.id, student.id]);

  if (!sc) return null;

  const { agreed, paid, balance } = computeCourseBalance(sc);
  const cfg = getCourseStatus(sc.status);

  const totalHours = lessonSummary
    ? `${Math.floor(lessonSummary.total_minutes / 60)}h ${lessonSummary.total_minutes % 60}m`
    : "—";

  /* Weekly bar chart — same logic as Lessons page */
  const weeklyData = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const totals = WEEKDAYS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { day: label, date: d, minutes: 0, isToday: d.toDateString() === now.toDateString() };
    });

    lessons.forEach((l) => {
      if (l.status !== "completed" || !l.date) return;
      const d = new Date(l.date);
      if (d < monday || d > sunday) return;
      const idx = totals.findIndex((t) => t.date.toDateString() === d.toDateString());
      if (idx >= 0) totals[idx].minutes += l.duration_minutes || 0;
    });

    return totals;
  }, [lessons]);

  const weeklyTotalMinutes = weeklyData.reduce((s, d) => s + d.minutes, 0);

  /* Activity timeline */
  const activityItems = [
    ...lessons.slice(0, 5).map((l) => ({
      date: l.date,
      type: l.status === "completed" ? "lesson_completed" : l.status === "no_show" ? "lesson_no_show" : "lesson_other",
      label: l.status === "completed" ? "Lesson completed" : `Lesson ${l.status}`,
      sub: [l.instructor_name, l.start_time && l.end_time ? `${l.start_time.slice(0, 5)}–${l.end_time.slice(0, 5)}` : null, l.vehicle_display]
        .filter(Boolean).join(" · "),
    })),
    ...recentPayments.slice(0, 5).map((p) => ({
      date: (p.transaction_date || p.created_at || "").slice(0, 10),
      type: "payment",
      label: "Payment received",
      sub: fmt(p.amount),
    })),
  ]
    .filter((a) => a.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-6">

        {/* Enrollment summary strip */}
        <div className="rounded-2xl border p-5" style={{ background: "#fdf1f1", borderColor: "#f5c4c6" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-gray-900 tracking-tight">{sc.course_name}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Started {fmtDate(sc.registration_date)} · Ref: {sc.payment_reference}
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={CreditCard}    label="Total Paid"        value={fmt(paid)}   sub={`of ${fmt(agreed)} agreed`} color="green" />
          <StatCard icon={TrendingUp}    label="Balance"           value={balance > 0 ? fmt(balance) : "Cleared"} sub={balance > 0 ? "Outstanding" : "Fully paid"} color={balance > 0 ? "red" : "green"} />
          {lessonSummary && (
            <>
              <StatCard icon={GraduationCap} label="Lessons Completed" value={lessonSummary.completed} sub={`${lessonSummary.practical_completed} practical · ${lessonSummary.theory_completed} theory`} color="purple" />
              <StatCard icon={Clock}         label="Training Hours"    value={totalHours} sub="Completed lessons" color="amber" />
            </>
          )}
          <StatCard icon={Calendar} label="Registered" value={fmtDate(student.created_at)} color="indigo" />
        </div>

        {/* Training progress — practical / theory split + weekly bar chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {lessonSummary && (lessonSummary.practical_required > 0 || lessonSummary.theory_required > 0) && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-sm font-bold text-gray-800">Training Progress</p>

              {/* Practical */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-600">Practical</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {lessonSummary.practical_completed}
                    <span className="text-xs font-semibold text-gray-400"> / {lessonSummary.practical_required}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-orange-400 transition-all"
                    style={{ width: `${lessonSummary.practical_required > 0 ? Math.min(100, (lessonSummary.practical_completed / lessonSummary.practical_required) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {Math.max(0, lessonSummary.practical_required - lessonSummary.practical_completed)} remaining
                </p>
              </div>

              {/* Theory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-600">Theory</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {lessonSummary.theory_completed}
                    <span className="text-xs font-semibold text-gray-400"> / {lessonSummary.theory_required}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-400 transition-all"
                    style={{ width: `${lessonSummary.theory_required > 0 ? Math.min(100, (lessonSummary.theory_completed / lessonSummary.theory_required) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {Math.max(0, lessonSummary.theory_required - lessonSummary.theory_completed)} remaining
                </p>
              </div>
            </div>
          )}

          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${lessonSummary && (lessonSummary.practical_required > 0 || lessonSummary.theory_required > 0) ? "lg:col-span-3" : "lg:col-span-5"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-800">Weekly Training Hours</p>
              <span className="text-xs font-semibold text-gray-400">{fmtDuration(weeklyTotalMinutes)} this week</span>
            </div>
            <div style={{ width: "100%", height: 180 }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={20}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={hoursTooltip} cursor={{ fill: "rgba(196,24,32,0.04)" }} />
                  <Bar dataKey="minutes" radius={[8, 8, 8, 8]} maxBarSize={28} isAnimationActive={false}>
                    {weeklyData.map((d, i) => (
                      <Cell key={i} fill={d.isToday ? "#c41820" : d.minutes > 0 ? "#f4b8bc" : "#f1f2f4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Payment History</p>
            <span className="text-xs text-gray-400">{recentPayments.length} transaction{recentPayments.length !== 1 ? "s" : ""}</span>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["Date", "Reference", "Method", "Amount"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(p.transaction_date || p.created_at)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{p.reference_code}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{METHOD_LABEL[p.payment_method] || p.payment_method}</td>
                      <td className="px-5 py-3 text-xs font-bold text-emerald-700 tabular-nums whitespace-nowrap">+{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent activity timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4">Recent Activity</p>
          {activityItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No activity recorded yet.</p>
          ) : (
            <div>
              {activityItems.map((item, i) => (
                <TimelineItem key={i} item={item} isLast={i === activityItems.length - 1} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
