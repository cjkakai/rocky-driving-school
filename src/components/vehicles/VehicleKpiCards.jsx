import { Car, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

const CARDS = [
  {
    key: "total",
    label: "Total Vehicles",
    icon: Car,
    bg: "bg-gray-50",
    border: "border-gray-100",
    iconBg: "bg-gray-200",
    iconColor: "text-gray-600",
    valueColor: "text-gray-900",
    labelColor: "text-gray-500",
  },
  {
    key: "insurance_active",
    label: "Active Insurance",
    icon: ShieldCheck,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    valueColor: "text-gray-900",
    labelColor: "text-emerald-600",
  },
  {
    key: "insurance_expired",
    label: "Expired Insurance",
    icon: ShieldAlert,
    bg: "bg-rose-50",
    border: "border-rose-100",
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    valueColor: "text-gray-900",
    labelColor: "text-rose-600",
  },
  {
    key: "inspection_due",
    label: "Inspection Due",
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    valueColor: "text-gray-900",
    labelColor: "text-amber-600",
  },
];

function KpiCard({ card, value, loading }) {
  const Icon = card.icon;
  return (
    <div className={`rounded-2xl border ${card.border} ${card.bg} p-5 flex items-start gap-4`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${card.iconBg}`}>
        <Icon className={`w-5 h-5 ${card.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${card.labelColor} mb-1`}>
          {card.label}
        </p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse" />
        ) : (
          <p className={`text-3xl font-black ${card.valueColor}`}>{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

export function VehicleKpiCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <KpiCard key={card.key} card={card} value={stats?.[card.key]} loading={loading} />
      ))}
    </div>
  );
}
