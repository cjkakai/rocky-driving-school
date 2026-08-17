import { useState } from "react";
import { Clock, CheckCircle, XCircle, Award, FileText, Loader2, ListPlus } from "lucide-react";
import { fmtDate } from "../../utils/students.utils";
import { canSubmitForExam, submitExamBlockedReason } from "../../utils/studentActions";
import { examsAPI } from "../../api/exams.api";

export function ExamSection({ sc, exam, isBranchUser, isSuperAdmin, loading, onSubmitForExam, onApproveExam, activeExams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const submitReason     = submitExamBlockedReason(sc);
  const eligibleToSubmit = isBranchUser && canSubmitForExam(sc);
  const canShowSubmit    = isBranchUser && ["active", "retake_booked"].includes(sc.status);

  const statusConfig = {
    pending:   { color: "text-amber-700 bg-amber-50 border-amber-200",  icon: <Clock className="w-3 h-3" />,       label: "Pending" },
    confirmed: { color: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle className="w-3 h-3" />, label: "Confirmed" },
    failed:    { color: "text-red-600 bg-red-50 border-red-200",        icon: <XCircle className="w-3 h-3" />,     label: "Failed" },
    passed:    { color: "text-blue-700 bg-blue-50 border-blue-200",     icon: <Award className="w-3 h-3" />,       label: "Passed" },
  };

  return (
    <div className="space-y-2">
      {exam?.status ? (
        <div className="space-y-1.5">
          {exam.exam_name && (
            <p className="text-xs font-bold text-gray-800 leading-snug" title={exam.exam_name}>
              {exam.exam_name}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full ${statusConfig[exam.status]?.color ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
              {statusConfig[exam.status]?.icon}
              {statusConfig[exam.status]?.label ?? exam.status}
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
        <div className="space-y-2">
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
            onClick={() => onApproveExam(selectedExamId)}
            disabled={loading || !selectedExamId}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white py-2 rounded-xl transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListPlus className="w-3 h-3" />}
            Add to Exam List
          </button>
        </div>
      )}

      {canShowSubmit && (
        eligibleToSubmit ? (
          <button
            onClick={onSubmitForExam}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            Submit for Exam List
          </button>
        ) : (
          submitReason && <p className="text-xs text-red-400 italic">{submitReason}</p>
        )
      )}
    </div>
  );
}
