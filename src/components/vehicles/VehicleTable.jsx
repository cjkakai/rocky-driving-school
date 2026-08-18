import { useState, useMemo } from "react";
import { Search, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, Car } from "lucide-react";
import { fmtDate } from "../../utils/students.utils";

const PAGE_SIZE = 15;

const INS_STYLE = {
  ACTIVE:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  EXPIRED: "bg-rose-50 text-rose-700 border-rose-200",
};
const INSP_STYLE = {
  DUE:     "bg-amber-50 text-amber-700 border-amber-200",
  NOT_DUE: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ label, style }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${style}`}>
      {label}
    </span>
  );
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
  return sort.dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-gray-500" />
    : <ChevronDown className="w-3 h-3 text-gray-500" />;
}

export function VehicleTable({ vehicles, loading, onEdit, onDelete, quickFilter, isSuperAdmin, userBranchId }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ col: "registration_number", dir: "asc" });
  const [page, setPage] = useState(1);

  const toggleSort = (col) =>
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });

  const filtered = useMemo(() => {
    let rows = vehicles;
    if (quickFilter === "active_insurance")  rows = rows.filter((v) => v.insurance_status === "ACTIVE");
    else if (quickFilter === "expired_insurance") rows = rows.filter((v) => v.insurance_status === "EXPIRED");
    else if (quickFilter === "inspection_due")    rows = rows.filter((v) => v.inspection_status === "DUE");
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((v) =>
        v.registration_number?.toLowerCase().includes(q) ||
        v.vehicle_name?.toLowerCase().includes(q) ||
        v.vehicle_type?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const av = a[sort.col] ?? ""; const bv = b[sort.col] ?? "";
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [vehicles, search, sort, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const canMutate = (v) => isSuperAdmin || (v.branch != null && v.branch === userBranchId);

  const TH = ({ col, children, className = "" }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 cursor-pointer select-none whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon col={col} sort={sort} />
      </span>
    </th>
  );

  const isWarning = (v) => v.insurance_status === "EXPIRED" || v.inspection_status === "DUE";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-xl">
            <Car className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">Fleet Registry</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="ml-auto relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search vehicles…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <TH col="registration_number">Reg. Number</TH>
              <TH col="vehicle_name">Vehicle</TH>
              <TH col="vehicle_type">Type</TH>
              <TH col="branch_name">Branch</TH>
              <TH col="insurance_status">Insurance</TH>
              <TH col="insurance_expiry_date">Ins. Expiry</TH>
              <TH col="inspection_status">Inspection</TH>
              <TH col="inspection_due_date">Insp. Due</TH>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !pageRows.length ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="p-3 bg-gray-50 rounded-2xl">
                      <Car className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium">No vehicles found</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-gray-50 transition-colors ${
                    isWarning(v) ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {isWarning(v) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span className="font-mono font-bold text-gray-900 text-xs tracking-wide">
                        {v.registration_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{v.vehicle_name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                      {v.vehicle_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {v.branch_name
                      ? <span className="text-xs font-semibold text-gray-700">{v.branch_name}</span>
                      : <span className="text-[11px] text-gray-400 italic">General</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={v.insurance_status === "ACTIVE" ? "Active" : "Expired"}
                      style={INS_STYLE[v.insurance_status] ?? INS_STYLE.EXPIRED}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{fmtDate(v.insurance_expiry_date)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={v.inspection_status === "DUE" ? "Due" : "OK"}
                      style={INSP_STYLE[v.inspection_status] ?? INSP_STYLE.NOT_DUE}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{fmtDate(v.inspection_due_date)}</td>
                  <td className="px-4 py-3.5">
                    {canMutate(v) && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(v)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(v)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages} · {filtered.length} vehicles
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
