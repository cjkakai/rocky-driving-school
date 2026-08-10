import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { targetsAPI } from "../../api/targets.api";
import { fmt } from "../../utils/students.utils";

const TARGET_COLOR   = "#2563eb";
const ACHIEVED_COLOR = "#16a34a";

function CustomTooltip({ active, payload, label, isRevenue }) {
  if (!active || !payload?.length) return null;
  const target   = payload.find((p) => p.dataKey === "target")?.value ?? 0;
  const achieved = payload.find((p) => p.dataKey === "achieved")?.value ?? 0;
  const pct = target > 0 ? ((achieved / target) * 100).toFixed(1) : 0;
  const fmtFn = isRevenue ? fmt : (v) => `${v}`;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-50 pb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Target</span>
          <span className="text-sm font-bold text-blue-700">{fmtFn(target)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500" /> Achieved</span>
          <span className="text-sm font-bold text-green-700">{fmtFn(achieved)}</span>
        </div>
        <div className="flex justify-between items-center gap-4 border-t border-gray-50 pt-1.5 mt-1">
          <span className="text-xs font-semibold text-gray-700">Achievement</span>
          <span className={`text-sm font-black ${pct >= 100 ? "text-green-700" : "text-rose-600"}`}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// Single-branch view: clean stat comparison instead of a 2-bar chart
function SingleBranchView({ row, isRevenue }) {
  const fmtFn = isRevenue ? fmt : (v) => `${v}`;
  const pctColor = row.pct >= 100 ? "text-emerald-600" : row.pct >= 75 ? "text-amber-600" : "text-rose-600";
  const barColor = row.pct >= 100 ? "#10b981" : row.pct >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 p-2">
      {/* Target */}
      <div className="flex-1 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Target</span>
        </div>
        <p className="text-3xl font-black text-blue-800 tabular-nums">{fmtFn(row.target)}</p>
      </div>
      {/* Achieved */}
      <div className="flex-1 rounded-2xl border border-green-100 bg-green-50 px-6 py-5 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Achieved</span>
        </div>
        <p className="text-3xl font-black text-green-800 tabular-nums">{fmtFn(row.achieved)}</p>
      </div>
      {/* Achievement % */}
      <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Achievement</span>
          <span className={`text-2xl font-black tabular-nums ${pctColor}`}>{row.pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(row.pct, 100)}%`, background: barColor }}
          />
        </div>
      </div>
    </div>
  );
}

export function TargetBranchChart({ metric, branchId, period = {} }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const isRevenue = metric === "revenue";

  const load = useCallback(() => {
    setLoading(true);
    const p = { ...period, ...(branchId ? { branch: branchId } : {}) };
    const fn = isRevenue ? targetsAPI.revenueBranches : targetsAPI.registrationBranches;
    fn(p)
      .then((res) => setData(res ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [isRevenue, branchId, JSON.stringify(period)]);

  useEffect(() => { load(); }, [load]);

  const fmtY = isRevenue ? (v) => `${(v / 1000).toFixed(0)}K` : (v) => `${v}`;
  const isSingle = data.length === 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-base">Branch Performance</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Target vs Achieved · {isRevenue ? "Current week" : "Current month"}
        </p>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ) : !data.length ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No targets set for this period</div>
        ) : isSingle ? (
          <SingleBranchView row={data[0]} isRevenue={isRevenue} />
        ) : (() => {
          const needsScroll = data.length > 5;
          const chartWidth  = needsScroll ? data.length * 100 + 60 : undefined;
          const chart = (
            <BarChart
              {...(needsScroll ? { width: chartWidth, height: 288 } : {})}
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
              barGap={0}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
              <Tooltip content={<CustomTooltip isRevenue={isRevenue} />} cursor={{ fill: "#f8fafc", radius: 6 }} />
              <Bar dataKey="target"   name="Target"   fill={TARGET_COLOR}   radius={[8, 8, 0, 0]} maxBarSize={56} fillOpacity={0.85} />
              <Bar dataKey="achieved" name="Achieved" fill={ACHIEVED_COLOR} radius={[8, 8, 0, 0]} maxBarSize={56} fillOpacity={0.9} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            </BarChart>
          );
          return needsScroll ? (
            <div className="overflow-x-auto overflow-y-hidden">{chart}</div>
          ) : (
            <div className="h-72"><ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer></div>
          );
        })()}

        {!loading && data.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
            {data.map((b) => (
              <div key={b.branch_id} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">{b.branch}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.pct >= 100 ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}