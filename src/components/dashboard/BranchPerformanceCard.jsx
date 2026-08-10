import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { fmt } from "../../utils/students.utils";

export function BranchPerformanceCard({
  branch,
  students,
  revenue,
  growth,
  rank,
}) {
  const isUp = growth >= 0;

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
        <span className="text-xs font-extrabold text-blue-700">#{rank}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">{branch.name}</p>
        <p className="text-[11px] text-gray-400 truncate">{branch.location}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <p className="text-[11px] font-medium text-gray-500">{students} students</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-extrabold text-blue-900">{fmt(revenue)}</p>
        <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
          isUp ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(growth)}%
        </div>
      </div>
    </div>
  );
}