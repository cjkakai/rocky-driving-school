import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Btn, Input, Label, Modal, DeleteConfirmModal } from "../ui";
import { coursesAPI } from "../api/courses.api";
import { fmt } from "../utils/students.utils";

const TH = ({ children }) => (
  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 whitespace-nowrap">
    {children}
  </th>
);

function CourseForm({ initial, onClose, onSuccess }) {
  const [form, setForm] = useState({
    category: initial?.category ?? "",
    class_name: initial?.class_name ?? "",
    lessons: initial?.lessons ?? "",
    amount: initial?.amount ?? "",
    max_discount: initial?.max_discount ?? "0",
    is_refresher_course: initial?.is_refresher_course ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    const max_discount = Number(form.max_discount);
    if (!form.category.trim()) { setError("Category is required."); return; }
    if (!form.class_name.trim()) { setError("Class name is required."); return; }
    if (!form.lessons.trim()) { setError("Lessons is required."); return; }
    if (amount <= 0) { setError("Amount must be greater than 0."); return; }
    if (max_discount < 0) { setError("Max discount cannot be negative."); return; }
    if (max_discount > amount) { setError("Max discount cannot exceed course amount."); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        category: form.category.trim(),
        class_name: form.class_name.trim(),
        lessons: form.lessons.trim(),
        amount,
        max_discount,
        is_refresher_course: form.is_refresher_course,
      };
      if (initial) {
        await coursesAPI.update(initial.id, payload);
      } else {
        await coursesAPI.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${initial ? "update" : "create"} course.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="e.g. A Motorbike & Three Wheelers" value={form.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="class_name">Class</Label>
          <Input id="class_name" placeholder="e.g. A2 Motorcycle" value={form.class_name} onChange={(e) => set("class_name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lessons">Lessons</Label>
          <Input id="lessons" placeholder="e.g. 10 theory, 10 practical" value={form.lessons} onChange={(e) => set("lessons", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="amount">Amount (Ksh)</Label>
          <Input id="amount" type="number" min="1" placeholder="12000" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="max_discount">Max Discount (Ksh)</Label>
          <Input id="max_discount" type="number" min="0" placeholder="0" value={form.max_discount} onChange={(e) => set("max_discount", e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => set("is_refresher_course", !form.is_refresher_course)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_refresher_course ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_refresher_course ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Refresher Course
            <span className="ml-2 text-xs text-gray-400 font-normal">(skips PDL, manual completion)</span>
          </span>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? (initial ? "Saving..." : "Creating...") : (initial ? "Save Changes" : "Add Course")}
        </Btn>
      </div>
    </form>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoadingIds, setDeleteLoadingIds] = useState(new Set());
  const [toggleLoadingIds, setToggleLoadingIds] = useState(new Set());

  const handleToggleRegistration = async (course) => {
    setToggleLoadingIds((prev) => new Set(prev).add(course.id));
    try {
      await coursesAPI.update(course.id, { is_active_for_registration: !course.is_active_for_registration });
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_active_for_registration: !c.is_active_for_registration } : c));
    } catch {
      toast.error("Failed to update registration visibility.");
    } finally {
      setToggleLoadingIds((prev) => { const next = new Set(prev); next.delete(course.id); return next; });
    }
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await coursesAPI.getAll();
      setCourses(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleDelete = async (course) => {
    setDeleteTarget(course);
  };

   const confirmDelete = async () => {
     if (!deleteTarget) return;
     setDeleteLoadingIds(prev => new Set(prev).add(deleteTarget.id));
     try {
       await coursesAPI.delete(deleteTarget.id);
       toast.success(`Course "${deleteTarget.class_name}" deleted`);
       fetchCourses();
       setDeleteTarget(null);
     } catch (err) {
       toast.error(err.message || "Failed to delete course.");
     } finally {
       setDeleteLoadingIds(prev => {
         const next = new Set(prev);
         next.delete(deleteTarget.id);
         return next;
       });
     }
   };

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return c.category?.toLowerCase().includes(q) || c.class_name?.toLowerCase().includes(q);
  });

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage driving courses and pricing</p>
        </div>
        <Btn onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />Add Course
        </Btn>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by category or class..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {error && (
          <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading courses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.9rem]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <TH>Category</TH>
                  <TH>Class</TH>
                  <TH>Lessons</TH>
                  <TH>Amount</TH>
                  <TH>Max Discount</TH>
                  <TH>Refresher</TH>
                  <TH>Registration</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-gray-700 max-w-[180px]"><span className="line-clamp-2">{c.category}</span></td>
                    <td className="px-4 py-4 font-semibold text-gray-900 max-w-[140px]"><span className="line-clamp-2">{c.class_name}</span></td>
                    <td className="px-4 py-4 text-gray-600 max-w-[100px]"><span className="line-clamp-2">{c.lessons}</span></td>
                    <td className="px-4 py-4 font-bold text-green-700 whitespace-nowrap">{fmt(c.amount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {Number(c.max_discount) > 0 ? (
                        <Badge variant="orange">{fmt(c.max_discount)}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {c.is_refresher_course ? <Badge variant="blue">Refresher</Badge> : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={toggleLoadingIds.has(c.id)}
                        onClick={() => handleToggleRegistration(c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                          c.is_active_for_registration ? "bg-green-500" : "bg-gray-200"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          c.is_active_for_registration ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Btn size="sm" variant="outline" onClick={() => setEditTarget(c)}>
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => handleDelete(c)}>
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Course" maxWidth="max-w-lg">
        <CourseForm onClose={() => setModalOpen(false)} onSuccess={fetchCourses} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Course" maxWidth="max-w-lg">
        <CourseForm initial={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchCourses} />
      </Modal>

       <DeleteConfirmModal
         open={!!deleteTarget}
         onClose={() => setDeleteTarget(null)}
         onConfirm={confirmDelete}
         title="Delete Course"
         message="This action cannot be undone. The course will be permanently deleted."
         itemName={deleteTarget?.class_name}
         isLoading={deleteLoadingIds.has(deleteTarget?.id ?? '')}
       />
    </div>
  );
}
