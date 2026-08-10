import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { GraduationCap, Plus, Loader2, Clock, CheckCircle, Calendar, XCircle } from "lucide-react";
import { lessonsAPI } from "../../api/lessons.api";
import { fmtDate } from "../../utils/students.utils";
import AddLessonModal from "./AddLessonModal";

const STATUS_CONFIG = {
  completed:  { label: "Completed",  color: "text-green-700 bg-green-50 border-green-200" },
  scheduled:  { label: "Scheduled",  color: "text-blue-700 bg-blue-50 border-blue-200" },
  cancelled:  { label: "Cancelled",  color: "text-gray-600 bg-gray-50 border-gray-200" },
  no_show:    { label: "No Show",    color: "text-red-600 bg-red-50 border-red-200" },
};

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtTime12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function SummaryCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function StudentLessons() {
  const { student, setStudent, selectedCourse } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLessons([]);
    if (!selectedCourse) { setLoading(false); return; }
    const params = { student_id: student.id, student_course_id: selectedCourse.id };
    Promise.all([
      lessonsAPI.getAll(params),
      lessonsAPI.getSummary(student.id, selectedCourse.id),
    ])
      .then(([data, sum]) => {
        setLessons(Array.isArray(data) ? data : (data.results ?? []));
        setSummary(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.id, selectedCourse?.id]);

  useEffect(() => { load(); }, [load]);

  const totalHours = summary
    ? `${Math.floor(summary.total_minutes / 60)}h ${summary.total_minutes % 60}m`
    : "—";

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon={GraduationCap} label="Required"   value={summary?.total_required ?? "—"} color="blue" />
          <SummaryCard icon={CheckCircle}   label="Completed"  value={summary?.completed ?? "—"} color="green" />
          <SummaryCard icon={Calendar}      label="Remaining"  value={summary?.remaining ?? "—"} color="amber" />
          <SummaryCard icon={Clock}         label="Total Hours" value={totalHours} color="blue" />
        </div>

        {/* Progress bar */}
        {summary?.total_required > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Lesson Progress</span>
              <span className="text-sm font-bold text-gray-900">
                {summary.completed} / {summary.total_required}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(100, (summary.completed / summary.total_required) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {summary.remaining} lesson{summary.remaining !== 1 ? "s" : ""} remaining to complete the course
            </p>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Lesson History</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Lesson
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading lessons…</span>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <GraduationCap className="w-10 h-10 opacity-30" />
              <p className="font-semibold text-gray-500">No lessons recorded yet.</p>
              <p className="text-sm text-gray-400">Add the student's first lesson to start tracking practical training.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-1 flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Date", "Time", "Duration", "Course", "Instructor", "Vehicle", "Type", "Status", "Notes"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson, i) => {
                    const cfg = STATUS_CONFIG[lesson.status] ?? STATUS_CONFIG.completed;
                    return (
                      <tr key={lesson.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                        <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                          {fmtDate(lesson.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {fmtTime12(lesson.start_time)} – {fmtTime12(lesson.end_time)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                          {fmtDuration(lesson.duration_minutes)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">
                          {lesson.course_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {lesson.instructor_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {lesson.vehicle_display || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">
                          {lesson.lesson_type?.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                          {lesson.notes || lesson.instructor_remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddLessonModal
          student={student}
          studentCourses={student.student_courses ?? []}
          selectedCourse={selectedCourse}
          onClose={() => setShowAdd(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
