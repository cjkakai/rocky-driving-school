import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Pencil } from "lucide-react";
import { studentStatusBadge } from "../../utils/students.utils";
import { Modal } from "../../ui";
import { RegisterStudentForm } from "../RegisterStudentForm";
import { studentsAPI } from "../../api/students.api";
import { useAuth } from "../../context/AuthContext";

export default function StudentHeader({ student, onUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const backPath = location.state?.from || "/dashboard/students";

  const initials = student.full_name?.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const activeCourse = student?.student_courses?.find(
    (sc) => sc.status !== "transferred" && sc.status !== "completed"
  ) || student?.student_courses?.[0];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <button
          onClick={() => navigate(backPath)}
          className="hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Students
        </button>
        <span>/</span>
        <span className="text-gray-600 font-medium truncate">{student.full_name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c41820] to-[#2c1417] flex items-center justify-center text-white font-black text-base shadow-md shrink-0 select-none">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-gray-900">{student.full_name}</h1>
              {studentStatusBadge(student.status)}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                {student.admission_number}
              </span>
              {activeCourse && (
                <span className="text-xs text-gray-500">{activeCourse.course_name}</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {student.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3" /> {student.phone}
                </span>
              )}
              {student.branch?.name && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" /> {student.branch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {user?.role === "super_admin" && (
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student">
        {showEdit && (
          <RegisterStudentForm
            mode="edit"
            initialData={student}
            branches={[student.branch].filter(Boolean)}
            courses={[]}
            currentUser={user}
            onClose={() => setShowEdit(false)}
            onSuccess={async () => {
              setShowEdit(false);
              const updated = await studentsAPI.getOne(student.id);
              onUpdate?.(updated);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
