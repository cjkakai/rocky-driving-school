import { useState, useEffect } from "react";
import { Loader2, Plus, AlertTriangle, Lock, Calendar, Car, X } from "lucide-react";
import { Btn, Label, Input } from "../../ui";
import { vehiclesAPI } from "../../api/vehicles.api";
import { reportsAPI } from "../../api/reports.api";
import { useAuth } from "../../context/AuthContext";
import { fmtDate } from "../../utils/students.utils";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
}

function TripRow({ trip, index, vehicles, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 group">
      <span className="text-xs font-bold text-gray-400 w-5 shrink-0 tabular-nums mt-2">{index + 1}</span>
      <div className="flex-1 min-w-0 space-y-2">
        <select
          value={trip.vehicle}
          onChange={(e) => onChange(index, { ...trip, vehicle: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.registration_number} — {v.vehicle_name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-medium mb-1">Students Attended</p>
            <input
              type="number" min="0"
              value={trip.students}
              onChange={(e) => onChange(index, { ...trip, students: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-medium mb-1">Practical Lessons Conducted</p>
            <input
              type="number" min="0"
              value={trip.lessons}
              onChange={(e) => onChange(index, { ...trip, lessons: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ReportForm({ branches, onCreated, preselectedBranchId = "" }) {
  const { user }  = useAuth();
  const isAdmin   = user?.role === "super_admin";

  const [reportDate, setReportDate] = useState(todayStr());
  const [branchId, setBranchId]     = useState(
    isAdmin ? preselectedBranchId : String(user?.branch_id ?? "")
  );
  const [attendance, setAttendance] = useState("");
  const [inquiries, setInquiries]   = useState("");
  const [trips, setTrips]           = useState([]);

  const [vehicles, setVehicles]     = useState([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const effectiveBranch = isAdmin ? branchId : String(user?.branch_id ?? "");
  const canSubmit       = reportDate && effectiveBranch;
  const minDate         = isAdmin ? "2020-01-01" : yesterdayStr();
  const maxDate         = todayStr();

  useEffect(() => {
    vehiclesAPI.forReport().then(setVehicles).catch(() => {});
  }, []);

  // Check for duplicate submission only
  useEffect(() => {
    if (!reportDate || !effectiveBranch) { setAlreadySubmitted(false); return; }
    reportsAPI.preview({ report_date: reportDate, branch: effectiveBranch })
      .then((data) => setAlreadySubmitted(!!data.already_submitted))
      .catch(() => setAlreadySubmitted(false));
  }, [reportDate, effectiveBranch]);

  const addTrip    = () => setTrips((p) => [...p, { vehicle: "", students: "", lessons: "" }]);
  const updateTrip = (i, val) => setTrips((p) => p.map((t, idx) => idx === i ? val : t));
  const removeTrip = (i) => setTrips((p) => p.filter((_, idx) => idx !== i));

  const totalStudents = trips.reduce((s, t) => s + (parseInt(t.students) || 0), 0);
  const totalLessons  = trips.reduce((s, t) => s + (parseInt(t.lessons)  || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || alreadySubmitted) return;
    setSubmitting(true); setError("");
    try {
      const payload = {
        report_date: reportDate,
        ...(isAdmin ? { branch: effectiveBranch } : {}),
        inquiries:   parseInt(inquiries)  || 0,
        attendance:  parseInt(attendance) || 0,
        trip_entries: trips.filter((t) => t.vehicle).map((t) => ({
          vehicle:            t.vehicle,
          number_of_students: parseInt(t.students) || 0,
          number_of_lessons:  parseInt(t.lessons)  || 0,
        })),
      };
      const report = await reportsAPI.create(payload);
      onCreated(report);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const sel = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Date */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-semibold text-blue-800">Operational date</p>
        </div>
        <input type="date" value={reportDate} min={minDate} max={maxDate} required
          onChange={(e) => setReportDate(e.target.value)}
          className={sel}
        />
        {!isAdmin && <p className="text-xs text-blue-500 mt-2">Today or yesterday only.</p>}
        {reportDate && (
          <p className="text-xs font-semibold text-blue-700 mt-1">
            {reportDate === todayStr() ? "Today's report"
              : reportDate === yesterdayStr() ? "Yesterday's report"
              : `Report for ${fmtDate(reportDate)}`}
          </p>
        )}
      </div>

      {/* Branch (admin only) */}
      {isAdmin && (
        <div>
          <Label htmlFor="branch">Branch</Label>
          <select id="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required className={sel}>
            <option value="">Select branch…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {/* Already submitted warning */}
      {alreadySubmitted && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Already submitted</p>
            <p className="text-xs text-amber-600 mt-0.5">A report for {fmtDate(reportDate)} already exists for this branch.</p>
          </div>
        </div>
      )}

      {/* Manual inputs — stacked vertically */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Daily inputs</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="inquiries">Inquiries</Label>
            <Input id="inquiries" type="number" min="0" value={inquiries}
              placeholder="Enter value"
              onChange={(e) => setInquiries(e.target.value)}
              disabled={!!alreadySubmitted} />
          </div>
          <div>
            <Label htmlFor="attendance">Attendance</Label>
            <Input id="attendance" type="number" min="0" value={attendance}
              placeholder="Enter value"
              onChange={(e) => setAttendance(e.target.value)}
              disabled={!!alreadySubmitted} />
          </div>
        </div>
      </div>

      {/* Practical trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Practical trips</p>
            {trips.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {trips.length} vehicle{trips.length !== 1 ? "s" : ""} · {totalStudents} student{totalStudents !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button type="button" onClick={addTrip} disabled={!!alreadySubmitted}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Add trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-5 border border-dashed border-gray-200 rounded-xl text-gray-400">
            <Car className="w-5 h-5 opacity-40" />
            <div>
              <p className="text-sm font-medium">No trips added yet</p>
              <p className="text-xs mt-0.5">Click "Add trip" for each vehicle used during the day</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip, i) => (
              <TripRow key={i} trip={trip} index={i} vehicles={vehicles}
                onChange={updateTrip} onRemove={removeTrip} />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <Btn type="submit" disabled={submitting || !canSubmit || !!alreadySubmitted} className="w-full justify-center">
        {alreadySubmitted ? <><Lock className="w-4 h-4" /> Already submitted</>
          : submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          : "Submit daily report"}
      </Btn>
    </form>
  );
}
