import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, TrendingUp, Calendar, GraduationCap, Clock } from "lucide-react";
import { lessonsAPI } from "../../api/lessons.api";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate, computeCourseBalance, getCourseStatus } from "../../utils/students.utils";

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

function ActivityDot({ color }) {
  return <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: color }} />;
}

export default function StudentOverview() {
  const { student, setStudent, selectedCourse: sc } = useOutletContext();
  const [lessonSummary, setLessonSummary] = useState(null);
  const [recentLessons, setRecentLessons] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    if (!sc) return;
    setLessonSummary(null);
    setRecentLessons([]);
    setRecentPayments([]);

    lessonsAPI.getSummary(student.id, sc.id)
      .then(setLessonSummary)
      .catch(() => {});

    lessonsAPI.getAll({ student_id: student.id, student_course_id: sc.id })
      .then((d) => setRecentLessons((Array.isArray(d) ? d : d.results ?? []).slice(0, 5)))
      .catch(() => {});

    paymentsAPI.getByStudentCourse(sc.id)
      .then((d) => setRecentPayments((Array.isArray(d) ? d : d.results ?? []).slice(0, 5)))
      .catch(() => {});
  }, [sc?.id, student.id]);

  if (!sc) return null;

  const { agreed, paid, balance } = computeCourseBalance(sc);
  const cfg = getCourseStatus(sc.status);

  const totalHours = lessonSummary
    ? `${Math.floor(lessonSummary.total_minutes / 60)}h ${lessonSummary.total_minutes % 60}m`
    : "—";

  const activityItems = [
    ...recentLessons.map((l) => ({
      date: l.date,
      label: l.status === "completed" ? "Lesson completed" : `Lesson ${l.status}`,
      sub: [l.instructor_name, l.start_time && l.end_time ? `${l.start_time.slice(0, 5)}–${l.end_time.slice(0, 5)}` : null, l.vehicle_display]
        .filter(Boolean).join(" · "),
      color: l.status === "completed" ? "#2563eb" : l.status === "no_show" ? "#dc2626" : "#94a3b8",
    })),
    ...recentPayments.map((p) => ({
      date: (p.transaction_date || p.created_at || "").slice(0, 10),
      label: "Payment received",
      sub: fmt(p.amount),
      color: "#16a34a",
    })),
  ]
    .filter((a) => a.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-6">

        {/* Enrollment summary strip */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{sc.course_name}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Started {fmtDate(sc.registration_date)} · Ref: {sc.payment_reference}
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Paid"
            value={fmt(paid)}
            sub={`of ${fmt(agreed)} agreed`}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Balance"
            value={balance > 0 ? fmt(balance) : "Cleared"}
            sub={balance > 0 ? "Outstanding" : "Fully paid"}
            color={balance > 0 ? "red" : "green"}
          />
          {lessonSummary && (
            <>
              <StatCard
                icon={GraduationCap}
                label="Training Progress"
                value={`${lessonSummary.completed} / ${lessonSummary.total_required || "?"}`}
                sub={lessonSummary.total_required ? `${lessonSummary.remaining} remaining` : ""}
                color="purple"
              />
              <StatCard
                icon={Clock}
                label="Training Hours"
                value={totalHours}
                sub="Completed lessons"
                color="amber"
              />
            </>
          )}
          <StatCard
            icon={Calendar}
            label="Registered"
            value={fmtDate(student.created_at)}
            color="indigo"
          />
        </div>

        {/* Training progress bar */}
        {lessonSummary?.total_required > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-bold text-gray-700">Training Progress</p>
              <span className="text-sm font-bold text-gray-900">
                {lessonSummary.completed} / {lessonSummary.total_required} lessons
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (lessonSummary.completed / lessonSummary.total_required) * 100)}%`,
                  background: cfg.color,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>{lessonSummary.remaining} remaining</span>
              <span>{Math.round((lessonSummary.completed / lessonSummary.total_required) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">Recent Activity</p>
          {activityItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {activityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <ActivityDot color={item.color} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 tabular-nums">{fmtDate(item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
