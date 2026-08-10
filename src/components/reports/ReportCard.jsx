import { useState, useEffect } from "react";
import {
  Users, DollarSign, BookOpen, ClipboardCheck, Eye,
  Calendar, User, ChevronRight, Car, Hash,
} from "lucide-react";
import { fmt, fmtDate } from "../../utils/students.utils";
import { reportsAPI } from "../../api/reports.api";

const KPI_CONFIG = [
  { key: "payment_total",                label: "Revenue",    icon: DollarSign,    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-100",  fmt: (v) => fmt(v) },
  { key: "student_registrations",        label: "Students",   icon: Users,         color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",  fmt: (v) => v },
  { key: "student_course_registrations", label: "Enrollments",icon: BookOpen,      color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100",fmt: (v) => v },
  { key: "exam_bookings_count",          label: "Exams",      icon: ClipboardCheck,color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",   fmt: (v) => v },
];

export function ReportCard({ report, onClick }) {
  const period = fmtDate(report.report_date);
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer overflow-hidden
        hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-200"
    >
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500
        opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate group-hover:text-blue-700 transition-colors">
              {report.branch_name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{period}</p>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                Daily
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {KPI_CONFIG.map(({ key, label, icon: Icon, color, bg, border, fmt: fmtFn }) => (
            <div key={key} className={`${bg} ${border} border rounded-xl p-2 text-center`}>
              <Icon className={`w-3 h-3 ${color} mx-auto mb-1`} />
              <p className={`text-xs font-bold ${color}`}>{fmtFn(report[key] ?? 0)}</p>
              <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-gray-400" />
            <p className="text-[11px] text-gray-400">{report.created_by_name}</p>
          </div>
          <p className="text-[11px] text-gray-400">{fmtDate(report.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Detail Metric Card ────────────────────────────────────────────────────────

function DetailMetricCard({ label, value, accent, drillKey, textColor, onDrilldown }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${accent}`} />
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      {drillKey && (
        <button
          onClick={() => onDrilldown(drillKey)}
          className="mt-2.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <Eye className="w-3 h-3" /> View details
        </button>
      )}
    </div>
  );
}

// ── Trip Summary Section ──────────────────────────────────────────────────────

function TripSummary({ reportId }) {
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    reportsAPI.tripEntries(reportId)
      .then((res) => setTrips(Array.isArray(res) ? res : []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [reportId]);

  const totalStudents = trips.reduce((s, t) => s + (t.number_of_students || 0), 0);
  const totalLessons  = trips.reduce((s, t) => s + (t.number_of_lessons  || 0), 0);

  // Aggregate per vehicle
  const byVehicle = trips.reduce((acc, t) => {
    const key  = t.vehicle_registration ?? t.vehicle ?? "Unknown";
    const name = t.vehicle_name ?? "";
    if (!acc[key]) acc[key] = { reg: key, name, students: 0, lessons: 0 };
    acc[key].students += (t.number_of_students || 0);
    acc[key].lessons  += (t.number_of_lessons  || 0);
    return acc;
  }, {});
  const vehicleRows = Object.values(byVehicle).sort((a, b) => b.lessons - a.lessons);

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header strip with totals */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100">
            <Car className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Practical trips</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Students</p>
            <p className="text-base font-black text-blue-900">{loading ? "—" : totalStudents}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Lessons</p>
            <p className="text-base font-black text-blue-900">{loading ? "—" : totalLessons}</p>
          </div>
        </div>
      </div>

      {/* Per-vehicle breakdown */}
      {loading ? (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />)}
        </div>
      ) : vehicleRows.length === 0 ? (
        <div className="px-4 py-5 text-center text-gray-400 text-xs">No trips recorded for this report</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Vehicle</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center justify-center gap-1">
                  <Hash className="w-3 h-3" /> Lessons
                </span>
              </th>
              <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Students
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicleRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="font-bold text-gray-800 font-mono">{row.reg}</p>
                  {row.name && <p className="text-gray-400 text-[10px]">{row.name}</p>}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 border border-blue-100 font-bold text-blue-700">
                    {row.lessons}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center font-semibold text-gray-700">{row.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

const AUTO_METRICS = [
  { label: "Student registrations",  key: "student_registrations",        accent: "from-blue-500 to-blue-600",    drillKey: "student_registrations",        textColor: "text-blue-700"   },
  { label: "Course enrollments",     key: "student_course_registrations",  accent: "from-blue-500 to-blue-600",drillKey: "student_course_registrations", textColor: "text-blue-700" },
  { label: "Payments",               key: "payment_count",                 accent: "from-green-500 to-green-600",  drillKey: "payments",                     textColor: "text-green-700"  },
  { label: "Revenue",                key: "payment_total",                 accent: "from-blue-500 to-blue-600",    drillKey: null,                           textColor: "text-blue-700",  isCurrency: true },
  { label: "Exam bookings",          key: "exam_bookings_count",           accent: "from-red-500 to-red-600",      drillKey: "exam_bookings",                textColor: "text-red-700"    },
];

// Manual fields that still exist on the Report model
const MANUAL_METRICS = [
  { label: "Inquiries",  key: "inquiries"  },
  { label: "Attendance", key: "attendance" },
];

export function ReportDetailPanel({ report, onDrilldown }) {
  const [manualOpen, setManualOpen] = useState(true);
  if (!report) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl border border-blue-100 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{report.branch_name}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> {fmtDate(report.report_date)}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <User className="w-3.5 h-3.5 text-blue-500" /> {report.created_by_name}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
            Daily report
          </span>
        </div>
      </div>

      {/* Live metrics */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Operational metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AUTO_METRICS.map((m) => (
            <DetailMetricCard
              key={m.key}
              label={m.label}
              value={m.isCurrency ? fmt(report[m.key] ?? 0) : (report[m.key] ?? 0)}
              accent={m.accent}
              drillKey={m.drillKey}
              textColor={m.textColor}
              onDrilldown={onDrilldown}
            />
          ))}
        </div>
      </div>

      {/* Course breakdown */}
      {report.course_breakdown && Object.keys(report.course_breakdown).length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Course breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.course_breakdown).map(([course, count]) => (
              <span key={course} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-blue-700 border border-blue-200">
                {course}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Practical trips — replaces the old manual/auto lesson section */}
      <TripSummary reportId={report.id} />

      {/* Manual inputs — attendance + inquiries only */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => setManualOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Manual inputs</p>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${manualOpen ? "rotate-90" : ""}`} />
        </button>
        {manualOpen && (
          <div className="grid grid-cols-2 gap-3 p-4">
            {MANUAL_METRICS.map(({ label, key }) => (
              <div key={key} className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-xl font-bold text-gray-800">{report[key] ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}