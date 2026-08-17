import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Loader2, AlertCircle,
  ClipboardList, Clock3, AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";
import { Btn, Modal, Label, Input } from "../ui";
import { SearchableSelect } from "../ui/SearchableSelect";
import { useAuth } from "../context/AuthContext";
import { examsAPI } from "../api/exams.api";
import { ExamCard } from "../components/exams/ExamCard";

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
    success: { bar: "bg-green-500", icon: <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />, wrapper: "border-green-100 bg-white" },
    error:   { bar: "bg-red-500",   icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,     wrapper: "border-red-100 bg-white" },
    info:    { bar: "bg-blue-500",  icon: <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />, wrapper: "border-blue-100 bg-white" },
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
        {toasts.map((t) => {
          const s = variantStyles[t.variant ?? "info"];
          return (
            <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg px-4 py-3 min-w-[280px] max-w-[360px] ${s.wrapper} animate-in slide-in-from-bottom-3 fade-in duration-200`}>
              <div className={`mt-0.5 w-1 self-stretch rounded-full ${s.bar}`} />
              {s.icon}
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold text-gray-900">{t.title}</p>}
                {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {confirms.map((c) => (
        <div key={c.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={(e) => { if (e.target === e.currentTarget) resolveConfirm(c.id, false); }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-2xl bg-amber-50 border border-amber-100 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  {c.title && <p className="font-bold text-gray-900 text-base">{c.title}</p>}
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
// CountUp
// ─────────────────────────────────────────────────────────────
function CountUp({ value, duration = 800 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{count}</>;
}

// ─────────────────────────────────────────────────────────────
// PassRateRing
// ─────────────────────────────────────────────────────────────
function PassRateRing({ value }) {
  return (
    <div className="relative w-[180px] h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ name: "Pass Rate", value }]} startAngle={90} endAngle={-270} barSize={14}>
          <RadialBar dataKey="value" cornerRadius={20} background clockWise />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-black text-green-900"><CountUp value={value} />%</p>
        <p className="text-xs uppercase tracking-[0.18em] text-green-500">Pass Rate</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ResultsDonut
// ─────────────────────────────────────────────────────────────
function ResultsDonut({ passed, failed, pending }) {
  const data = [
    { name: "Passed",  value: passed,  color: "#22c55e" },
    { name: "Failed",  value: failed,  color: "#ef4444" },
    { name: "Pending", value: pending, color: "#eab308" },
  ];
  return (
    <div className="relative w-[220px] h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={68} outerRadius={92} paddingAngle={3} dataKey="value" stroke="transparent">
            {data.map((e) => <Cell key={e.name} fill={e.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-black text-gray-900">{passed + failed + pending}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Total Results</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    blue:  { card: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400",       label: "text-blue-100",    value: "text-white", sub: "text-blue-200",    iconBg: "bg-white/20 border-white/30 text-white" },
    green: { card: "bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400", label: "text-emerald-100", value: "text-white", sub: "text-emerald-200", iconBg: "bg-white/20 border-white/30 text-white" },
    red:   { card: "bg-gradient-to-br from-red-500 to-rose-600 border-red-400",          label: "text-red-100",     value: "text-white", sub: "text-red-200",     iconBg: "bg-white/20 border-white/30 text-white" },
  };
  const c = colors[color];
  return (
    <div className={`relative overflow-hidden rounded-3xl border ${c.card} p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] font-semibold ${c.label}`}>{label}</p>
          <p className={`text-4xl font-black mt-3 ${c.value}`}><CountUp value={Number(value)} /></p>
          {sub && <p className={`text-sm mt-1 ${c.sub}`}>{sub}</p>}
        </div>
        <div className={`p-3 rounded-2xl border ${c.iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MonthPickerPopover — custom, no library
// ─────────────────────────────────────────────────────────────
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOW_YEAR  = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth();

function MonthPickerPopover({ value, onChange }) {
  const [open, setOpen]         = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseInt(value.split("-")[0]));
  const ref = useRef(null);

  const selYear  = parseInt(value.split("-")[0]);
  const selMonth = parseInt(value.split("-")[1]) - 1;

  // Sync picker year when value changes externally (prev/next arrows)
  useEffect(() => { setPickerYear(parseInt(value.split("-")[0])); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (m) => {
    onChange(`${pickerYear}-${String(m + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${
          open ? "border-gray-400 bg-gray-50 text-gray-900" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {MONTHS[selMonth]} {selYear}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">

          {/* Year row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setPickerYear((y) => y - 1)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-900">{pickerYear}</span>
            <button
              onClick={() => setPickerYear((y) => y + 1)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1 p-3">
            {MONTHS.map((m, i) => {
              const isSelected = pickerYear === selYear && i === selMonth;
              const isToday    = pickerYear === NOW_YEAR && i === NOW_MONTH;
              return (
                <button
                  key={m}
                  onClick={() => pick(i)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : isToday
                      ? "border border-gray-300 text-gray-900 hover:bg-gray-50"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Jump to current */}
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
// CreateExamForm
// ─────────────────────────────────────────────────────────────
function CreateExamForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({ exam_name: "", exam_date: "", test_center: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exam_name.trim()) return setError("Exam name is required.");
    if (!form.exam_date) return setError("Exam date is required.");
    setLoading(true); setError("");
    try {
      await examsAPI.create({ exam_name: form.exam_name.trim(), exam_date: form.exam_date, test_center: form.test_center.trim() });
      toast({ variant: "success", title: "Exam created", message: `"${form.exam_name.trim()}" has been scheduled.` });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.message || "Failed to create exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Exam Name</Label>
          <Input value={form.exam_name} onChange={(e) => set("exam_name", e.target.value)} />
        </div>
        <div>
          <Label>Exam Date</Label>
          <Input type="date" value={form.exam_date} onChange={(e) => set("exam_date", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Test Center</Label>
          <Input value={form.test_center} onChange={(e) => set("test_center", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? "Creating..." : "Create Exam"}
        </Btn>
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

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Exams() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [exams, setExams] = useState([]);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

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
      setError(err.message || "Failed to load exams.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const totalPassed  = summary.passed  ?? 0;
  const totalFailed  = summary.failed  ?? 0;
  const totalPending = summary.pending ?? 0;
  const passRate = totalPassed + totalFailed > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : 0;

  const filteredExams = useMemo(() => {
    if (!statusFilter) return exams;
    return exams.filter((e) => e.status === statusFilter);
  }, [exams, statusFilter]);

  const handleResult = useCallback(async (booking, result) => {
    try {
      await examsAPI.createResult({ exam_booking: booking.id, result });
      toast({ variant: "success", title: "Result recorded", message: `${booking.student_name} marked as ${result === "pass" ? "Passed" : "Failed"}.` });
      examsAPI.getSummary({ month }).then(setSummary).catch(() => {});
      return true;
    } catch (err) {
      toast({ variant: "error", title: "Action failed", message: err.message || "Could not record result." });
      return false;
    }
  }, [month]);

  const handleRemove = useCallback(async (booking) => {
    try {
      await examsAPI.removeBooking(booking.id);
      toast({ variant: "success", title: "Student removed", message: `${booking.student_name} has been removed. The branch can rebook them.` });
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
      toast({ variant: "info", title: "Exam closed", message: "You can now record results for students." });
      setExams((prev) => prev.map((e) => e.id === id ? { ...e, status: "closed" } : e));
    } catch (err) {
      toast({ variant: "error", title: "Failed to close exam", message: err.message });
    }
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen mt-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Exams</h1>
            <p className="text-sm text-gray-500 mt-1">Manage exam sessions and results</p>
          </div>
          {isSuperAdmin && (
            <Btn onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />Create Exam</Btn>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="This Month" value={filteredExams.length} sub="Exams" color="blue" icon={<ClipboardList className="w-5 h-5" />} />
            <StatCard label="Passed"     value={totalPassed}          sub="Success" color="green" icon={<CheckCircle className="w-5 h-5" />} />
            <StatCard label="Failed"     value={totalFailed}          sub="Retakes" color="red"   icon={<XCircle className="w-5 h-5" />} />
            <div className="rounded-3xl border border-gray-200 bg-white flex items-center justify-center shadow-sm">
              <PassRateRing value={passRate} />
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 flex flex-col md:flex-row items-center justify-center gap-8 shadow-sm">
            <ResultsDonut passed={totalPassed} failed={totalFailed} pending={totalPending} />
            <div className="space-y-4">
              {[
                { color: "bg-green-500",  label: "Passed",  count: totalPassed },
                { color: "bg-red-500",    label: "Failed",  count: totalFailed },
                { color: "bg-yellow-400", label: "Pending", count: totalPending },
              ].map(({ color, label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{count} Students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Status filter left — month navigator right */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <SearchableSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "active", label: "Active" },
                  { value: "closed", label: "Closed" },
                ]}
                placeholder="All Exams"
                triggerClassName="py-2"
              />
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={() => {
                const [y, m] = month.split("-").map(Number);
                const d = new Date(y, m - 2);
                setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors bg-white shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <MonthPickerPopover value={month} onChange={setMonth} />

            <button
              onClick={() => {
                const [y, m] = month.split("-").map(Number);
                const d = new Date(y, m);
                setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors bg-white shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#c41820]" />Loading exams...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-24 text-center rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="w-14 h-14 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <Clock3 className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold">No exams this month</p>
            <p className="text-sm text-gray-500 mt-1">Try a different month or create a new exam</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                isSuperAdmin={isSuperAdmin}
                onResult={handleResult}
                onRemove={handleRemove}
                onClose={handleCloseExam}
                confirm={confirm}
              />
            ))}
          </div>
        )}

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Exam">
          <CreateExamForm onClose={() => setCreateOpen(false)} onSuccess={fetchExams} />
        </Modal>
      </div>
    </>
  );
}
