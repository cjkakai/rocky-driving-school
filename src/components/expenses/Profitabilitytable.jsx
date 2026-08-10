import { useEffect, useState, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { expensesAPI } from "../../api/expenses.api";
import { fmt } from "../../utils/students.utils";
import { SearchableSelect } from "../../ui/SearchableSelect";

function ProfitBadge({ profit }) {
  if (profit > 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
      <TrendingUp className="w-3 h-3" />{fmt(profit)}
    </span>
  );
  if (profit < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
      <TrendingDown className="w-3 h-3" />{fmt(profit)}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100">
      <Minus className="w-3 h-3" />{fmt(0)}
    </span>
  );
}

function MarginBar({ margin }) {
  const clamped = Math.max(-100, Math.min(100, margin));
  const isPos = clamped >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isPos ? "bg-green-400" : "bg-rose-400"}`}
          style={{ width: `${Math.abs(clamped)}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-12 text-right ${isPos ? "text-green-600" : "text-rose-600"}`}>
        {margin > 0 ? "+" : ""}{margin.toFixed(1)}%
      </span>
    </div>
  );
}

function exportExcel(params) {
  expensesAPI.exportProfitability(params);
}

export function ProfitabilityTable({ globalFilters, branches }) {
  const [rows, setRows] = useState([]);
  const [generalExpense, setGeneralExpense] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState("profit");
  const [sortDir, setSortDir] = useState("desc");
  const [filterBranch, setFilterBranch] = useState("");

  const { dateFrom, dateTo } = globalFilters;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;

    Promise.all([
      expensesAPI.branchProfitability(params).catch(() => []),
      expensesAPI.profitabilityKpi(params).catch(() => ({})),
    ]).then(([profData, kpi]) => {
      setRows(Array.isArray(profData) ? profData : []);
      // General = total - branch expenses
      const branchTotal = (Array.isArray(profData) ? profData : []).reduce((s, r) => s + Number(r.expense || 0), 0);
      const totalExp = Number(kpi?.total_expenses || 0);
      setGeneralExpense(Math.max(0, totalExp - branchTotal));
    }).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (col) => {
    setSortCol(col);
    setSortDir((d) => (sortCol === col && d === "desc") ? "asc" : "desc");
  };

  const sorted = useMemo(() => {
    let data = [...rows];
    if (filterBranch) data = data.filter((r) => String(r.branch_id) === filterBranch);
    data.sort((a, b) => {
      const av = Number(a[sortCol] ?? 0);
      const bv = Number(b[sortCol] ?? 0);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return data;
  }, [rows, sortCol, sortDir, filterBranch]);

  const totals = useMemo(() => ({
    revenue: sorted.reduce((s, r) => s + Number(r.revenue || 0), 0),
    expense: sorted.reduce((s, r) => s + Number(r.expense || 0), 0) + generalExpense,
    profit:  sorted.reduce((s, r) => s + Number(r.profit  || 0), 0) - (filterBranch ? 0 : generalExpense),
  }), [sorted, generalExpense, filterBranch]);

  const SortTH = ({ col, children, right }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-500 cursor-pointer select-none whitespace-nowrap ${right ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}>
        {children}
        <span className="text-gray-300">
          {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
        </span>
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-blue-50 bg-gradient-to-r from-blue-50 via-white to-white flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-700 text-base">Branch P&amp;L Summary</h3>
            <p className="text-xs text-blue-400 mt-0.5">Revenue, expenses and profitability by branch</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-44">
            <SearchableSelect
              value={filterBranch}
              onChange={setFilterBranch}
              options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              placeholder="All Branches"
              triggerClassName="py-2"
            />
          </div>
          <button
            onClick={() => exportExcel({ ...( dateFrom ? { date_from: dateFrom } : {}), ...(dateTo ? { date_to: dateTo } : {}) })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-50/60 to-white border-b border-blue-100">
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-blue-500">Branch</th>
              <SortTH col="revenue" right>Revenue</SortTH>
              <SortTH col="expense" right>Expenses</SortTH>
              <SortTH col="profit"  right>Net Profit</SortTH>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-blue-500 min-w-[140px]">Margin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !sorted.length ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                  No branch data for selected period
                </td>
              </tr>
            ) : (
              <>
                {sorted.map((r) => {
                  const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                  return (
                    <tr key={r.branch_id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-800 uppercase">{r.branch}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-green-700">{fmt(r.revenue)}</td>
                      <td className="px-4 py-3.5 text-right text-gray-600">{fmt(r.expense)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <ProfitBadge profit={r.profit} />
                      </td>
                      <td className="px-4 py-3.5">
                        <MarginBar margin={margin} />
                      </td>
                    </tr>
                  );
                })}

                {/* General Operations row — shown when not filtering by branch */}
                {!filterBranch && generalExpense > 0 && (
                  <tr className="border-b border-gray-50 bg-amber-50/30 hover:bg-amber-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-semibold text-gray-700">General Operations</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">HQ / Overhead</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-400">—</td>
                    <td className="px-4 py-3.5 text-right text-gray-600">{fmt(generalExpense)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <ProfitBadge profit={-generalExpense} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">Not attributed</td>
                  </tr>
                )}
              </>
            )}
          </tbody>

          {/* Totals footer */}
          {!loading && sorted.length > 0 && (
            <tfoot>
              <tr className="bg-gray-900 text-white">
                <td className="px-4 py-3.5 font-bold text-sm">Total</td>
                <td className="px-4 py-3.5 text-right font-bold text-green-400">{fmt(totals.revenue)}</td>
                <td className="px-4 py-3.5 text-right font-bold text-white/80">{fmt(totals.expense)}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-black text-base ${totals.profit >= 0 ? "text-green-400" : "text-rose-400"}`}>
                    {fmt(totals.profit)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {totals.revenue > 0 && (
                    <span className={`text-sm font-bold ${totals.profit >= 0 ? "text-green-400" : "text-rose-400"}`}>
                      {totals.profit > 0 ? "+" : ""}
                      {((totals.profit / totals.revenue) * 100).toFixed(1)}% margin
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}