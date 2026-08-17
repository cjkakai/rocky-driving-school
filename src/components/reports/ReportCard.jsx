import { useState } from "react";
import {
  Users, DollarSign, BookOpen, ClipboardCheck, Eye,
  Calendar, User, ChevronRight,
} from "lucide-react";
import { fmt, fmtDate } from "../../utils/students.utils";

const KPI_CONFIG = [
  { key: "payment_total",                label: "Revenue",    icon: DollarSign,    color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-100",  fmt: (v) => fmt(v) },
  { key: "student_registrations",        label: "Students",   icon: Users,         color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-100",  fmt: (v) => v },
  { key: "student_course_registrations", label: "Enrollments",icon: BookOpen,      color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-100",  fmt: (v) => v },
  { key: "exam_bookings_count",          label: "Exams",      icon: ClipboardCheck,color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",   fmt: (v) => v },
];

export function ReportCard({ report, onClick }) {
  const period = fmtDate(report.report_date);
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer overflow-hidden
        hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 transition-all duration-200"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate transition-colors">
              {report.branch_name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{period}</p>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                Daily
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
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
          className="mt-2.5 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <Eye className="w-3 h-3" /> View details
        </button>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

const AUTO_METRICS = [
  { label: "Student registrations",  key: "student_registrations",        accent: "from-gray-500 to-gray-600",    drillKey: "student_registrations",        textColor: "text-gray-800"   },
  { label: "Course enrollments",     key: "student_course_registrations",  accent: "from-gray-500 to-gray-600",   drillKey: "student_course_registrations", textColor: "text-gray-800" },
  { label: "Payments",               key: "payment_count",                 accent: "from-emerald-500 to-emerald-600",  drillKey: "payments",                     textColor: "text-emerald-700"  },
  { label: "Revenue",                key: "payment_total",                 accent: "from-gray-500 to-gray-600",    drillKey: null,                           textColor: "text-gray-800",  isCurrency: true },
  { label: "Exam bookings",          key: "exam_bookings_count",           accent: "from-red-500 to-red-600",      drillKey: "exam_bookings",                textColor: "text-red-700"    },
];

// Manual fields that still exist on the Report model
const MANUAL_METRICS = [
  { label: "Inquiries", key: "inquiries" },
];

export function ReportDetailPanel({ report, onDrilldown }) {
  const [manualOpen, setManualOpen] = useState(true);
  if (!report) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{report.branch_name}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-gray-500" /> {fmtDate(report.report_date)}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <User className="w-3.5 h-3.5 text-gray-500" /> {report.created_by_name}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
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
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Course breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.course_breakdown).map(([course, count]) => (
              <span key={course} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200">
                {course}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* Manual inputs — inquiries only */}
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