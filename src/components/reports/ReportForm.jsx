import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Lock, Calendar } from "lucide-react";
import { Btn, Label, Input } from "../../ui";
import { reportsAPI } from "../../api/reports.api";
import { useAuth } from "../../context/AuthContext";
import { fmtDate } from "../../utils/students.utils";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
}

export function ReportForm({ branches, onCreated, preselectedBranchId = "" }) {
  const { user }  = useAuth();
  const isAdmin   = user?.role === "super_admin";

  const [reportDate, setReportDate] = useState(todayStr());
  const [branchId, setBranchId]     = useState(
    isAdmin ? preselectedBranchId : String(user?.branch_id ?? "")
  );
  const [inquiries, setInquiries]   = useState("");
  const [notes, setNotes]           = useState("");

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const effectiveBranch = isAdmin ? branchId : String(user?.branch_id ?? "");
  const canSubmit       = reportDate && effectiveBranch;
  const minDate         = isAdmin ? "2020-01-01" : yesterdayStr();
  const maxDate         = todayStr();

  // Check for duplicate submission only
  useEffect(() => {
    if (!reportDate || !effectiveBranch) { setAlreadySubmitted(false); return; }
    reportsAPI.preview({ report_date: reportDate, branch: effectiveBranch })
      .then((data) => setAlreadySubmitted(!!data.already_submitted))
      .catch(() => setAlreadySubmitted(false));
  }, [reportDate, effectiveBranch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || alreadySubmitted) return;
    setSubmitting(true); setError("");
    try {
      const payload = {
        report_date: reportDate,
        ...(isAdmin ? { branch: effectiveBranch } : {}),
        inquiries: parseInt(inquiries) || 0,
        notes: notes.trim(),
      };
      const report = await reportsAPI.create(payload);
      onCreated(report);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const sel = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Date */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-800">Operational date</p>
        </div>
        <input type="date" value={reportDate} min={minDate} max={maxDate} required
          onChange={(e) => setReportDate(e.target.value)}
          className={sel}
        />
        {!isAdmin && <p className="text-xs text-gray-500 mt-2">Today or yesterday only.</p>}
        {reportDate && (
          <p className="text-xs font-semibold text-gray-700 mt-1">
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

      {/* Manual inputs */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Daily sign-off</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="inquiries">Inquiries</Label>
            <Input id="inquiries" type="number" min="0" value={inquiries}
              placeholder="Enter value"
              onChange={(e) => setInquiries(e.target.value)}
              disabled={!!alreadySubmitted} />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea id="notes" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 resize-none"
              disabled={!!alreadySubmitted}
            />
          </div>
        </div>
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