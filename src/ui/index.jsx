import { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2 } from "lucide-react";
export { DeleteConfirmModal } from "./DeleteConfirmModal";
export { SearchableSelect } from "./SearchableSelect";

export function Badge({ children, variant, tone }) {
  // tone prop (success/warning/danger/info/neutral) takes precedence over legacy variant
  const toneStyles = {
    success: "bg-green-100 text-green-700 border border-green-300",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    danger:  "bg-red-100 text-red-700 border border-red-300",
    info:    "bg-blue-100 text-blue-700 border border-blue-300",
    neutral: "bg-gray-100 text-gray-600 border border-gray-300",
  };
  const variantStyles = {
    green:  "bg-green-100 text-green-700 border border-green-300",
    yellow: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    red:    "bg-red-100 text-red-700 border border-red-300",
    blue:   "bg-blue-100 text-blue-700 border border-blue-300",
    gray:   "bg-gray-100 text-gray-600 border border-gray-300",
    orange: "bg-orange-100 text-orange-700 border border-orange-300",
  };
  const cls = tone ? (toneStyles[tone] ?? toneStyles.neutral) : (variantStyles[variant] ?? variantStyles.gray);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct === 100 ? "bg-green-500" : pct > 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500">{Math.round(pct)}%</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto z-10`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Select({ value, onChange, placeholder, children, className = "", ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors appearance-none cursor-pointer ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors placeholder-gray-400 ${className}`}
      {...props}
    />
  );
}

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

const BTN_BASE = "inline-flex items-center gap-2 font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SIZES = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2 text-sm", lg: "px-6 py-2.5 text-sm" };
const BTN_VARIANTS = {
  primary: "bg-[#E30613] hover:bg-[#c40510] text-white focus:ring-red-300 shadow-sm",
  outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
  green: "bg-white border border-green-500 text-green-700 hover:bg-green-50 focus:ring-green-200",
  danger: "bg-[#E30613] hover:bg-[#c40510] text-white focus:ring-red-300 shadow-sm",
  ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-200",
};

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BTN_BASE} ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, variant = "success") => {
    setToast({ message, variant });
  }, []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}

export function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [toast, onHide]);

  if (!toast) return null;

  const styles = {
    success: "bg-green-600",
    error: "bg-red-600",
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium animate-fade-in ${styles[toast.variant] ?? styles.success}`}>
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      {toast.message}
      <button onClick={onHide} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
