import { Clock, CheckCircle, XCircle, Award, FileText, Loader2 } from "lucide-react";
import { fmtDate } from "../../utils/students.utils";
import { canBookExam, examBlockedReason } from "../../utils/studentActions";

export function ExamSection({ sc, exam, isBranchUser, isSuperAdmin, loading, onBookExam, onApproveExam }) {
  const examReason      = examBlockedReason(sc);
  const eligibleForExam = isBranchUser && canBookExam(sc);

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

      {exam?.status === "pending" && isSuperAdmin && (
        <button
          onClick={onApproveExam}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve Exam
        </button>
      )}

      {eligibleForExam && (
        <button
          onClick={() => onBookExam(sc)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold border border-blue-300 text-blue-700 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
        >
          <FileText className="w-3 h-3" /> Book Exam
        </button>
      )}

      {examReason && <p className="text-xs text-red-400 italic">{examReason}</p>}
    </div>
  );
}
