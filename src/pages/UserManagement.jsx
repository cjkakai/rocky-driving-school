import { useEffect, useState } from "react";
import { UserPlus, Trash2, Power, X, Eye, EyeOff, Loader2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { usersAPI } from "../api/users.api";
import { branchesAPI } from "../api/branches.api";
import { DeactivateConfirmModal } from "../ui/DeactivateConfirmModal";

const ROLE_LABELS = { super_admin: "Super Admin", branch_user: "Branch User" };

function CreateUserModal({ branches, onClose, onCreated }) {
  const [form, setForm] = useState({ username: "", phone_number: "", password: "", role: "branch_user", branch: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        username: form.username,
        phone_number: form.phone_number,
        password: form.password,
        role: form.role,
        ...(form.role === "branch_user" ? { branch: form.branch } : { email: form.email }),
      };
      const created = await usersAPI.create(payload);
      toast.success(`User "${created.username}" created`);
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Modal */}
    <div className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">
            Create User
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add a new system user
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(90vh-80px)]"
      >
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Username
            </label>
            <input
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              placeholder="e.g. john_doe"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Phone Number
            </label>
            <input
              required
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              placeholder="e.g. 0712345678"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used for password reset OTP.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Default Password
            </label>

            <div className="relative">
              <input
                required
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 sm:py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="Min. 6 characters"
              />

              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              User should change this after first login.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            >
              <option value="branch_user">Branch User</option>
            </select>
          </div>

          {/* Branch */}
          {form.role === "branch_user" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Branch
              </label>
              <select
                required
                value={form.branch}
                onChange={(e) => set("branch", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 sm:py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 rounded-xl border border-gray-200 py-3 sm:py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 rounded-xl bg-primary text-white py-3 sm:py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoadingIds, setDeleteLoadingIds] = useState(new Set());

  useEffect(() => {
    Promise.all([usersAPI.getAll(), branchesAPI.getAll()])
      .then(([u, b]) => { setUsers(u); setBranches(b); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (user) => {
    setDeleteTarget(user);
  };

   const confirmDelete = async () => {
      if (!deleteTarget) return;
      setDeleteLoadingIds(prev => new Set(prev).add(deleteTarget.id));
      try {
        await usersAPI.delete(deleteTarget.id);
        setUsers((p) =>
          p.map((u) => (u.id === deleteTarget.id ? { ...u, is_active: false } : u))
        );
        toast.success(`User "${deleteTarget.username}" deactivated`);
        setDeleteTarget(null);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setDeleteLoadingIds(prev => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users and their access</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/sessions"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Clock className="w-4 h-4" />
            View Sessions
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            New User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Username", "Phone", "Role", "Branch", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">@{u.username}</td>
                  <td className="px-5 py-3.5 text-gray-600">{u.phone_number || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{u.branch_name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold ${u.is_active ? "text-green-600" : "text-red-600"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.is_active ? (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deleteLoadingIds.has(u.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                         <Power size={18} />
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateUserModal
          branches={branches}
          onClose={() => setShowModal(false)}
          onCreated={(u) => setUsers((p) => [...p, u])}
        />
      )}

       <DeactivateConfirmModal
         open={!!deleteTarget}
         onClose={() => setDeleteTarget(null)}
         onConfirm={confirmDelete}
         title="Deactivate User"
         message="This action cannot be undone. The user account will be permanently deactivated."
         itemName={deleteTarget?.username}
         isLoading={deleteLoadingIds.has(deleteTarget?.id ?? '')}
       />
    </div>
  );
}
