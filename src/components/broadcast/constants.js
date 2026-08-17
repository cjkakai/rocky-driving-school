export const STATUS_OPTIONS = ["active", "dormant", "offloaded"];
export const COURSE_STATUS_OPTIONS = [
  "onboarded", "pending_pdl", "active", "pending_exam_booking",
  "exam_list", "exam_approved", "failed", "retake_booked", "completed", "dormant",
];
export const PDL_DAYS_OPTIONS = ["7", "15", "30"];
export const PAGE_SIZE = 50;

export const EXAM_RESULT_OPTIONS = [
  { value: "",     label: "All Results" },
  { value: "PASS", label: "Passed" },
  { value: "FAIL", label: "Failed" },
];

export const TEMPLATES = [
  { id: "welcome", label: "👋 Welcome",         text: "Welcome to Rocky Driving School 🚗\nWe wish you success in your training!" },
  { id: "payment", label: "💰 Payment Reminder", text: "Reminder: Your balance is KES [AMOUNT]. Kindly clear to proceed with exam booking.\nPaybill: 400222\nAccount: [REF]" },
  { id: "exam",    label: "📅 Exam Reminder",    text: "Your exam is scheduled soon. Please ensure you're prepared and arrive on time. Good luck!" },
  { id: "pdl",     label: "⚠️ PDL Expiry",       text: "Alert ⚠️\nYour PDL expires in 30 days. A penalty of KES 3,000 may apply. Kindly book early." },
];

export const STATUS_STYLES = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  dormant:   "bg-slate-100 text-slate-500 border-slate-200",
  offloaded: "bg-gray-100 text-gray-500 border-gray-200",
};

export const BRAND      = "#c41820";
export const BRAND_DARK = "#8f1017";
export const INK_FROM   = "#1a0608";
export const INK_TO     = "#2c1417";

export const STEPS = [
  { n: 1, label: "Audience" },
  { n: 2, label: "Message" },
  { n: 3, label: "Review & Send" },
];

export const titleCase = (s) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
