import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { sessionsAPI } from "../api/sessions.api";

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const shiftDate = (iso, days) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${period}`;
};

const formatDuration = (start, end) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatDateHuman = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [count, setCount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);

  const isToday = date === todayISO();

  useEffect(() => {
    setLoading(true);
    sessionsAPI
      .list(date)
      .then((data) => {
        setSessions(data.results);
        setCount(data.count);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View user login activity by date
          </p>
        </div>
      </div>

      {/* Date Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        <div className="relative">
          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>

        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>

        {!isToday && (
          <button
            onClick={() => setDate(todayISO())}
            className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Today
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          <span className="font-medium text-gray-900">{count}</span>{" "}
          {count === 1 ? "session" : "sessions"} on {formatDateHuman(date)}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            No sessions found for this date
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Branch", "Started", "Ended", "Duration", "Device", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map((s) => {
                const active = !s.end_time;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">@{s.username}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {s.branch ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 tabular-nums">
                      {formatTime(s.start_time)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 tabular-nums">
                      {s.end_time ? formatTime(s.end_time) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 tabular-nums">
                      {formatDuration(s.start_time, s.end_time) ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.device === "mobile"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {s.device === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Ended
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
