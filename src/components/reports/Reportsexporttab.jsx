import { useState, useCallback } from "react";
import { Download, FileSpreadsheet, Loader2, CheckCircle2, Info } from "lucide-react";
import { Btn } from "../../ui";
import { fmt } from "../../utils/students.utils";
import { reportsAPI } from "../../api/reports.api";

const SECTION_DEFS = [
  { key: "operational",    label: "Operational summary",   desc: "Registrations, attendance, inquiries, trips, exams" },
  { key: "revenue",        label: "Revenue summary",       desc: "Total revenue and breakdown by payment type" },
  { key: "branch_perf",    label: "Branch performance",    desc: "Per-branch revenue, attendance, registrations" },
  { key: "course_enroll",  label: "Course enrollments",    desc: "Enrollments per course across the period" },
];

function SectionToggle({ section, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="mt-0.5 shrink-0">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 group-hover:border-blue-400"
        }`}>
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(section.key, e.target.checked)} />
      <div>
        <p className="text-sm font-semibold text-gray-800">{section.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{section.desc}</p>
      </div>
    </label>
  );
}

function PreviewRow({ label, value, indent = false }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-gray-50 last:border-0 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${indent ? "text-gray-500" : "text-gray-700 font-medium"}`}>{label}</span>
      <span className={`text-sm font-bold ${indent ? "text-gray-600" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

export function ReportsExportTab({ branches, courses, apiFilters }) {
  const [sections, setSections] = useState({
    operational: true,
    revenue:     true,
    branch_perf: true,
    course_enroll: false,
  });
  const [preview, setPreview]       = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [exported, setExported]     = useState(false);
  const [error, setError]           = useState("");

  const toggleSection = (key, val) => setSections((s) => ({ ...s, [key]: val }));
  const anySelected   = Object.values(sections).some(Boolean);

  const loadPreview = useCallback(async () => {
    if (!anySelected) return;
    setLoadingPreview(true);
    setError("");
    try {
      // Fetch summary data from backend
      const { reportsAPI } = await import("../../api/reports.api");
      const data = await reportsAPI.exportSummary({ ...apiFilters, sections: Object.keys(sections).filter(k => sections[k]) });
      setPreview(data);
    } catch (e) {
      setError("Failed to load preview: " + e.message);
    } finally {
      setLoadingPreview(false);
    }
  }, [JSON.stringify(apiFilters), JSON.stringify(sections)]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      await reportsAPI.exportExcel({
        ...apiFilters,
        sections: Object.keys(sections).filter((k) => sections[k]),
      });
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      setError("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const fmtLabel = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      {/* Left: Config panel */}
      <div className="xl:col-span-2 space-y-4">

        {/* Date range info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Export range</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {apiFilters.date_from && apiFilters.date_to
                  ? `${apiFilters.date_from} → ${apiFilters.date_to}`
                  : apiFilters.date_from
                  ? `From ${apiFilters.date_from}`
                  : "All available data — use date filters above to narrow"}
              </p>
              {apiFilters.branch && (
                <p className="text-xs text-blue-500 mt-0.5">Filtered to one branch</p>
              )}
            </div>
          </div>
        </div>

        {/* Section selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Include sections</h3>
          <div className="space-y-4">
            {SECTION_DEFS.map((s) => (
              <SectionToggle key={s.key} section={s} checked={sections[s.key]} onChange={toggleSection} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Btn variant="outline" onClick={loadPreview} disabled={!anySelected || loadingPreview} className="w-full justify-center">
            {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Preview data
          </Btn>
          <Btn onClick={handleExport} disabled={!anySelected || exporting} className="w-full justify-center">
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : exported
              ? <CheckCircle2 className="w-4 h-4" />
              : <Download className="w-4 h-4" />}
            {exported ? "Exported!" : "Download Excel"}
          </Btn>
        </div>

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>
        )}
      </div>

      {/* Right: Preview */}
      <div className="xl:col-span-3">
        {!preview && !loadingPreview ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 gap-3">
            <FileSpreadsheet className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Click "Preview data" to see what will be exported</p>
            <p className="text-xs">Numbers only — no individual transactions</p>
          </div>
        ) : loadingPreview ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Export preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Aggregated totals only — no individual records exported</p>
            </div>
            <div className="p-5 space-y-6 max-h-[520px] overflow-y-auto">

              {sections.operational && preview?.operational && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Operational summary</p>
                  <PreviewRow label="Registrations"      value={preview.operational.registrations?.toLocaleString() ?? "—"} />
                  <PreviewRow label="Course enrollments" value={preview.operational.enrollments?.toLocaleString() ?? "—"} />
                  <PreviewRow label="Exam bookings"      value={preview.operational.exam_bookings?.toLocaleString() ?? "—"} />
                  <PreviewRow label="Practical lessons"  value={preview.operational.practical_lessons?.toLocaleString() ?? "—"} />
                  <PreviewRow label="Attendance"         value={preview.operational.attendance?.toLocaleString() ?? "—"} />
                  <PreviewRow label="Inquiries"          value={preview.operational.inquiries?.toLocaleString() ?? "—"} />
                </div>
              )}

              {sections.revenue && preview?.revenue && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Revenue</p>
                  <PreviewRow label="Total revenue" value={fmt(preview.revenue.total ?? 0)} />
                  {(preview.revenue.by_type ?? []).map((r) => (
                    <PreviewRow key={r.payment_type} label={fmtLabel(r.payment_type)}
                      value={fmt(r.amount ?? 0)} indent />
                  ))}
                </div>
              )}

              {sections.branch_perf && preview?.branch_perf && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Branch performance</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Branch","Revenue","Regs","Enroll","Attend"].map((h) => (
                            <th key={h} className="py-2 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.branch_perf.map((r) => (
                          <tr key={r.branch} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 pr-3 font-medium text-gray-700">{r.branch}</td>
                            <td className="py-2 pr-3 font-bold text-emerald-700">{fmt(r.revenue ?? 0)}</td>
                            <td className="py-2 pr-3 text-gray-600">{r.registrations ?? 0}</td>
                            <td className="py-2 pr-3 text-gray-600">{r.enrollments ?? 0}</td>
                            <td className="py-2 pr-3 text-gray-600">{r.attendance ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {sections.course_enroll && preview?.course_enroll && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Course enrollments</p>
                  {preview.course_enroll.map((r) => (
                    <PreviewRow key={r.course} label={r.course} value={`${r.count} enrollments`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}