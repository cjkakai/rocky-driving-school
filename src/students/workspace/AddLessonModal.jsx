import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { lessonsAPI, instructorsAPI } from "../../api/lessons.api";
import { vehiclesAPI } from "../../api/vehicles.api";

const today = () => new Date().toISOString().split("T")[0];

const LESSON_TYPES = [
  { value: "practical",  label: "Practical" },
  { value: "theory",     label: "Theory" },
  { value: "mock_test",  label: "Mock Test" },
  { value: "road_test",  label: "Road Test" },
];

const STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show",   label: "No Show" },
];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white";

export default function AddLessonModal({ student, studentCourses = [], selectedCourse, onClose, onSuccess }) {
  const [instructors, setInstructors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);

  const activeCourses = studentCourses.filter(
    (sc) => sc.status !== "transferred" && sc.status !== "completed"
  );
  const defaultCourse = selectedCourse ?? activeCourses[0] ?? studentCourses[0];

  const [form, setForm] = useState({
    student_course:     defaultCourse?.id ?? "",
    date:               today(),
    start_time:         "07:00",
    end_time:           "08:00",
    lesson_type:        "practical",
    status:             "completed",
    instructor:         "",
    vehicle:            "",
    notes:              "",
    instructor_remarks: "",
  });

  useEffect(() => {
    instructorsAPI.getAll().then(setInstructors).catch(() => {});
    vehiclesAPI.list().then((d) => setVehicles(Array.isArray(d) ? d : (d.results ?? []))).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const duration = (() => {
    try {
      const [sh, sm] = form.start_time.split(":").map(Number);
      const [eh, em] = form.end_time.split(":").map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins <= 0) return null;
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    } catch { return null; }
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_course) { toast.error("Please select a course."); return; }
    setSaving(true);
    try {
      await lessonsAPI.create({
        student_course:     Number(form.student_course),
        date:               form.date,
        start_time:         form.start_time,
        end_time:           form.end_time,
        lesson_type:        form.lesson_type,
        status:             form.status,
        instructor:         form.instructor ? Number(form.instructor) : null,
        vehicle:            form.vehicle    ? Number(form.vehicle)    : null,
        notes:              form.notes,
        instructor_remarks: form.instructor_remarks,
      });
      toast.success("Lesson recorded.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Lesson</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.full_name} · {student.admission_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Course */}
          <Field label="Course" required>
            <select value={form.student_course} onChange={(e) => set("student_course", e.target.value)} required className={inputCls}>
              <option value="">Select course…</option>
              {studentCourses.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.course_name} ({sc.status})</option>
              ))}
            </select>
          </Field>

          {/* Date */}
          <Field label="Date" required>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
              required max={today()} className={inputCls} />
          </Field>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time" required>
              <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="End Time" required>
              <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} required className={inputCls} />
            </Field>
          </div>
          {duration && <p className="text-xs text-blue-600 font-semibold -mt-2">Duration: {duration}</p>}

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lesson Type">
              <select value={form.lesson_type} onChange={(e) => set("lesson_type", e.target.value)} className={inputCls}>
                {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Instructor */}
          <Field label="Instructor">
            <select value={form.instructor} onChange={(e) => set("instructor", e.target.value)} className={inputCls}>
              <option value="">— Select instructor —</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.full_name}</option>
              ))}
            </select>
          </Field>

          {/* Vehicle */}
          <Field label="Vehicle">
            <select value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} className={inputCls}>
              <option value="">— Select vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registration_number} — {v.vehicle_name}</option>
              ))}
            </select>
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={2} placeholder="Optional notes…"
              className={`${inputCls} resize-none`} />
          </Field>

          {/* Instructor remarks */}
          <Field label="Instructor Remarks">
            <textarea value={form.instructor_remarks} onChange={(e) => set("instructor_remarks", e.target.value)}
              rows={2} placeholder="Instructor's remarks…"
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save Lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
