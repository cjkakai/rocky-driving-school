import { useMemo, useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { vehiclesAPI } from "../../api/vehicles.api";

const STATUS_COLORS = ["#16a34a", "#dc2626", "#d97706", "#6366f1"];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const PERIODS = [
  { label: "Today",      dateFrom: today(),    dateTo: today() },
  { label: "Yesterday",  dateFrom: daysAgo(1), dateTo: daysAgo(1) },
  { label: "This Week",  dateFrom: daysAgo(6), dateTo: today() },
  { label: "This Month", dateFrom: daysAgo(29),dateTo: today() },
  { label: "Custom",     dateFrom: null,       dateTo: null },
];

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-gray-500 mb-1">{payload[0].name}</p>
      <p className="text-base font-bold text-gray-900">{payload[0].value} vehicles</p>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-base font-bold text-gray-900">{payload[0].value} lessons</p>
    </div>
  );
}

export function VehicleCharts({ vehicles }) {
  const [tripData, setTripData] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [activePeriod, setActivePeriod] = useState("Today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const periodParams = useMemo(() => {
    if (activePeriod === "Custom") {
      return { date_from: customFrom || undefined, date_to: customTo || undefined };
    }
    const p = PERIODS.find((x) => x.label === activePeriod);
    return p ? { date_from: p.dateFrom, date_to: p.dateTo } : {};
  }, [activePeriod, customFrom, customTo]);

  useEffect(() => {
    setLoadingTrips(true);
    vehiclesAPI.tripAnalytics(periodParams)
      .then((res) => setTripData(res?.top_vehicles ?? []))
      .catch(() => setTripData([]))
      .finally(() => setLoadingTrips(false));
  }, [JSON.stringify(periodParams)]);

  const statusData = useMemo(() => {
    return [
      { name: "Insurance Active",  value: vehicles.filter((v) => v.insurance_status === "ACTIVE").length },
      { name: "Insurance Expired", value: vehicles.filter((v) => v.insurance_status === "EXPIRED").length },
      { name: "Inspection Due",    value: vehicles.filter((v) => v.inspection_status === "DUE").length },
      { name: "Inspection OK",     value: vehicles.filter((v) => v.inspection_status === "NOT_DUE").length },
    ].filter((d) => d.value > 0);
  }, [vehicles]);

  const barData = tripData.map((v) => ({
    name: v.registration,
    lessons: v.total_lessons,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
      {/* Status Donut — compact sidebar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 text-base">Vehicle Status</h3>
          <p className="text-xs text-gray-400 mt-0.5">Insurance & inspection</p>
        </div>
        <div className="p-4">
          {!statusData.length ? (
            <div className="py-10 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Vehicles by Trips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Top Vehicles by Lessons</h3>
              <p className="text-xs text-gray-400 mt-0.5">Practical lessons from daily reports</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setActivePeriod(p.label)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    activePeriod === p.label
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {activePeriod === "Custom" && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <span className="text-gray-300 text-xs">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
        </div>
        <div className="p-5">
          {loadingTrips ? (
            <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
          ) : !barData.length ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">No trip data yet</div>
          ) : (() => {
            const needsScroll = barData.length > 5;
            const chartWidth  = needsScroll ? barData.length * 80 + 60 : undefined;
            const chart = (
              <BarChart
                {...(needsScroll ? { width: chartWidth, height: 288 } : {})}
                data={barData}
                margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc", radius: 6 }} />
                <Bar dataKey="lessons" fill="#2563eb" fillOpacity={1} radius={[8, 8, 0, 0]} maxBarSize={56} />
              </BarChart>
            );
            return needsScroll ? (
              <div className="overflow-x-auto overflow-y-hidden">{chart}</div>
            ) : (
              <div className="h-72"><ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer></div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
