import { ChevronLeft, ChevronRight, Loader2, Printer, CreditCard } from "lucide-react";
import { Btn } from "../../ui";
import { DateCell, StatusBadge, PaymentTypeBadge } from "./paymentUtils";
import { fmt } from "../../utils/students.utils";

export function PaymentsTable({
  payments,
  loading,
  error,
  page,
  setPage,
  totalCount,
  totalPages,
  isSuperAdmin,
  filterStatus,
  onViewDetail,
  onAllocate,
  onPrintReceipt,
}) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      {loading ? (
        <div className="py-20 flex justify-center text-gray-300">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-red-500 bg-red-50 rounded-xl m-4">{error}</div>
      ) : payments.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-2 text-gray-300">
          <CreditCard className="w-8 h-8" />
          <p className="text-sm">No payments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ background: "#1a0a0b" }}>
                {[
                  "Transaction",
                  "Channel",
                  "M-PESA Ref",
                  "Student",
                  "Amount",
                  "Status",
                  "Type",
                  "Date",
                  "Branch",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                  className="px-4 py-3 text-left text-[10px] font-extrabold text-white/60 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                  {/* Transaction */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-700 font-medium">
                      {p.payment_reference ?? p.id}
                    </p>
                  </td>

                  {/* Channel */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-600">
                      {p.channel ?? <span className="text-gray-300">—</span>}
                    </span>
                  </td>

                  {/* M-PESA Ref */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">
                      {p.mpesa_reference ?? <span className="text-gray-300">—</span>}
                    </span>
                  </td>

                  {/* Student + Course */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{p.student_name ?? "—"}</p>
                    {p.course_name && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.course_name}</p>
                    )}
                    {p.student_course_reference && (
                      <p className="font-mono text-[11px] text-gray-400 mt-0.5">{p.student_course_reference}</p>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-green-600 tabular-nums whitespace-nowrap">
                      {fmt(p.amount)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <PaymentTypeBadge type={p.payment_type} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DateCell iso={p.transaction_date || p.created_at} />
                  </td>

                  {/* Branch */}
                  <td className="px-4 py-3">
                    {p.branch_name
                      ? <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">{p.branch_name}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {isSuperAdmin && (
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetail(p.id)}
                          className="text-xs"
                        >
                          View
                        </Btn>
                      )}
                      {isSuperAdmin && filterStatus === "orphaned" && (
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => onAllocate(p)}
                          className="text-xs"
                        >
                          Allocate
                        </Btn>
                      )}
                      <Btn
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintReceipt(p)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {payments.length} of {totalCount} payments
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg bg-[#1a0a0b] text-white hover:bg-[#3d1a1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-600 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-[#1a0a0b] text-white hover:bg-[#3d1a1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
