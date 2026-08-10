import { useState, useEffect } from "react";
import { X, Wallet, Users, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { targetsAPI } from "../../api/targets.api";
import { SearchableSelect } from "../../ui/SearchableSelect";

const METRICS = [
  { value: "revenue",       label: "Revenue",       desc: "Weekly cash target",     Icon: Wallet },
  { value: "registrations", label: "Registrations", desc: "Monthly signup target",  Icon: Users  },
];

export function SetTargetModal({ open, onClose, onSaved, branches }) {
  const [metric,   setMetric]   = useState("revenue");
  const [branchId, setBranchId] = useState("");
  const [value,    setValue]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [period,   setPeriod]   = useState(null);

  useEffect(() => {
    if (open) {
      setMetric("revenue"); setBranchId(""); setValue(""); setError("");
      targetsAPI.currentPeriod().then(setPeriod).catch(() => setPeriod(null));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId || !value) { setError("Branch and target value are required."); return; }
    if (!period) { setError("Could not determine current period. Please try again."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = metric === "revenue"
        ? { branch: branchId, year: period.year, week: period.week, target_amount: Number(value) }
        : { branch: branchId, year: period.year, month: period.month, target_count: Number(value) };
      const fn = metric === "revenue" ? targetsAPI.setRevenueTarget : targetsAPI.setRegTarget;
      await fn(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save target.");
    } finally {
      setSaving(false);
    }
  };

  const periodLabel = period
    ? metric === "revenue"
      ? `Week ${period.week}, ${period.year}`
      : `Month ${period.month}, ${period.year}`
    : "Loading…";

  const isRevenue = metric === "revenue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">

        {/* Accent bar */}
        <div className="h-1 rounded-t-3xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-none">Set Target</h2>
              <p className="text-xs text-gray-400 mt-1">Define a performance goal for a branch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 rounded-b-3xl">

          {/* Metric selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metric</label>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map(({ value: m, label, desc, Icon }) => {
                const active = metric === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetric(m)}
                    className={`text-left px-4 py-3 rounded-2xl border transition-all ${
                      active
                        ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${active ? "text-blue-600" : "text-gray-400"}`} />
                    <p className={`text-sm font-bold leading-none ${active ? "text-blue-700" : "text-gray-700"}`}>
                      {label}
                    </p>
                    <p className={`text-[11px] mt-1 leading-tight ${active ? "text-blue-500" : "text-gray-400"}`}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period chip */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 font-medium">
              Setting target for <span className="font-bold">{periodLabel}</span>
            </p>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Branch</label>
            <SearchableSelect
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              placeholder="Select branch…"
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {isRevenue ? "Target Amount" : "Target Count"}
            </label>
            <div className="relative">
              {isRevenue && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  Ksh
                </span>
              )}
              <input
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isRevenue ? "500,000" : "20"}
                className={`w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  isRevenue ? "pl-12 pr-3" : "pl-3.5 pr-24"
                }`}
              />
              {!isRevenue && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                  registrations
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !period}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}