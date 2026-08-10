import { TrendingUp, TrendingDown } from "lucide-react";

export function StatsCard({ icon: Icon, label, value, subtext, trend, gradient = "from-blue-600 to-blue-700" }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70 mb-1.5">{label}</p>
          <p className="text-2xl font-black text-white truncate">{value ?? "—"}</p>
          {subtext && <p className="text-[11px] text-white/60 mt-1">{subtext}</p>}
        </div>
        <div className="p-2 bg-white/15 rounded-xl shrink-0 ml-3">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-2.5 flex items-center gap-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${trend >= 0 ? "bg-white/20 text-white" : "bg-white/20 text-white"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
      )}
    </div>
  );
}
