import { useState, useMemo } from "react";
import { Search, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { Badge } from "../../ui";
import { fmtDate } from "../../utils/students.utils";

const PAGE_SIZE = 15;

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
  return sort.dir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

export function VehicleTable({ vehicles, loading, onEdit, onDelete, quickFilter }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ col: "registration_number", dir: "asc" });
  const [page, setPage] = useState(1);

  const toggleSort = (col) =>
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });

  const filtered = useMemo(() => {
    let rows = vehicles;
    if (quickFilter === "active_insurance") rows = rows.filter((v) => v.insurance_status === "ACTIVE");
    else if (quickFilter === "expired_insurance") rows = rows.filter((v) => v.insurance_status === "EXPIRED");
    else if (quickFilter === "inspection_due") rows = rows.filter((v) => v.inspection_status === "DUE");
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((v) =>
        v.registration_number?.toLowerCase().includes(q) ||
        v.vehicle_name?.toLowerCase().includes(q) ||
        v.vehicle_type?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let av = a[sort.col] ?? ""; let bv = b[sort.col] ?? "";
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [vehicles, search, sort, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TH = ({ col, children }) => (
    <th onClick={() => toggleSort(col)} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 cursor-pointer select-none whitespace-nowrap">
      <span className="flex items-center gap-1">{children}<SortIcon col={col} sort={sort} /></span>
    </th>
  );

  const isWarning = (v) => v.insurance_status === "EXPIRED" || v.inspection_status === "DUE";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search vehicles…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} vehicles</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <tr>
              <TH col="registration_number">Reg. Number</TH>
              <TH col="vehicle_name">Vehicle</TH>
              <TH col="vehicle_type">Type</TH>
              <TH col="insurance_status">Insurance</TH>
              <TH col="insurance_expiry_date">Ins. Expiry</TH>
              <TH col="inspection_status">Inspection</TH>
              <TH col="inspection_due_date">Insp. Due</TH>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : !pageRows.length ? (
              <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No vehicles found</td></tr>
            ) : (
              pageRows.map((v) => (
                <tr key={v.id} className={`border-b border-gray-50 transition-colors ${isWarning(v) ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-blue-50/40"}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {isWarning(v) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span className="font-mono font-semibold text-gray-900 text-xs">{v.registration_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{v.vehicle_name}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{v.vehicle_type}</td>
                  <td className="px-4 py-3.5">
                    {v.insurance_status === "ACTIVE"
                      ? <Badge variant="green">Active</Badge>
                      : <Badge variant="red">Expired</Badge>}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-600">{fmtDate(v.insurance_expiry_date)}</td>
                  <td className="px-4 py-3.5">
                    {v.inspection_status === "DUE"
                      ? <Badge variant="yellow">Due</Badge>
                      : <Badge variant="gray">Not Due</Badge>}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-600">{fmtDate(v.inspection_due_date)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onEdit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(v)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
