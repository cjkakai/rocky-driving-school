import { useState } from "react";
import { BookOpen } from "lucide-react";
import { CourseCard } from "./components/CourseCard";
import { BookExamInline } from "./components/BookExamInline";

/* ─── Expanded Row ───────────────────────────────────────────────── */
export function ExpandedRow({
  student,
  exams    = [],
  courses  = [],   // ← all available courses for the transfer modal
  isBranchUser,
  isSuperAdmin,
  onEnroll,
  onSuccess,
  onPatch,
}) {
  const [bookingCourse, setBookingCourse] = useState(null);
  const studentCourses = student.student_courses ?? [];

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">{student.full_name}</p>
            <p className="text-xs text-gray-400">
              {studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
        </div>

        <button
          onClick={() => onEnroll?.(student)}
          className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <BookOpen className="w-3.5 h-3.5" /> Enroll to New Course
        </button>
      </div>

      {/* Inline exam booking form */}
      {bookingCourse && (
        <BookExamInline
          sc={bookingCourse}
          exams={exams}
          onClose={() => setBookingCourse(null)}
          onSuccess={onSuccess}
        />
      )}

      {/* Course cards */}
      {studentCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <BookOpen className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm font-medium">No courses enrolled</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {studentCourses.map((sc) => (
              <CourseCard
                key={sc.id}
                sc={sc}
                isBranchUser={isBranchUser}
                isSuperAdmin={isSuperAdmin}
                courses={courses}
                studentCourses={studentCourses}
                onBookExam={setBookingCourse}
                onSuccess={onSuccess}
                onPatch={onPatch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
