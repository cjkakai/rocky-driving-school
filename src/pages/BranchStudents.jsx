import { useState, useEffect, useCallback } from "react";
import { UserPlus, AlertCircle, Download, RefreshCw, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRefreshButton } from "../hooks/useRefreshButton";
import { Btn, Modal } from "../ui";
import { useAuth } from "../context/AuthContext";
import { branchesAPI } from "../api/branches.api";
import { coursesAPI } from "../api/courses.api";
import { examsAPI } from "../api/exams.api";
import { StudentFilters } from "../students/StudentFilters";
import { StudentSummary, StudentStatCards } from "../students/StudentSummary";
import { StudentTable } from "../students/StudentTable";
import { RegisterStudentForm } from "../students/RegisterStudentForm";
import { EnrollCourseForm } from "../students/EnrollCourseForm";
import { studentsAPI } from "../api/students.api";
import { useStudents } from "../students/useStudents";

export default function BranchStudents() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [registrationCourses, setRegistrationCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState(null);
  const [exporting, setExporting] = useState(false);

  const {
    students, loading, error,
    filters, setFilter, setFiltersMany,
    page, setPage, pageSize, totalCount, totalPages,
    refresh, refreshSummary, patchStudent, summary,
  } = useStudents({ isBranchUser: true });

  const doRefresh = useCallback(async () => {
    await refresh();
    refreshSummary();
  }, [refresh, refreshSummary]);
  const { refreshState, triggerRefresh } = useRefreshButton(doRefresh);

  useEffect(() => {
    Promise.all([branchesAPI.getAll(), coursesAPI.getAll(), coursesAPI.getForRegistration(), examsAPI.getAll({ status: "active" })])
      .then(([b, c, rc, e]) => { setBranches(b); setCourses(c); setRegistrationCourses(rc); setExams(Array.isArray(e) ? e : e.results ?? []); })
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(filters.filterStatus && filters.filterStatus !== "all" && { status: filters.filterStatus }),
        ...(filters.filterStatus === "all" && { status: "all" }),
        ...(filters.filterCourse        && { course_id:     filters.filterCourse }),
        ...(filters.filterCourseStatus  && { course_status: filters.filterCourseStatus }),
        ...(filters.filterExam          && { exam_id:       filters.filterExam }),
        ...(filters.searchQuery         && { search:        filters.searchQuery }),
        ...(filters.dateFrom            && { date_from:     filters.dateFrom }),
        ...(filters.dateTo              && { date_to:       filters.dateTo }),
        page_size: 10000,
      };
      await studentsAPI.exportExcel(params);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 to-slate-100 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Students in your branch</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            disabled={refreshState !== "idle"}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${
              refreshState === "done"
                ? "bg-blue-600 text-white border border-blue-600"
                : "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            }`}
          >
            {refreshState === "loading" && <RefreshCw className="w-4 h-4 animate-spin" />}
            {refreshState === "done"    && <CheckCircle className="w-4 h-4" />}
            {refreshState === "idle"    && <RefreshCw className="w-4 h-4" />}
            {refreshState === "done" ? "Updated" : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
          <Btn onClick={() => setShowRegister(true)}>
            <UserPlus className="w-4 h-4" />Register Student
          </Btn>
        </div>
      </div>

      <StudentStatCards summary={summary} />

      <StudentFilters
        filters={filters}
        onChange={setFilter}
        onChangePeriod={(patch) => setFiltersMany(patch)}
        branches={branches}
        courses={courses}
        exams={exams}
        isBranchUser={true}
      />

      <StudentSummary summary={summary} />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <StudentTable
          students={students}
          loading={loading}
          isBranchUser={true}
          isSuperAdmin={false}
          onApprovePdl={() => {}}
          onApproveExam={() => {}}
          onEnroll={setEnrollStudent}
          exams={exams}
          courses={courses}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          refresh={refresh}
          patchStudent={patchStudent}
        />
      </div>

      <Modal open={showRegister} onClose={() => setShowRegister(false)} title="Register New Student">
        <RegisterStudentForm
          branches={branches}
          courses={registrationCourses}
          currentUser={user}
          onClose={() => setShowRegister(false)}
          onSuccess={refresh}
        />
      </Modal>

      <Modal open={!!enrollStudent} onClose={() => setEnrollStudent(null)} title="Enroll to Course">
        {enrollStudent && (
          <EnrollCourseForm
            student={enrollStudent}
            courses={registrationCourses}
            onClose={() => setEnrollStudent(null)}
            onSuccess={refresh}
          />
        )}
      </Modal>
    </div>
  );
}
