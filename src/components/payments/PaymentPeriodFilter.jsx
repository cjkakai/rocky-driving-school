import { X, CalendarDays } from "lucide-react";

const GRAD   = "linear-gradient(135deg, #8f1017, #c41820)";
const SHADOW = "0 4px 14px rgba(196,24,32,0.32)";
const TODAY  = new Date().toISOString().slice(0, 10);

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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</span>
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => applyQuick(q)}
                style={activeQuick === q.label ? { background: GRAD, boxShadow: SHADOW } : undefined}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeQuick === q.label ? "text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
            />
            <span className="text-gray-300 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
            />
          </div>

          {hasFilter && !activeQuick && (
            <span className="text-xs text-[#c41820] font-semibold bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
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
    </div>
  );
}