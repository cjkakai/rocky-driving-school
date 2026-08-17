import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, MinusCircle, Building2, Percent } from "lucide-react";
import { expensesAPI } from "../../api/expenses.api";
import { fmt } from "../../utils/students.utils";

const CARDS = [
  {
    key: "total_revenue",
    label: "Total Revenue",
    icon: TrendingUp,
    color: "emerald",
    fmt: (v) => fmt(v),
    sub: null,
  },
  {
    key: "total_expenses",
    label: "Total Expenses",
    icon: MinusCircle,
    color: "rose",
    fmt: (v) => fmt(v),
    sub: null,
  },
  {
    key: "net_profit",
    label: "Net Profit",
    icon: DollarSign,
    color: "blue",
    fmt: (v) => fmt(v),
    sub: "profit_margin",
    subFmt: (v) => `${v}% margin`,
  },
  {
    key: "top_branch",
    label: "Top Branch",
    icon: Building2,
    color: "amber",
    fmt: (v) => v || "—",
    sub: "top_branch_profit",
    subFmt: (v) => (v != null ? fmt(v) + " profit" : ""),
  },
];

const COLOR_MAP = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: "bg-emerald-500 text-white",
    label: "text-emerald-600",
    value: "text-gray-900",
    sub: "text-emerald-600",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: "bg-rose-500 text-white",
    label: "text-rose-600",
    value: "text-gray-900",
    sub: "text-rose-500",
  },
  blue: {
    bg: "bg-red-50",
    border: "border-red-100",
    icon: "bg-[#c41820] text-white",
    label: "text-[#c41820]",
    value: "text-gray-900",
    sub: "text-[#c41820]",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: "bg-amber-500 text-white",
    label: "text-amber-600",
    value: "text-gray-900",
    sub: "text-amber-600",
  },
};

function KpiCard({ card, kpis, loading }) {
  const Icon = card.icon;
  const c = COLOR_MAP[card.color];
  const value = kpis?.[card.key];
  const subValue = card.sub ? kpis?.[card.sub] : null;

  // Net profit can be negative — adjust icon
  const isProfit = card.key === "net_profit";
  const isNegative = isProfit && value < 0;
  const ProfitIcon = isNegative ? TrendingDown : TrendingUp;
  const DisplayIcon = isProfit ? ProfitIcon : Icon;

  const profitColor = isProfit
    ? isNegative
      ? { ...c, icon: "bg-rose-500 text-white", value: "text-rose-600", sub: "text-rose-500" }
      : { ...c, icon: "bg-emerald-500 text-white", value: "text-emerald-700", sub: "text-emerald-600" }
    : c;

  return (
    <div className={`rounded-2xl border ${profitColor.border} ${profitColor.bg} p-5 flex items-start gap-4`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${profitColor.icon}`}>
        <DisplayIcon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${profitColor.label} mb-1`}>
          {card.label}
        </p>
        {loading ? (
          <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse" />
        ) : (
          <p className={`text-2xl font-black truncate ${profitColor.value}`}>
            {card.fmt(value)}
          </p>
        )}
        {!loading && subValue != null && card.subFmt && (
          <p className={`text-xs font-medium mt-0.5 ${profitColor.sub}`}>
            {card.subFmt(subValue)}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProfitabilityKpiCards({ filters }) {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    expensesAPI.profitabilityKpi(filters)
      .then(setKpis)
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <KpiCard key={card.key} card={card} kpis={kpis} loading={loading} />
      ))}
    </div>
  );
}