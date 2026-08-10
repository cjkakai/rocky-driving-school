import { useState } from "react";
import { Eye, EyeOff, KeyRound, User, GitBranch, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../api/users.api";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleShow = (k) => setShow((p) => ({ ...p, [k]: !p[k] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await usersAPI.changePassword(form);
      toast.success("Password changed successfully");
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "old_password",     showKey: "old",     label: "Current Password",  placeholder: "Enter current password" },
    { key: "new_password",     showKey: "new",     label: "New Password",       placeholder: "Min. 6 characters" },
    { key: "confirm_password", showKey: "confirm", label: "Confirm Password",   placeholder: "Repeat new password" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(({ key, showKey, label, placeholder }) => (
        <div key={key}>
          <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
          <div className="relative">
            <input
              required
              type={show[showKey] ? "text" : "password"}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="button" onClick={() => toggleShow(showKey)} className="absolute right-3 top-2.5 text-gray-400">
              {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Update Password"}
      </button>
    </form>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Account Info</h2>
        <div>
          <InfoRow icon={User} label="Username" value={`@${user?.username}`} />
          {isSuperAdmin
            ? <InfoRow icon={ShieldCheck} label="Role" value="Super Admin" />
            : <InfoRow icon={GitBranch} label="Branch" value={user?.branch_name ?? "—"} />
          }
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Change Password</h2>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
