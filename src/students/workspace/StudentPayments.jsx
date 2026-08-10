import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, Loader2 } from "lucide-react";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate } from "../../utils/students.utils";
import { Badge } from "../../ui";

const METHOD_LABEL = { bank: "Bank", coop_stk: "Co-op STK", bank_ipn: "Bank IPN", bank_b2b: "Bank B2B" };
const TYPE_LABEL   = { REGISTRATION: "Registration", TOP_UP: "Top-Up", RETAKE: "Retake", PDL_REACTIVATION: "PDL Reactivation", UNALLOCATED: "Unallocated", CREDIT_TRANSFER: "Credit Transfer" };

export default function StudentPayments() {
  const { student, setStudent, selectedCourse } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch = selectedCourse
      ? paymentsAPI.getByStudentCourse(selectedCourse.id)
      : paymentsAPI.getByStudent(student.id);
    fetch
      .then((data) => setPayments(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.id, selectedCourse?.id]);

  const totalPaid = payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Paid</p>
              <p className="text-lg font-black text-gray-900">{fmt(totalPaid)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Transactions</p>
            <p className="text-lg font-black text-gray-900">{payments.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading payments…</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <CreditCard className="w-8 h-8 opacity-30" />
              <p className="font-semibold text-gray-500">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Date", "Reference", "Course", "Method", "Type", "Amount", "Balance After"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{fmtDate(p.transaction_date || p.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-700">{p.reference_code}</span>
                        {p.mpesa_reference && <p className="text-[10px] text-gray-400">{p.mpesa_reference}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">{p.course_name || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant="gray">{METHOD_LABEL[p.payment_method] || p.payment_method}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={p.payment_type === "UNALLOCATED" ? "orange" : "blue"}>{TYPE_LABEL[p.payment_type] || p.payment_type}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="font-bold text-green-700 tabular-nums">{fmt(p.amount)}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.receipt_new_balance != null ? (
                          <span className={`text-xs font-bold tabular-nums ${Number(p.receipt_new_balance) > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(p.receipt_new_balance)}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
