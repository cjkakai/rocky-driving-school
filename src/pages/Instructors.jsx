import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, UserX, UserCheck, Phone, BadgeCheck, Building2 } from "lucide-react";
import { Btn, Badge, Modal, Input, Label, Select, Toast, useToast } from "../ui";
import { instructorsAPI } from "../api/lessons.api";
import { branchesAPI } from "../api/branches.api";
import { useAuth } from "../context/AuthContext";

function InstructorModal({ open, onClose, onSaved, instructor, branches }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [form, setForm] = useState({ full_name: "", phone: "", licence_number: "", branch: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        full_name: instructor?.full_name ?? "",
        phone: instructor?.phone ?? "",
        licence_number: instructor?.licence_number ?? "",
        branch: instructor?.branch ?? (isAdmin ? "" : user?.branch_id ?? ""),
      });
      setError("");
    }
  }, [open, instructor, isAdmin, user]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    if (isAdmin && !form.branch) { setError("Branch is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, branch: form.branch || user?.branch_id };
      if (instructor) {
        await instructorsAPI.update(instructor.id, payload);
      } else {
        await instructorsAPI.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const data = await err?.response?.json?.().catch(() => null);
      setError(data ? Object.values(data).flat().join(" ") : "Failed to save instructor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={instructor ? "Edit Instructor" : "Add Instructor"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} placeholder="e.g. Morris Odhiambo" autoFocus />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="e.g. 0712 345 678" />
        </div>
        <div>
          <Label htmlFor="licence_number">Licence / ID Number</Label>
          <Input id="licence_number" value={form.licence_number} onChange={(e) => set("licence_number")(e.target.value)} placeholder="e.g. 387795154" />
        </div>
        {isAdmin && (
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select id="branch" value={form.branch} onChange={set("branch")} placeholder="Select branch">
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose} type="button">Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? "Saving…" : instructor ? "Save Changes" : "Add Instructor"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function DeactivateModal({ open, onClose, onConfirm, instructor }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };
  return (
    <Modal open={open} onClose={onClose} title="Deactivate Instructor" maxWidth="max-w-sm">
      <p className="text-sm text-gray-600 mb-6">
        Deactivate <span className="font-semibold">{instructor?.full_name}</span>? They will no longer appear in lesson dropdowns but their lesson history is preserved.
      </p>
      <div className="flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={handle} disabled={loading}>{loading ? "Deactivating…" : "Deactivate"}</Btn>
      </div>
    </Modal>
  );
}

export default function Instructors() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [instructors, setInstructors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const { toast, show, hide } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (showInactive) params.include_inactive = "true";
    Promise.all([
      instructorsAPI.getAll(params),
      isAdmin ? branchesAPI.getAll() : Promise.resolve([]),
    ])
      .then(([iRes, bRes]) => {
        setInstructors(Array.isArray(iRes) ? iRes : iRes.results ?? []);
        setBranches(Array.isArray(bRes) ? bRes : bRes.results ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [showInactive, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (msg) => { load(); show(msg); };

  const handleDeactivate = async () => {
    await instructorsAPI.delete(deactivateTarget.id);
    setDeactivateTarget(null);
    load();
    show("Instructor deactivated");
  };

  const handleReactivate = async (instructor) => {
    await instructorsAPI.update(instructor.id, { is_active: true });
    load();
    show(`${instructor.full_name} reactivated`);
  };

  const filtered = instructors.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.full_name.toLowerCase().includes(q) || i.phone?.includes(q) || i.licence_number?.toLowerCase().includes(q);
    const matchBranch = !branchFilter || String(i.branch) === branchFilter;
    return matchSearch && matchBranch;
  });

  const active = filtered.filter((i) => i.is_active);
  const inactive = filtered.filter((i) => !i.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 to-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdmin ? "All branches" : user?.branch_name} · {active.length} active instructor{active.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowInactive((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                showInactive ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </button>
          )}
          <Btn onClick={() => { setEditTarget(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Instructor
          </Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, licence…"
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 w-64"
        />
        {isAdmin && branches.length > 0 && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 appearance-none cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading instructors…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">No instructors found</p>
            <p className="text-gray-400 text-sm mt-1">Add the first instructor to get started.</p>
            <Btn className="mt-4" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Instructor
            </Btn>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Instructor</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Licence / ID</th>
                {isAdmin && <th className="text-left px-5 py-3 font-semibold text-gray-600">Branch</th>}
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...active, ...inactive].map((instructor) => (
                <tr key={instructor.id} className={`hover:bg-gray-50/50 transition-colors ${!instructor.is_active ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-700">
                          {instructor.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{instructor.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {instructor.phone ? (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{instructor.phone}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {instructor.licence_number ? (
                      <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-gray-400" />{instructor.licence_number}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" />{instructor.branch_name ?? "—"}</span>
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <Badge tone={instructor.is_active ? "success" : "neutral"}>
                      {instructor.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditTarget(instructor); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {instructor.is_active ? (
                        <button
                          onClick={() => setDeactivateTarget(instructor)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Deactivate"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(instructor)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          title="Reactivate"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InstructorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSaved={() => handleSaved(editTarget ? "Instructor updated" : "Instructor added")}
        instructor={editTarget}
        branches={branches}
      />
      <DeactivateModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        instructor={deactivateTarget}
      />
      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
