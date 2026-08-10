import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Loader2, AlertCircle, Save } from "lucide-react";
import { Btn, Input, Label, SearchableSelect } from "../ui";
import { studentsAPI } from "../api/students.api";
import request from "../api/client";

export function RegisterStudentForm({ branches, courses, currentUser, onClose, onSuccess, mode = "create", initialData = null }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    full_name: initialData?.full_name ?? "",
    phone:     initialData?.phone ?? "",
    id_number: initialData?.id_number ?? "",
    branch_id: initialData?.branch?.id
      ? String(initialData.branch.id)
      : currentUser?.role === "branch_user" ? String(currentUser.branch_id) : "",
  });
  const [courseDetails, setCourseDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCourses = Object.keys(courseDetails).map(Number);

  const toggleCourse = (id) => {
    setCourseDetails((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        const course = courses.find((c) => c.id === id);
        next[id] = { amount: course.amount, discount: "0", amount_agreed: String(course.amount) };
      }
      return next;
    });
  };

  const setCourseField = (id, field, value) =>
    setCourseDetails((prev) => {
      const current = prev[id];
      const updated = { ...current, [field]: value };
      if (field === "discount") {
        const course = courses.find((c) => c.id === id);
        const discountVal = parseFloat(value) || 0;
        updated.amount_agreed = String(Math.max(0, course.amount - discountVal));
      }
      return { ...prev, [id]: updated };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.branch_id) {
      setError("Full name, phone and branch are required.");
      return;
    }

    if (isEdit) {
      setLoading(true);
      setError("");
      try {
        await studentsAPI.update(initialData.id, {
          full_name: form.full_name,
          phone: form.phone,
          id_number: form.id_number,
          branch_id: Number(form.branch_id),
        });
        toast.success(`${form.full_name} updated successfully`);
        onSuccess?.();
        onClose();
      } catch (err) {
        toast.error(err.message || "Failed to update student.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }
    for (const id of selectedCourses) {
      const course = courses.find((c) => c.id === id);
      const detail = courseDetails[id];
      const discountVal = parseFloat(detail.discount) || 0;
      const maxDiscount = Number(course.max_discount ?? course.amount);
      if (discountVal > maxDiscount) {
        setError(`Discount exceeds maximum allowed (Ksh ${maxDiscount}) for ${course.class_name}.`);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const newStudent = await studentsAPI.create({
        ...form,
        branch_id: Number(form.branch_id),
        status: "active",
      });

      await Promise.all(
        selectedCourses.map((cid) =>
          request("/api/student-courses/", {
            method: "POST",
            body: JSON.stringify({
              student: newStudent.id,
              course: cid,
              amount_agreed: Number(courseDetails[cid].amount_agreed),
              discount: Number(courseDetails[cid].discount || 0),
            }),
          })
        )
      );
      toast.success(`${form.full_name} registered successfully`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to register student.");
    } finally {
      setLoading(false);
    }
  };

  const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }));
  const coursePickerOptions = courses
    .filter((c) => !courseDetails[c.id])
    .map((c) => ({ value: String(c.id), label: `${c.category} — ${c.class_name}` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div>
        <h3 className="font-bold text-gray-900 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "full_name", label: "Full Name", placeholder: "Enter full name" },
            { id: "phone", label: "Phone Number", placeholder: "07XX XXX XXX" },
            { id: "id_number", label: "ID Number", placeholder: "National ID" },
          ].map(({ id, label, placeholder }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <Input id={id} placeholder={placeholder} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} />
            </div>
          ))}
          <div>
            <Label>Branch</Label>
            <SearchableSelect
              value={form.branch_id}
              onChange={(v) => setForm({ ...form, branch_id: v })}
              options={branchOptions}
              placeholder="Select branch…"
              disabled={currentUser?.role === "branch_user"}
            />
          </div>
        </div>
        {isEdit ? (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700"><strong>Note:</strong> Admission number ({initialData?.admission_number}) cannot be changed.</p>
          </div>
        ) : (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700"><strong>Note:</strong> Admission number will be auto-generated on registration.</p>
          </div>
        )}
      </div>

      {!isEdit && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4">Course Selection & Fees</h3>
          {/* pb-52 gives the SearchableSelect dropdown room to open without being clipped */}
          <div className="space-y-4 pb-52">
            <div>
              <Label>Add Course</Label>
              <SearchableSelect
                value=""
                onChange={(v) => { if (v) toggleCourse(Number(v)); }}
                options={coursePickerOptions}
                placeholder="Select a course to add…"
              />
            </div>

            {selectedCourses.map((id) => {
              const course = courses.find((c) => c.id === id);
              if (!course) return null;
              return (
                <div key={id} className="border border-blue-200 bg-blue-50/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">{course.category} — {course.class_name}</span>
                    <button type="button" onClick={() => toggleCourse(id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`course_amount_${id}`}>Course Amount (Ksh)</Label>
                      <Input id={`course_amount_${id}`} type="number" value={course.amount} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label htmlFor={`discount_${id}`}>Discount (Ksh)</Label>
                      <Input
                        id={`discount_${id}`}
                        type="number"
                        min="0"
                        max={course.max_discount ?? course.amount}
                        placeholder="0"
                        value={courseDetails[id].discount}
                        onChange={(e) => setCourseField(id, "discount", e.target.value)}
                      />
                      {course.max_discount > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Max: Ksh {Number(course.max_discount).toLocaleString()}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`agreed_${id}`}>Agreed Amount (Ksh)</Label>
                      <Input id={`agreed_${id}`} type="number" value={courseDetails[id].amount_agreed} disabled className="bg-gray-100" />
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedCourses.length === 0 && (
              <p className="text-sm text-gray-400 italic">No courses selected yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" disabled={loading}>
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : isEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {loading ? (isEdit ? "Saving..." : "Registering...") : isEdit ? "Save Changes" : "Register Student"}
        </Btn>
      </div>
    </form>
  );
}
