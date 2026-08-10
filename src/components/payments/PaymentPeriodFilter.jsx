import { X, CalendarDays } from "lucide-react";

const TODAY = new Date().toISOString().slice(0, 10);

function d(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  return dt.toISOString().slice(0, 10);
}

function firstOfMonth(offset = 0) {
  const dt = new Date();
  dt.setMonth(dt.getMonth() + offset, 1);
  return dt.toISOString().slice(0, 10);
}

const QUICK = [
  { label: "Today",      dateFrom: TODAY,          dateTo: TODAY },
  { label: "This Week",  dateFrom: d(6),            dateTo: TODAY },
  { label: "This Month", dateFrom: firstOfMonth(0), dateTo: TODAY },
];

export function PaymentPeriodFilter({ dateFrom, dateTo, onChange }) {
  const activeQuick =
    QUICK.find((q) => q.dateFrom === dateFrom && q.dateTo === dateTo)?.label ?? null;
  const hasFilter = dateFrom || dateTo;

  const applyQuick = (q) => onChange({ dateFrom: q.dateFrom, dateTo: q.dateTo });
  const clear = () => onChange({ dateFrom: "", dateTo: "" });

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Period</span>
        </div>

        {/* Quick pills */}
        <div className="flex gap-1 bg-blue-100/60 rounded-xl p-1">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => applyQuick(q)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeQuick === q.label
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-200"
                  : "text-blue-700/70 hover:text-blue-800"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-blue-100" />

        {/* Custom range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
            className="px-3 py-1.5 border border-blue-100 rounded-xl text-xs bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
          <span className="text-blue-300 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
            className="px-3 py-1.5 border border-blue-100 rounded-xl text-xs bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        {hasFilter && !activeQuick && (
          <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
            Custom Range
          </span>
        )}

        {hasFilter && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}