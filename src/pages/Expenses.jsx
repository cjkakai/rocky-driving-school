import { useState, useEffect, useCallback } from "react";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { Btn, Toast, useToast } from "../ui";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { expensesAPI } from "../api/expenses.api";
import { ProfitabilityKpiCards } from "../components/expenses/ProfitabilityKpiCards";
import { BranchProfitabilityChart } from "../components/expenses/BranchProfitability";
import { ProfitabilityDonut } from "../components/expenses/Profitabilitydonut";
import { ExpenseTimeSeries } from "../components/expenses/ExpenseTimeSeries";
import { ProfitabilityTable } from "../components/expenses/Profitabilitytable";
import { ExpenseModal } from "../components/expenses/ExpenseModal";
import { ExpenseTable } from "../components/expenses/ExpenseTable";

const TODAY = new Date().toISOString().slice(0, 10);
const d = (days) => {
  const dt = new Date(); dt.setDate(dt.getDate() - days);
  return dt.toISOString().slice(0, 10);
};
const QUICK = [
  { label: "Today",      dateFrom: TODAY,  dateTo: TODAY },
  { label: "7 Days",     dateFrom: d(6),   dateTo: TODAY },
  { label: "30 Days",    dateFrom: d(29),  dateTo: TODAY },
  {
    label: "This Month",
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    dateTo: TODAY,
  },
];

export default function Expenses() {
  const [branches, setBranches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });
  const [activeQuick, setActiveQuick] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast, show, hide } = useToast();

  const patchFilters = (patch) => { setFilters((f) => ({ ...f, ...patch })); setActiveQuick(null); };
  const applyQuick = (q) => { setFilters({ dateFrom: q.dateFrom, dateTo: q.dateTo }); setActiveQuick(q.label); };
  const clearFilters = () => { setFilters({ dateFrom: "", dateTo: "" }); setActiveQuick(null); };

  const apiFilters = {
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo   ? { date_to:   filters.dateTo   } : {}),
  };

  const loadExpenses = useCallback(() => {
    setLoadingExpenses(true);
    expensesAPI.list(apiFilters)
      .then((res) => setExpenses(Array.isArray(res) ? res : res.results ?? []))
      .catch(() => setExpenses([]))
      .finally(() => setLoadingExpenses(false));
  }, [JSON.stringify(apiFilters)]);

  useEffect(() => {
    expensesAPI.branches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleSaved = () => {
    loadExpenses();
    show(editExpense ? "Expense updated" : "Expense added");
  };

  const handleDelete = async () => {
    await expensesAPI.delete(deleteTarget.id);
    setDeleteTarget(null);
    loadExpenses();
    show("Expense deleted");
  };

  const hasFilters = filters.dateFrom || filters.dateTo;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch Performance</h1>
          <p className="text-gray-500 mt-1 text-sm">Revenue, expenses &amp; profitability dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-red-50/60 rounded-xl p-1">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => applyQuick(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeQuick === q.label
                    ? "bg-gradient-to-r from-[#c41820] to-[#ed1c24] text-white shadow-sm shadow-red-200"
                    : "text-[#c41820]/70 hover:text-[#c41820]"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <Btn onClick={() => { setEditExpense(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Expense
          </Btn>
        </div>
      </div>

      {/* Date filter bar */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-2xl border border-red-100 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c41820]/70 uppercase tracking-wide shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Date Range
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => patchFilters({ dateFrom: e.target.value })}
              className="px-3 py-1.5 border border-red-100 rounded-xl text-sm bg-red-50/40 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#c41820] transition-all"
            />
            <span className="text-red-300 text-sm">→</span>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom}
              onChange={(e) => patchFilters({ dateTo: e.target.value })}
              className="px-3 py-1.5 border border-red-100 rounded-xl text-sm bg-red-50/40 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#c41820] transition-all"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <p className="ml-auto text-xs text-[#c41820]/50">Filters apply globally to all sections</p>
        </div>
      </div>

      {/* KPI Cards */}
      <ProfitabilityKpiCards filters={apiFilters} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BranchProfitabilityChart branches={branches} globalFilters={filters} />
        <ProfitabilityDonut globalFilters={filters} />
      </div>

      {/* Trend chart */}
      <ExpenseTimeSeries branches={branches} globalFilters={filters} />

      {/* Expense transactions */}
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-800">Expense Transactions</h2>
          <p className="text-xs text-gray-400">Individual expense records · add, edit, or delete</p>
        </div>
        <ExpenseTable
          expenses={expenses}
          loading={loadingExpenses}
          onEdit={(exp) => { setEditExpense(exp); setModalOpen(true); }}
          onDelete={setDeleteTarget}
          apiFilters={apiFilters}
        />
      </div>

      {/* P&L table */}
      <ProfitabilityTable globalFilters={filters} branches={branches} />

      <ExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditExpense(null); }}
        onSaved={handleSaved}
        expense={editExpense}
        branches={branches}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.description}"? This cannot be undone.`}
      />
      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
