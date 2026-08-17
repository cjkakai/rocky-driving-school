import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, X } from "lucide-react";
import { Modal, Btn, Label, Input } from "../../ui";
import { expensesAPI } from "../../api/expenses.api";

function AddCategoryInline({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    setSaving(true);
    try {
      const cat = await expensesAPI.createCategory({ name: name.trim(), description: desc.trim() });
      onCreated(cat);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">New Category</p>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => { setName(e.target.value); setErr(""); }}
        placeholder="Category name…"
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <Btn size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
        </Btn>
        <Btn size="sm" variant="outline" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

export function ExpenseModal({ open, onClose, onSaved, expense, branches, currentUser }) {
  const isAdmin = currentUser?.role === "super_admin";
  const isEdit = !!expense;
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  const scope = watch("expense_type", expense?.expense_type ?? "GENERAL");

  const [categories, setCategories] = useState([]);
  const [showAddCat, setShowAddCat] = useState(false);

  const loadCategories = () =>
    expensesAPI.categories({ active_only: "true" })
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {});

  useEffect(() => { if (open) loadCategories(); }, [open]);

  useEffect(() => {
    if (open) {
      reset(expense
        ? {
            expense_type: expense.expense_type,
            branch: expense.branch ?? "",
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date,
          }
        : {
            expense_type: isAdmin ? "GENERAL" : "BRANCH",
            branch: isAdmin ? "" : (currentUser?.branch_id ?? ""),
            category: "", description: "", amount: "", expense_date: "",
          }
      );
      setShowAddCat(false);
    }
  }, [open, expense, reset, isAdmin, currentUser]);

  const handleCategoryCreated = (cat) => {
    setCategories((prev) => [...prev, cat]);
    setValue("category", cat.id);
    setShowAddCat(false);
  };

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (payload.expense_type === "GENERAL") delete payload.branch;
    if (isEdit) await expensesAPI.update(expense.id, payload);
    else await expensesAPI.create(payload);
    onSaved();
    onClose();
  };

  const sel = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors";
  const errCls = "text-xs text-red-500 mt-1";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Expense" : "Add Expense"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Scope — admin only, branch users are always BRANCH */}
        {isAdmin && (
        <div>
          <Label>Expense Scope</Label>
          <div className="flex gap-3 mt-1">
            {[{ v: "GENERAL", l: "General" }, { v: "BRANCH", l: "Branch" }].map(({ v, l }) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={v} {...register("expense_type", { required: true })} className="accent-red-600" />
                <span className="text-sm text-gray-700">{l}</span>
              </label>
            ))}
          </div>
        </div>
        )}

        {/* Branch — admin picks, branch user sees their branch as read-only */}
        {scope === "BRANCH" && (
          <div>
            <Label htmlFor="branch">Branch</Label>
            {isAdmin ? (
              <select id="branch" {...register("branch", { required: true })} className={sel}>
                <option value="">Select branch…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            ) : (
              <input
                readOnly
                value={currentUser?.branch_name ?? ""}
                className={`${sel} bg-gray-50 text-gray-500 cursor-not-allowed`}
              />
            )}
            {errors.branch && <p className={errCls}>Branch is required</p>}
          </div>
        )}

        {/* Category */}
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" {...register("category", { required: true })} className={sel}>
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category && <p className={errCls}>Category is required</p>}
          {!showAddCat && (
            <button
              type="button"
              onClick={() => setShowAddCat(true)}
              className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-medium"
            >
              <Plus className="w-3 h-3" /> Add New Category
            </button>
          )}
          {showAddCat && (
            <AddCategoryInline
              onCreated={handleCategoryCreated}
              onCancel={() => setShowAddCat(false)}
            />
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={2}
            {...register("description", { required: true })}
            className={`${sel} resize-none`}
            placeholder="Brief description…"
          />
          {errors.description && <p className={errCls}>Description is required</p>}
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount (Ksh)</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00"
            {...register("amount", { required: true, min: 0.01 })} />
          {errors.amount && <p className={errCls}>Valid amount is required</p>}
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="expense_date">Expense Date</Label>
          <Input id="expense_date" type="date" {...register("expense_date", { required: true })} />
          {errors.expense_date && <p className={errCls}>Date is required</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="outline" onClick={onClose} type="button">Cancel</Btn>
          <Btn type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Expense"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
