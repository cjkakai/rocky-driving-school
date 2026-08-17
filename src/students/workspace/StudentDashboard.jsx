import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, TrendingUp, BookOpen, Calendar, GraduationCap, Clock } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { lessonsAPI } from "../../api/lessons.api";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate, computeTotals, getCourseStatus } from "../../utils/students.utils";
import StudentHeader from "./StudentHeader";

const CHIP = {
  blue:   "bg-red-50 text-[#c41820]",
  green:  "bg-emerald-50 text-emerald-600",
  red:    "bg-rose-50 text-rose-600",
  amber:  "bg-amber-50 text-amber-600",
  indigo: "bg-slate-100 text-[#333333]",
  purple: "bg-red-50 text-[#c41820]",
};

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${CHIP[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* Recharts radial ring, styled after a leave-tracker widget */
function RingStat({ value, max, label, sub, color = "#c41820", tint = "#fdf1f1" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const data = [{ value: pct, fill: color }];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-[76px] h-[76px] shrink-0">
        <RadialBarChart
          width={76} height={76} cx="50%" cy="50%"
          innerRadius="76%" outerRadius="100%"
          data={data} startAngle={90} endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar background={{ fill: "#f1f2f4" }} dataKey="value" cornerRadius={20} isAnimationActive={false} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-gray-900">{value}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-gray-700 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

const paymentTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-bold text-gray-800">{p.reference_code}</p>
      <p className="text-[11px] text-gray-400">{p.dateLabel}</p>
      <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{fmt(p.amount)}</p>
    </div>
  );
};

export default function StudentDashboard() {
  const { student, setStudent } = useOutletContext();
  const [lessonSummary, setLessonSummary] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    lessonsAPI.getSummary(student.id).then(setLessonSummary).catch(() => {});
    paymentsAPI.getByStudent(student.id)
      .then((data) => setRecentPayments((Array.isArray(data) ? data : (data.results ?? [])).slice(0, 5)))
      .catch(() => {});
  }, [student.id]);

  const totals = computeTotals(student);
  const activeCourses = (student.student_courses ?? []).filter((sc) => sc.status !== "transferred");
  const totalHours = lessonSummary
    ? `${Math.floor(lessonSummary.total_minutes / 60)}h ${lessonSummary.total_minutes % 60}m`
    : "—";

  const paymentPct = totals.agreedTotal > 0 ? Math.round((totals.paidTotal / totals.agreedTotal) * 100) : 0;

  const chartData = [...recentPayments].reverse().map((p) => ({
    ...p,
    dateLabel: fmtDate(p.transaction_date || p.created_at),
    amount: Number(p.amount || 0),
  }));

  return (
    <div className="min-h-full bg-gray-50">
      <StudentHeader student={student} onUpdate={setStudent} />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard icon={BookOpen}      label="Courses"        value={activeCourses.length}    sub={activeCourses.map((sc) => getCourseStatus(sc.status).label).join(", ") || "—"} color="blue" />
          <StatCard icon={Calendar}      label="Registered"     value={fmtDate(student.created_at)} color="indigo" />
          <StatCard icon={Clock} label="Training Hours" value={totalHours} sub="Completed lessons" color="amber" />

          <RingStat
            value={totals.paidTotal > 0 ? paymentPct : 0}
            max={100}
            label="Payment Progress"
            sub={`${fmt(totals.paidTotal)} of ${fmt(totals.agreedTotal)}`}
            color="#059669"
          />
          {lessonSummary?.total_required ? (
            <RingStat
              value={lessonSummary.completed}
              max={lessonSummary.total_required}
              label="Lessons Done"
              sub={`of ${lessonSummary.total_required} · ${lessonSummary.remaining} left`}
            />
          ) : lessonSummary ? (
            <StatCard icon={GraduationCap} label="Lessons Done" value={lessonSummary.completed} color="purple" />
          ) : null}
          <RingStat
            value={activeCourses.length}
            max={Math.max(activeCourses.length, 3)}
            label="Course Load"
            sub={`${activeCourses.length} active course${activeCourses.length !== 1 ? "s" : ""}`}
            color="#c41820"
          />
        </div>

        {/* Balance banner */}
        <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm ${totals.balance > 0 ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${totals.balance > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wide ${totals.balance > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                {totals.balance > 0 ? "Outstanding Balance" : "Account Status"}
              </p>
              <p className={`text-xl font-extrabold mt-0.5 ${totals.balance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {totals.balance > 0 ? fmt(totals.balance) : "Fully paid"}
              </p>
            </div>
          </div>
        </div>

        {/* Course progress */}
        {activeCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">Course Progress</p>
            <div className="space-y-5">
              {activeCourses.map((sc) => {
                const agreed = Number(sc.amount_agreed || 0);
                const paid = (sc.payments ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);
                const pct = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;
                const cfg = getCourseStatus(sc.status);
                return (
                  <div key={sc.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">{sc.course_name}</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border" style={{ background: `${cfg.color}12`, color: cfg.color, borderColor: `${cfg.color}30` }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>{fmt(paid)} paid</span>
                      <span className="font-semibold text-gray-500">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent payments — bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-1">Recent Payments</p>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No payments recorded yet.</p>
          ) : (
            <div className="mt-3" style={{ width: "100%", height: Math.max(180, chartData.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                  barCategoryGap={14}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="reference_code" width={110}
                    tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={paymentTooltip} cursor={{ fill: "rgba(196,24,32,0.04)" }} />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={22} isAnimationActive={false}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? "#c41820" : "#f4b8bc"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}