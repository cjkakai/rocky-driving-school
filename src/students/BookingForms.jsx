import { useState } from "react";
import { Calendar, FileText, Loader2, AlertCircle } from "lucide-react";
import { Btn, Input, Label, Select } from "../ui";
import { pdlAPI } from "../api/pdl.api";
import { examsAPI } from "../api/exams.api";
import { fmtDate } from "../utils/students.utils";

function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />{message}
    </div>
  );
}

function FormActions({ onClose, loading, loadingLabel, label, icon: Icon }) {
  return (
    <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
      <Btn variant="outline" onClick={onClose}>Cancel</Btn>
      <Btn type="submit" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        {loading ? loadingLabel : label}
      </Btn>
    </div>
  );
}

export function BookPDLForm({ student, currentUser, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) { setError("Please select a booking date."); return; }
    setLoading(true);
    try {
      await pdlAPI.create({ student: student.id, booking_date: date });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to book PDL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError message={error} />
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        Booking PDL for <strong>{student.full_name}</strong>. This will be sent for admin approval.
      </div>
      <div>
        <Label htmlFor="pdl_date">PDL Booking Date</Label>
        <Input id="pdl_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
      </div>
      <FormActions onClose={onClose} loading={loading} loadingLabel="Booking..." label="Book PDL" icon={Calendar} />
    </form>
  );
}

export function BookExamForm({ student, exams, currentUser, onClose, onSuccess }) {
  const [examId, setExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examId) { setError("Please select an exam date."); return; }
    setLoading(true);
    try {
      await examsAPI.create({ student: student.id, exam: Number(examId) });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to book exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError message={error} />
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <strong>{student.full_name}</strong> has an approved PDL and is ready for exam booking.
      </div>
      <div>
        <Label>Select Exam Date</Label>
        <Select value={examId} onChange={setExamId} placeholder="Choose an exam date">
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>{fmtDate(ex.exam_date)} — {ex.test_center}</option>
          ))}
        </Select>
      </div>
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
        <strong>Note:</strong> Booking will be sent to Super Admin for approval.
      </div>
      <FormActions onClose={onClose} loading={loading} loadingLabel="Booking..." label="Book Exam" icon={FileText} />
    </form>
  );
}
