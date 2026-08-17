export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, gradient, right, badge }) {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between"
      style={{ background: gradient ?? "linear-gradient(135deg,#1a0608,#2c1417)" }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-extrabold text-white tracking-wide">{title}</span>
        {badge && (
          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
            {badge}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">{children}</p>
  );
}

export function StyledSelect({ value, onChange, children, accent }) {
  const base = "w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-all text-gray-700 bg-white";
  const ring = accent
    ? "border-red-200 focus:ring-[#c41820]/40"
    : "border-gray-200 focus:ring-[#c41820]/30 bg-gray-50/60";
  return (
    <select className={`${base} ${ring}`} value={value} onChange={onChange}>
      {children}
    </select>
  );
}
