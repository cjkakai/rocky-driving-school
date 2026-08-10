import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from "recharts";
import { expensesAPI } from "../../api/expenses.api";
import { BranchMultiSelect } from "../reports/BranchMultiSelect";
import { fmt } from "../../utils/students.utils";

const REV_COLOR  = "#10b981"; // emerald-500
const EXP_COLOR  = "#f43f5e"; // rose-500

function ProfitBadge({ profit, margin }) {
  const positive = profit >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        positive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
      }`}
    >
      {positive ? "▲" : "▼"} {fmt(Math.abs(profit))}
      {margin != null && ` · ${Math.abs(margin)}%`}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  const profit  = revenue - expense;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-50 pb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue
          </span>
          <span className="text-sm font-bold text-emerald-700">{fmt(revenue)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Expense
          </span>
          <span className="text-sm font-bold text-rose-600">{fmt(expense)}</span>
        </div>
        <div className="flex justify-between items-center gap-4 border-t border-gray-50 pt-1.5 mt-1">
          <span className="text-xs font-semibold text-gray-700">Net Profit</span>
          <span className={`text-sm font-black ${profit >= 0 ? "text-blue-700" : "text-rose-600"}`}>
            {profit >= 0 ? "" : "-"}{fmt(Math.abs(profit))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BranchProfitabilityChart({ branches, globalFilters }) {
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [data, setData]                         = useState([]);
  const [loading, setLoading]                   = useState(false);

  const { dateFrom, dateTo } = globalFilters;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (selectedBranches.length) params.branches = selectedBranches;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;

    expensesAPI.branchProfitability(params)
      .then((res) => setData(res ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedBranches, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Branch Profitability</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Revenue vs Expenses ·{" "}
              {selectedBranches.length === 0 ? "All branches" : `${selectedBranches.length} selected`}
            </p>
          </div>
          <BranchMultiSelect
            branches={branches}
            selected={selectedBranches}
            onChange={setSelectedBranches}
            placeholder="All Branches"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        {loading ? (
          <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
        ) : !data.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            No data for selected filters
          </div>
        ) : (
          <>
            {(() => {
              const needsScroll = data.length > 5;
              const chartWidth  = needsScroll ? data.length * 90 + 60 : undefined;
              const chart = (
                <BarChart
                  {...(needsScroll ? { width: chartWidth, height: 288 } : {})}  
                  data={data}
                  margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={44} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", radius: 6 }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="revenue" name="Revenue" fill={REV_COLOR} radius={[8, 8, 0, 0]} maxBarSize={64} fillOpacity={0.9} />
                  <Bar dataKey="expense" name="Expense" fill={EXP_COLOR} radius={[8, 8, 0, 0]} maxBarSize={64} fillOpacity={0.85} />
                </BarChart>
              );
              return needsScroll ? (
                <div className="overflow-x-auto overflow-y-hidden">{chart}</div>
              ) : (
                <div className="h-72"><ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer></div>
              );
            })()}

            {/* Mini profit badges per branch */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
              {data.map((b) => (
                <div key={b.branch_id} className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium uppercase">{b.branch}</span>
                  <ProfitBadge profit={b.profit} margin={b.margin} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}