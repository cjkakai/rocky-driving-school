import { useState, useEffect, useCallback } from "react";
import { Plus, Search, MapPin, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Btn, Input, Label, Modal, DeleteConfirmModal } from "../ui";
import { branchesAPI } from "../api/branches.api";

const TH = ({ children }) => (
  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 whitespace-nowrap">
    {children}
  </th>
);

function BranchForm({ initial, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    location: initial?.location ?? "",
    branch_code: initial?.branch_code ?? "",
    phone_number: initial?.phone_number ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Branch name is required."); return; }
    if (!form.location.trim()) { setError("Location is required."); return; }
    if (!form.branch_code.trim()) { setError("Branch code is required."); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        branch_code: form.branch_code.trim(),
        phone_number: form.phone_number.trim(),
      };
      if (initial) {
        await branchesAPI.update(initial.id, payload);
      } else {
        await branchesAPI.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${initial ? "update" : "create"} branch.`);
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
          <Label htmlFor="name">Branch Name</Label>
          <Input id="name" placeholder="e.g., Utawala Branch" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g., Utawala, Nairobi" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="branch_code">Branch Code</Label>
          <Input id="branch_code" placeholder="e.g., BR-UTW" value={form.branch_code} onChange={(e) => set("branch_code", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input id="phone_number" placeholder="e.g., +254 700 000 000" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? (initial ? "Saving..." : "Creating...") : (initial ? "Save Changes" : "Add Branch")}
        </Btn>
      </div>
    </form>
  );
}

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoadingIds, setDeleteLoadingIds] = useState(new Set());

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await branchesAPI.getAll();
      setBranches(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleDelete = async (branch) => {
    setDeleteTarget(branch);
  };

   const confirmDelete = async () => {
     if (!deleteTarget) return;
     setDeleteLoadingIds(prev => new Set(prev).add(deleteTarget.id));
     try {
       await branchesAPI.delete(deleteTarget.id);
       toast.success(`Branch "${deleteTarget.name}" deleted`);
       fetchBranches();
       setDeleteTarget(null);
     } catch (err) {
       toast.error(err.message || "Failed to delete branch.");
     } finally {
       setDeleteLoadingIds(prev => {
         const next = new Set(prev);
         next.delete(deleteTarget.id);
         return next;
       });
     }
   };

  const filtered = branches.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.branch_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.location?.toLowerCase().includes(search.toLowerCase())
  );

   return (
     <div className="mt-8 space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage branch locations and operations</p>
        </div>
        <Btn onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />Add Branch
        </Btn>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, code, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
            <p className="text-sm">Loading branches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No branches found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.9rem]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <TH>Branch Name</TH>
                  <TH>Location</TH>
                  <TH>Branch Code</TH>
                  <TH>Phone Number</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {b.location ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-700 whitespace-nowrap">{b.branch_code ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{b.phone_number || "—"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Btn size="sm" variant="outline" onClick={() => setEditTarget(b)}>
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => handleDelete(b)}>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Branch" maxWidth="max-w-lg">
        <BranchForm onClose={() => setAddOpen(false)} onSuccess={fetchBranches} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Branch" maxWidth="max-w-lg">
        <BranchForm initial={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchBranches} />
      </Modal>

       <DeleteConfirmModal
         open={!!deleteTarget}
         onClose={() => setDeleteTarget(null)}
         onConfirm={confirmDelete}
         title="Delete Branch"
         message="This action cannot be undone. The branch will be permanently deleted."
         itemName={deleteTarget?.name}
         isLoading={deleteLoadingIds.has(deleteTarget?.id ?? '')}
       />
    </div>
  );
}
