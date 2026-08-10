export function MiniProgress({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: "rgba(255,255,255,0.9)" }}
      />
    </div>
  );
}
