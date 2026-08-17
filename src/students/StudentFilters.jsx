import { Search, X, CalendarDays, SlidersHorizontal } from "lucide-react";
import { SearchableSelect } from "../ui/SearchableSelect";

const TODAY = new Date().toISOString().slice(0, 10);
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}
function firstOfMonth() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
}
const QUICK_PERIODS = [
  { label: "Today",      dateFrom: TODAY,          dateTo: TODAY },
  { label: "This Week",  dateFrom: daysAgo(6),     dateTo: TODAY },
  { label: "This Month", dateFrom: firstOfMonth(), dateTo: TODAY },
];

const STATUS_TABS = [
  { value: "",          label: "All Active" },
  { value: "all",       label: "All" },
  { value: "active",    label: "Active" },
  { value: "dormant",   label: "Dormant" },
  { value: "offloaded", label: "Offloaded" },
];

const COURSE_STATUS_OPTIONS = [
  { value: "",                     label: "All Statuses" },
  { value: "onboarded",            label: "Onboarded" },
  { value: "pending_pdl",          label: "Pending PDL" },
  { value: "active",               label: "Active" },
  { value: "pending_exam_booking", label: "Pending Exam" },
  { value: "exam_list",            label: "Exam List" },
  { value: "exam_approved",        label: "Exam Approved" },
  { value: "failed",               label: "Failed" },
  { value: "retake_booked",        label: "Retake Booked" },
  { value: "completed",            label: "Completed" },
  { value: "dormant",              label: "Dormant" },
];

export function StudentFilters({ filters, onChange, onChangePeriod, branches, courses, exams = [], isBranchUser }) {
  const {
    searchQuery, filterBranch, filterStatus,
    filterCourse, filterCourseStatus, filterExam,
    dateFrom, dateTo,
  } = filters;

  const activeQuick = QUICK_PERIODS.find((q) => q.dateFrom === dateFrom && q.dateTo === dateTo)?.label ?? null;
  const hasDateFilter = dateFrom || dateTo;

  const activeChips = [
    searchQuery        && { key: "searchQuery",        label: `"${searchQuery}"` },
    filterBranch       && { key: "filterBranch",       label: branches.find((b) => String(b.id) === String(filterBranch))?.name ?? "Branch" },
    filterCourse       && { key: "filterCourse",       label: courses.find((c) => String(c.id) === String(filterCourse))?.class_name ?? "Course" },
    filterCourseStatus && { key: "filterCourseStatus", label: COURSE_STATUS_OPTIONS.find((o) => o.value === filterCourseStatus)?.label ?? filterCourseStatus },
    filterExam         && { key: "filterExam",         label: exams.find((e) => String(e.id) === String(filterExam))?.exam_name ?? "Exam" },
    hasDateFilter      && { key: "__date__",            label: activeQuick ?? `${dateFrom} → ${dateTo}` },
  ].filter(Boolean);

  const clearAll = () => {
    ["searchQuery", "filterBranch", "filterStatus", "filterCourse", "filterCourseStatus", "filterExam"]
      .forEach((k) => onChange(k, ""));
    onChangePeriod({ dateFrom: "", dateTo: "" });
  };

  const removeChip = (key) => {
    if (key === "__date__") return onChangePeriod({ dateFrom: "", dateTo: "" });
    onChange(key, "");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>

      {/* ── Top accent strip ── */}
      <div className="h-1 w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg, #1a0a0b, #3d1a1c, #c41820)" }} />

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Filters & Period</span>
          {activeChips.length > 0 && (
            <span className="text-[11px] font-bold bg-[#1a0a0b] text-white px-2 py-0.5 rounded-full tabular-nums">
              {activeChips.length} active
            </span>
          )}
        </div>
        {activeChips.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="bg-white px-5 py-5 space-y-5">

        {/* Row 1: Student status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = filterStatus === tab.value;
            return (
              <button
                key={tab.value || "default"}
                type="button"
                onClick={() => onChange("filterStatus", tab.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? "bg-[#1a0a0b] text-white border-[#1a0a0b] shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-[#1a0a0b] hover:text-[#1a0a0b]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Row 2: Enrollment period */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Period</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_PERIODS.map((q) => (
              <button
                key={q.label}
                onClick={() => onChangePeriod({ dateFrom: q.dateFrom, dateTo: q.dateTo })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeQuick === q.label
                    ? "bg-[#1a0a0b] text-white border-[#1a0a0b] shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-[#1a0a0b] hover:text-[#1a0a0b]"
                }`}
              >
                {q.label}
              </button>
            ))}
            <span className="text-slate-200 select-none hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onChangePeriod({ dateFrom: e.target.value, dateTo })}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all bg-white"
              />
              <span className="text-slate-300 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => onChangePeriod({ dateFrom, dateTo: e.target.value })}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all bg-white"
              />
            </div>
            {hasDateFilter && !activeQuick && (
              <span className="text-[11px] text-[#1a0a0b] font-semibold bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                Custom Range
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Row 3: Search + dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search name, phone, admission no…"
              value={searchQuery}
              onChange={(e) => onChange("searchQuery", e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all placeholder:text-slate-400 text-slate-700"
              aria-label="Search students"
            />
          </div>
          <SearchableSelect
            value={filterBranch}
            onChange={(v) => onChange("filterBranch", v)}
            options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
            placeholder="All Branches"
            disabled={isBranchUser}
          />
          <SearchableSelect
            value={filterCourse}
            onChange={(v) => onChange("filterCourse", v)}
            options={courses.map((c) => ({ value: String(c.id), label: c.class_name ?? c.name }))}
            placeholder="All Courses"
          />
          <SearchableSelect
            value={filterExam}
            onChange={(v) => onChange("filterExam", v)}
            options={exams.map((e) => ({ value: String(e.id), label: e.exam_name }))}
            placeholder="All Exams"
          />
        </div>

        {/* Row 4: Course lifecycle */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Course Status</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_STATUS_OPTIONS.map((opt) => {
              const isActive = filterCourseStatus === opt.value;
              return (
                <button
                  key={opt.value || "all-cs"}
                  type="button"
                  onClick={() => onChange("filterCourseStatus", opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-[#1a0a0b] text-white border-[#1a0a0b] shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-[#1a0a0b] hover:text-[#1a0a0b]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 5: Active chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {activeChips.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200"
              >
                {label}
                <button type="button" onClick={() => removeChip(key)} aria-label={`Remove ${label}`}>
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-700 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
