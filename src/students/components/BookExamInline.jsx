import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { fmtDate } from "../../utils/students.utils";
import { Select } from "../../ui";
import { useAsyncAction } from "../../useAsyncAction";
import { examsAPI } from "../../api/exams.api";

export function BookExamInline({ sc, exams, onClose, onSuccess }) {
  const [examId, setExamId] = useState("");
  const { run, loading }    = useAsyncAction({ onSuccess });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examId) return;
    const result = await run(
      () => examsAPI.createBooking({ student_course: sc.id, exam: Number(examId) }),
      "Exam booked — awaiting approval",
    );
    if (result) onClose();
  };

  return (
    <form
      className="p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50 shadow-sm space-y-3"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-sm font-bold text-blue-900">
          Book Exam — <span className="font-black">{sc.course_name}</span>
        </p>
      </div>

      {exams.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No exam dates available.</p>
      ) : (
        <Select value={examId} onChange={setExamId} placeholder="Choose exam date">
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {fmtDate(ex.exam_date)} — {ex.test_center}
            </option>
          ))}
        </Select>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 rounded-xl transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading || !examId}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          Confirm Booking
        </button>
      </div>
    </form>
  );
}
