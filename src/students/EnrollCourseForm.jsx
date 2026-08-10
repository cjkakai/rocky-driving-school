import { useState } from "react";
import toast from "react-hot-toast";
import { BookOpen, Loader2 } from "lucide-react";
import { Btn, Input, Label, SearchableSelect } from "../ui";
import { studentCoursesAPI } from "../api/courses.api";

export function EnrollCourseForm({ student, courses, onClose, onSuccess }) {
  const enrolledCourseIds = new Set((student.student_courses ?? []).map((sc) => sc.course_id));
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  const [courseId, setCourseId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);

  const selectedCourse = courses.find((c) => c.id === Number(courseId));
  const discountVal = parseFloat(discount) || 0;
  const amountAgreed = selectedCourse ? Math.max(0, selectedCourse.amount - discountVal) : 0;

  const courseOptions = availableCourses.map((c) => ({
    value: String(c.id),
    label: `${c.category} — ${c.class_name} (Ksh ${Number(c.amount).toLocaleString()})`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) { toast.error("Please select a course."); return; }
    if (selectedCourse && discountVal > selectedCourse.max_discount) {
      toast.error(`Discount exceeds maximum allowed (Ksh ${selectedCourse.max_discount}).`);
      return;
    }
    setLoading(true);
    try {
      await studentCoursesAPI.enroll({
        student: student.id,
        course: Number(courseId),
        amount_agreed: amountAgreed,
        discount: discountVal,
      });
      toast.success(`${student.full_name} enrolled successfully`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to enroll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Read-only student info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Full Name",  value: student.full_name },
            { label: "Adm. No",    value: student.admission_number },
            { label: "Phone",      value: student.phone },
            { label: "ID Number",  value: student.id_number },
          ].map(({ label, value }) => (
            <div key={label}>
              <Label>{label}</Label>
              <Input value={value ?? "—"} disabled className="bg-white opacity-70" />
            </div>
          ))}
        </div>
      </div>

      {availableCourses.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-4">
          Student is already enrolled in all available courses.
        </p>
      ) : (
        <>
          <div className="pb-52">
            <Label>Course</Label>
            <SearchableSelect
              value={courseId}
              onChange={setCourseId}
              options={courseOptions}
              placeholder="Select a course…"
            />
          </div>

          {selectedCourse && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Course Amount (Ksh)</Label>
                <Input type="number" value={selectedCourse.amount} disabled className="bg-gray-100" />
              </div>
              <div>
                <Label>Discount (Ksh)</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedCourse.max_discount}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                {selectedCourse.max_discount > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Max: Ksh {Number(selectedCourse.max_discount).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <Label>Agreed Amount (Ksh)</Label>
                <Input type="number" value={amountAgreed} disabled className="bg-gray-100" />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Btn variant="outline" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {loading ? "Enrolling..." : "Enroll to Course"}
            </Btn>
          </div>
        </>
      )}
    </form>
  );
}
