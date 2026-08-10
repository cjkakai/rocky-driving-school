import { useEffect, useState, useMemo } from "react";
import { Outlet, useParams, useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  ArrowLeft, LayoutDashboard, CreditCard,
  GraduationCap, BookOpen, Phone, MapPin, IdCard,
} from "lucide-react";
import { studentsAPI } from "../../api/students.api";
import { studentStatusBadge, getCourseStatus } from "../../utils/students.utils";

const NAV = [
  { to: "overview",   label: "Overview",   icon: LayoutDashboard },
  { to: "payments",   label: "Payments",   icon: CreditCard },
  { to: "lessons",    label: "Lessons",    icon: GraduationCap },
  { to: "enrollment", label: "Enrollment", icon: BookOpen },
];

import StudentHeader from "./StudentHeader";

/* ── Course selector bar ─────────────────────────────────────────── */
function CourseSelectorBar({ allCourses, selectedCourse, onSelect }) {
  if (allCourses.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 shrink-0">
        Course
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {allCourses.map((c) => {
          const cfg = getCourseStatus(c.status);
          const isSelected = c.id === selectedCourse?.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? "text-white border-transparent shadow-sm"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white"
              }`}
              style={isSelected ? { background: cfg.color, borderColor: cfg.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isSelected ? "rgba(255,255,255,0.65)" : cfg.color }}
              />
              {c.course_name}
              <span className={`font-normal ${isSelected ? "opacity-70" : "text-gray-400"}`}>
                · {cfg.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Layout ──────────────────────────────────────────────────────── */
export default function StudentWorkspaceLayout() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const backPath = location.state?.from || "/dashboard/students";

  useEffect(() => {
    setLoading(true);
    studentsAPI.getOne(studentId)
      .then((s) => {
        setStudent(s);
        const courses = s.student_courses ?? [];
        const first = [...courses]
          .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
          .find((sc) => sc.status !== "transferred") ?? courses[0];
        if (first) setSelectedCourseId(first.id);
      })
      .catch((err) => setError(err.status === 404 ? "Student not found." : "Failed to load student."))
      .finally(() => setLoading(false));
  }, [studentId]);

  // Re-default if student_courses changes and nothing is selected
  useEffect(() => {
    if (!student || selectedCourseId) return;
    const courses = student.student_courses ?? [];
    const first = [...courses]
      .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
      .find((sc) => sc.status !== "transferred") ?? courses[0];
    if (first) setSelectedCourseId(first.id);
  }, [student, selectedCourseId]);

  const allCourses = useMemo(() => {
    const courses = [...(student?.student_courses ?? [])];
    return courses.sort((a, b) => {
      const aT = a.status === "transferred" ? 1 : 0;
      const bT = b.status === "transferred" ? 1 : 0;
      if (aT !== bT) return aT - bT;
      return new Date(b.registration_date) - new Date(a.registration_date);
    });
  }, [student?.student_courses]);

  const selectedCourse = allCourses.find((c) => c.id === selectedCourseId) ?? allCourses[0] ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={() => navigate(backPath)} className="text-sm text-blue-600 hover:underline">
          ← Back to Students
        </button>
      </div>
    );
  }

  const initials = student.full_name
    .trim().split(" ")
    .map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-[calc(100vh-64px)]">

      {/* ── Sidebar: identity + nav only ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">

        {/* Back */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Students
          </button>
        </div>

        {/* Student identity */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow select-none shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight truncate">{student.full_name}</p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{student.admission_number}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {studentStatusBadge(student.status)}
          </div>
          <div className="mt-2.5 space-y-1">
            {student.phone && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{student.phone}</span>
              </div>
            )}
            {student.id_number && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <IdCard className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{student.id_number}</span>
              </div>
            )}
            {student.branch?.name && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{student.branch.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Student header banner */}
        <StudentHeader student={student} onUpdate={setStudent} />

        {/* Course selector bar — always visible above page content */}
        <CourseSelectorBar
          allCourses={allCourses}
          selectedCourse={selectedCourse}
          onSelect={setSelectedCourseId}
        />

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet context={{ student, setStudent, selectedCourse, setSelectedCourseId, allCourses }} />
        </div>
      </div>
    </div>
  );
}
