import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BookOpen, Building2, Pencil, PlayCircle, RefreshCw,
  CheckCircle, XCircle, Clock, Calendar, Award, Loader2,
  AlertTriangle, FileText,
} from "lucide-react";
import { Modal } from "../../ui";
import { EnrollCourseForm } from "../EnrollCourseForm";
import { StkPushModal } from "../components/StkPushModal";
import { ChangeCourseModal } from "../components/ChangeCourseModal";
import { PdlSection } from "../components/PdlSection";
import { coursesAPI, studentCoursesAPI } from "../../api/courses.api";
import { studentsAPI } from "../../api/students.api";
import { pdlAPI } from "../../api/pdl.api";
import { examsAPI } from "../../api/exams.api";
import { useAuth } from "../../context/AuthContext";
import { useAsyncAction } from "../../useAsyncAction";
import { fmt, fmtDate, computeCourseBalance, getCourseStatus } from "../../utils/students.utils";
import { canBookPdl, canBookExam, examBlockedReason } from "../../utils/studentActions";

/* ── Tiny section label ─────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
      {children}
    </p>
  );
}

/* ── Divider ────────────────────────────────────────────────────── */
function Divider() {
  return <div className="border-t border-gray-100" />;
}

/* ── Single enrollment panel ────────────────────────────────────── */
function EnrollmentPanel({ sc, courses, studentCourses, isBranchUser, isSuperAdmin, onPatch, onSuccess, isSelected, onSelect }) {
  const [showStk, setShowStk] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const { agreed, paid, balance } = computeCourseBalance(sc);
  const paymentPct = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;
  const cfg = getCourseStatus(sc.status);
  const isTerminal = sc.status === "completed" || sc.status === "transferred";
  const exam = sc.exam_booking;

  const patchCourse = async () => {
    try {
      const freshSc = await studentCoursesAPI.getOne(sc.id);
      onPatch((student) => ({
        ...student,
        student_courses: student.student_courses.map((c) => c.id === freshSc.id ? freshSc : c),
      }));
    } catch { /* non-critical */ }
  };

  const { run, loading } = useAsyncAction({ onSuccess: patchCourse });

  const handleBookPdl  = () => run(() => pdlAPI.create({ student_course: sc.id }), "PDL booked — awaiting approval");
  const handleActivate = () => run(() => studentCoursesAPI.activateCourse(sc.id), "Course reactivated");
  const handleRetake   = () => run(() => studentCoursesAPI.applyRetake(sc.id), "Retake applied");
  const handleMarkCompleted = () => run(() => studentCoursesAPI.markCompleted(sc.id), "Course marked as completed");
  const handleApproveExam   = () => run(() => examsAPI.approve(exam.id), "Exam approved");
  const handleApprovePdl    = () => run(() => pdlAPI.approve(sc.pending_pdl_booking_id), "PDL approved");

  const examStatusConfig = {
    pending:   { color: "text-amber-700 bg-amber-50 border-amber-200",  icon: <Clock className="w-3 h-3" />,       label: "Pending approval" },
    confirmed: { color: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle className="w-3 h-3" />, label: "Confirmed" },
    failed:    { color: "text-red-600 bg-red-50 border-red-200",        icon: <XCircle className="w-3 h-3" />,     label: "Failed" },
    passed:    { color: "text-blue-700 bg-blue-50 border-blue-200",     icon: <Award className="w-3 h-3" />,       label: "Passed" },
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        isSelected ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
      }`}
    >

      {/* ── Header strip ── */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-10 rounded-full shrink-0"
            style={{ background: cfg.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-gray-900 truncate">{sc.course_name}</h3>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {sc.payment_reference && (
                <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {sc.payment_reference}
                </span>
              )}
              <span className="text-xs text-gray-400">
                Started {fmtDate(sc.registration_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* STK push — only when there's a balance and not terminal */}
          {balance > 0 && !isTerminal && (
            <button
              onClick={() => setShowStk(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
              style={{ background: "#0d9488", color: "#fff" }}
            >
              <Building2 className="w-3.5 h-3.5" /> Co-op STK
            </button>
          )}
          {/* Change course — super_admin only, non-terminal */}
          {isSuperAdmin && !isTerminal && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
            >
              <Pencil className="w-3.5 h-3.5" /> Change Course
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Column 1 — Financials */}
        <div className="space-y-3">
          <SectionLabel>Financials</SectionLabel>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Agreed</span>
              <span className="font-bold text-gray-800 tabular-nums">{fmt(agreed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid</span>
              <span className="font-bold text-green-700 tabular-nums">{fmt(paid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance</span>
              <span className={`font-bold tabular-nums ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                {balance > 0 ? fmt(balance) : "Cleared"}
              </span>
            </div>
          </div>
          {/* Payment progress bar */}
          <div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${paymentPct}%`, background: cfg.color }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{Math.round(paymentPct)}% paid</p>
          </div>
        </div>

        {/* Column 2 — PDL */}
        <div className="space-y-3">
          <SectionLabel>PDL</SectionLabel>
          <PdlSection
            sc={sc}
            isBranchUser={isBranchUser}
            isSuperAdmin={isSuperAdmin}
            loading={loading}
            onBookPdl={handleBookPdl}
            onApprovePdl={handleApprovePdl}
          />
        </div>

        {/* Column 3 — Exam */}
        <div className="space-y-3">
          <SectionLabel>Exam</SectionLabel>
          {exam?.status ? (
            <div className="space-y-2">
              {exam.exam_name && (
                <p className="text-xs font-semibold text-gray-700 leading-snug">{exam.exam_name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full ${examStatusConfig[exam.status]?.color ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                  {examStatusConfig[exam.status]?.icon}
                  {examStatusConfig[exam.status]?.label ?? exam.status}
                </span>
                {exam.exam_date && (
                  <span className="text-xs text-gray-400 tabular-nums">{fmtDate(exam.exam_date)}</span>
                )}
              </div>
              {exam.status === "pending" && isSuperAdmin && (
                <button
                  onClick={handleApproveExam}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve Exam
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No exam booked</span>
          )}
          {canBookExam(sc) && (
            <button
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Book Exam
            </button>
          )}
          {examBlockedReason(sc) && (
            <p className="text-xs text-red-400 italic">{examBlockedReason(sc)}</p>
          )}
        </div>
      </div>

      {/* ── Course action buttons (conditional) ── */}
      {(
        (sc.status === "dormant" && isBranchUser) ||
        (sc.status === "failed" && isBranchUser) ||
        (sc.is_refresher_course && sc.status !== "completed" && balance === 0 && isBranchUser)
      ) && (
        <>
          <Divider />
          <div className="px-6 py-4 flex flex-wrap gap-3">
            {sc.status === "dormant" && isBranchUser && (
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Activate Course (+Ksh 3,000)
              </button>
            )}
            {sc.status === "failed" && isBranchUser && (
              <button
                onClick={handleRetake}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Apply Retake (+Ksh 3,000)
              </button>
            )}
            {sc.is_refresher_course && sc.status !== "completed" && balance === 0 && isBranchUser && (
              <button
                onClick={handleMarkCompleted}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark as Completed
              </button>
            )}
          </div>
        </>
      )}

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
            onPatch((student) => ({
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

/* ── Page ───────────────────────────────────────────────────────── */
export default function StudentEnrollment() {
  const { student, setStudent, selectedCourse, setSelectedCourseId } = useOutletContext();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => { coursesAPI.getForRegistration().then(setCourses).catch(() => {}); }, []);

  const studentCourses = student.student_courses ?? [];
  const active     = studentCourses.filter((sc) => sc.status !== "transferred" && sc.status !== "completed");
  const historical = studentCourses.filter((sc) => sc.status === "transferred" || sc.status === "completed");

  const refresh = async () => {
    const updated = await studentsAPI.getOne(student.id);
    setStudent(updated);
    // After enroll, select the newest course
    const newest = [...(updated.student_courses ?? [])]
      .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))[0];
    if (newest) setSelectedCourseId(newest.id);
  };

  const isBranchUser = user?.role === "branch_user";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Enrollment</h2>
            <p className="text-sm text-gray-500">
              {studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
          <button
            onClick={() => setShowEnroll(true)}
            className="flex items-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4" /> Enroll to Course
          </button>
        </div>

        {studentCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 gap-3">
            <BookOpen className="w-10 h-10 opacity-30" />
            <p className="font-semibold text-gray-500">No courses enrolled yet.</p>
            <button onClick={() => setShowEnroll(true)} className="text-sm text-blue-600 hover:underline font-medium">
              Enroll to a course
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="space-y-4">
                {active.map((sc) => (
                  <EnrollmentPanel
                    key={sc.id}
                    sc={sc}
                    courses={courses}
                    studentCourses={studentCourses}
                    isBranchUser={isBranchUser}
                    isSuperAdmin={isSuperAdmin}
                    onPatch={setStudent}
                    onSuccess={refresh}
                    isSelected={selectedCourse?.id === sc.id}
                    onSelect={() => setSelectedCourseId(sc.id)}
                  />
                ))}
              </div>
            )}

            {historical.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Past Enrollments</p>
                {historical.map((sc) => (
                  <EnrollmentPanel
                    key={sc.id}
                    sc={sc}
                    courses={courses}
                    studentCourses={studentCourses}
                    isBranchUser={isBranchUser}
                    isSuperAdmin={isSuperAdmin}
                    onPatch={setStudent}
                    onSuccess={refresh}
                    isSelected={selectedCourse?.id === sc.id}
                    onSelect={() => setSelectedCourseId(sc.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={showEnroll} onClose={() => setShowEnroll(false)} title="Enroll to Course">
        {showEnroll && (
          <EnrollCourseForm
            student={student}
            courses={courses}
            onClose={() => setShowEnroll(false)}
            onSuccess={refresh}
          />
        )}
      </Modal>
    </div>
  );
}
