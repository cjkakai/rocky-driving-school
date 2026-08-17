import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, Loader2, Receipt, TrendingUp } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { paymentsAPI } from "../../api/payments.api";
import { fmt, fmtDate, computeCourseBalance } from "../../utils/students.utils";
import { Badge } from "../../ui";

const METHOD_LABEL = { bank: "Bank", coop_stk: "Co-op STK", bank_ipn: "Bank IPN", bank_b2b: "Bank B2B" };
const TYPE_LABEL   = { REGISTRATION: "Registration", TOP_UP: "Top-Up", RETAKE: "Retake", PDL_REACTIVATION: "PDL Reactivation", UNALLOCATED: "Unallocated", CREDIT_TRANSFER: "Credit Transfer" };

function RingCard({ pct, label, sub, color = "#059669" }) {
  const data = [{ value: pct, fill: color }];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3.5">
      <div className="relative w-14 h-14 shrink-0">
        <RadialBarChart
          width={56} height={56} cx="50%" cy="50%"
          innerRadius="78%" outerRadius="100%"
          data={data} startAngle={90} endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar background={{ fill: "#f1f2f4" }} dataKey="value" cornerRadius={16} isAnimationActive={false} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-gray-900">{Math.round(pct)}%</span>
        </div>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-gray-700 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

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

  const courseBalance = selectedCourse ? computeCourseBalance(selectedCourse) : null;
  const coursePct = courseBalance && courseBalance.agreed > 0
    ? Math.min(100, (courseBalance.paid / courseBalance.agreed) * 100)
    : 0;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Total Paid</p>
              <p className="text-lg font-extrabold text-gray-900">{fmt(totalPaid)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5 text-[#c41820]" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Transactions</p>
              <p className="text-lg font-extrabold text-gray-900">{payments.length}</p>
            </div>
          </div>
          {courseBalance && (
            <>
              <RingCard
                pct={coursePct}
                label="Course Payment"
                sub={`${fmt(courseBalance.paid)} of ${fmt(courseBalance.agreed)}`}
              />
              {courseBalance.balance > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-rose-500 font-bold uppercase tracking-wide">Outstanding</p>
                    <p className="text-lg font-extrabold text-rose-700">{fmt(courseBalance.balance)}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#c41820]" />
              <span className="text-sm">Loading payments…</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#c41820]" />
              </div>
              <p className="font-semibold text-gray-500">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["Date", "Reference", "Course", "Method", "Type", "Amount", "Balance After"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{fmtDate(p.transaction_date || p.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-700">{p.reference_code}</span>
                        {p.mpesa_reference && <p className="text-[10px] text-gray-400">{p.mpesa_reference}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">{p.course_name || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant="gray">{METHOD_LABEL[p.payment_method] || p.payment_method}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={p.payment_type === "UNALLOCATED" ? "orange" : "blue"}>{TYPE_LABEL[p.payment_type] || p.payment_type}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="font-extrabold text-emerald-700 tabular-nums">{fmt(p.amount)}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.receipt_new_balance != null ? (
                          <span className={`text-xs font-bold tabular-nums ${Number(p.receipt_new_balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmt(p.receipt_new_balance)}</span>
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