import { useState } from "react";
import { Calendar, CheckCircle, XCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { canBookPdl, pdlBlockedReason } from "../../utils/studentActions";
import { fmtDate } from "../../utils/students.utils";

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1a0a0b]/20 focus:border-[#1a0a0b] bg-white transition-colors";

export function PdlSection({ sc, isBranchUser, loading, onAddPdl }) {
  const [showForm, setShowForm] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [formError, setFormError] = useState("");

  const eligibleForPdl = isBranchUser && canBookPdl(sc);
  const pdlReason = pdlBlockedReason(sc);
  const pdl = sc.pdl_details;

  if (sc.is_refresher_course) {
    return <span className="text-xs text-gray-400 italic">Not required (refresher)</span>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!referenceNumber.trim()) { setFormError("PDL reference number is required."); return; }
    if (!issuedDate) { setFormError("Issued date is required."); return; }
    try {
      await onAddPdl({ reference_number: referenceNumber.trim(), issued_date: issuedDate });
      setShowForm(false);
      setReferenceNumber("");
      setIssuedDate("");
    } catch (err) {
      setFormError(err?.message || "Failed to save PDL.");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  /* ── ACTIVE PDL ─────────────────────────────────────────────────── */
  if (sc.pdl_state === "active") {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" /> Active
        </span>
        {pdl?.reference_number && (
          <div className="text-[11px] text-gray-500 space-y-0.5 pl-0.5">
            <p><span className="font-semibold text-gray-600">Ref:</span> {pdl.reference_number}</p>
            {pdl.issued_date && (
              <p><span className="font-semibold text-gray-600">Issued:</span> {fmtDate(pdl.issued_date)}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── EXPIRED PDL ─────────────────────────────────────────────────── */
  if (sc.pdl_state === "expired") {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Expired
        </span>
        {isBranchUser && (
          eligibleForPdl ? (
            showForm ? (
              <PdlEntryForm
                referenceNumber={referenceNumber}
                issuedDate={issuedDate}
                today={today}
                loading={loading}
                formError={formError}
                onRefChange={setReferenceNumber}
                onDateChange={setIssuedDate}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setFormError(""); }}
              />
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white px-3 py-1.5 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Renew PDL
              </button>
            )
          ) : (
            <p className="text-xs text-red-400 italic">{pdlReason}</p>
          )
        )}
      </div>
    );
  }

  /* ── PENDING PDL (waiting for branch to enter details) ─────────────── */
  if (sc.status === "pending_pdl") {
    if (!isBranchUser) {
      return (
        <span className="text-xs text-amber-600 italic">Awaiting PDL entry by branch</span>
      );
    }

    if (!eligibleForPdl) {
      return <p className="text-xs text-red-400 italic">{pdlReason}</p>;
    }

    return (
      <div className="space-y-2">
        {showForm ? (
          <PdlEntryForm
            referenceNumber={referenceNumber}
            issuedDate={issuedDate}
            today={today}
            loading={loading}
            formError={formError}
            onRefChange={setReferenceNumber}
            onDateChange={setIssuedDate}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setFormError(""); }}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Add PDL
          </button>
        )}
      </div>
    );
  }

  return null;
}

/* ── Reusable PDL entry form ─────────────────────────────────────────── */
function PdlEntryForm({ referenceNumber, issuedDate, today, loading, formError, onRefChange, onDateChange, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
        <FileText className="w-3 h-3" /> PDL Details
      </p>

      <div>
        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
          Reference Number <span className="text-[#c41820]">*</span>
        </label>
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => onRefChange(e.target.value)}
          placeholder="e.g. KHW/PDL/2026/001"
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
          Issued On <span className="text-[#c41820]">*</span>
        </label>
        <input
          type="date"
          value={issuedDate}
          onChange={(e) => onDateChange(e.target.value)}
          max={today}
          className={inputCls}
          required
        />
      </div>

      {formError && (
        <p className="text-[11px] text-red-500">{formError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-1.5 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
          {loading ? "Saving…" : "Save PDL"}
        </button>
      </div>
    </form>
  );
}
