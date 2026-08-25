from django.utils import timezone
from datetime import timedelta

PDL_VALIDITY_DAYS = 90
PDL_MIN_PAYMENT_PERCENT = 10

PDL_REACTIVATION_PENALTY = 3000
RETAKE_FAILURE_PENALTY = 3000

# Statuses that mean "still in progress" (not terminal)
ACTIVE_STATUSES = {
    "onboarded", "pending_pdl", "active",
    "pending_exam_booking", "exam_list", "exam_approved",
    "failed", "retake_booked",
}
DORMANT_STATUS = "dormant"
COMPLETED_STATUS = "completed"
# Both completed and transferred are terminal — course is no longer active
TERMINAL_STATUSES = {COMPLETED_STATUS, "transferred"}


# ── PDL helpers ───────────────────────────────────────────────────────────────

def get_course_pdl(student_course):
    """Return the latest approved PDL for this course, or None."""
    return student_course.pdl_bookings.filter(status="approved").order_by("-approved_at").first()


def get_current_pdl(student_course):
    return student_course.pdl_bookings.order_by("-approved_at", "-created_at").first()


def is_pdl_expired(pdl):
    if not pdl or not pdl.approved_at:
        return False
    return timezone.now() > pdl.approved_at + timedelta(days=PDL_VALIDITY_DAYS)


def check_and_apply_pdl_expiry(student_course):
    """
    On-demand expiry check for a single StudentCourse.
    If its PDL is expired and the course is in an active training state, set it → dormant.
    Returns True if expiry was applied.
    """
    if student_course.status not in ACTIVE_STATUSES:  # also excludes 'transferred'
        return False
    pdl = get_current_pdl(student_course)
    if pdl and pdl.status == "approved" and is_pdl_expired(pdl):
        student_course.status = DORMANT_STATUS
        student_course.save(update_fields=["status", "updated_at"])
        sync_student_status(student_course.student)
        return True
    return False


# ── Payment eligibility ───────────────────────────────────────────────────────

def has_min_payment(student_course):
    """True if this StudentCourse has paid >= 10% of amount_agreed."""
    agreed = student_course.amount_agreed or 0
    if agreed <= 0:
        return False
    paid = sum(p.amount for p in student_course.payments.filter(status="completed"))
    return paid / agreed >= PDL_MIN_PAYMENT_PERCENT / 100


def has_full_payment(student_course):
    """True if balance is cleared."""
    agreed = student_course.amount_agreed or 0
    paid = sum(p.amount for p in student_course.payments.filter(status="completed"))
    return agreed - paid <= 0


# ── PDL approval → course activation ─────────────────────────────────────────

def activate_course_on_pdl_approval(student_course):
    """Called when the PDL for a specific StudentCourse is approved. pending_pdl → active."""
    if student_course.status == "pending_pdl":
        student_course.status = "active"
        student_course.save(update_fields=["status", "updated_at"])
        sync_student_status(student_course.student)


# ── Payment-triggered transitions ─────────────────────────────────────────────

def on_payment_completed(student_course):
    """
    Called after a payment is recorded as completed.
    Only handles onboarded → pending_pdl / active transitions.
    active → pending_exam_booking is now triggered explicitly by branch via submit_for_exam.
    """
    sc = student_course
    if sc.status == "onboarded":
        if sc.course.is_refresher_course:
            if has_min_payment(sc):
                sc.status = "active"
                sc.save(update_fields=["status", "updated_at"])
                sync_student_status(sc.student)
        else:
            if has_min_payment(sc):
                sc.status = "pending_pdl"
                sc.save(update_fields=["status", "updated_at"])
                sync_student_status(sc.student)


# ── Student status aggregation ────────────────────────────────────────────────

def sync_student_status(student):
    """
    Derives student.status from StudentCourse statuses.

    OFFLOADED → all courses are completed or transferred (terminal)
    DORMANT   → all non-terminal courses are dormant (no active-state courses)
    ACTIVE    → at least one course is in an active/in-progress state
    """
    courses = list(student.student_courses.all())
    if not courses:
        new_status = "active"
    else:
        non_terminal = [sc for sc in courses if sc.status not in TERMINAL_STATUSES]
        if not non_terminal:
            new_status = "offloaded"
        elif all(sc.status == DORMANT_STATUS for sc in non_terminal):
            new_status = "dormant"
        else:
            new_status = "active"

    if student.status != new_status:
        student.status = new_status
        student.save(update_fields=["status", "updated_at"])


# ── Explicit lifecycle actions ────────────────────────────────────────────────

def apply_pdl_reactivation(sc):
    """Dormant → pending_pdl with reactivation penalty. Explicit user action only."""
    sc.amount_agreed = (sc.amount_agreed or 0) + PDL_REACTIVATION_PENALTY
    sc.status = "pending_pdl"
    sc.save(update_fields=["amount_agreed", "status", "updated_at"])
    sync_student_status(sc.student)


def apply_retake(sc):
    """
    FAILED → RETAKE_BOOKED with retake fee.
    Explicit user action only.
    """
    if sc.status != "failed":
        raise ValueError("Only failed courses can have a retake applied.")
    sc.amount_agreed = (sc.amount_agreed or 0) + RETAKE_FAILURE_PENALTY
    sc.status = "retake_booked"
    sc.save(update_fields=["amount_agreed", "status", "updated_at"])
    sync_student_status(sc.student)


def apply_exam_result(student_course, result):
    """
    Apply exam result to a StudentCourse.
    result: 'pass' | 'fail'
    Penalty is NOT added here — it is added only when the branch
    explicitly books a retake via apply_retake().
    """
    sc = student_course
    sc.exam_attempt_count = (sc.exam_attempt_count or 0) + 1
    sc.last_exam_result = result
    sc.status = COMPLETED_STATUS if result == "pass" else "failed"
    sc.save(update_fields=["status", "exam_attempt_count", "last_exam_result", "updated_at"])
    sync_student_status(sc.student)


def mark_refresher_completed(sc):
    """Manual completion for refresher courses."""
    if not sc.course.is_refresher_course:
        raise ValueError("Only refresher courses can be manually completed.")
    sc.status = COMPLETED_STATUS
    sc.save(update_fields=["status", "updated_at"])
    sync_student_status(sc.student)
