import { useState, useEffect } from "react";
import { X, Loader2, Clock, Car, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { lessonsAPI, instructorsAPI } from "../../api/lessons.api";
import { vehiclesAPI } from "../../api/vehicles.api";

const today = () => new Date().toISOString().split("T")[0];

const STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show",   label: "No Show" },
];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-[#c41820] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#c41820] bg-white transition-colors";

/* ── Segmented lesson-type control ─────────────────────────────────── */
const LESSON_TYPE_OPTIONS = [
  { value: "practical", label: "Practical", icon: Car },
  { value: "theory",    label: "Theory",    icon: BookOpen },
];

function LessonTypeSelector({ value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {LESSON_TYPE_OPTIONS.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              active
                ? "bg-[#1a0a0b] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

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

  const isPractical = form.lesson_type === "practical";

  useEffect(() => {
    instructorsAPI.getAll().then(setInstructors).catch(() => {});
    vehiclesAPI.list().then((d) => setVehicles(Array.isArray(d) ? d : (d.results ?? []))).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Clear vehicle when switching to theory
  const handleTypeChange = (v) => {
    setForm((p) => ({ ...p, lesson_type: v, vehicle: v === "theory" ? "" : p.vehicle }));
  };

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
        vehicle:            isPractical && form.vehicle ? Number(form.vehicle) : null,
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
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

          {/* Lesson Type — segmented control */}
          <Field label="Lesson Type">
            <LessonTypeSelector value={form.lesson_type} onChange={handleTypeChange} />
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
          {duration && (
            <div className="inline-flex items-center gap-1.5 -mt-2 text-xs font-bold text-[#c41820] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" /> Duration: {duration}
            </div>
          )}

          {/* Status */}
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>

          {/* Instructor */}
          <Field label="Instructor">
            <select value={form.instructor} onChange={(e) => set("instructor", e.target.value)} className={inputCls}>
              <option value="">— Select instructor —</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.full_name}</option>
              ))}
            </select>
          </Field>

          {/* Vehicle — only shown for Practical lessons */}
          {isPractical && (
            <Field label="Vehicle">
              <select value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} className={inputCls}>
                <option value="">— Select vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registration_number} — {v.vehicle_name}</option>
                ))}
              </select>
            </Field>
          )}

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
              className="flex-1 py-2.5 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-red-900/10">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save Lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
