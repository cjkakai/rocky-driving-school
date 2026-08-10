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
  { label: "Today",      dateFrom: TODAY,           dateTo: TODAY },
  { label: "This Week",  dateFrom: d(6),             dateTo: TODAY },
  { label: "This Month", dateFrom: firstOfMonth(0),  dateTo: TODAY },
];

export function StudentPeriodFilter({ dateFrom, dateTo, onChange }) {
  const activeQuick = QUICK.find((q) => q.dateFrom === dateFrom && q.dateTo === dateTo)?.label ?? null;
  const hasFilter = dateFrom || dateTo;

  const applyQuick = (q) => onChange({ dateFrom: q.dateFrom, dateTo: q.dateTo });
  const clear = () => onChange({ dateFrom: "", dateTo: "" });

  return (
    <div className="bg-blue-50/40 rounded-2xl border border-blue-100 shadow-sm px-5 py-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Enrollment Period</span>
      </div>

      {/* Quick pills + date inputs on same row */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => applyQuick(q)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeQuick === q.label
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {q.label}
          </button>
        ))}

        {/* Divider */}
        <span className="text-gray-200 text-sm select-none hidden sm:inline">|</span>

        {/* Custom range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
          <span className="text-gray-300 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold border border-red-600 transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
