import {
  Search, Eye, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles,
} from "lucide-react";
import { SearchableSelect } from "../../ui/SearchableSelect";

/* ─── Constants ───────────────────────────────────────────────────── */
export const STATUS_OPTIONS = ["active", "dormant", "offloaded"];
export const COURSE_STATUS_OPTIONS = [
  "onboarded", "pending_pdl", "active", "pending_exam_booking",
  "exam_booked", "exam_approved", "failed", "retake_booked", "completed", "dormant",
];
export const PDL_DAYS_OPTIONS = ["7", "15", "30"];
export const PAGE_SIZE = 50;

export const EXAM_RESULT_OPTIONS = [
  { value: "",     label: "All Results" },
  { value: "PASS", label: "Passed" },
  { value: "FAIL", label: "Failed" },
];

export const TEMPLATES = [
  { id: "welcome", label: "👋 Welcome",         text: "Welcome to Five Star Driving School 🚗\nWe wish you success in your training!" },
  { id: "payment", label: "💰 Payment Reminder", text: "Reminder: Your balance is KES [AMOUNT]. Kindly clear to proceed with exam booking.\nPaybill: 400222\nAccount: [REF]" },
  { id: "exam",    label: "📅 Exam Reminder",    text: "Your exam is scheduled soon. Please ensure you're prepared and arrive on time. Good luck!" },
  { id: "pdl",     label: "⚠️ PDL Expiry",       text: "Alert ⚠️\nYour PDL expires in 30 days. A penalty of KES 3,000 may apply. Kindly book early." },
];

export const STATUS_STYLES = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  dormant:   "bg-slate-100 text-slate-500 border-slate-200",
  offloaded: "bg-gray-100 text-gray-500 border-gray-200",
};

/* ─── Shared primitives (exported so Broadcast.jsx can reuse) ─────── */
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, gradient, right, badge }) {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between"
      style={{ background: gradient ?? "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-extrabold text-white tracking-wide">{title}</span>
        {badge && (
          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
            {badge}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">{children}</p>
  );
}

export function StyledSelect({ value, onChange, children, accent }) {
  const base = "w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-all text-gray-700 bg-white";
  const ring = accent
    ? "border-indigo-200 focus:ring-indigo-400"
    : "border-gray-200 focus:ring-blue-400 bg-gray-50/60";
  return (
    <select className={`${base} ${ring}`} value={value} onChange={onChange}>
      {children}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function BroadcastFilters({
  /* filter values */
  search, setSearch,
  branchId, setBranchId,
  statusFilter, setStatusFilter,
  examId, setExamId,
  examResult, setExamResult,
  courseStatus, setCourseStatus,
  pdlDays, setPdlDays,
  /* dropdown data */
  branches, exams,
  /* table toggle */
  total, showTable, setShowTable,
  /* active filter count for badge */
  activeFilterCount,
}) {
  return (
    <Card>
      <CardHeader
        icon={SlidersHorizontal}
        title="Audience Filters"
        gradient="linear-gradient(135deg,#1e293b,#334155)"
        badge={activeFilterCount > 0 ? `${activeFilterCount} active` : undefined}
      />
      <div className="p-4 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/60 transition-all"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Exam filter section */}
        <div className={`rounded-xl border p-3 space-y-2.5 transition-all duration-200 ${
          examId
            ? "border-indigo-300 bg-indigo-50/60 shadow-sm shadow-indigo-100"
            : "border-gray-200 bg-gray-50/40"
        }`}>
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-3 h-3 ${examId ? "text-indigo-500" : "text-gray-400"}`} />
            <SectionLabel>Filter by Exam Results</SectionLabel>
          </div>

          <SearchableSelect
            value={examId}
            onChange={(v) => { setExamId(v); setExamResult(""); }}
            options={exams.map((e) => ({ value: String(e.id), label: e.exam_name }))}
            placeholder="Select Exam…"
          />

          {examId && (
            <>
              <StyledSelect
                value={examResult}
                accent
                onChange={(e) => setExamResult(e.target.value)}
              >
                {EXAM_RESULT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </StyledSelect>

              <div className="flex items-center gap-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <p className="text-[10px] text-indigo-500 font-semibold leading-tight">
                  Exam mode — all student statuses included
                </p>
              </div>
            </>
          )}
        </div>

        {/* Branch — always active in both modes */}
        <div className={`rounded-xl border p-3 space-y-2 transition-all duration-200 ${
          branchId ? "border-sky-300 bg-sky-50/60 shadow-sm shadow-sky-100" : "border-gray-200 bg-gray-50/40"
        }`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${branchId ? "bg-sky-500" : "bg-gray-300"}`} />
            <SectionLabel>Branch</SectionLabel>
          </div>
          <SearchableSelect
            value={branchId}
            onChange={(v) => setBranchId(v)}
            options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
            placeholder="All Branches"
          />
        </div>

        {/* General filters — dimmed in exam mode */}
        <div className={`transition-all duration-200 space-y-3 ${examId ? "opacity-40 pointer-events-none" : ""}`}>

          {/* Student Status */}
          <div className={`rounded-xl border p-3 space-y-2 transition-all duration-200 ${
            statusFilter ? "border-violet-300 bg-violet-50/60 shadow-sm shadow-violet-100" : "border-gray-200 bg-gray-50/40"
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${statusFilter ? "bg-violet-500" : "bg-gray-300"}`} />
              <SectionLabel>Student Status</SectionLabel>
            </div>
            <StyledSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} accent={!!statusFilter}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </StyledSelect>
          </div>

          {/* Course Status */}
          <div className={`rounded-xl border p-3 space-y-2 transition-all duration-200 ${
            courseStatus ? "border-teal-300 bg-teal-50/60 shadow-sm shadow-teal-100" : "border-gray-200 bg-gray-50/40"
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${courseStatus ? "bg-teal-500" : "bg-gray-300"}`} />
              <SectionLabel>Course Status</SectionLabel>
            </div>
            <StyledSelect value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)} accent={!!courseStatus}>
              <option value="">All Course Statuses</option>
              {COURSE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </StyledSelect>
          </div>

          {/* PDL Expiry */}
          <div className={`rounded-xl border p-3 space-y-2 transition-all duration-200 ${
            pdlDays ? "border-amber-300 bg-amber-50/60 shadow-sm shadow-amber-100" : "border-gray-200 bg-gray-50/40"
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${pdlDays ? "bg-amber-500" : "bg-gray-300"}`} />
              <SectionLabel>PDL Expiry</SectionLabel>
            </div>
            <div className="flex gap-1.5">
              {PDL_DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setPdlDays(pdlDays === d ? "" : d)}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-xl border transition-all ${
                    pdlDays === d
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  ≤{d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Toggle student list */}
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            {showTable ? "Hide" : "View"} Students
            <span className="font-black tabular-nums text-blue-600">({total})</span>
          </span>
          {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

    </Card>
  );
}