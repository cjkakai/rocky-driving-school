import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Modal } from "../../ui";
import { CourseCard } from "../components/CourseCard";
import { EnrollCourseForm } from "../EnrollCourseForm";
import { coursesAPI } from "../../api/courses.api";
import { studentsAPI } from "../../api/students.api";
import { useAuth } from "../../context/AuthContext";
import StudentHeader from "./StudentHeader";

export default function StudentCourses() {
  const { student, setStudent } = useOutletContext();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => { coursesAPI.getForRegistration().then(setCourses).catch(() => {}); }, []);

  const studentCourses = student.student_courses ?? [];

  const refresh = async () => {
    const updated = await studentsAPI.getOne(student.id);
    setStudent(updated);
  };

  const patchStudent = (updater) =>
    setStudent((prev) => typeof updater === "function" ? updater(prev) : { ...prev, ...updater });

  return (
    <div className="min-h-full bg-gray-50">
      <StudentHeader student={student} onUpdate={setStudent} />

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Courses</h2>
            <p className="text-sm text-gray-500">{studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""} enrolled</p>
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
          <div className="flex flex-wrap gap-4">
            {studentCourses.map((sc) => (
              <CourseCard
                key={sc.id}
                sc={sc}
                isBranchUser={user?.role === "branch_user"}
                isSuperAdmin={user?.role === "super_admin"}
                courses={courses}
                studentCourses={studentCourses}
                onBookExam={() => {}}
                onSuccess={refresh}
                onPatch={patchStudent}
              />
            ))}
          </div>
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
