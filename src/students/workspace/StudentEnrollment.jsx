import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BookOpen, Building2, Pencil, PlayCircle, RefreshCw,
  CheckCircle, XCircle, Clock, Award, Loader2, FileText, ListPlus,
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
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
import { canSubmitForExam, submitExamBlockedReason } from "../../utils/studentActions";

/* ── Tiny section label ─────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2.5">
      {children}
    </p>
  );
}

/* ── Recharts payment ring, consistent with the rest of the workspace ── */
function PaymentRing({ pct, color }) {
  const data = [{ value: pct, fill: color }];
  return (
    <div className="relative w-16 h-16 shrink-0">
      <RadialBarChart
        width={64} height={64} cx="50%" cy="50%"
        innerRadius="78%" outerRadius="100%"
        data={data} startAngle={90} endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar background={{ fill: "#f1f2f4" }} dataKey="value" cornerRadius={20} isAnimationActive={false} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-gray-900">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

/* ── Single enrollment panel ────────────────────────────────────── */
function EnrollmentPanel({ sc, courses, studentCourses, isBranchUser, isSuperAdmin, activeExams = [], onPatch, isSelected, onSelect }) {
  const [showStk, setShowStk] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");

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

  const handleBookPdl  = () => run(() => pdlAPI.create({ student_course: sc.id }), "PDL submitted — awaiting HQ approval");
  const handleActivate = () => run(() => studentCoursesAPI.activateCourse(sc.id), "Course reactivated");
  const handleRetake   = () => run(() => studentCoursesAPI.applyRetake(sc.id), "Retake applied");
  const handleMarkCompleted  = () => run(() => studentCoursesAPI.markCompleted(sc.id), "Course marked as completed");
  const handleApprovePdl     = () => run(() => pdlAPI.approve(sc.pending_pdl_booking_id), "PDL approved");
  const handleSubmitForExam  = () => run(() => studentCoursesAPI.submitForExam(sc.id), "Submitted for exam list — awaiting HQ review");
  const handleAddToExamList  = () => {
    if (!selectedExamId) return;
    run(() => examsAPI.createBooking({ student_course: sc.id, exam: selectedExamId }), "Student added to exam list");
  };

  const examStatusConfig = {
    pending:   { color: "text-amber-700 bg-amber-50 border-amber-100",  icon: <Clock className="w-3 h-3" />,       label: "Pending approval" },
    confirmed: { color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: <CheckCircle className="w-3 h-3" />, label: "Confirmed" },
    failed:    { color: "text-rose-600 bg-rose-50 border-rose-100",     icon: <XCircle className="w-3 h-3" />,     label: "Failed" },
    passed:    { color: "text-[#c41820] bg-red-50 border-red-100",      icon: <Award className="w-3 h-3" />,       label: "Passed" },
  };
  const examCfg = examStatusConfig[exam?.status];

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isSelected ? "border-[#c41820] ring-2 ring-red-100" : "border-gray-100"
      }`}
    >
      {/* ── Header strip ── */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}14` }}
          >
            <BookOpen className="w-4.5 h-4.5" style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight truncate">{sc.course_name}</h3>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border"
                style={{ background: `${cfg.color}12`, color: cfg.color, borderColor: `${cfg.color}30` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              {sc.payment_reference && (
                <span className="font-mono text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                  {sc.payment_reference}
                </span>
              )}
              <span className="text-xs text-gray-400">
                Started {fmtDate(sc.registration_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {balance > 0 && !isTerminal && (
            <button
              onClick={() => setShowStk(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-900/10"
            >
              <Building2 className="w-3.5 h-3.5" /> Co-op STK
            </button>
          )}
          {isSuperAdmin && !isTerminal && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all"
            >
              <Pencil className="w-3.5 h-3.5" /> Change Course
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Column 1 — Financials */}
        <div>
          <SectionLabel>Financials</SectionLabel>
          <div className="flex items-center gap-4">
            <PaymentRing pct={paymentPct} color={cfg.color} />
            <div className="space-y-1.5 min-w-0">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-gray-400 font-medium">Agreed</span>
                <span className="font-bold text-gray-800 tabular-nums">{fmt(agreed)}</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-gray-400 font-medium">Paid</span>
                <span className="font-bold text-emerald-600 tabular-nums">{fmt(paid)}</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-gray-400 font-medium">Balance</span>
                <span className={`font-bold tabular-nums ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {balance > 0 ? fmt(balance) : "Cleared"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 — PDL */}
        <div>
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
        <div>
          <SectionLabel>Exam</SectionLabel>
          {exam?.status ? (
            <div className="space-y-2">
              {exam.exam_name && (
                <p className="text-xs font-semibold text-gray-700 leading-snug">{exam.exam_name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold border px-2.5 py-1 rounded-full ${examCfg?.color ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                  {examCfg?.icon}
                  {examCfg?.label ?? exam.status}
                </span>
                {exam.exam_date && (
                  <span className="text-xs text-gray-400 tabular-nums">{fmtDate(exam.exam_date)}</span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No exam booked</span>
          )}

          {/* Admin: assign to exam list when pending_exam_booking */}
          {isSuperAdmin && sc.status === "pending_exam_booking" && (
            <div className="mt-3 space-y-2">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a0a0b]/20 focus:border-[#1a0a0b] text-gray-700"
              >
                <option value="">Select exam list…</option>
                {activeExams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.exam_name} — {fmtDate(e.exam_date)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToExamList}
                disabled={loading || !selectedExamId}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white py-2 rounded-xl transition-colors disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListPlus className="w-3.5 h-3.5" />}
                Add to Exam List
              </button>
            </div>
          )}

          {/* Branch: submit for exam list */}
          {canSubmitForExam(sc) && isBranchUser && (
            <button
              onClick={handleSubmitForExam}
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Submit for Exam List
            </button>
          )}
          {isBranchUser && !canSubmitForExam(sc) && submitExamBlockedReason(sc) && (
            <p className="text-xs text-red-400 italic mt-2">{submitExamBlockedReason(sc)}</p>
          )}
        </div>
      </div>

      {/* ── Course action buttons (conditional) ── */}
      {(
        (sc.status === "dormant" && isBranchUser) ||
        (sc.status === "failed" && isBranchUser) ||
        (sc.is_refresher_course && sc.status !== "completed" && balance === 0 && isBranchUser)
      ) && (
        <div className="px-6 py-4 flex flex-wrap gap-3 border-t border-gray-100 bg-gray-50/50">
          {sc.status === "dormant" && isBranchUser && (
            <button
              onClick={handleActivate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-amber-900/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Activate Course (+Ksh 3,000)
            </button>
          )}
          {sc.status === "failed" && isBranchUser && (
            <button
              onClick={handleRetake}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-rose-900/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Apply Retake (+Ksh 3,000)
            </button>
          )}
          {sc.is_refresher_course && sc.status !== "completed" && balance === 0 && isBranchUser && (
            <button
              onClick={handleMarkCompleted}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-red-900/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Completed
            </button>
          )}
        </div>
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
  const [activeExams, setActiveExams] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => { coursesAPI.getForRegistration().then(setCourses).catch(() => {}); }, []);
  useEffect(() => { examsAPI.getAll({ status: "active" }).then(setActiveExams).catch(() => {}); }, []);

  const studentCourses = student.student_courses ?? [];
  const active     = studentCourses.filter((sc) => sc.status !== "transferred" && sc.status !== "completed");
  const historical = studentCourses.filter((sc) => sc.status === "transferred" || sc.status === "completed");

  const refresh = async () => {
    const updated = await studentsAPI.getOne(student.id);
    setStudent(updated);
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
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Enrollment</h2>
            <p className="text-sm text-gray-500">
              {studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
          <button
            onClick={() => setShowEnroll(true)}
            className="flex items-center gap-2 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-red-900/10"
          >
            <BookOpen className="w-4 h-4" /> Enroll to Course
          </button>
        </div>

        {studentCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#c41820]" />
            </div>
            <p className="font-semibold text-gray-500">No courses enrolled yet.</p>
            <button onClick={() => setShowEnroll(true)} className="text-sm text-[#c41820] hover:underline font-semibold">
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
                    activeExams={activeExams}
                    onPatch={setStudent}
                    isSelected={selectedCourse?.id === sc.id}
                    onSelect={() => setSelectedCourseId(sc.id)}
                  />
                ))}
              </div>
            )}

            {historical.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="h-px flex-1 bg-gray-200 max-w-[24px]" />
                  Past Enrollments
                  <span className="h-px flex-1 bg-gray-200" />
                </p>
                {historical.map((sc) => (
                  <EnrollmentPanel
                    key={sc.id}
                    sc={sc}
                    courses={courses}
                    studentCourses={studentCourses}
                    isBranchUser={isBranchUser}
                    isSuperAdmin={isSuperAdmin}
                    activeExams={activeExams}
                    onPatch={setStudent}
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