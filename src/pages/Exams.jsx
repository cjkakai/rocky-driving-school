import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Loader2, AlertCircle,
  ClipboardList, Clock3, AlertTriangle, GraduationCap,
  TrendingUp,
} from "lucide-react";
import { Btn, Modal, Label, Input } from "../ui";
import { useAuth } from "../context/AuthContext";
import { examsAPI } from "../api/exams.api";
import { ExamCard } from "../components/exams/ExamCard";

// ─────────────────────────────────────────────────────────────
// Brand accents — shared with Broadcast page
// ─────────────────────────────────────────────────────────────
const BRAND      = "#c41820";
const BRAND_DARK = "#8f1017";
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`;
const BRAND_SHADOW   = "0 4px 14px rgba(196,24,32,0.32)";

// ─────────────────────────────────────────────────────────────
// Toast / Confirm System
// ─────────────────────────────────────────────────────────────
let _addToast = null;
let _addConfirm = null;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirms, setConfirms] = useState([]);

  useEffect(() => {
    _addToast = (t) => {
      const id = Date.now() + Math.random();
      setToasts((p) => [...p, { ...t, id }]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), t.duration ?? 3500);
    };
    _addConfirm = (c) => {
      const id = Date.now() + Math.random();
      setConfirms((p) => [...p, { ...c, id }]);
    };
    return () => { _addToast = null; _addConfirm = null; };
  }, []);

  const resolveConfirm = (id, result) => {
    setConfirms((p) => {
      const c = p.find((x) => x.id === id);
      if (c) c.resolve(result);
      return p.filter((x) => x.id !== id);
    });
  };

  const variantStyles = {
    success: { bar: "bg-emerald-500", icon: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />, wrapper: "border-emerald-100 bg-white" },
    error:   { bar: "bg-red-500",     icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,       wrapper: "border-red-100 bg-white" },
    info:    { bar: "bg-[#1a0a0b]",   icon: <AlertCircle className="w-4 h-4 text-[#1a0a0b] shrink-0" />, wrapper: "border-gray-100 bg-white" },
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
        {toasts.map((t) => {
          const s = variantStyles[t.variant ?? "info"];
          return (
            <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg px-4 py-3 min-w-[280px] max-w-[360px] ${s.wrapper}`}>
              <div className={`mt-0.5 w-1 self-stretch rounded-full ${s.bar}`} />
              {s.icon}
              <div className="flex-1 min-w-0">
                {t.title   && <p className="text-sm font-semibold text-gray-900">{t.title}</p>}
                {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {confirms.map((c) => (
        <div key={c.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) resolveConfirm(c.id, false); }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-2xl bg-amber-50 border border-amber-100 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  {c.title   && <p className="font-bold text-gray-900 text-base">{c.title}</p>}
                  {c.message && <p className="text-sm text-gray-500 mt-1">{c.message}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <Btn variant="outline" size="sm" onClick={() => resolveConfirm(c.id, false)}>Cancel</Btn>
              <Btn size="sm" variant={c.danger ? "destructive" : "primary"} onClick={() => resolveConfirm(c.id, true)}>
                {c.confirmLabel ?? "Confirm"}
              </Btn>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function toast(options) { _addToast?.(options); }
export function confirm(options) {
  return new Promise((resolve) => { _addConfirm?.({ ...options, resolve }); });
}

// ─────────────────────────────────────────────────────────────
// KPI Card — flat, left accent bar (matches app theme)
// ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${accent}15` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MonthPickerPopover
// ─────────────────────────────────────────────────────────────
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOW_YEAR  = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth();

function MonthPickerPopover({ value, onChange }) {
  const [open, setOpen]             = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseInt(value.split("-")[0]));
  const ref = useRef(null);

  const selYear  = parseInt(value.split("-")[0]);
  const selMonth = parseInt(value.split("-")[1]) - 1;

  useEffect(() => { setPickerYear(parseInt(value.split("-")[0])); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (m) => { onChange(`${pickerYear}-${String(m + 1).padStart(2, "0")}`); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        style={open ? { background: BRAND_GRADIENT, borderColor: "transparent" } : undefined}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${
          open ? "text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        {MONTHS[selMonth]} {selYear}
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={() => setPickerYear((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-900">{pickerYear}</span>
            <button onClick={() => setPickerYear((y) => y + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-3">
            {MONTHS.map((m, i) => {
              const isSelected = pickerYear === selYear && i === selMonth;
              const isToday    = pickerYear === NOW_YEAR && i === NOW_MONTH;
              return (
                <button
                  key={m} onClick={() => pick(i)}
                  style={isSelected ? { background: BRAND_GRADIENT } : undefined}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    isSelected ? "text-white"
                    : isToday  ? "border border-gray-300 text-gray-900 hover:bg-gray-50"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          {(selYear !== NOW_YEAR || selMonth !== NOW_MONTH) && (
            <div className="px-3 pb-3">
              <button
                onClick={() => { setPickerYear(NOW_YEAR); pick(NOW_MONTH); }}
                className="w-full py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Current month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CreateExamListForm
// ─────────────────────────────────────────────────────────────
function CreateExamListForm({ onClose, onSuccess }) {
  const [form, setForm]     = useState({ exam_name: "", exam_date: "", test_center: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exam_name.trim()) return setError("Exam list name is required.");
    if (!form.exam_date)        return setError("Exam date is required.");
    setLoading(true); setError("");
    try {
      await examsAPI.create({ exam_name: form.exam_name.trim(), exam_date: form.exam_date, test_center: form.test_center.trim() });
      toast({ variant: "success", title: "Exam list created", message: `"${form.exam_name.trim()}" has been scheduled.` });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.message || "Failed to create exam list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div>
        <Label>Exam List Name</Label>
        <Input placeholder="e.g. Class B — January 2025" value={form.exam_name} onChange={(e) => set("exam_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Exam Date</Label>
          <Input type="date" value={form.exam_date} onChange={(e) => set("exam_date", e.target.value)} />
        </div>
        <div>
          <Label>Test Center</Label>
          <Input placeholder="e.g. Nairobi NTSA" value={form.test_center} onChange={(e) => set("test_center", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <button
          type="submit"
          disabled={loading}
          style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? "Creating…" : "Create Exam List"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(m) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(m) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Exams() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [exams, setExams]         = useState([]);
  const [summary, setSummary]     = useState({ passed: 0, failed: 0, pending: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [month, setMonth]         = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen]     = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [examData, summaryData] = await Promise.all([
        examsAPI.getAll({ month }),
        examsAPI.getSummary({ month }),
      ]);
      setExams(Array.isArray(examData) ? examData : examData.results ?? []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Failed to load exam lists.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const totalPassed  = summary.passed  ?? 0;
  const totalFailed  = summary.failed  ?? 0;
  const totalPending = summary.pending ?? 0;
  const passRate     = totalPassed + totalFailed > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : 0;

  const filteredExams = useMemo(() => {
    if (!statusFilter) return exams;
    return exams.filter((e) => e.status === statusFilter);
  }, [exams, statusFilter]);

  const handleResult = useCallback(async (booking, result) => {
    try {
      await examsAPI.createResult({ exam_booking: booking.id, result });
      toast({ variant: "success", title: "Result recorded", message: `${booking.student_name} marked as ${result === "pass" ? "Passed ✓" : "Failed ✗"}.` });
      examsAPI.getSummary({ month }).then(setSummary).catch(() => {});
      return true;
    } catch (err) {
      toast({ variant: "error", title: "Action failed", message: err.message || "Could not record result." });
      return false;
    }
  }, [month]);

  const handleApprove = useCallback(async (booking, comment) => {
    try {
      await examsAPI.approve(booking.id, comment);
      toast({ variant: "success", title: "Approved", message: `${booking.student_name} moved to Exam Approved.` });
      return true;
    } catch (err) {
      toast({ variant: "error", title: "Action failed", message: err.message || "Could not approve." });
      return false;
    }
  }, []);

  const handleRemove = useCallback(async (booking) => {
    try {
      await examsAPI.removeBooking(booking.id);
      toast({ variant: "info", title: "Student removed", message: `${booking.student_name} removed. Branch can resubmit.` });
      examsAPI.getSummary({ month }).then(setSummary).catch(() => {});
      return true;
    } catch (err) {
      toast({ variant: "error", title: "Action failed", message: err.message || "Could not remove student." });
      return false;
    }
  }, [month]);

  const handleCloseExam = useCallback(async (id) => {
    try {
      await examsAPI.closeExam(id);
      toast({ variant: "info", title: "Exam list closed", message: "You can now record results for students." });
      setExams((prev) => prev.map((e) => e.id === id ? { ...e, status: "closed" } : e));
    } catch (err) {
      toast({ variant: "error", title: "Failed to close", message: err.message });
    }
  }, []);

  const STATUS_TABS = [
    { value: "",       label: "All" },
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen">

        {/* ── Page Header ── */}
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Exam Lists</h1>
                <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Manage exam sessions, approvals and results</p>
              </div>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setCreateOpen(true)}
                style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl transition-all hover:brightness-110"
              >
                <Plus className="w-4 h-4" /> Create Exam List
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Exam Lists"   value={exams.length}  sub={`This month`}     accent="#1a0a0b" icon={ClipboardList} />
            <KpiCard label="Passed"       value={totalPassed}   sub="Students"         accent="#059669" icon={CheckCircle} />
            <KpiCard label="Failed"       value={totalFailed}   sub="Need retake"      accent={BRAND}   icon={XCircle} />
            <KpiCard label="Pass Rate"    value={`${passRate}%`} sub="Of recorded"     accent="#d97706" icon={TrendingUp} />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Status tabs */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    style={active ? { background: BRAND_GRADIENT } : undefined}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Month navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(prevMonth(month))}
                className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <MonthPickerPopover value={month} onChange={setMonth} />
              <button
                onClick={() => setMonth(nextMonth(month))}
                className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
              <div
                style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center animate-pulse"
              >
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-500">Loading exam lists…</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-24 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Clock3 className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold">No exam lists this month</p>
              <p className="text-sm text-gray-400 mt-1">Try a different month or create a new exam list</p>
              {isSuperAdmin && (
                <button
                  onClick={() => setCreateOpen(true)}
                  style={{ background: BRAND_GRADIENT, boxShadow: BRAND_SHADOW }}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl transition-all hover:brightness-110"
                >
                  <Plus className="w-4 h-4" /> Create Exam List
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  isSuperAdmin={isSuperAdmin}
                  onResult={handleResult}
                  onApprove={handleApprove}
                  onRemove={handleRemove}
                  onClose={handleCloseExam}
                  confirm={confirm}
                />
              ))}
            </div>
          )}
        </div>

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Exam List">
          <CreateExamListForm onClose={() => setCreateOpen(false)} onSuccess={fetchExams} />
        </Modal>
      </div>
    </>
  );
}