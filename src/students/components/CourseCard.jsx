import { useState, useEffect } from "react";
import {
  PlayCircle, RefreshCw, CheckCircle, Banknote, Calendar,
  Award, Pencil, ChevronDown, ChevronUp, Loader2, Building2,
} from "lucide-react";
import { fmt, computeCourseBalance, getCourseStatus } from "../../utils/students.utils";
import { useAsyncAction } from "../../useAsyncAction";
import { examsAPI } from "../../api/exams.api";
import { studentCoursesAPI } from "../../api/courses.api";
import { pdlAPI } from "../../api/pdl.api";
import { MiniProgress } from "./MiniProgress";
import { PaymentRow } from "./PaymentRow";
import { PdlSection } from "./PdlSection";
import { ExamSection } from "./ExamSection";
import { StkPushModal } from "./StkPushModal";
import { ChangeCourseModal } from "./ChangeCourseModal";

/* ─── Status gradient helper ─────────────────────────────────────── */
function statusGrad(status) {
  const cfg = getCourseStatus(status);
  return { from: cfg.from, to: cfg.to, accent: cfg.color, ring: cfg.ring };
}

export function CourseCard({ sc, isBranchUser, isSuperAdmin, courses, studentCourses = [], onPatch, onSuccess }) {
  const { agreed, paid, balance } = computeCourseBalance(sc);
  const progress = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;
  const exam     = sc.exam_booking;
  const { run, loading } = useAsyncAction({ onSuccess: onPatch ? undefined : onSuccess });
  const grad = statusGrad(sc.status);

  const [showStk,      setShowStk]      = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [activeExams,  setActiveExams]  = useState([]);

  useEffect(() => {
    if (isSuperAdmin) examsAPI.getAll({ status: "active" }).then(setActiveExams).catch(() => {});
  }, [isSuperAdmin]);

  const isTerminal = sc.status === "completed" || sc.status === "transferred";

  const patchCourse = (updatedSc) => {
    onPatch?.((student) => ({
      ...student,
      student_courses: student.student_courses.map((c) =>
        c.id === updatedSc.id ? updatedSc : c
      ),
    }));
  };

  const runAndPatch = async (apiFn, successMsg) => {
    const result = await run(apiFn, successMsg);
    if (result === undefined) return;
    if (onPatch) {
      try {
        const freshSc = await studentCoursesAPI.getOne(sc.id);
        patchCourse(freshSc);
      } catch { /* non-critical */ }
    }
    return result;
  };

  const handleAddPdl = (pdlData) => runAndPatch(
    () => pdlAPI.create({ student_course: sc.id, ...pdlData }),
    "PDL saved — course is now active"
  );
  const handleActivate       = () => runAndPatch(() => studentCoursesAPI.activateCourse(sc.id), "Course reactivated");
  const handleRetake         = () => runAndPatch(() => studentCoursesAPI.applyRetake(sc.id), "Retake applied");
  const handleMarkCompleted  = () => runAndPatch(() => studentCoursesAPI.markCompleted(sc.id), "Course marked as completed");
  const handleSubmitForExam  = () => runAndPatch(() => studentCoursesAPI.submitForExam(sc.id), "Submitted for exam list — awaiting HQ review");

  const paymentCount = (sc.payments ?? []).length;

  return (
    <div className={`relative flex-shrink-0 w-[380px] rounded-2xl overflow-hidden bg-white shadow-md ring-1 ${grad.ring}`}>

      {/* ── Gradient header ── */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
      >
        {/* Top row: status badge + Co-op btn + ref */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            {getCourseStatus(sc.status).label}
          </span>
          <div className="flex items-center gap-2">
            {sc.payment_reference && balance > 0 && !isTerminal && (
              <button
                onClick={() => setShowStk(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition-all hover:brightness-110"
                style={{ background: "#0d9488", color: "#fff", boxShadow: "0 2px 8px rgba(13,148,136,0.45)" }}
              >
                <Building2 className="w-3 h-3" /> Co-op
              </button>
            )}
            {sc.payment_reference && (
              <span className="text-[10px] font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-md tracking-wide">
                {sc.payment_reference}
              </span>
            )}
          </div>
        </div>

        {/* Course name + pencil icon */}
        <div className="flex items-center gap-2">
          <p className="font-black text-white text-base leading-tight tracking-tight flex-1 min-w-0 truncate">
            {sc.course_name}
          </p>
          {isSuperAdmin && !isTerminal && (
            <button
              onClick={() => setShowTransfer(true)}
              className="shrink-0 p-1.5 rounded-lg bg-white/15 hover:bg-white/30 transition-colors"
              title="Change course"
            >
              <Pencil className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-white/70">
            <span>Payment Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <MiniProgress value={progress} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 space-y-4">

        {/* Financials */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Financials</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Agreed",  value: fmt(agreed),  color: "text-gray-800" },
              { label: "Paid",    value: fmt(paid),    color: "text-green-700" },
              {
                label: "Balance",
                value: balance > 0 ? fmt(balance) : "Cleared",
                color: balance > 0 ? "text-red-600" : "text-green-600",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-2 py-2 text-center">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">{label}</p>
                <p className={`text-xs font-black ${color} tabular-nums leading-tight`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payments — collapsible ── */}
        {paymentCount > 0 && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowPayments((p) => !p)}
              className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors group"
            >
              <span className="flex items-center gap-1">
                <Banknote className="w-3 h-3" />
                Payments
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 group-hover:bg-gray-200 text-[9px] font-black text-gray-500 transition-colors normal-case tracking-normal">
                  {paymentCount}
                </span>
              </span>
              {showPayments
                ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              }
            </button>

            {showPayments && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                {sc.payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDL */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> PDL
          </p>
          <PdlSection
            sc={sc}
            isBranchUser={isBranchUser}
            loading={loading}
            onAddPdl={handleAddPdl}
          />
        </div>

        <div className="border-t border-gray-100" />

        {/* Exam */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
            <Award className="w-3 h-3" /> Exam
          </p>
          <ExamSection
            sc={sc}
            exam={exam}
            isBranchUser={isBranchUser}
            isSuperAdmin={isSuperAdmin}
            loading={loading}
            activeExams={activeExams}
            onSubmitForExam={handleSubmitForExam}
            onApproveExam={(examId) => runAndPatch(() => examsAPI.createBooking({ student_course: sc.id, exam: examId }), "Student added to exam list")}
          />
        </div>

        {/* Course action buttons */}
        {sc.status === "dormant" && isBranchUser && (
          <button onClick={handleActivate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            Activate Course (+Ksh 3,000)
          </button>
        )}

        {sc.status === "failed" && isBranchUser && (
          <button onClick={handleRetake} disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-2 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Apply Retake (+Ksh 3,000)
          </button>
        )}

        {sc.is_refresher_course && sc.status !== "completed" && balance === 0 && isBranchUser && (
          <button onClick={handleMarkCompleted} disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Mark as Completed
          </button>
        )}
      </div>

      {/* ── Modals ── */}
      {showStk && (
        <StkPushModal sc={sc} balance={balance} onClose={() => setShowStk(false)} />
      )}

      {showTransfer && (
        <ChangeCourseModal
          sc={sc}
          courses={courses}
          studentCourses={studentCourses}
          onClose={() => setShowTransfer(false)}
          onSuccess={(newSc) => {
            setShowTransfer(false);
            onPatch?.((student) => ({
              ...student,
              student_courses: [
                ...student.student_courses.map((c) =>
                  c.id === sc.id ? { ...c, status: "transferred" } : c
                ),
                newSc,
              ],
            }));
          }}
        />
      )}
    </div>
  );
}
