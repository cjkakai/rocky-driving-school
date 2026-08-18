import { useRef, useState, useEffect } from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { Input } from "../../ui";
import { SearchableSelect } from "../../ui/SearchableSelect";

const GRAD = "linear-gradient(135deg, #8f1017, #c41820)";
const SHADOW = "0 4px 14px rgba(196,24,32,0.32)";

const statusOptions = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed", badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  { label: "Orphaned",  value: "orphaned",  badgeClass: "bg-red-50 text-red-800 border border-red-200" },
];

const channelOptions = [
  { label: "All",           value: "" },
  { label: "M-PESA",        value: "MPESA",         badgeClass: "bg-green-50 text-green-800 border border-green-200" },
  { label: "STK Push",      value: "STK PUSH",      badgeClass: "bg-gray-100 text-gray-700 border border-gray-200" },
  { label: "Pesalink",      value: "PESALINK",      badgeClass: "bg-gray-100 text-gray-700 border border-gray-200" },
  { label: "Agent Deposit", value: "AGENT DEPOSIT", badgeClass: "bg-amber-50 text-amber-800 border border-amber-200" },
  { label: "Bank",          value: "BANK",          badgeClass: "bg-gray-100 text-gray-700 border border-gray-200" },
  { label: "Unknown",       value: "UNKNOWN",       badgeClass: "bg-gray-100 text-gray-600 border border-gray-200" },
];

const typePills = [
  { label: "All",              value: "" },
  { label: "Registration",     value: "REGISTRATION" },
  { label: "Top-up",           value: "TOP_UP" },
  { label: "Retake",           value: "RETAKE" },
  { label: "PDL Reactivation", value: "PDL_REACTIVATION" },
  { label: "Unallocated",      value: "UNALLOCATED" },
];

function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative bg-gray-100 rounded-xl p-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ background: GRAD, boxShadow: SHADOW }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110"
      >
        <span className="opacity-75">{label}:</span>
        <span>{active.label}</span>
        <ChevronDown className={`w-3 h-3 opacity-80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-50 py-1 min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors text-left"
            >
              <Check className={`w-3.5 h-3.5 flex-shrink-0 ${value === opt.value ? "text-gray-700" : "opacity-0"}`} />
              {opt.badgeClass ? (
                <span className={`inline-flex items-center h-5 px-2.5 rounded-full text-xs font-medium ${opt.badgeClass}`}>
                  {opt.label}
                </span>
              ) : (
                <span className="text-gray-500">All</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PaymentsFilters({
  search, setSearch,
  isSuperAdmin,
  filterBranch, setFilterBranch,
  filterStatus, setFilterStatus,
  filterPaymentType, setFilterPaymentType,
  filterChannel, setFilterChannel,
  branches, setPage,
}) {
  const hasActiveFilters = search || filterBranch || filterStatus || filterPaymentType || filterChannel;

  const clearAll = () => {
    setSearch(""); setFilterBranch(""); setFilterStatus("");
    setFilterPaymentType(""); setFilterChannel(""); setPage(1);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3 space-y-3">

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              className="pl-9 border-gray-200 bg-gray-50/60 focus:ring-gray-200 focus:border-gray-300"
              placeholder="Search by reference, M-PESA ref, name or admission number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {isSuperAdmin && (
            <div className="sm:w-52">
              <SearchableSelect
                value={filterBranch}
                onChange={(v) => { setFilterBranch(v); setPage(1); }}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="All Branches"
                triggerClassName="py-2"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {isSuperAdmin && (
            <FilterDropdown
              label="Status"
              options={statusOptions}
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(1); }}
            />
          )}
          <FilterDropdown
            label="Channel"
            options={channelOptions}
            value={filterChannel}
            onChange={(v) => { setFilterChannel(v); setPage(1); }}
          />

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {typePills.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { setFilterPaymentType(p.value); setPage(1); }}
                style={filterPaymentType === p.value ? { background: GRAD, boxShadow: SHADOW } : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterPaymentType === p.value ? "text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

      </div>
    </div>
  );
}