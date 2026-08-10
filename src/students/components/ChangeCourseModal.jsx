import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertTriangle, ArrowRightLeft, CreditCard } from "lucide-react";
import { studentCoursesAPI } from "../../api/courses.api";
import { SearchableSelect } from "../../ui";

export function ChangeCourseModal({ sc, courses, studentCourses = [], onClose, onSuccess }) {
  const [courseId, setCourseId] = useState("");
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const enrolledCourseIds = new Set(studentCourses.map((s) => s.course_id));
  const available = (courses ?? []).filter(
    (c) => !enrolledCourseIds.has(c.id) && c.is_active_for_registration
  );
  const selected  = courses?.find((c) => c.id === Number(courseId));
  const courseOptions = available.map((c) => ({
    value: String(c.id),
    label: `${c.category} — ${c.class_name} (Ksh ${Number(c.amount).toLocaleString()})`,
  }));

  const credit       = Number(sc.amount_agreed || 0) - Number(sc.balance || 0);
  const newFee       = selected ? Number(selected.amount) : 0;
  const diff         = newFee - credit;
  const balanceDue   = diff > 0 ? diff : 0;
  const overpayment  = diff < 0 ? Math.abs(diff) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) return setError("Please select a course.");
    setLoading(true);
    setError("");
    try {
      const newSc = await studentCoursesAPI.transferCourse(sc.id, {
        new_course_id: Number(courseId),
        reason: reason.trim(),
      });
      onSuccess(newSc);
    } catch (err) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5" style={{ background: "#1d4ed8" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Change Course</p>
                <p className="text-[11px] text-white/65 font-medium leading-tight">{sc.course_name}</p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-30 text-lg leading-none">
              ✕
            </button>
          </div>

          <div className="bg-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-white/80 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Credit to carry forward</p>
              <p className="text-sm font-black text-white tabular-nums">
                Ksh {credit.toLocaleString()}
                <span className="text-white/60 font-normal text-xs ml-1">paid on current course</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
              New Course
            </label>
            <SearchableSelect
              value={courseId}
              onChange={setCourseId}
              options={courseOptions}
              placeholder="Select a course…"
              disabled={loading}
            />
            {available.length === 0 && (
              <p className="mt-1 text-xs text-gray-400 italic">No other courses available.</p>
            )}
          </div>

          {selected && (
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "New Fee",
                  value: `Ksh ${newFee.toLocaleString()}`,
                  sub: selected.class_name,
                  color: "text-gray-800",
                  bg: "bg-gray-50 border-gray-200",
                },
                {
                  label: "Credit",
                  value: `Ksh ${credit.toLocaleString()}`,
                  sub: "carried over",
                  color: "text-blue-700",
                  bg: "bg-blue-50 border-blue-200",
                },
                balanceDue > 0
                  ? {
                      label: "Balance Due",
                      value: `Ksh ${balanceDue.toLocaleString()}`,
                      sub: "still owes",
                      color: "text-red-600",
                      bg: "bg-red-50 border-red-200",
                    }
                  : {
                      label: "Overpayment",
                      value: `Ksh ${overpayment.toLocaleString()}`,
                      sub: overpayment === 0 ? "exact match" : "credit remains",
                      color: "text-green-700",
                      bg: "bg-green-50 border-green-200",
                    },
              ].map(({ label, value, sub, color, bg }) => (
                <div key={label} className={`rounded-xl px-2.5 py-2.5 text-center border ${bg}`}>
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-1">{label}</p>
                  <p className={`text-xs font-black ${color} tabular-nums leading-tight`}>{value}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {selected && overpayment > 0 && (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>Student has overpaid. The credit balance of <strong>Ksh {overpayment.toLocaleString()}</strong> will remain on the new course. Issue a refund or leave as credit.</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
              Reason <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={2}
              placeholder="e.g. Student requested upgrade to Class B"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 resize-none"
            />
          </div>

          <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
            <span>Any pending exam bookings on the current course will remain attached to it. The student will need to be re-booked on the new course.</span>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || !courseId}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRightLeft className="w-4 h-4" />
              }
              Transfer Course
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
