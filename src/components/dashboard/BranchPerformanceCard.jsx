import { TrendingUp, TrendingDown } from "lucide-react";
import { fmt } from "../../utils/students.utils";

export function BranchPerformanceCard({ branch, students, revenue, growth, rank, maxRevenue }) {
  const isUp = growth >= 0;
  const barPct = maxRevenue > 0 ? Math.round((revenue / maxRevenue) * 100) : 0;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50/40 transition-colors cursor-default">
      {/* Rank */}
      <span className="w-5 text-center text-[11px] font-black text-gray-300 group-hover:text-[#c41820] transition-colors shrink-0">
        {rank}
      </span>

      {/* Branch info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-bold text-gray-800 truncate">{branch.name}</p>
          <p className="text-xs font-extrabold text-gray-900 tabular-nums shrink-0">{fmt(revenue)}</p>
        </div>
        {/* Revenue bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, background: rank === 1 ? "#c41820" : "#e8a0a3" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">{students} students</span>
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(growth)}%
          </span>
        </div>
      </div>
    </div>
  );
}
