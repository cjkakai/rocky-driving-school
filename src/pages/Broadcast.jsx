import { useState, useEffect, useCallback } from "react";
import {
  Send, MessageSquare, Users, X, Radio, Zap, Loader2,
  Hash, SmartphoneNfc, AlignLeft, CheckSquare, Square, Search,
} from "lucide-react";
import { studentsAPI } from "../api/students.api";
import { branchesAPI } from "../api/branches.api";
import { broadcastSMS } from "../api/sms.api";
import { examsAPI } from "../api/exams.api";
import BroadcastFilters, {
  Card, CardHeader, SectionLabel, TEMPLATES, PAGE_SIZE, STATUS_STYLES,
} from "../components/broadcast/BroadcastFilters";

/* ═══════════════════════════════════════════════════════════════════ */
export default function Broadcast() {

  /* ── Data ── */
  const [students,     setStudents]     = useState([]);
  const [branches,     setBranches]     = useState([]);
  const [exams,        setExams]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(false);

  /* ── Filters ── */
  const [search,       setSearch]       = useState("");
  const [branchId,     setBranchId]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [examId,       setExamId]       = useState("");
  const [examResult,   setExamResult]   = useState("");
  const [courseStatus, setCourseStatus] = useState("");
  const [pdlDays,      setPdlDays]      = useState("");

  /* ── Selection + message ── */
  const [selected,    setSelected]    = useState(new Set());
  const [message,     setMessage]     = useState("");

  /* ── UI state ── */
  const [sending,     setSending]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [showTable,   setShowTable]   = useState(false);

  /* ── Toast helper ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Fetch students ── */
  const fetchStudents = useCallback(async () => {
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
      if (Array.isArray(data)) {
        setStudents(data); setTotal(data.length);
      } else if (data?.results) {
        setStudents(data.results); setTotal(data.count || data.results.length);
      } else {
        setStudents([]); setTotal(0);
      }
    } catch {
      setStudents([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, branchId, statusFilter, examId, examResult, courseStatus, pdlDays]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { branchesAPI.getAll().then(setBranches).catch(() => {}); }, []);
  useEffect(() => {
    examsAPI.getAll()
      .then((d) => setExams(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, []);

  /* ── Clear selections on filter change ── */
  useEffect(() => {
    setSelected(new Set());
  }, [search, branchId, statusFilter, examId, examResult, courseStatus, pdlDays]);

  /* ── Selection helpers ── */
  const toggleOne = (id) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));
  const toggleAll   = () =>
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));

  /* ── Send ── */
  const handleSend = async () => {
    if (selected.size === 0 || !message.trim()) {
      showToast("Please select students and enter a message", "error"); return;
    }
    setSending(true); setShowConfirm(false);
    try {
      const res = await broadcastSMS([...selected], message);
      showToast(`✅ Messages sent (${res.sent} sent, ${res.failed} failed)`);
      setSelected(new Set()); setMessage("");
    } catch (e) {
      showToast(e.message || "Failed to send messages", "error");
    } finally {
      setSending(false);
    }
  };

  /* ── Derived values ── */
  const previewStudent = students.find((s) => selected.has(s.id));
  const canSend        = selected.size > 0 && message.trim().length > 0;
  const smsCount       = message.length > 160 ? 2 : 1;
  const totalSms       = selected.size * smsCount;

  const activeFilters = [
    branchId     && !examId && (branches.find((b) => b.id === parseInt(branchId))?.name ?? "Branch"),
    statusFilter && !examId && (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)),
    examId       && (exams.find((e) => e.id === parseInt(examId))?.exam_name ?? "Exam"),
    examResult   && examId && (examResult === "PASS" ? "Passed" : "Failed"),
    courseStatus && !examId && courseStatus.replace(/_/g, " "),
    pdlDays      && !examId && `PDL ≤ ${pdlDays}d`,
  ].filter(Boolean);

  /* ─────────────────────────────────────────────────────────── JSX ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 to-slate-100 pb-12">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div
        className="px-6 py-8 border-b border-white/10"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 mt-0.5">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">Broadcast Campaign</h1>
              <p className="text-xs text-white/50 font-medium mt-1.5">Compose and send bulk SMS to your students</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-white/70" />
              <span className="text-sm font-black text-white tabular-nums">{selected.size}</span>
              <span className="text-xs text-white/60">recipients</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs text-white/60">Total:</span>
              <span className="text-sm font-black text-white tabular-nums">{total}</span>
            </div>
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-400/20 border border-blue-300/30 text-blue-100 rounded-xl backdrop-blur"
              >
                <Zap className="w-3 h-3 opacity-70" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT: Filters + Table ───────────────────────────── */}
          <div className="lg:col-span-3">
            <BroadcastFilters
              search={search}           setSearch={setSearch}
              branchId={branchId}       setBranchId={setBranchId}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              examId={examId}           setExamId={setExamId}
              examResult={examResult}   setExamResult={setExamResult}
              courseStatus={courseStatus} setCourseStatus={setCourseStatus}
              pdlDays={pdlDays}         setPdlDays={setPdlDays}
              branches={branches}
              exams={exams}
              total={total}
              showTable={showTable}
              setShowTable={setShowTable}
              activeFilterCount={activeFilters.length}
            />
          </div>

          {/* ── CENTER: Composer + Table ─────────────────────────── */}
          <div className="lg:col-span-6 space-y-4">
            <Card>
              <CardHeader
                icon={MessageSquare}
                title="Message Composer"
                gradient="linear-gradient(135deg,#0f172a,#1e3a5f)"
              />
              <div className="p-5 space-y-4">

                {/* Templates */}
                <div className="space-y-2">
                  <SectionLabel>Quick Templates</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setMessage(tpl.text)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          message === tpl.text
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    rows={8}
                    maxLength={320}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/60 leading-relaxed transition-all"
                    placeholder="Type your message here…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {message && (
                    <button
                      onClick={() => setMessage("")}
                      className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Stats bar */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <AlignLeft className="w-3 h-3" />
                      <span className="tabular-nums font-bold text-gray-700">{message.length}</span>
                      <span>/ 320 chars</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3" />
                      <span className="font-bold text-gray-700">{smsCount}</span>
                      <span>SMS / recipient</span>
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    message.length > 160
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {message.length > 160 ? "2-part SMS" : "Single SMS"}
                  </span>
                </div>
              </div>
            </Card>

            {/* ── Collapsible Student Table ── */}
            {showTable && (
              <Card>
                <div
                  className="px-5 py-3.5 flex items-center justify-between"
                  style={{ background: "linear-gradient(135deg,#1e293b,#334155)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/80" />
                    <span className="text-sm font-extrabold text-white">Student List</span>
                    <span className="text-white/50 font-medium tabular-nums text-sm">({total})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAll}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
                    >
                      {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                    <button onClick={() => setShowTable(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 w-10" />
                        {["Name", "Adm. No", "Phone", "Branch", "Status", ...(examId ? ["Result"] : [])].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={examId ? 7 : 6} className="px-4 py-14 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span className="text-xs font-medium">Loading students…</span>
                            </div>
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={examId ? 7 : 6} className="px-4 py-14 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Search className="w-7 h-7 opacity-30" />
                              <span className="text-xs font-medium">No students found</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        students.map((s, idx) => {
                          const examBooking = examId
                            ? s.student_courses
                                ?.map((sc) => sc.exam_booking)
                                .filter(Boolean)
                                .find((eb) => String(eb.exam_id) === String(examId))
                            : null;
                          const result = examBooking?.result ?? null;

                          return (
                            <tr
                              key={s.id}
                              onClick={() => toggleOne(s.id)}
                              className={`cursor-pointer border-b border-gray-50 transition-all ${
                                selected.has(s.id)
                                  ? "bg-blue-50 hover:bg-blue-100"
                                  : idx % 2 === 1
                                    ? "bg-gray-50/40 hover:bg-blue-50/40"
                                    : "hover:bg-blue-50/40"
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  selected.has(s.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                }`}>
                                  {selected.has(s.id) && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{s.full_name}</td>
                              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.admission_number}</td>
                              <td className="px-4 py-3 text-gray-500 tabular-nums text-xs">{s.phone}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{s.branch?.name ?? "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                  {s.status}
                                </span>
                              </td>
                              {examId && (
                                <td className="px-4 py-3">
                                  {result?.toUpperCase() === "PASS" ? (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">PASS</span>
                                  ) : result?.toUpperCase() === "FAIL" ? (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">FAIL</span>
                                  ) : result?.toUpperCase() === "ABSENT" ? (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">ABSENT</span>
                                  ) : (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">PENDING</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Preview & Send ───────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">

              {/* Phone preview */}
              <Card>
                <CardHeader
                  icon={SmartphoneNfc}
                  title="SMS Preview"
                  gradient="linear-gradient(135deg,#1e3a5f,#1d4ed8)"
                />
                <div className="p-4 space-y-4">
                  <div className="mx-auto w-44 rounded-3xl border-4 border-gray-800 bg-gray-900 overflow-hidden shadow-xl">
                    <div className="bg-gray-800 h-5 flex items-center justify-center gap-1.5">
                      <div className="w-8 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                    </div>
                    <div className="bg-white min-h-[130px] p-3 space-y-2">
                      {previewStudent ? (
                        <>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">To</p>
                          <p className="text-xs font-extrabold text-gray-900 leading-tight">{previewStudent.full_name}</p>
                          <p className="text-[10px] text-gray-400 tabular-nums">{previewStudent.phone}</p>
                          <div className="border-t border-gray-100 pt-2">
                            <p className="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {message || <span className="text-gray-300 italic">Your message…</span>}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                          <Users className="w-6 h-6 text-gray-200" />
                          <p className="text-[10px] text-gray-300 leading-snug">Select students<br />to preview</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    {[
                      { label: "Recipients",   value: selected.size,      color: "text-gray-900" },
                      { label: "SMS / person", value: `${smsCount} SMS`,  color: "text-gray-900" },
                      { label: "Total SMS",    value: totalSms,           color: totalSms > 0 ? "text-blue-700 font-black" : "text-gray-900" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">{label}</span>
                        <span className={`font-bold tabular-nums ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Send button */}
              <Card>
                <div className="p-4 space-y-3">
                  <button
                    disabled={!canSend || sending}
                    onClick={() => setShowConfirm(true)}
                    className="w-full flex items-center justify-center gap-2.5 font-extrabold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                    style={canSend && !sending
                      ? { background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }
                      : { background: "#94a3b8" }}
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Campaign</>
                    )}
                  </button>
                  {!canSend && (
                    <p className="text-[11px] text-center text-gray-400 font-medium">
                      {selected.size === 0 ? "Select at least one student" : "Enter a message to continue"}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* ── Confirm Modal ──────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-base">Confirm Broadcast</p>
                  <p className="text-xs text-white/50 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                You are about to send an SMS to{" "}
                <span className="font-extrabold text-blue-700">{selected.size}</span>{" "}
                student{selected.size !== 1 ? "s" : ""}.
              </p>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Message Preview</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Recipients", value: selected.size },
                  { label: "SMS each",   value: smsCount },
                  { label: "Total SMS",  value: totalSms },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 rounded-xl py-2.5 border border-blue-100">
                    <p className="text-lg font-black text-blue-700 tabular-nums">{value}</p>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wide mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-2.5 text-sm font-extrabold rounded-xl text-white transition-all shadow-sm hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}
                >
                  Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${
          toast.type === "error"
            ? "bg-gradient-to-r from-red-600 to-rose-600"
            : "bg-gradient-to-r from-green-600 to-emerald-600"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}