import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown, ChevronUp, CalendarDays, MapPin,
  Users, ShieldAlert, CheckCircle, XCircle, Loader2,
  Download, UserMinus, Search, ChevronLeft, ChevronRight,
  MessageSquare, ThumbsUp, UserCheck, Clock, Pencil,
} from "lucide-react";
import { Btn, Badge } from "../../ui";
import { SearchableSelect } from "../../ui/SearchableSelect";
import { fmtDate, getCourseStatus } from "../../utils/students.utils";
import { examsAPI } from "../../api/exams.api";
import { branchesAPI } from "../../api/branches.api";
import { toast } from "../../pages/Exams";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Brand accents — matches Broadcast page & Exams.jsx
// ─────────────────────────────────────────────────────────────
const BRAND      = "#c41820";
const BRAND_DARK = "#8f1017";
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`;
const BRAND_SHADOW   = "0 4px 14px rgba(196,24,32,0.32)";
const HEADER_GRADIENT = "linear-gradient(135deg, #2c1417, #c41820)";

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
// Booking status badge (admin approval — separate from exam result)
// ─────────────────────────────────────────────────────────────
function bookingStatusBadge(status) {
  if (status === "confirmed")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <UserCheck className="w-3 h-3" /> Confirmed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Awaiting approval
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
// Branch badge
// ─────────────────────────────────────────────────────────────
function BranchBadge({ name }) {
  if (!name) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap uppercase">
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Comments panel — always editable
// ─────────────────────────────────────────────────────────────
function CommentsPanel({ booking, isSuperAdmin, onApprove, onSaveComment, actionLoading }) {
  const [draft1, setDraft1] = useState(booking.admin1_comment ?? "");
  const [draft2, setDraft2] = useState(booking.admin2_comment ?? "");
  const [editing1, setEditing1] = useState(!booking.admin1_comment);
  const [editing2, setEditing2] = useState(!booking.admin2_comment);
  const [saving1, setSaving1] = useState(false);
  const [saving2, setSaving2] = useState(false);
  const isLoading = actionLoading === booking.id;
  const isPending = booking.status !== "confirmed";

  const handleSave1 = async () => {
    setSaving1(true);
    const ok = await onSaveComment(booking, { admin1_comment: draft1 });
    setSaving1(false);
    if (ok) { setEditing1(false); toast({ variant: "success", title: "Note saved" }); }
    else toast({ variant: "error", title: "Failed to save note" });
  };

  const handleSave2 = async () => {
    setSaving2(true);
    const ok = await onSaveComment(booking, { admin2_comment: draft2 });
    setSaving2(false);
    if (ok) { setEditing2(false); toast({ variant: "success", title: "Note saved" }); }
    else toast({ variant: "error", title: "Failed to save note" });
  };

  const handleApproveClick = () => onApprove(booking, draft2);

  return (
    <tr className="bg-red-50/30 border-b border-gray-100">
      <td colSpan={9} className="px-5 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* Admin 1 note */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Admin 1 note
            </p>
            {isSuperAdmin ? (
              editing1 ? (
                <>
                  <textarea
                    rows={2}
                    value={draft1}
                    onChange={(e) => setDraft1(e.target.value)}
                    placeholder="Note when student was added to exam list…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 resize-none
                      focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      disabled={saving1}
                      onClick={handleSave1}
                      style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                        text-white disabled:opacity-50 transition-all hover:brightness-110"
                    >
                      {saving1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Save note
                    </button>
                    {draft1 && (
                      <button onClick={() => setEditing1(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed flex-1">
                    {draft1 || <span className="text-gray-300 italic">No note.</span>}
                  </p>
                  <button
                    onClick={() => setEditing1(true)}
                    title="Edit note"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#c41820] hover:bg-red-50 transition-all shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {booking.admin1_comment || <span className="text-gray-300 italic">No note.</span>}
              </p>
            )}
          </div>

          {/* Admin 2 note */}
          {isSuperAdmin && (
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
                <ThumbsUp className="w-3 h-3" /> Admin 2 note
              </p>
              {editing2 ? (
                <>
                  <textarea
                    rows={2}
                    value={draft2}
                    onChange={(e) => setDraft2(e.target.value)}
                    placeholder="Optional note before approving…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 resize-none
                      focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    {isPending && (
                      <button
                        disabled={isLoading}
                        onClick={handleApproveClick}
                        style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                          text-white disabled:opacity-50 transition-all hover:brightness-110"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve booking
                      </button>
                    )}
                    <button
                      disabled={saving2}
                      onClick={handleSave2}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                        border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100
                        disabled:opacity-50 transition-all"
                    >
                      {saving2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      Save note
                    </button>
                    {draft2 && (
                      <button onClick={() => setEditing2(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed flex-1">
                    {draft2 || <span className="text-gray-300 italic">No note.</span>}
                  </p>
                  <button
                    onClick={() => setEditing2(true)}
                    title="Edit note"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#c41820] hover:bg-red-50 transition-all shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// StudentRow
// ─────────────────────────────────────────────────────────────
function StudentRow({ booking, exam, isSuperAdmin, onResult, onRemove, onApprove, onSaveComment, actionLoading, confirm }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isLoading = actionLoading === booking.id;

  const canRecordResult =
    isSuperAdmin &&
    exam.status === "closed" &&
    booking.status === "confirmed" &&
    !booking.result;

  const canRemove = exam.status === "active" && !booking.result;
  const isPendingApproval = booking.status !== "confirmed";
  const hasComment = !!(booking.admin1_comment || booking.admin2_comment);

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

  const handleQuickApprove = () => onApprove(booking, booking.admin2_comment ?? "");

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-red-50/20 transition-colors duration-150">
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

        {/* SC Status */}
        <td className="px-5 py-4">
          <CourseStatusBadge status={booking.student_course_status} />
        </td>

        {/* Booking status (admin approval) */}
        <td className="px-5 py-4">{bookingStatusBadge(booking.status)}</td>

        {/* Result */}
        <td className="px-5 py-4">{resultBadge(booking.result)}</td>

        {/* Actions */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            {isSuperAdmin && isPendingApproval ? (
              /* Approve — primary action, front and center in the list */
              <button
                disabled={isLoading}
                onClick={handleQuickApprove}
                style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                  text-white disabled:opacity-50 transition-all hover:brightness-110"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </button>
            ) : canRecordResult ? (
              <>
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

            {/* Comments toggle — always available */}
            <button
              onClick={() => setCommentsOpen((p) => !p)}
              title="View comments"
              style={commentsOpen ? { background: BRAND_GRADIENT } : undefined}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                commentsOpen
                  ? "border-transparent text-white shadow-sm"
                  : "border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
              } ${hasComment && !commentsOpen ? "ring-2 ring-amber-200" : ""}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {commentsOpen && (
        <CommentsPanel
          booking={booking}
          isSuperAdmin={isSuperAdmin}
          onApprove={onApprove}
          onSaveComment={onSaveComment}
          actionLoading={actionLoading}
        />
      )}
    </>
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
          style={page === 1 ? undefined : { background: BRAND_GRADIENT }}
          className="p-1.5 rounded-lg text-white disabled:opacity-30 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              style={p === page ? { background: BRAND_GRADIENT } : undefined}
              className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${
                p === page
                  ? "text-white shadow-sm"
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
          style={page === totalPages ? undefined : { background: BRAND_GRADIENT }}
          className="p-1.5 rounded-lg text-white disabled:opacity-30 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
  onApprove,
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
  const pendingApprovalCount = bookings.filter((b) => b.status !== "confirmed").length;

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

  const handleSaveComment = async (booking, data) => {
    try {
      const updated = await examsAPI.patchBooking(booking.id, data);
      setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, ...updated } : b));
      return true;
    } catch {
      return false;
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

  const handleApprove = async (booking, comment) => {
    setActionLoading(booking.id);
    const ok = await onApprove(booking, comment);
    if (ok) {
      setBookings((prev) => prev.map((b) =>
        b.id === booking.id ? { ...b, status: "confirmed", admin2_comment: comment } : b
      ));
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
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 bg-white ${
        open
          ? "border-red-200 shadow-lg"
          : "border-gray-200 shadow-sm hover:shadow-md hover:border-red-100"
      }`}
    >
      {/* Top accent bar — brand red, always present, brighter when open */}
      <div
        className="absolute top-0 inset-x-0 h-1 transition-opacity duration-300"
        style={{ background: BRAND_GRADIENT, opacity: open ? 1 : 0.35 }}
      />

      {/* ── Card Header ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`w-full px-6 pt-6 pb-5 text-left transition-colors duration-200 ${
          open ? "bg-gradient-to-r from-red-50/60 via-white to-white hover:from-red-50" : "bg-white hover:bg-gray-50/60"
        }`}
      >
        <div className="flex items-start justify-between gap-5">
          <div className="flex gap-4">
            {/* Expand toggle icon */}
            <div
              style={open ? { background: BRAND_GRADIENT } : undefined}
              className={`mt-1 p-2 rounded-xl border shrink-0 transition-all duration-200 ${
                open
                  ? "border-transparent text-white shadow-sm"
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Closed
                  </span>
                )}
                {open && pendingApprovalCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" /> {pendingApprovalCount} awaiting approval
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
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: BRAND_GRADIENT }}
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
                open ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className={`text-xl font-black tabular-nums ${open ? "text-red-700" : "text-gray-900"}`}>
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
                  focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300
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
                { value: "",     label: "All",    activeClass: "bg-gray-100 text-gray-800" },
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
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-red-400" />
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
                  <tr style={{ background: HEADER_GRADIENT }}>
                    {["Student", "ID No.", "Phone", "Branch", "Course", "SC Status", "Booking", "Result", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-extrabold text-white/70 uppercase tracking-widest whitespace-nowrap"
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
                      onApprove={handleApprove}
                      onRemove={handleRemove}
                      onSaveComment={handleSaveComment}
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