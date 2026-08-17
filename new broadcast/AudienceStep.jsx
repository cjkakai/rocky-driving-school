import { useState, useMemo } from "react";
import {
  Users, TriangleAlert, ClipboardCheck, Layers, SlidersHorizontal,
  Search, ChevronDown, ChevronUp, Loader2, CheckSquare, Square,
} from "lucide-react";
import { SearchableSelect } from "../../ui/SearchableSelect";
import { Card, SectionLabel, StyledSelect } from "./primitives";
import {
  STATUS_OPTIONS, COURSE_STATUS_OPTIONS, PDL_DAYS_OPTIONS,
  EXAM_RESULT_OPTIONS, STATUS_STYLES, BRAND, titleCase,
} from "./constants";

const SEGMENTS = [
  { id: "all",    label: "All active students",   description: "Everyone currently active",           icon: Users },
  { id: "pdl",    label: "PDL expiring soon",      description: "Provisional licence about to lapse",  icon: TriangleAlert },
  { id: "exam",   label: "Exam results",           description: "Tied to a specific exam sitting",      icon: ClipboardCheck },
  { id: "course", label: "Course status",          description: "At a specific stage of their course",  icon: Layers },
  { id: "custom", label: "Custom filter",          description: "Build your own combination",           icon: SlidersHorizontal },
];

export default function AudienceStep({
  segment, setSegment,
  search, setSearch,
  branchId, setBranchId,
  statusFilter, setStatusFilter,
  examId, setExamId,
  examResult, setExamResult,
  courseStatus, setCourseStatus,
  pdlDays, setPdlDays,
  branches, exams,
  students, total, loading,
  selected, toggleOne, toggleAll, allSelected,
}) {
  const [showTable, setShowTable] = useState(false);

  const summary = useMemo(() => {
    const bits = [];
    if (segment === "pdl" && pdlDays) bits.push(`PDL ≤ ${pdlDays}d`);
    if (segment === "exam" && examId) bits.push(exams.find((e) => String(e.id) === String(examId))?.exam_name ?? "Exam");
    if (segment === "exam" && examResult) bits.push(EXAM_RESULT_OPTIONS.find((o) => o.value === examResult)?.label);
    if (segment === "course" && courseStatus) bits.push(titleCase(courseStatus));
    if (segment === "custom" && statusFilter) bits.push(titleCase(statusFilter));
    if (branchId) bits.push(branches.find((b) => String(b.id) === String(branchId))?.name ?? "Branch");
    if (search) bits.push(`"${search}"`);
    return bits.filter(Boolean).join(" · ");
  }, [segment, pdlDays, examId, examResult, courseStatus, statusFilter, branchId, search, branches, exams]);

  const pickSegment = (id) => {
    setSegment(id);
    // reset segment-specific fields when switching
    setExamId(""); setExamResult("");
    setCourseStatus(""); setPdlDays(""); setStatusFilter("");
    if (id === "all") setStatusFilter("active");
    setShowTable(false);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ── Segment picker ─────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-black text-gray-900 mb-1">Who do you want to reach?</h2>
        <p className="text-xs text-gray-400 mb-4">Pick a targeting preset — you can fine-tune it after.</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {SEGMENTS.map((s) => {
            const active = segment === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => pickSegment(s.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  active
                    ? "border-[#c41820] bg-red-50/70 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                    active ? "text-white" : "bg-gray-100 text-gray-400"
                  }`}
                  style={active ? { background: BRAND } : undefined}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className={`text-sm font-extrabold leading-tight ${active ? "text-[#c41820]" : "text-gray-800"}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Refine strip — depends on chosen segment ─────────────── */}
      {segment && segment !== "custom" && (
        <Card>
          <div className="p-4 flex flex-wrap items-end gap-3">
            {segment === "pdl" && (
              <div>
                <SectionLabel>Expires within</SectionLabel>
                <div className="flex gap-1.5">
                  {PDL_DAYS_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setPdlDays(pdlDays === d ? "" : d)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        pdlDays === d
                          ? "text-white border-transparent"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                      }`}
                      style={pdlDays === d ? { background: "#d97706" } : undefined}
                    >
                      ≤{d} days
                    </button>
                  ))}
                </div>
              </div>
            )}

            {segment === "exam" && (
              <>
                <div className="min-w-[220px] flex-1">
                  <SectionLabel>Exam</SectionLabel>
                  <SearchableSelect
                    value={examId}
                    onChange={(v) => { setExamId(v); setExamResult(""); }}
                    options={exams.map((e) => ({ value: String(e.id), label: e.exam_name }))}
                    placeholder="Select exam…"
                  />
                </div>
                {examId && (
                  <div className="min-w-[160px]">
                    <SectionLabel>Result</SectionLabel>
                    <StyledSelect value={examResult} onChange={(e) => setExamResult(e.target.value)} accent>
                      {EXAM_RESULT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </StyledSelect>
                  </div>
                )}
              </>
            )}

            {segment === "course" && (
              <div className="min-w-[220px]">
                <SectionLabel>Course status</SectionLabel>
                <StyledSelect value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)}>
                  <option value="">Select a stage…</option>
                  {COURSE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </StyledSelect>
              </div>
            )}

            <div className="w-px h-9 bg-gray-100 hidden sm:block" />

            <div className="min-w-[180px]">
              <SectionLabel>Branch</SectionLabel>
              <SearchableSelect
                value={branchId}
                onChange={setBranchId}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="All branches"
              />
            </div>

            <div className="min-w-[200px] flex-1">
              <SectionLabel>Search</SectionLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, adm. no, phone…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41820]/30 bg-gray-50/60 transition-all"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Custom — full advanced form ──────────────────────────── */}
      {segment === "custom" && (
        <Card>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41820]/30 bg-gray-50/60 transition-all"
              />
            </div>
            <div>
              <SectionLabel>Branch</SectionLabel>
              <SearchableSelect
                value={branchId}
                onChange={setBranchId}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="All branches"
              />
            </div>
            <div>
              <SectionLabel>Student status</SectionLabel>
              <StyledSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </StyledSelect>
            </div>
            <div>
              <SectionLabel>Course status</SectionLabel>
              <StyledSelect value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)}>
                <option value="">All course statuses</option>
                {COURSE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </StyledSelect>
            </div>
            <div>
              <SectionLabel>PDL expiry</SectionLabel>
              <div className="flex gap-1.5">
                {PDL_DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setPdlDays(pdlDays === d ? "" : d)}
                    className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${
                      pdlDays === d
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    ≤{d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Result bar + collapsible review table ────────────────── */}
      {segment && (
        <Card>
          <button
            onClick={() => setShowTable((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="text-left">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: BRAND }} />
                  <span className="text-sm font-semibold">Matching students…</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-black text-gray-900">
                    <span style={{ color: BRAND }}>{selected.size}</span> student{selected.size !== 1 ? "s" : ""} selected
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{summary || "No refinements applied"}</p>
                </>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              {showTable ? "Hide list" : "Review list"}
              {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showTable && (
            <div className="border-t border-gray-100">
              <div className="px-5 py-2.5 flex items-center justify-between bg-gray-50/60 border-b border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">
                  Uncheck anyone you want to exclude from this campaign
                </span>
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#c41820] transition-colors"
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 w-10" />
                      {["Name", "Adm. No", "Phone", "Branch", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400 font-medium">
                          No students match yet
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => {
                        const isSel = selected.has(s.id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleOne(s.id)}
                            className={`cursor-pointer border-b border-gray-50 transition-all ${
                              isSel ? "bg-red-50/60" : idx % 2 === 1 ? "bg-gray-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-2.5">
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${!isSel ? "border-gray-300" : ""}`}
                                style={isSel ? { background: BRAND, borderColor: BRAND } : undefined}
                              >
                                {isSel && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{s.full_name}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{s.admission_number}</td>
                            <td className="px-4 py-2.5 text-gray-500 tabular-nums text-xs">{s.phone}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{s.branch?.name ?? "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
