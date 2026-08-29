import { useState, useEffect, useCallback, useMemo } from "react";
import { studentsAPI } from "../api/students.api";
import { branchesAPI } from "../api/branches.api";
import { broadcastSMS } from "../api/sms.api";
import { examsAPI } from "../api/exams.api";
import BroadcastHeader from "../components/broadcast/BroadcastHeader";
import AudienceStep from "../components/broadcast/AudienceStep";
import MessageStep from "../components/broadcast/MessageStep";
import ReviewStep from "../components/broadcast/ReviewStep";
import { PAGE_SIZE, titleCase } from "../components/broadcast/constants";

export default function Broadcast() {

  /* ── Wizard ── */
  const [step, setStep] = useState(1);

  /* ── Data ── */
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);

  /* ── Audience filters ── */
  const [segment,      setSegment]      = useState("");
  const [search,       setSearch]       = useState("");
  const [branchId,     setBranchId]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [examId,       setExamId]       = useState("");
  const [examResult,   setExamResult]   = useState("");
  const [courseStatus, setCourseStatus] = useState("");
  const [pdlDays,      setPdlDays]      = useState("");

  /* ── Selection + message ── */
  const [selected, setSelected] = useState(new Set());
  const [message,  setMessage]  = useState("");

  /* ── UI state ── */
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Fetch students ── */
  const fetchStudents = useCallback(async () => {
    if (!segment) { setStudents([]); setTotal(0); return; }
    setLoading(true);
    try {
      let data;
      if (examId) {
        const params = { exam_id: examId, page_size: PAGE_SIZE };
        if (examResult) params.exam_result = examResult;
        if (branchId)   params.branch_id   = branchId;
        if (search)     params.search      = search;
        data = await studentsAPI.examRoster(params);
      } else {
        const params = { page_size: PAGE_SIZE };
        if (search)       params.search        = search;
        if (branchId)     params.branch_id     = branchId;
        if (statusFilter) params.status        = statusFilter;
        if (courseStatus) params.course_status = courseStatus;
        if (pdlDays)      params.pdl_days      = pdlDays;
        data = await studentsAPI.getAll(params);
      }
      const list  = Array.isArray(data) ? data : (data?.results ?? []);
      const count = Array.isArray(data) ? data.length : (data?.count ?? list.length);
      setStudents(list);
      setTotal(count);
      setSelected(new Set(list.map((s) => s.id)));
    } catch {
      setStudents([]); setTotal(0); setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [segment, search, branchId, statusFilter, examId, examResult, courseStatus, pdlDays]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { branchesAPI.getAll().then(setBranches).catch(() => {}); }, []);
  useEffect(() => {
    examsAPI.getAll()
      .then((d) => setExams(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, []);

  /* ── Selection helpers ── */
  const toggleOne = (id) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));

  /* ── Send ── */
  const handleSend = async () => {
    setSending(true);
    try {
      const res = await broadcastSMS([...selected], message);
      showToast(`Messages sent — ${res.sent} sent, ${res.failed} failed`);
      setSelected(new Set());
      setMessage("");
      setSegment("");
      setStep(1);
    } catch (e) {
      showToast(e.message || "Failed to send messages", "error");
    } finally {
      setSending(false);
    }
  };

  /* ── Derived ── */
  const previewStudent = students.find((s) => selected.has(s.id));
  const smsCount       = message.length > 160 ? 2 : 1;
  const totalSms       = selected.size * smsCount;

  const audienceFilters = useMemo(() => [
    segment === "pdl"    && pdlDays      && `PDL ≤ ${pdlDays}d`,
    segment === "exam"   && examId       && (exams.find((e) => String(e.id) === String(examId))?.exam_name ?? "Exam"),
    segment === "exam"   && examResult   && (examResult === "PASS" ? "Passed" : "Failed"),
    segment === "course" && courseStatus && titleCase(courseStatus),
    segment === "custom" && statusFilter && titleCase(statusFilter),
    branchId && (branches.find((b) => String(b.id) === String(branchId))?.name ?? "Branch"),
    search   && `"${search}"`,
  ].filter(Boolean), [segment, pdlDays, examId, examResult, courseStatus, statusFilter, branchId, search, branches, exams]);

  const audienceSummary = audienceFilters.join(" · ");

  const canGoStep2 = selected.size > 0;
  const canGoStep3 = message.trim().length > 0;

  const goNext = () => {
    if (step === 1 && !canGoStep2) return;
    if (step === 2 && !canGoStep3) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BroadcastHeader
        step={step}
        selectedCount={selected.size}
        messageLength={message.length}
        canNext={step === 1 ? canGoStep2 : canGoStep3}
        sending={sending}
        onBack={goBack}
        onNext={goNext}
        onSend={handleSend}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6">
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md p-6">
          {step === 1 && (
            <AudienceStep
              segment={segment} setSegment={setSegment}
              search={search} setSearch={setSearch}
              branchId={branchId} setBranchId={setBranchId}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              examId={examId} setExamId={setExamId}
              examResult={examResult} setExamResult={setExamResult}
              courseStatus={courseStatus} setCourseStatus={setCourseStatus}
              pdlDays={pdlDays} setPdlDays={setPdlDays}
              branches={branches} exams={exams}
              students={students} total={total} loading={loading}
              selected={selected} toggleOne={toggleOne} toggleAll={toggleAll} allSelected={allSelected}
            />
          )}

          {step === 2 && (
            <MessageStep
              message={message} setMessage={setMessage}
              selectedCount={selected.size}
              audienceSummary={audienceSummary}
              smsCount={smsCount}
            />
          )}

          {step === 3 && (
            <ReviewStep
              previewStudent={previewStudent}
              message={message}
              selectedCount={selected.size}
              smsCount={smsCount}
              totalSms={totalSms}
              audienceFilters={audienceFilters}
            />
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${
          toast.type === "error"
            ? "bg-gradient-to-r from-rose-600 to-red-700"
            : "bg-gradient-to-r from-green-600 to-emerald-600"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
