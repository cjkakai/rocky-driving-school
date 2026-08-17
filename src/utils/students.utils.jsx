import { Badge } from "../ui";

/* ─── Formatters ─────────────────────────────────────────────────── */
export const fmt     = (n) => `Ksh ${Number(n || 0).toLocaleString()}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { timeZone: "Africa/Nairobi" }) : "—");
export const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Nairobi",
  });
};

/* ─── Financial helpers ──────────────────────────────────────────── */
export const isActiveCourse = (sc) => sc.status !== "transferred";

export function computeTotals(student) {
  // Exclude transferred courses — they are financially settled and must not
  // inflate Amount Agreed, Progress, or Balance on active registrations.
  const courses = (student.student_courses ?? []).filter(isActiveCourse);
  const agreedTotal = courses.reduce((s, sc) => s + Number(sc.amount_agreed || 0), 0);
  const paidTotal = courses.reduce((s, sc) => {
    const completed = (sc.payments ?? []).filter((p) => p.status === "completed");
    return s + completed.reduce((a, p) => a + Number(p.amount || 0), 0);
  }, 0);
  const balance = agreedTotal - paidTotal;
  const progress = agreedTotal > 0 ? (paidTotal / agreedTotal) * 100 : 0;
  const paymentStatus = balance <= 0 && agreedTotal > 0 ? "Paid" : paidTotal > 0 ? "Partial" : "Unpaid";
  return { agreedTotal, paidTotal, balance, progress, paymentStatus };
}

export function hasMinPayment(student) {
  return (student.student_courses ?? []).some((sc) => {
    const agreed = Number(sc.amount_agreed || 0);
    if (agreed <= 0) return false;
    const paid = (sc.payments ?? [])
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return paid / agreed >= 0.1;
  });
}

export function computeCourseBalance(sc) {
  const agreed = Number(sc.amount_agreed || 0);
  const paid = (sc.payments ?? [])
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  return { agreed, paid, balance: agreed - paid };
}

/* ─── Course status config — single source of truth ─────────────── */
//
// `color`    — primary solid color used in pipeline bars, legends, dots
// `from/to`  — gradient pair used in CourseCard headers (ExpandedRow)
// `ring`     — Tailwind ring class for CourseCard border
// `variant`  — Badge variant
// `label`    — human-readable display name
//
// Add new statuses here; ExpandedRow and StudentSummary both derive
// from this map — no more duplicate color definitions.
//
export const COURSE_STATUS_CONFIG = {
  onboarded: {
    label: "Onboarded",     short: "Onboard",
    variant: "gray",
    color: "#64748b",       from: "#64748b", to: "#475569",
    ring: "ring-slate-200",
  },
  pending_pdl: {
    label: "Pending PDL",   short: "PDL",
    variant: "yellow",
    color: "#d97706",       from: "#d97706", to: "#b45309",
    ring: "ring-amber-200",
  },
  active: {
    label: "Active",        short: "Active",
    variant: "green",
    color: "#2563eb",       from: "#2563eb", to: "#1d4ed8",
    ring: "ring-blue-200",
  },
  pending_exam_booking: {
    label: "Pending Exam",  short: "Pending",
    variant: "blue",
    color: "#0891b2",       from: "#0891b2", to: "#0e7490",
    ring: "ring-cyan-200",
  },
  exam_booked: {
    label: "Exam List",     short: "Listed",
    variant: "blue",
    color: "#f5c400",       from: "#f5c400", to: "#d4a800",
    ring: "ring-yellow-200",
  },
  exam_approved: {
    label: "Exam Approved", short: "Approved",
    variant: "blue",
    color: "#ffd700",       from: "#ffd700", to: "#f5c400",
    ring: "ring-yellow-200",
  },
  failed: {
    label: "Failed",        short: "Failed",
    variant: "red",
    color: "#dc2626",       from: "#dc2626", to: "#b91c1c",
    ring: "ring-red-200",
  },
  retake_booked: {
    label: "Retake Booked", short: "Retake",
    variant: "orange",
    color: "#ea580c",       from: "#ea580c", to: "#c2410c",
    ring: "ring-orange-200",
  },
  completed: {
    label: "Completed",     short: "Done",
    variant: "blue",
    color: "#333333",       from: "#333333", to: "#111111",
    ring: "ring-gray-200",
  },
  transferred: {
    label: "Transferred",   short: "Transferred",
    variant: "gray",
    color: "#94a3b8",       from: "#94a3b8", to: "#64748b",
    ring: "ring-slate-200",
  },
  dormant: {
    label: "Dormant",       short: "Dormant",
    variant: "orange",
    color: "#475569",       from: "#475569", to: "#334155",
    ring: "ring-slate-200",
  },
};

// Default fallback for unknown statuses
const COURSE_STATUS_DEFAULT = {
  label: "—",    short: "—",
  variant: "gray",
  color: "#94a3b8", from: "#333333", to: "#111111",
  ring: "ring-gray-100",
};

/** Look up a status entry, falling back to the default. */
export function getCourseStatus(status) {
  return COURSE_STATUS_CONFIG[status] ?? COURSE_STATUS_DEFAULT;
}

/**
 * Ordered pipeline stages for the StudentSummary chart.
 * Progress states first (left→right), exception states after.
 * Import this in StudentSummary instead of defining a local array.
 */
export const PIPELINE_STAGES = [
  "onboarded",
  "pending_pdl",
  "active",
  "pending_exam_booking",
  "exam_booked",
  "exam_approved",
  "completed",
  "dormant",
  "failed",
  "retake_booked",
].map((key) => ({ key, ...COURSE_STATUS_CONFIG[key] }));

/* ─── Booking badges ─────────────────────────────────────────────── */
const BOOKING_BADGE = {
  approved:  <Badge variant="green">Approved</Badge>,
  confirmed: <Badge variant="green">Confirmed</Badge>,
  pending:   <Badge variant="yellow">Pending Approval</Badge>,
  rejected:  <Badge variant="red">Rejected</Badge>,
  completed: <Badge variant="blue">Completed</Badge>,
  sat:       <Badge variant="blue">Sat</Badge>,
  cancelled: <Badge variant="gray">Cancelled</Badge>,
};
const NOT_BOOKED = <Badge variant="gray">Not Booked</Badge>;

export const pdlBadge  = (status) => BOOKING_BADGE[status] ?? NOT_BOOKED;
export const examBadge = (status) => BOOKING_BADGE[status] ?? NOT_BOOKED;

export const paymentBadge = (status) => {
  if (status === "Paid")    return <Badge variant="green">Paid</Badge>;
  if (status === "Partial") return <Badge variant="yellow">Partial</Badge>;
  return <Badge variant="red">Unpaid</Badge>;
};

/* ─── Student-level status badge ─────────────────────────────────── */
// Student status is separate from course status — it reflects
// the student's overall account standing, not any specific course.
const STUDENT_STATUS_VARIANT = {
  active:   "green",
  dormant:  "orange",
};

export const studentStatusBadge = (status) => (
  <Badge variant={STUDENT_STATUS_VARIANT[status] ?? "gray"}>
    {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
  </Badge>
);

/* ─── Course status badge ────────────────────────────────────────── */
export const courseStatusBadge = (status) => {
  const cfg = getCourseStatus(status);
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

/* ─── PDL state badge ────────────────────────────────────────────── */
const PDL_STATE_VARIANT = { active: "green", expired: "red", pending: "yellow", none: "gray" };

export const pdlStateBadge = (state) => (
  <Badge variant={PDL_STATE_VARIANT[state] ?? "gray"}>
    PDL: {state ?? "none"}
  </Badge>
);

/* ─── Course progress summary (for student table rows) ───────────── */
/**
 * Builds a human-readable course progress summary.
 * e.g. "1 Active • 1 Pending PDL"
 */
export function buildCourseProgressSummary(student) {
  const courses = student.student_courses ?? [];
  if (courses.length === 0) return "No courses";

  const counts = {};
  for (const sc of courses) {
    const label = getCourseStatus(sc.status).label;
    counts[label] = (counts[label] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([label, count]) => `${count} ${label}`)
    .join(" • ");
}