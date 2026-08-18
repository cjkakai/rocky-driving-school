import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Phone, Search, Loader2,
  ChevronLeft, ChevronRight, BookOpen, CheckCircle,
  Pencil, Trash2, IdCard, Eye,
} from "lucide-react";
import { Btn, ProgressBar, Badge } from "../ui";
import {
  fmt, fmtDate, fmtTime, computeTotals, studentStatusBadge,
  getCourseStatus,
} from "../utils/students.utils";
import {
  adminPrimaryAction, branchPrimaryAction,
} from "../utils/studentActions";

const TH = ({ children, className }) => (
  <th
    className={`px-4 py-3.5 text-left text-[10px] font-extrabold text-white/60 uppercase tracking-widest whitespace-nowrap ${className ?? ""}`}
  >
    {children}
  </th>
);

/* ─── Course Progress Summary cell ──────────────────────────────── */
function CourseProgressCell({ student }) {
  const courses = student.student_courses ?? [];
  if (courses.length === 0) return <span className="text-xs text-gray-400">—</span>;

  const counts = {};
  for (const sc of courses) {
    counts[sc.status] = (counts[sc.status] || 0) + 1;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(counts).map(([status, count]) => {
        const cfg = getCourseStatus(status);
        return (
          <span
            key={status}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              background: `${cfg.color}18`,
              color: cfg.color,
              border: `1px solid ${cfg.color}40`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
            {count} {cfg.short}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Next-action cell ───────────────────────────────────────────── */
function NextActionCell({ student, isBranchUser, isSuperAdmin, onEnroll, onApprovePdl, onApproveExam }) {
  const action = isSuperAdmin
    ? adminPrimaryAction(student)
    : branchPrimaryAction(student);

  if (action.kind === "none") return <span className="text-xs text-gray-300">—</span>;

  if (action.kind === "approve-pdl")
    return (
      <button
        onClick={() => onApprovePdl({ id: action.resourceId, studentId: student.id })}
        className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
      >
        <CheckCircle className="w-3 h-3" />
        {action.label}
      </button>
    );

  if (action.kind === "approve-exam")
    return (
      <button
        onClick={() => onApproveExam({ id: action.resourceId, studentId: student.id })}
        className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-[#c41820] to-[#ed1c24] hover:from-[#ed1c24] hover:to-[#ff3d44] text-white px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
      >
        <CheckCircle className="w-3 h-3" />
        {action.label}
      </button>
    );

  if (action.kind === "enroll")
    return (
      <button
        onClick={() => onEnroll(student)}
        className="flex items-center gap-1.5 text-xs font-bold border border-[#c41820] text-[#c41820] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
      >
        <BookOpen className="w-3 h-3" />
        {action.label}
      </button>
    );

  const toneClass = {
    "submit-pdl":  "text-amber-600 bg-amber-50 border-amber-200",
    "submit-exam": "text-green-700 bg-green-50 border-green-200",
    reactivate:    "text-orange-600 bg-orange-50 border-orange-200",
  };
  return (
    <span className={`text-[11px] font-semibold italic border px-2 py-0.5 rounded-full ${toneClass[action.kind] ?? "text-gray-500"}`}>
      {action.label}
    </span>
  );
}

/* ─── Student row ────────────────────────────────────────────────── */
function StudentRow({
  student,
  isBranchUser, isSuperAdmin,
  onApprovePdl, onApproveExam, onEnroll,
  onEdit, onDelete,
  isEvenRow,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const totals = useMemo(() => computeTotals(student), [student]);

  const { courseDisplay, courseNamesTitle } = useMemo(() => {
    const names = (student.student_courses ?? []).map((sc) => sc.course_name);
    return {
      courseDisplay:    names.length === 0 ? "—" : names.length === 1 ? names[0] : `${names.length} courses`,
      courseNamesTitle: names.join(", "),
    };
  }, [student]);

  const handleView = () => {
    navigate(`/dashboard/students/${student.id}/overview`, {
      state: { from: location.pathname },
    });
  };

  return (
    <tr
      className={`
        border-b border-gray-200 transition-all duration-150
        ${isEvenRow ? "bg-gray-50/40" : "bg-white"}
        hover:bg-[#c41820]/5
      `}
    >
      {/* Reg date */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-700 tabular-nums">{fmtDate(student.created_at)}</span>
          <span className="text-[11px] text-gray-400 tabular-nums">{fmtTime(student.created_at)}</span>
        </div>
      </td>

      {/* Adm no */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md tracking-wide">
          {student.admission_number}
        </span>
      </td>

      {/* Branch */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-xs font-semibold text-gray-600 uppercase">{student.branch?.name ?? "—"}</span>
      </td>

      {/* Student name + courses */}
      <td className="px-4 py-4">
        <p className="font-extrabold text-gray-900 text-sm leading-tight">{student.full_name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[180px]" title={courseNamesTitle}>
          {courseDisplay}
        </p>
      </td>

      {/* Student aggregate status */}
      <td className="px-4 py-4">{studentStatusBadge(student.status)}</td>

      {/* Course Progress Summary */}
      <td className="px-4 py-3">
        <CourseProgressCell student={student} />
      </td>

      {/* Phone + ID */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="tabular-nums">{student.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
          <IdCard className="w-3 h-3 shrink-0" />
          <span className="tabular-nums">{student.id_number}</span>
        </div>
      </td>

      {/* Amount agreed */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm font-black text-gray-800 tabular-nums">{fmt(totals.agreedTotal)}</span>
      </td>

      {/* Progress */}
      <td className="px-4 py-4 min-w-[110px]">
        <ProgressBar value={totals.progress} />
      </td>

      {/* Balance */}
      <td className="px-4 py-4 whitespace-nowrap">
        {totals.balance > 0 ? (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full tabular-nums">
            {fmt(totals.balance)}
          </span>
        ) : (
          <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            Cleared
          </span>
        )}
      </td>

      {/* Next action */}
      <td className="px-4 py-4">
        <NextActionCell
          student={student}
          isBranchUser={isBranchUser}
          isSuperAdmin={isSuperAdmin}
          onEnroll={onEnroll}
          onApprovePdl={onApprovePdl}
          onApproveExam={onApproveExam}
        />
      </td>

      {/* Actions: View + Edit/Delete */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleView}
            style={{ background: "linear-gradient(135deg, #8f1017, #c41820)", boxShadow: "0 4px 14px rgba(196,24,32,0.32)" }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:brightness-110 whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => onEdit?.(student)}
                title="Edit student"
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#c41820] hover:bg-red-50 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete?.(student)}
                title="Delete student"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Pagination ─────────────────────────────────────────────────── */
function getPageItems(page, totalPages) {
  const items = [];
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) items.push({ type: "gap", key: `gap-${idx}` });
    items.push({ type: "page", page: p });
  });
  return items;
}

function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);
  const items = getPageItems(page, totalPages);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
      <p className="text-xs text-gray-500">
        Showing{" "}
        <span className="font-bold text-gray-700 tabular-nums">{from}–{to}</span>
        {" "}of{" "}
        <span className="font-bold text-gray-700 tabular-nums">{totalCount}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg bg-[#1a0a0b] text-white hover:bg-[#3d1a1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {items.map((item) =>
          item.type === "gap" ? (
            <span key={item.key} className="px-1 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={`p-${item.page}`}
              onClick={() => onPageChange(item.page)}
              className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${
                item.page === page
                  ? "bg-[#1a0a0b] text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.page}
            </button>
          ),
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg bg-[#1a0a0b] text-white hover:bg-[#3d1a1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Student Table ──────────────────────────────────────────────── */
export function StudentTable({
  students, loading,
  page, totalPages, totalCount, pageSize, onPageChange,
  onEnroll, exams = [],
  isSuperAdmin,
  ...rowProps
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#1a0a0b] flex items-center justify-center shadow-lg animate-pulse">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-500">Loading students…</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Search className="w-6 h-6 opacity-40" />
        </div>
        <p className="font-semibold text-gray-500">No students found</p>
        <p className="text-sm text-gray-400">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 bg-white" style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -4px rgba(0,0,0,0.08)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.875rem]">
          <thead>
            <tr style={{ background: "#1a0a0b" }}>
              <TH>Reg. Date</TH>
              <TH>Adm. No</TH>
              <TH>Branch</TH>
              <TH>Student</TH>
              <TH>Status</TH>
              <TH>Courses</TH>
              <TH>Contact</TH>
              <TH>Amount</TH>
              <TH>Progress</TH>
              <TH>Balance</TH>
              <TH>Next Action</TH>
              <TH>Actions</TH>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => (
              <StudentRow
                key={student.id}
                student={student}
                exams={exams}
                onEnroll={onEnroll}
                isSuperAdmin={isSuperAdmin}
                isEvenRow={index % 2 === 1}
                {...rowProps}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination {...{ page, totalPages, totalCount, pageSize, onPageChange }} />
    </div>
  );
}
