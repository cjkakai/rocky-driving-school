import { useState, useEffect } from "react";
import { BarChart2, FileText, Download, Plus, SlidersHorizontal, X, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { reportsAPI } from "../api/reports.api";
import { Modal, Btn } from "../ui";
import { ReportDetailPanel } from "../components/reports/ReportCard";
import { ReportForm } from "../components/reports/ReportForm";
import { DrilldownModal } from "../components/reports/DrilldownModal";
import { ReportsDailyView } from "../components/reports/ReportsDailyView";
import { ReportsAnalyticsTab } from "../components/reports/Reportsanalyticstab";
import { ReportsExportTab } from "../components/reports/Reportsexporttab";

const TODAY = new Date().toISOString().slice(0, 10);
const d = (days) => {
  const dt = new Date(); dt.setDate(dt.getDate() - days);
  return dt.toISOString().slice(0, 10);
};
const QUICK = [
  { label: "Today",      dateFrom: TODAY,  dateTo: TODAY },
  { label: "7 days",     dateFrom: d(6),   dateTo: TODAY },
  { label: "30 days",    dateFrom: d(29),  dateTo: TODAY },
  { label: "This month", dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), dateTo: TODAY },
];

const TABS = [
  { key: "reports",   label: "Daily reports",  icon: FileText  },
  { key: "analytics", label: "Analytics",      icon: BarChart2 },
  { key: "export",    label: "Export",         icon: Download  },
];

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";

  const [branches, setBranches]   = useState([]);
  const [courses, setCourses]     = useState([]);
  const [tab, setTab]             = useState("reports");
  const [showForm, setShowForm]   = useState(false);
  const [formBranchId, setFormBranchId] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [drillMetric, setDrillMetric]       = useState(null);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [activeQuick, setActiveQuick]       = useState(null);

  // Global filters — drive both Analytics and Export tabs
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", branch: "" });
  const patch = (p) => { setFilters((f) => ({ ...f, ...p })); setActiveQuick(null); };
  const clearFilters = () => { setFilters({ dateFrom: "", dateTo: "", branch: "" }); setActiveQuick(null); };
  const applyQuick = (q) => { setFilters((f) => ({ ...f, dateFrom: q.dateFrom, dateTo: q.dateTo })); setActiveQuick(q.label); };

  const apiFilters = {
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo   ? { date_to:   filters.dateTo   } : {}),
    ...(filters.branch   ? { branch:    filters.branch   } : {}),
  };
  const hasFilters = filters.dateFrom || filters.dateTo || filters.branch;

  useEffect(() => {
    reportsAPI.courses().then(setCourses).catch(() => {});
    if (isAdmin) reportsAPI.branches().then(setBranches).catch(() => {});
  }, [isAdmin]);

  const handleCreated = (report) => {
    setShowForm(false); setFormBranchId("");
    setSelectedReport(report);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">Daily operations, analytics &amp; exports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => applyQuick(q)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                activeQuick === q.label
                  ? "bg-[#1a0a0b] text-white border-[#1a0a0b] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {q.label}
            </button>
          ))}
          <Btn onClick={() => { setFormBranchId(""); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> New report
          </Btn>
        </div>
      </div>

      {/* ── Global filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </div>
          <div className="flex items-center gap-1.5">
            <input type="date" value={filters.dateFrom}
              onChange={(e) => patch({ dateFrom: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 transition-colors"
            />
            <span className="text-gray-300 text-sm">→</span>
            <input type="date" value={filters.dateTo} min={filters.dateFrom}
              onChange={(e) => patch({ dateTo: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 transition-colors"
            />
          </div>
          {isAdmin && branches.length > 0 && (
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select value={filters.branch} onChange={(e) => patch({ branch: e.target.value })}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 transition-colors"
              >
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key ? "bg-[#1a0a0b] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "reports" && (
        <ReportsDailyView
          key={refreshKey}
          onViewReport={(report) => setSelectedReport(report)}
          onSubmitReport={(entry) => { setFormBranchId(String(entry.branch_id)); setShowForm(true); }}
        />
      )}

      {tab === "analytics" && (
        <ReportsAnalyticsTab
          branches={branches}
          courses={courses}
          apiFilters={apiFilters}
          rawFilters={filters}
        />
      )}

      {tab === "export" && (
        <ReportsExportTab
          branches={branches}
          courses={courses}
          apiFilters={apiFilters}
        />
      )}

      {/* ── Modals ── */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setFormBranchId(""); }}
        title="New daily report" maxWidth="max-w-xl">
        <ReportForm branches={branches} preselectedBranchId={formBranchId} onCreated={handleCreated} />
      </Modal>

      <Modal open={!!selectedReport} onClose={() => { setSelectedReport(null); setDrillMetric(null); }}
        title="Report details" maxWidth="max-w-2xl">
        <ReportDetailPanel report={selectedReport} onDrilldown={(m) => setDrillMetric(m)} />
      </Modal>

      <DrilldownModal open={!!drillMetric} onClose={() => setDrillMetric(null)}
        reportId={selectedReport?.id} metric={drillMetric} courses={courses} />
    </div>
  );
}