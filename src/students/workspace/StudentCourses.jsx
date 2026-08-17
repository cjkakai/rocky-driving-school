import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { BookOpen, CheckCircle2, ArrowRightLeft, PlayCircle } from "lucide-react";
import { Modal } from "../../ui";
import { CourseCard } from "../components/CourseCard";
import { EnrollCourseForm } from "../EnrollCourseForm";
import { coursesAPI } from "../../api/courses.api";
import { studentsAPI } from "../../api/students.api";
import { useAuth } from "../../context/AuthContext";
import StudentHeader from "./StudentHeader";

function MiniStat({ icon: Icon, label, value, color, tint }) {
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 shadow-sm">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint, color }}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-base font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function StudentCourses() {
  const { student, setStudent } = useOutletContext();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => { coursesAPI.getForRegistration().then(setCourses).catch(() => {}); }, []);

  const studentCourses = student.student_courses ?? [];
  const activeCount      = studentCourses.filter((sc) => sc.status !== "transferred" && sc.status !== "completed").length;
  const completedCount   = studentCourses.filter((sc) => sc.status === "completed").length;
  const transferredCount = studentCourses.filter((sc) => sc.status === "transferred").length;

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Courses</h2>
            <p className="text-sm text-gray-500">{studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""} enrolled</p>
          </div>
          <button
            onClick={() => setShowEnroll(true)}
            className="flex items-center gap-2 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-red-900/10"
          >
            <BookOpen className="w-4 h-4" /> Enroll to Course
          </button>
        </div>

        {studentCourses.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <MiniStat icon={PlayCircle}     label="Active"      value={activeCount}      color="#c41820"  tint="#fdf1f1" />
            <MiniStat icon={CheckCircle2}   label="Completed"   value={completedCount}   color="#059669"  tint="#ecfdf5" />
            <MiniStat icon={ArrowRightLeft} label="Transferred" value={transferredCount} color="#64748b"  tint="#f8fafc" />
          </div>
        )}

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