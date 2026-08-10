import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, Input, Btn } from "../../ui";
import { paymentsAPI } from "../../api/payments.api";
import { fmt } from "../../utils/students.utils";

export function AllocateModal({ payment, onClose, onSuccess }) {
  const [ref, setRef] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef(null);

  const handleRefChange = (val) => {
    setRef(val);
    setSelected(null);
    setError("");
    clearTimeout(debounce.current);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await paymentsAPI.searchStudentCourse(val.trim());
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleAllocate = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await paymentsAPI.allocate(payment.id, selected.id);
      onSuccess();
    } catch (e) {
      setError(e.message || "Allocation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Allocate Payment" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Payment info */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Reference</p>
            <p className="font-mono text-sm font-semibold text-gray-800">
              {payment.payment_reference ?? payment.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Amount</p>
            <p className="text-sm font-bold text-green-700">{fmt(payment.amount)}</p>
          </div>
        </div>

        <Input
          placeholder="Search by reference or student name..."
          value={ref}
          onChange={(e) => handleRefChange(e.target.value)}
        />

        {searching && (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Searching...
          </div>
        )}

        {results.length > 0 && (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  selected?.id === r.id
                    ? "bg-blue-50 border-l-2 border-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.course_name}</p>
                <p className="font-mono text-xs text-blue-600 mt-0.5">{r.payment_reference}</p>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={handleAllocate} disabled={!selected || saving}>
            {saving && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
            Confirm Allocation
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
