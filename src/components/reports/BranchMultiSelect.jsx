import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

/**
 * Searchable multi-select dropdown for branches.
 * Props:
 *   branches: [{id, name}]
 *   selected: string[]  (branch ids as strings)
 *   onChange: (ids: string[]) => void
 *   placeholder?: string
 */
export function BranchMultiSelect({ branches = [], selected = [], onChange, placeholder = "All Branches" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id) => {
    const sid = String(id);
    onChange(selected.includes(sid) ? selected.filter((s) => s !== sid) : [...selected, sid]);
  };

  const selectedNames = branches.filter((b) => selected.includes(String(b.id)));

  return (
    <div ref={ref} className="relative min-w-[180px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm transition-all
          ${open ? "border-blue-400 ring-2 ring-blue-100 bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}
      >
        <span className="flex-1 text-left truncate text-gray-700">
          {selectedNames.length === 0
            ? <span className="text-gray-400">{placeholder}</span>
            : selectedNames.length === 1
            ? selectedNames[0].name
            : `${selectedNames.length} branches`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Selected chips */}
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedNames.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              {b.name}
              <button onClick={(e) => { e.stopPropagation(); toggle(b.id); }} className="hover:text-blue-900">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search branches…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No branches found</p>
            ) : (
              filtered.map((b) => {
                const isSelected = selected.includes(String(b.id));
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50
                      ${isSelected ? "text-blue-700 font-medium" : "text-gray-700"}`}
                  >
                    <span>{b.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-600">
                Clear all ({selected.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
