import { computeCourseBalance } from "./students.utils";

export const MIN_PAYMENT_RATIO_FOR_PDL = 0.1;

export function pdlBlockedReason(sc) {
  if (sc.is_refresher_course) return "Refresher courses skip PDL.";
  const { agreed, paid } = computeCourseBalance(sc);
  if (agreed <= 0) return "Course agreement missing.";
  if (paid / agreed < MIN_PAYMENT_RATIO_FOR_PDL)
    return `Pay at least ${Math.round(MIN_PAYMENT_RATIO_FOR_PDL * 100)}% to book PDL`;
  return null;
}

export function canBookPdl(sc) {
  if (sc.is_refresher_course) return false;
  return (
    sc.status === "pending_pdl" &&
    (sc.pdl_state === "none" || sc.pdl_state === "expired") &&
    pdlBlockedReason(sc) === null
  );
}

export function canBookExam(sc) {
  if (sc.is_refresher_course) return false;
  const { balance } = computeCourseBalance(sc);
  return (
    (sc.status === "pending_exam_booking" || sc.status === "retake_booked") &&
    balance <= 0
  );
}

export function examBlockedReason(sc) {
  if (!["pending_exam_booking", "retake_booked"].includes(sc.status)) return null;
  const { balance } = computeCourseBalance(sc);
  if (balance > 0) return "Clear balance to book exam";
  return null;
}

export function pendingApprovals(student) {
  const courses = student?.student_courses ?? [];
  const pdlCourse  = courses.find((sc) => sc.pdl_state === "pending" && sc.pending_pdl_booking_id);
  const examCourse = courses.find((sc) => sc.exam_booking?.status === "pending");
  return {
    pdlBookingId:  pdlCourse?.pending_pdl_booking_id,
    examBookingId: examCourse?.exam_booking?.id,
  };
}

export function adminPrimaryAction(student) {
  const { pdlBookingId, examBookingId } = pendingApprovals(student);
  if (pdlBookingId)  return { kind: "approve-pdl",  label: "Approve PDL",  resourceId: pdlBookingId };
  if (examBookingId) return { kind: "approve-exam", label: "Approve Exam", resourceId: examBookingId };
  if (student?.status === "offloaded") return { kind: "enroll", label: "Enroll" };
  return { kind: "none", label: "—" };
}

export function branchPrimaryAction(student) {
  if (student?.status === "offloaded") return { kind: "enroll", label: "Enroll" };
  const courses = student?.student_courses ?? [];
  if (courses.some((sc) => sc.status === "pending_pdl"))
    return { kind: "book-pdl", label: "Book PDL" };
  if (courses.some((sc) => sc.status === "pending_exam_booking" || sc.status === "retake_booked"))
    return { kind: "book-exam", label: "Book Exam" };
  if (courses.some((sc) => sc.status === "dormant"))
    return { kind: "reactivate", label: "Reactivate" };
  return { kind: "none", label: "—" };
}

export function aggregateExamStatus(courses) {
  const bookings = (courses ?? []).map((sc) => sc.exam_booking).filter(Boolean);
  if (bookings.some((e) => e.status === "confirmed")) return { tone: "success", label: "Confirmed" };
  if (bookings.some((e) => e.status === "pending"))   return { tone: "warning", label: "Pending" };
  return { tone: "neutral", label: "—" };
}
