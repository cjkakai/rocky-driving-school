import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown, ChevronUp, CalendarDays, MapPin,
  Users, ShieldAlert, CheckCircle, XCircle, Loader2,
  Download, UserMinus, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Btn, Badge } from "../../ui";
import { SearchableSelect } from "../../ui/SearchableSelect";
import { fmtDate, getCourseStatus } from "../../utils/students.utils";
import { examsAPI } from "../../api/exams.api";
import { branchesAPI } from "../../api/branches.api";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Result badge
// ─────────────────────────────────────────────────────────────
function resultBadge(result) {
  if (result === "pass")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Passed
      </span>
    );
  if (result === "fail")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      Pending
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Course status badge — uses getCourseStatus colors
// ─────────────────────────────────────────────────────────────
function CourseStatusBadge({ status }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const cfg = getCourseStatus(status);
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        background: `${cfg.color}18`,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Branch badge — colored instead of gray
// ─────────────────────────────────────────────────────────────
function BranchBadge({ name }) {
  if (!name) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap uppercase">
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// StudentRow
// ─────────────────────────────────────────────────────────────
function StudentRow({ booking, exam, isSuperAdmin, onResult, onRemove, actionLoading, confirm }) {
  const isLoading = actionLoading === booking.id;
  const canAct =
    isSuperAdmin &&
    exam.status === "closed" &&
    booking.status === "confirmed" &&
    !booking.result;

  const canRemove = exam.status === "active" && !booking.result;

  const handlePass = () => onResult(booking, "pass");

  const handleFail = async () => {
    const ok = await confirm({
      title: "Mark as Failed?",
      message: `This will record ${booking.student_name} as FAILED. This action cannot be undone.`,
      confirmLabel: "Yes, Failed",
      danger: true,
    });
    if (!ok) return;
    onResult(booking, "fail");
  };

  const handleRemove = async () => {
    const ok = await confirm({
      title: "Remove from exam?",
      message: `${booking.student_name} will be removed from this exam. The branch can rebook them into another exam.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    onRemove(booking);
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-slate-50/80 transition-colors duration-150">
      {/* Student */}
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{booking.student_name ?? "—"}</p>
        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{booking.student_admission ?? "—"}</p>
      </td>

      {/* ID No */}
      <td className="px-5 py-4">
        <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
          {booking.student_id_number ?? "—"}
        </span>
      </td>

      {/* Phone */}
      <td className="px-5 py-4 text-sm text-gray-600 tabular-nums">
        {booking.student_phone ?? "—"}
      </td>

      {/* Branch */}
      <td className="px-5 py-4">
        <BranchBadge name={booking.branch_name} />
      </td>

      {/* Course */}
      <td className="px-5 py-4 text-xs text-gray-600 max-w-[140px] truncate" title={booking.course_name}>
        {booking.course_name ?? "—"}
      </td>

      {/* SC Status — colored */}
      <td className="px-5 py-4">
        <CourseStatusBadge status={booking.student_course_status} />
      </td>

      {/* Result */}
      <td className="px-5 py-4">{resultBadge(booking.result)}</td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {canAct ? (
            <>
              {/* Pass — solid green */}
              <button
                disabled={isLoading}
                onClick={handlePass}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                  bg-emerald-500 hover:bg-emerald-600 text-white
                  disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <CheckCircle className="w-3.5 h-3.5" />}
                Pass
              </button>

              {/* Fail — solid red */}
              <button
                disabled={isLoading}
                onClick={handleFail}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                  bg-red-500 hover:bg-red-600 text-white
                  disabled:opacity-50 transition-all shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" />
                Fail
              </button>
            </>
          ) : canRemove ? (
            /* Remove — red-tinted outline */
            <button
              disabled={isLoading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                border border-red-200 text-red-600 bg-red-50
                hover:bg-red-100 hover:border-red-300
                disabled:opacity-50 transition-all"
            >
              {isLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <UserMinus className="w-3.5 h-3.5" />}
              Remove
            </button>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// CardPagination
// ─────────────────────────────────────────────────────────────
function CardPagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, totalCount);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
      <p className="text-xs text-gray-500">
        Showing <span className="font-bold text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-bold text-gray-700">{totalCount}</span> students
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${
                p === page
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ExamCard
// ─────────────────────────────────────────────────────────────
export function ExamCard({
  exam,
  isSuperAdmin,
  onResult,
  onRemove,
  onClose,
  confirm,
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [branches, setBranches] = useState([]);
  const [filterBranch, setFilterBranch] = useState("");

  useEffect(() => {
    if (isSuperAdmin) branchesAPI.getAll().then(setBranches).catch(() => {});
  }, [isSuperAdmin]);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [totalCount, setTotalCount] = useState(exam.booking_count ?? 0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const [examStats, setExamStats] = useState({ passed: 0, failed: 0, pending: totalCount });

  const fetchExamStats = useCallback(async () => {
    try {
      const data = await examsAPI.getSummary({ exam_id: exam.id });
      setExamStats(data);
    } catch { /* silently fail */ }
  }, [exam.id]);

  useEffect(() => {
    if (open) fetchExamStats();
  }, [open, fetchExamStats]);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await examsAPI.getBookings({
        exam_id: exam.id,
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(isSuperAdmin && filterBranch && { branch_id: filterBranch }),
        ...(resultFilter && { result: resultFilter }),
      });
      const results = data.results ?? [];
      setBookings(results);
      setTotalCount(data.count ?? results.length);
      setTotalPages(data.total_pages ?? 1);
    } catch {
      // silently fail
    } finally {
      setLoadingBookings(false);
    }
  }, [exam.id, page, debouncedSearch, filterBranch, isSuperAdmin, resultFilter]);

  useEffect(() => {
    if (open) fetchBookings();
  }, [open, fetchBookings]);

  const passed  = examStats.passed;
  const failed  = examStats.failed;
  const pending = examStats.pending;

  const totalStudents = exam.booking_count ?? totalCount;

  const examTotal = examStats.passed + examStats.failed + examStats.pending;
  const recorded  = examStats.passed + examStats.failed;
  const progress  = examTotal > 0 ? Math.round((recorded / examTotal) * 100) : 0;

  const isActive = exam.status === "active";

  const handleCloseExam = async (e) => {
    e.stopPropagation();
    const ok = await confirm({
      title: `Close "${exam.exam_name}"?`,
      message: "Once closed, you will be able to record results for all students.",
      confirmLabel: "Close Exam",
      danger: false,
    });
    if (!ok) return;
    onClose(exam.id);
  };

  const handleExport = async (e) => {
    e.stopPropagation();
    setExporting(true);
    try {
      await examsAPI.exportExam(exam.id);
    } finally {
      setExporting(false);
    }
  };

  const handleResult = async (booking, result) => {
    setActionLoading(booking.id);
    const ok = await onResult(booking, result);
    if (ok) {
      setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, result } : b));
      fetchExamStats();
    }
    setActionLoading(null);
  };

  const handleRemove = async (booking) => {
    setActionLoading(booking.id);
    const ok = await onRemove(booking);
    if (ok) {
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setTotalCount((c) => Math.max(0, c - 1));
      fetchExamStats();
    }
    setActionLoading(null);
  };

  const handlePageChange = (p) => setPage(p);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 bg-white ${
        open
          ? "border-blue-300 shadow-lg border-l-4 border-l-blue-500"
          : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
      }`}
    >
      {/* ── Card Header ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`w-full px-6 py-5 text-left transition-colors duration-200 ${
          open ? "bg-slate-50 hover:bg-slate-100/70" : "bg-white hover:bg-slate-50/60"
        }`}
      >
        <div className="flex items-start justify-between gap-5">
          <div className="flex gap-4">
            {/* Expand toggle icon */}
            <div
              className={`mt-1 p-2 rounded-xl border shrink-0 transition-all duration-200 ${
                open
                  ? "bg-blue-100 border-blue-200 text-blue-600"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            <div className="min-w-0">
              {/* Exam name + status pill */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-black text-lg text-gray-900 leading-tight">
                  {exam.exam_name}
                </p>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Closed
                  </span>
                )}
              </div>

              {/* Date + location */}
              <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {fmtDate(exam.exam_date)}
                </span>
                {exam.test_center && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {exam.test_center}
                  </span>
                )}
              </div>

              {/* Stats badges — shown when open and loaded */}
              {open && !loadingBookings && bookings.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {passed} Passed
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {failed} Failed
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {pending} Pending
                  </span>
                </div>
              )}

              {/* Progress bar */}
              {open && (
                <div className="mt-4 w-full max-w-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
                      Results Recorded
                    </p>
                    <p className="text-xs font-bold text-gray-600 tabular-nums">
                      {recorded}/{examTotal}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side — student count + action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`px-4 py-2 rounded-xl border text-center transition-colors duration-200 ${
                open ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className={`text-xl font-black tabular-nums ${open ? "text-blue-700" : "text-gray-900"}`}>
                {totalStudents}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Students</p>
            </div>

            <Btn size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </Btn>

            {isSuperAdmin && isActive && (
              <Btn size="sm" variant="outline" onClick={handleCloseExam}>
                <ShieldAlert className="w-4 h-4" />
                Close Exam
              </Btn>
            )}
          </div>
        </div>
      </button>

      {/* ── Expanded Body ── */}
      {open && (
        <div className="border-t border-gray-200 bg-white">

          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name, admission no, phone, ID..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                  bg-white text-gray-700 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Branch filter */}
            {isSuperAdmin && branches.length > 0 && (
              <div className="w-48 shrink-0">
                <SearchableSelect
                  value={filterBranch}
                  onChange={(v) => { setFilterBranch(v); setPage(1); }}
                  options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                  placeholder="All Branches"
                  triggerClassName="py-2"
                />
              </div>
            )}

            {/* Result filter tabs */}
            <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shrink-0 shadow-sm">
              {[
                { value: "",     label: "All",    activeClass: "bg-blue-50 text-blue-700 border-r-blue-200" },
                { value: "pass", label: "Passed", activeClass: "bg-emerald-50 text-emerald-700" },
                { value: "fail", label: "Failed", activeClass: "bg-red-50 text-red-600" },
              ].map(({ value, label, activeClass }, i, arr) => (
                <button
                  key={label}
                  onClick={() => { setResultFilter(value); setPage(1); }}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                    i < arr.length - 1 ? "border-r border-gray-200" : ""
                  } ${
                    resultFilter === value ? activeClass : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loadingBookings ? (
            <div className="py-14 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-sm">Loading students…</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-gray-500">
                {debouncedSearch ? "No students match your search" : "No bookings yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {/* Dark gradient header — matches student table */}
                  <tr style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
                    {["Student", "ID No.", "Phone", "Branch", "Course", "SC Status", "Result", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-extrabold text-white/60 uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <StudentRow
                      key={b.id}
                      booking={b}
                      exam={exam}
                      isSuperAdmin={isSuperAdmin}
                      onResult={handleResult}
                      onRemove={handleRemove}
                      actionLoading={actionLoading}
                      confirm={confirm}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <CardPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}