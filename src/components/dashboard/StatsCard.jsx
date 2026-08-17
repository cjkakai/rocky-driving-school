export function StatsCard({ icon: Icon, label, value, subtext, gradient, accentColor, detail }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
      {/* Top color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accentColor }} />

      <div className="p-5">
        {/* Icon + label row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ background: `${accentColor}14`, color: accentColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Value */}
        <p className="text-3xl font-black text-gray-900 tracking-tight leading-none">{value ?? "—"}</p>

        {/* Subtext */}
        {subtext && (
          <p className="text-[11px] text-gray-400 mt-2 font-medium">{subtext}</p>
        )}
      </div>

      {/* Bottom detail strip */}
      {detail && (
        <div
          className="px-5 py-2.5 border-t flex items-center gap-1.5"
          style={{ borderColor: `${accentColor}18`, background: `${accentColor}06` }}
        >
          <span className="text-[11px] font-semibold" style={{ color: accentColor }}>{detail}</span>
        </div>
      )}
    </div>
  );
}
