import { useEffect, useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, Download, Search, Target } from "lucide-react";
import { targetsAPI } from "../../api/targets.api";
import { fmt } from "../../utils/students.utils";

const STATUS_STYLE = {
  "Above Target": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "On Target":    "bg-blue-50 text-blue-700 border-blue-100",
  "Below Target": "bg-rose-50 text-rose-700 border-rose-100",
};

function StatusBadge({ status }) {
  const Icon = status === "Below Target" ? TrendingDown : status === "Above Target" ? TrendingUp : Minus;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLE[status] ?? STATUS_STYLE["Below Target"]}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
}

function AchievementBar({ pct }) {
  const clamped = Math.min(pct, 100);
  const isGood  = pct >= 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${isGood ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-xs font-bold w-12 text-right ${isGood ? "text-emerald-600" : "text-rose-600"}`}>{pct}%</span>
    </div>
  );
}

const PAGE_SIZE = 10;

export function TargetSummaryTable({ branchId, metric, period = {} }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState("branch");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);

  const metricLabel = metric === "revenue" ? "Revenue" : "Registrations";

  const load = useCallback(() => {
    setLoading(true);
    const p = { ...period, ...(branchId ? { branch: branchId } : {}) };
    targetsAPI.summary(p)
      .then((res) => setRows(Array.isArray(res) ? res : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [branchId, JSON.stringify(period)]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (col) => {
    setSortCol(col);
    setSortDir((d) => sortCol === col && d === "desc" ? "asc" : "desc");
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = rows.filter((r) => r.metric === metricLabel);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.branch.toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      const av = typeof a[sortCol] === "string" ? a[sortCol] : Number(a[sortCol] ?? 0);
      const bv = typeof b[sortCol] === "string" ? b[sortCol] : Number(b[sortCol] ?? 0);
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return data;
  }, [rows, sortCol, sortDir, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortTH = ({ col, children, right }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 cursor-pointer select-none whitespace-nowrap ${right ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}>
        {children}
        <span className={sortCol === col ? "text-blue-400" : "text-gray-300"}>{sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}</span>
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-blue-50 bg-gradient-to-r from-blue-50 via-white to-white flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-700 text-base">Targets Summary</h3>
            <p className="text-xs text-blue-400 mt-0.5">
              {metricLabel} · {metric === "revenue" ? "current week" : "current month"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search…"
              className="pl-8 pr-3 py-2 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-40 bg-blue-50/40"
            />
          </div>
          <button
            onClick={() => targetsAPI.export({ ...period, ...(branchId ? { branch: branchId } : {}), metric: metricLabel })}
            className="flex items-center gap-1.5 px-3 py-2 border border-blue-100 rounded-xl text-sm text-blue-600 hover:bg-blue-50 transition-colors bg-blue-50/40"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <tr>
              <SortTH col="branch">Branch</SortTH>
              <SortTH col="metric">Metric</SortTH>
              <SortTH col="target"   right>Target</SortTH>
              <SortTH col="achieved" right>Achieved</SortTH>
              <SortTH col="diff"     right>Difference</SortTH>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 min-w-[140px]">Achievement %</th>
              <SortTH col="status">Status</SortTH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : !paged.length ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                  {search ? "No results match your search" : "No target data available"}
                </td>
              </tr>
            ) : paged.map((r, i) => {
              const isRevenue = r.metric === "Revenue";
              const fmtFn = isRevenue ? fmt : (v) => `${v}`;
              return (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-gray-800 uppercase">{r.branch}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                      {r.metric}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-700">{fmtFn(r.target)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">{fmtFn(r.achieved)}</td>
                  <td className={`px-4 py-3.5 text-right font-semibold ${r.diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {r.diff >= 0 ? "+" : ""}{fmtFn(r.diff)}
                  </td>
                  <td className="px-4 py-3.5"><AchievementBar pct={r.pct} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} rows · page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
