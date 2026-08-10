import { Pencil, Trash2, Download, Receipt } from "lucide-react";
import { expensesAPI } from "../../api/expenses.api";
import { fmt } from "../../utils/students.utils";

function exportExcel(apiFilters) {
  expensesAPI.exportExpenses(apiFilters);
}

const TYPE_STYLE = {
  BRANCH: "bg-blue-50 text-blue-700 border-blue-200",
  DEFAULT: "bg-amber-50 text-amber-700 border-amber-200",
};

function TypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        TYPE_STYLE[type] ?? TYPE_STYLE.DEFAULT
      }`}
    >
      {type}
    </span>
  );
}

export function ExpenseTable({ expenses, loading, onEdit, onDelete, apiFilters = {} }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-rose-50">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-rose-50 bg-gradient-to-r from-rose-50 via-white to-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-xl">
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-rose-700 text-base">Expense Records</h3>
            <p className="text-xs text-rose-400 mt-0.5">
              {expenses.length} record{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => exportExcel(apiFilters)}
          disabled={!expenses.length}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
      </div>

      {!expenses.length ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <Receipt className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium">No expenses found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-rose-50/60 to-white border-b border-rose-100">
              <tr>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400 whitespace-nowrap">Date</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Type</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Category</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Description</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Branch</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Amount</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap font-medium">{e.expense_date}</td>
                  <td className="px-4 py-3.5">
                    <TypeBadge type={e.expense_type} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 font-semibold">{e.category_name}</td>
                  <td className="px-4 py-3.5 text-gray-500 max-w-[220px] truncate">{e.description}</td>
                  <td className="px-4 py-3.5 text-gray-500 uppercase">{e.branch_name ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right font-black text-rose-700 tabular-nums">{fmt(e.amount)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(e)}
                        title="Edit"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(e)}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}