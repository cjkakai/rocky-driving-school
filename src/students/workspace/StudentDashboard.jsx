import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, TrendingUp, BookOpen, Calendar, GraduationCap, Clock } from "lucide-react";
import { lessonsAPI } from "../../api/lessons.api";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate, computeTotals, getCourseStatus } from "../../utils/students.utils";
import StudentHeader from "./StudentHeader";

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    red:    "bg-red-50 text-red-600",
    amber:  "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-black text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

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

  return (
    <div className="min-h-full bg-gray-50">
      <StudentHeader student={student} onUpdate={setStudent} />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard icon={CreditCard}    label="Total Paid"     value={fmt(totals.paidTotal)}   sub={`of ${fmt(totals.agreedTotal)} agreed`} color="green" />
          <StatCard icon={TrendingUp}    label="Balance"        value={totals.balance > 0 ? fmt(totals.balance) : "Cleared"} sub={totals.balance > 0 ? "Outstanding" : "Fully paid"} color={totals.balance > 0 ? "red" : "green"} />
          <StatCard icon={BookOpen}      label="Courses"        value={activeCourses.length}    sub={activeCourses.map((sc) => getCourseStatus(sc.status).label).join(", ") || "—"} color="blue" />
          <StatCard icon={Calendar}      label="Registered"     value={fmtDate(student.created_at)} color="indigo" />
          {lessonSummary && (
            <>
              <StatCard icon={GraduationCap} label="Lessons Done"   value={`${lessonSummary.completed} / ${lessonSummary.total_required || "?"}`} sub={lessonSummary.total_required ? `${lessonSummary.remaining} remaining` : ""} color="purple" />
              <StatCard icon={Clock}         label="Training Hours" value={totalHours} sub="Completed lessons" color="amber" />
            </>
          )}
        </div>

        {/* Course progress */}
        {activeCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-700 mb-4">Course Progress</p>
            <div className="space-y-4">
              {activeCourses.map((sc) => {
                const agreed = Number(sc.amount_agreed || 0);
                const paid = (sc.payments ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);
                const pct = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;
                const cfg = getCourseStatus(sc.status);
                return (
                  <div key={sc.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">{sc.course_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                      <span>{fmt(paid)} paid</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent payments */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-700 mb-3">Recent Payments</p>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No payments recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.reference_code}</p>
                    <p className="text-xs text-gray-400">{fmtDate(p.transaction_date || p.created_at)} · {p.payment_method}</p>
                  </div>
                  <span className="text-sm font-black text-green-700 tabular-nums shrink-0 ml-4">+{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
