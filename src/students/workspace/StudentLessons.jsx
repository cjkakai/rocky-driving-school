import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { GraduationCap, Plus, Loader2, Clock, CheckCircle, BookOpen, Printer, Car } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { lessonsAPI } from "../../api/lessons.api";
import { fmtDate } from "../../utils/students.utils";
import AddLessonModal from "./AddLessonModal";

const STATUS_CONFIG = {
  completed:  { label: "Completed",  color: "text-emerald-700 bg-emerald-50 border-emerald-100", dot: "#059669" },
  scheduled:  { label: "Scheduled",  color: "text-blue-700 bg-blue-50 border-blue-100", dot: "#2563eb" },
  cancelled:  { label: "Cancelled",  color: "text-gray-600 bg-gray-50 border-gray-200", dot: "#6b7280" },
  no_show:    { label: "No Show",    color: "text-rose-600 bg-rose-50 border-rose-100", dot: "#e11d48" },
};

const TYPE_CONFIG = {
  practical: {
    label: "Practical",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    icon: Car,
  },
  theory: {
    label: "Theory",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    icon: BookOpen,
  },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtTime12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function printLessonSlip(lesson, student) {
  const printed = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
  const time = lesson.start_time && lesson.end_time
    ? `${fmtTime12(lesson.start_time)} – ${fmtTime12(lesson.end_time)}`
    : "—";
  const win = window.open("", "_blank", "width=760,height=900");
  win.document.write(`<!DOCTYPE html><html><head><title>Lesson Slip</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    body { margin: 0; padding: 0; background: #fff; font-family: 'Inter', Arial, sans-serif; }
    .slip { width: 80mm; min-width: 80mm; padding: 14px 12px; font-size: 11px; line-height: 1.45; color: #111; position: relative; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-45deg); font-size: 52px; font-weight: 900; color: rgba(0,0,0,0.10); text-transform: uppercase; white-space: nowrap; pointer-events: none; z-index: 1; letter-spacing: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .content { position: relative; z-index: 2; }
    .header { text-align: center; margin-bottom: 10px; }
    .logo { width: 56px; height: 56px; object-fit: contain; margin: 0 auto 5px; display: block; }
    .title { font-size: 15px; font-weight: 900; margin: 3px 0; letter-spacing: 0.8px; text-transform: uppercase; }
    .subtitle { font-size: 11px; font-weight: 700; margin: 2px 0; color: #444; }
    .divider-thick { border: none; border-top: 2px solid #111; margin: 9px 0; }
    .divider { border: none; border-top: 1.5px dashed #aaa; margin: 9px 0; }
    .section-title { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; text-align: center; margin-bottom: 6px; color: #333; }
    .row { display: flex; justify-content: space-between; align-items: baseline; margin: 3.5px 0; font-size: 10.5px; }
    .label { color: #555; font-weight: 500; }
    .value { font-weight: 700; text-align: right; color: #111; }
    .type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #f0f0f0; border: 1.5px solid #ccc; }
    .footer { text-align: center; margin-top: 12px; }
    .footer p { margin: 2px 0; font-size: 9.5px; color: #555; }
    .thank-you { font-weight: 900; font-size: 13px; margin: 4px 0 8px; }
    .timestamp { font-size: 9px; color: #aaa; margin-top: 6px; }
    .copy-label { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #bbb; letter-spacing: 1.5px; margin-top: 5px; }
    @media print { @page { size: 80mm auto; margin: 0; } }
  </style></head><body>
    <div class="slip">
      <div class="watermark">lesson slip</div>
      <div class="content">
        <div class="header">
          <img src="/images.png" alt="Rocky Driving School" class="logo" />
          <h1 class="title">Rocky Driving School</h1>
          <p class="subtitle">Lesson Attendance Slip</p>
        </div>
        <div class="divider-thick"></div>
        <div class="section-title">Student Details</div>
        <div class="row"><span class="label">Name:</span><span class="value">${student.full_name || "—"}</span></div>
        <div class="row"><span class="label">Admission No:</span><span class="value">${student.admission_number || "—"}</span></div>
        <div class="row"><span class="label">Course:</span><span class="value">${lesson.course_name || "—"}</span></div>
        <div class="divider"></div>
        <div class="section-title">Lesson Details</div>
        <div class="row"><span class="label">Date:</span><span class="value">${lesson.date || "—"}</span></div>
        <div class="row"><span class="label">Time:</span><span class="value">${time}</span></div>
        <div class="row"><span class="label">Duration:</span><span class="value">${fmtDuration(lesson.duration_minutes)}</span></div>
        <div class="row"><span class="label">Type:</span><span class="value"><span class="type-badge">${(lesson.lesson_type || "—").replace("_", " ")}</span></span></div>
        <div class="row"><span class="label">Instructor:</span><span class="value">${lesson.instructor_name || "—"}</span></div>
        <div class="row"><span class="label">Vehicle:</span><span class="value">${lesson.vehicle_display || "—"}</span></div>
        <div class="row"><span class="label">Status:</span><span class="value">${lesson.status || "—"}</span></div>
        ${lesson.notes ? `<div class="divider"></div><div class="section-title">Notes</div><div style="font-size:10px;color:#444;">${lesson.notes}</div>` : ""}
        <div class="divider-thick"></div>
        <div class="footer">
          <p class="thank-you">Rocky Driving School</p>
          <p>Thank you for your commitment to safe driving.</p>
          <div class="timestamp"><p>Printed: ${printed}</p></div>
          <p class="copy-label">student copy</p>
        </div>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

const CHIP = {
  blue:  "bg-red-50 text-[#c41820]",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red:   "bg-rose-50 text-rose-600",
};

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CHIP[color]}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

const hoursTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-bold text-gray-800">{p.day}</p>
      <p className="text-xs font-extrabold text-[#c41820]">{fmtDuration(p.minutes)}</p>
    </div>
  );
};

/* ── Type filter pill button ─────────────────────────────────────────── */
function TypeFilterTab({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
        active
          ? "bg-[#1a0a0b] text-white shadow-sm"
          : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {label}
      {count != null && (
        <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function StudentLessons() {
  const { student, setStudent, selectedCourse } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "practical" | "theory"

  const load = useCallback(() => {
    setLoading(true);
    setLessons([]);
    if (!selectedCourse) { setLoading(false); return; }
    const params = { student_id: student.id, student_course_id: selectedCourse.id };
    Promise.all([
      lessonsAPI.getAll(params),
      lessonsAPI.getSummary(student.id, selectedCourse.id),
    ])
      .then(([data, sum]) => {
        setLessons(Array.isArray(data) ? data : (data.results ?? []));
        setSummary(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.id, selectedCourse?.id]);

  useEffect(() => { load(); }, [load]);

  const totalHours = summary
    ? `${Math.floor(summary.total_minutes / 60)}h ${summary.total_minutes % 60}m`
    : "—";

  /* ── Type filter counts ─────────────────────────────────────────────── */
  const practicalCount = useMemo(() => lessons.filter((l) => l.lesson_type === "practical").length, [lessons]);
  const theoryCount    = useMemo(() => lessons.filter((l) => l.lesson_type === "theory").length, [lessons]);

  const filteredLessons = useMemo(() => {
    if (typeFilter === "all") return lessons;
    return lessons.filter((l) => l.lesson_type === typeFilter);
  }, [lessons, typeFilter]);

  /* Group completed lessons of the current week by weekday */
  const weeklyData = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const totals = WEEKDAYS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { day: label, date: d, minutes: 0, isToday: d.toDateString() === now.toDateString() };
    });

    lessons.forEach((l) => {
      if (l.status !== "completed" || !l.date) return;
      const d = new Date(l.date);
      if (d < monday || d > sunday) return;
      const idx = totals.findIndex((t) => t.date.toDateString() === d.toDateString());
      if (idx >= 0) totals[idx].minutes += l.duration_minutes || 0;
    });

    return totals;
  }, [lessons]);

  const weeklyTotalMinutes = weeklyData.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="min-h-full bg-background">
      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon={GraduationCap} label="Completed"  value={summary ? `${summary.practical_completed + summary.theory_completed}` : "—"} color="blue" />
          <SummaryCard icon={CheckCircle}   label="Practical"  value={summary ? `${summary.practical_completed} / ${summary.practical_required}` : "—"} color="green" />
          <SummaryCard icon={BookOpen}      label="Theory"     value={summary ? `${summary.theory_completed} / ${summary.theory_required}` : "—"} color="amber" />
          <SummaryCard icon={Clock}         label="Total Hours" value={totalHours} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Practical / Theory split progress */}
          {summary && (summary.practical_required > 0 || summary.theory_required > 0) && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-sm font-bold text-gray-800">Training Progress</p>

              {/* Practical */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-600">Practical</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {summary.practical_completed}
                    <span className="text-xs font-semibold text-gray-400"> / {summary.practical_required}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-orange-400 transition-all"
                    style={{ width: `${summary.practical_required > 0 ? Math.min(100, (summary.practical_completed / summary.practical_required) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {Math.max(0, summary.practical_required - summary.practical_completed)} remaining
                </p>
              </div>

              {/* Theory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-600">Theory</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {summary.theory_completed}
                    <span className="text-xs font-semibold text-gray-400"> / {summary.theory_required}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-400 transition-all"
                    style={{ width: `${summary.theory_required > 0 ? Math.min(100, (summary.theory_completed / summary.theory_required) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {Math.max(0, summary.theory_required - summary.theory_completed)} remaining
                </p>
              </div>
            </div>
          )}

          {/* Weekly training hours — bar chart */}
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${summary && (summary.practical_required > 0 || summary.theory_required > 0) ? "lg:col-span-3" : "lg:col-span-5"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-800">Weekly Training Hours</p>
              <span className="text-xs font-semibold text-gray-400">{fmtDuration(weeklyTotalMinutes)} this week</span>
            </div>
            <div style={{ width: "100%", height: 180 }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={20}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={hoursTooltip} cursor={{ fill: "rgba(196,24,32,0.04)" }} />
                  <Bar dataKey="minutes" radius={[8, 8, 8, 8]} maxBarSize={28} isAnimationActive={false}>
                    {weeklyData.map((d, i) => (
                      <Cell key={i} fill={d.isToday ? "#c41820" : d.minutes > 0 ? "#f4b8bc" : "#f1f2f4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Header row + type filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Lesson History</h2>
            {/* Type filter tabs */}
            <div className="flex items-center gap-1.5">
              <TypeFilterTab
                label="All"
                active={typeFilter === "all"}
                count={lessons.length}
                onClick={() => setTypeFilter("all")}
              />
              <TypeFilterTab
                label="Practical"
                active={typeFilter === "practical"}
                count={practicalCount}
                onClick={() => setTypeFilter("practical")}
              />
              <TypeFilterTab
                label="Theory"
                active={typeFilter === "theory"}
                count={theoryCount}
                onClick={() => setTypeFilter("theory")}
              />
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white rounded-xl transition-all shadow-sm shadow-red-900/10 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Lesson
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#c41820]" />
              <span className="text-sm">Loading lessons…</span>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#c41820]" />
              </div>
              <p className="font-semibold text-gray-500">
                {typeFilter === "all"
                  ? "No lessons recorded yet."
                  : `No ${typeFilter} lessons found.`}
              </p>
              {typeFilter === "all" && (
                <>
                  <p className="text-sm text-gray-400">Add the student's first lesson to start tracking training.</p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-1 flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#c41820] hover:bg-[#ed1c24] text-white rounded-xl transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["#", "Date", "Type", "Time", "Duration", "Course", "Instructor", "Vehicle", "Status", "Notes", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLessons.map((lesson, i) => {
                    const cfg = STATUS_CONFIG[lesson.status] ?? STATUS_CONFIG.completed;
                    const typeCfg = TYPE_CONFIG[lesson.lesson_type] ?? TYPE_CONFIG.practical;
                    const TypeIcon = typeCfg.icon;
                    return (
                      <tr key={lesson.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                        <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                          {fmtDate(lesson.date)}
                        </td>
                        {/* Type badge column */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {fmtTime12(lesson.start_time)} – {fmtTime12(lesson.end_time)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                          {fmtDuration(lesson.duration_minutes)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">
                          {lesson.course_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {lesson.instructor_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {lesson.vehicle_display || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                          {lesson.notes || lesson.instructor_remarks || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => printLessonSlip(lesson, student)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#c41820] hover:bg-[#ed1c24] text-white transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddLessonModal
          student={student}
          studentCourses={student.student_courses ?? []}
          selectedCourse={selectedCourse}
          onClose={() => setShowAdd(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
