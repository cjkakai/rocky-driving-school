import { fmtDate, fmt } from "../../utils/students.utils";

const TYPE_LABELS = {
  REGISTRATION:     "Registration",
  TOP_UP:           "Top-up",
  RETAKE:           "Retake",
  PDL_REACTIVATION: "PDL Reactivation",
  CREDIT_TRANSFER:  "Credit Transfer",
  UNALLOCATED:      "Unallocated",
};

const TYPE_STYLES = {
  REGISTRATION:     "bg-indigo-100 text-indigo-700",
  TOP_UP:           "bg-violet-100 text-violet-700",
  RETAKE:           "bg-amber-100 text-amber-700",
  PDL_REACTIVATION: "bg-orange-100 text-orange-700",
  CREDIT_TRANSFER:  "bg-blue-100 text-blue-700",
  UNALLOCATED:      "bg-gray-100 text-gray-500",
};

export function PaymentRow({ payment }) {
  const typeLabel = TYPE_LABELS[payment.payment_type] ?? payment.payment_type;
  const isCredit  = payment.payment_type === "CREDIT_TRANSFER";
  const typeBadgeClass = TYPE_STYLES[payment.payment_type] ?? "bg-gray-100 text-gray-600";

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 transition-all duration-150
        ${isCredit
          ? "bg-blue-50/60 border-blue-100 hover:border-blue-200 hover:shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      {/* Row 1: date + type + amount */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
            {fmtDate(payment.created_at)}
          </span>
          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full truncate ${typeBadgeClass}`}>
            {typeLabel}
          </span>
        </div>

        <span
          className={`text-sm font-bold tabular-nums tracking-tight whitespace-nowrap shrink-0
            ${isCredit ? "text-blue-700" : "text-emerald-700"}`}
        >
          {isCredit && <span className="mr-0.5">↩</span>}
          {fmt(payment.amount)}
        </span>
      </div>

      {/* Row 2: transaction id */}
      {payment.reference_code && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md shrink-0">
            TX ID
          </span>
          <span className="text-[11px] font-mono text-gray-500 truncate" title={payment.reference_code}>
            {payment.reference_code}
          </span>
        </div>
      )}

      {/* Row 3: M-Pesa ref — only when present */}
      {payment.mpesa_reference && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-gray-200">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
            M-Pesa
          </span>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 tracking-wide truncate">
            {payment.mpesa_reference}
          </span>
        </div>
      )}
    </div>
  );
}