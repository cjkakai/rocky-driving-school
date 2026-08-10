import { Car, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

const CARDS = [
  { key: "total",           label: "Total Vehicles",    icon: Car,          gradient: "from-blue-600 to-blue-700" },
  { key: "insurance_active",label: "Active Insurance",  icon: ShieldCheck,  gradient: "from-green-600 to-green-700" },
  { key: "insurance_expired",label:"Expired Insurance", icon: ShieldAlert,  gradient: "from-rose-600 to-rose-700" },
  { key: "inspection_due",  label: "Inspection Due",    icon: AlertTriangle, gradient: "from-amber-500 to-amber-600" },
];

function KpiCard({ card, value, loading }) {
  const Icon = card.icon;
  return (
    <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">{card.label}</p>
          {loading ? (
            <div className="h-7 w-16 bg-white/20 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-white">{value ?? 0}</p>
          )}
        </div>
        <div className="p-2.5 bg-white/15 rounded-xl shrink-0 ml-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
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
