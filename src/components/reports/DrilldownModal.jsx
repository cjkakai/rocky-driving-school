import { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { reportsAPI } from "../../api/reports.api";
import { Modal } from "../../ui";
import { fmt, fmtDate } from "../../utils/students.utils";

const METRIC_LABELS = {
  student_registrations: "Student Registrations",
  student_course_registrations: "Course Enrollments",
  payments: "Payments",
  exam_bookings: "Exam Bookings",
  pdl_bookings: "PDL Bookings",
};

function TableShell({ headers, children, count }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-100">
            {headers.map((h) => (
              <th key={h} className="pb-2.5 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">{count} record{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

function StatusChip({ status, color = "blue" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    indigo: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[color] ?? styles.blue}`}>
      {status}
    </span>
  );
}

function RegistrationsTable({ rows }) {
  return (
    <TableShell headers={["Name", "Adm No.", "Status", "Registered"]} count={rows.length}>
      {rows.map((r) => (
        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
          <td className="py-2.5 pr-4 font-medium text-gray-800">{r.full_name}</td>
          <td className="py-2.5 pr-4 text-gray-500 font-mono text-xs">{r.admission_number}</td>
          <td className="py-2.5 pr-4"><StatusChip status={r.status} color="blue" /></td>
          <td className="py-2.5 text-gray-400 text-xs">{fmtDate(r.created_at)}</td>
        </tr>
      ))}
    </TableShell>
  );
}

function EnrollmentsTable({ rows }) {
  return (
    <TableShell headers={["Student", "Course", "Status", "Date"]} count={rows.length}>
      {rows.map((r) => (
        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
          <td className="py-2.5 pr-4 font-medium text-gray-800">{r.student__full_name}</td>
          <td className="py-2.5 pr-4 text-gray-600">{r.course__class_name}</td>
          <td className="py-2.5 pr-4"><StatusChip status={r.status} color="blue" /></td>
          <td className="py-2.5 text-gray-400 text-xs">{fmtDate(r.registration_date)}</td>
        </tr>
      ))}
    </TableShell>
  );
}

function PaymentsTable({ rows }) {
  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  return (
    <>
      <div className="mb-3 px-3 py-2 bg-green-50 border border-green-100 rounded-xl inline-flex items-center gap-2">
        <span className="text-xs text-green-600 font-medium">Total:</span>
        <span className="text-sm font-bold text-green-700">{fmt(total)}</span>
      </div>
      <TableShell headers={["Student", "Amount", "Reference", "Date"]} count={rows.length}>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-2.5 pr-4 font-medium text-gray-800">{r.student__full_name}</td>
            <td className="py-2.5 pr-4 font-bold text-green-700">{fmt(r.amount)}</td>
            <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs">{r.reference_code}</td>
            <td className="py-2.5 text-gray-400 text-xs">{fmtDate(r.created_at)}</td>
          </tr>
        ))}
      </TableShell>
    </>
  );
}

function BookingsTable({ rows, type }) {
  return (
    <TableShell
      headers={type === "exam_bookings" ? ["Student", "Exam", "Status", "Date"] : ["Student", "Status", "Date"]}
      count={rows.length}
    >
      {rows.map((r) => (
        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
          <td className="py-2.5 pr-4 font-medium text-gray-800">{r.student__full_name}</td>
          {type === "exam_bookings" && <td className="py-2.5 pr-4 text-gray-600">{r.exam__exam_name}</td>}
          <td className="py-2.5 pr-4"><StatusChip status={r.status} color="orange" /></td>
          <td className="py-2.5 text-gray-400 text-xs">{fmtDate(r.created_at)}</td>
        </tr>
      ))}
    </TableShell>
  );
}

export function DrilldownModal({ open, onClose, reportId, metric, courses }) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !reportId || !metric) return;
    setLoading(true);
    setSearch("");
    const extra = metric === "student_course_registrations" && courseFilter ? { course: courseFilter } : {};
    reportsAPI.drilldown(reportId, metric, extra)
      .then(setRawData)
      .catch(() => setRawData([]))
      .finally(() => setLoading(false));
  }, [open, reportId, metric, courseFilter]);

  const data = useMemo(() => {
    if (!search.trim()) return rawData;
    const q = search.toLowerCase();
    return rawData.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rawData, search]);

  const renderTable = () => {
    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
    if (!data.length) return <p className="text-center text-gray-400 py-12 text-sm">No records found.</p>;
    if (metric === "student_registrations") return <RegistrationsTable rows={data} />;
    if (metric === "student_course_registrations") return <EnrollmentsTable rows={data} />;
    if (metric === "payments") return <PaymentsTable rows={data} />;
    return <BookingsTable rows={data} type={metric} />;
  };

  return (
    <Modal open={open} onClose={onClose} title={METRIC_LABELS[metric] ?? "Details"} maxWidth="max-w-3xl">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        {metric === "student_course_registrations" && courses?.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        )}
      </div>
      {renderTable()}
    </Modal>
  );
}
