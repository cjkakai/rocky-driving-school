import { Badge } from "../../ui";

// ─── Type config ───────────────────────────────────────────────────────────

export const TYPE_CONFIG = {
  REGISTRATION:     { label: "Registration",     color: "#2563eb", badgeVariant: "blue"   },
  TOP_UP:           { label: "Top-Up",           color: "#0d9488", badgeVariant: "green"  },
  RETAKE:           { label: "Retake",           color: "#f43f5e", badgeVariant: "red"    },
  PDL_REACTIVATION: { label: "PDL Reactivation", color: "#f59e0b", badgeVariant: "yellow" },
  UNALLOCATED:      { label: "Unallocated",      color: "#94a3b8", badgeVariant: "gray"   },
  CREDIT_TRANSFER:  { label: "Credit Transfer",  color: "#6366f1", badgeVariant: "blue"  },
};

export const HERO_ACCENTS = {
  revenue: {
    bg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    iconBg: "rgba(255,255,255,0.18)",
    shadow: "0 4px 20px rgba(5,150,105,0.28)",
  },
  total: {
    bg: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
    iconBg: "rgba(255,255,255,0.18)",
    shadow: "0 4px 14px rgba(37,99,235,0.35)",
  },
  completed: {
    bg: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    iconBg: "rgba(255,255,255,0.18)",
    shadow: "0 4px 20px rgba(8,145,178,0.28)",
  },
  orphaned: {
    bg: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    iconBg: "rgba(255,255,255,0.18)",
    shadow: "0 4px 20px rgba(225,29,72,0.28)",
  },
};

export const METHOD_LABELS = {
  coop_stk: "Co-op STK",
  bank_ipn: "Bank Transfer (IPN)",
  bank_b2b: "Bank (B2B)",
  bank:     "Bank",
};

// ─── Date cell ─────────────────────────────────────────────────────────────

export function DateCell({ iso }) {
  if (!iso) return <span className="text-gray-300">—</span>;
  const d = new Date(iso);
  return (
    <div>
      <p className="text-sm text-gray-800 font-medium tabular-nums">
        {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Nairobi" })}
      </p>
      <p className="text-xs text-gray-400 tabular-nums">
        {d.toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit", hour12: false,
          timeZone: "Africa/Nairobi",
        })}
      </p>
    </div>
  );
}

// ─── Badges ─────────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  if (status === "completed") return <Badge variant="green">Completed</Badge>;
  if (status === "orphaned")  return <Badge variant="red">Orphaned</Badge>;
  return <Badge variant="gray">{status}</Badge>;
}

export function PaymentTypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return <span className="text-gray-300">—</span>;
  return <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>;
}

// ─── Filter pills ──────────────────────────────────────────────────────────

export function PillGroup({ label, options, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
        {label}
      </span>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              active
                ? opt.activeClass
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Detail row (for modals) ───────────────────────────────────────────────

export function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="font-medium text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}
