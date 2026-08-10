import csv
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from academics.models import Course, StudentCourse
from students.models import Student
from students.lifecycle import sync_student_status
from finance.models import PaymentTransaction
from branches.models import Branch
from django.db import transaction
from students.views import generate_admission_number

from datetime import datetime
from contextlib import contextmanager
from django.utils import timezone
from django.db.models.signals import post_save


@contextmanager
def signals_disabled():
    from sms.signals import on_student_course_created
    from finance.signals import payment_transaction_post_save
    from academics.models import StudentCourse
    from finance.models import PaymentTransaction
    post_save.disconnect(on_student_course_created, sender=StudentCourse)
    post_save.disconnect(payment_transaction_post_save, sender=PaymentTransaction)
    try:
        yield
    finally:
        post_save.connect(on_student_course_created, sender=StudentCourse)
        post_save.connect(payment_transaction_post_save, sender=PaymentTransaction)


# Second-pass import: only DORMANT, INACTIVE, PDL EXPIRED rows.
# ACTIVE and blank were already imported in the first pass.
# The existing-in-DB guard ensures already-imported students are skipped cleanly.
IMPORT_AS_DORMANT = {"DORMANT"}     # all dormant variants normalise here

# All of these normalise to DORMANT — student is imported with dormant status
# so the reactivation button renders in the UI.
# The KES 3,000 penalty is only applied when the branch clicks Reactivate.
STATUS_NORMALISATION = {
    # Dormant variants and misspellings
    "DORMANT":      "DORMANT",
    "DOMAD":        "DORMANT",
    "DOMANT":       "DORMANT",
    "DOAMNT":       "DORMANT",
    "DOMAINT":      "DORMANT",
    "DORAMT":       "DORMANT",
    "DORAMENT":     "DORMANT",
    "DORAMNT":      "DORMANT",
    "DORMAMT":      "DORMANT",
    "DORMNAT":      "DORMANT",
    "IN ACTIVE":    "DORMANT",
    "INACTIVE":     "DORMANT",
    "IN-ACTIVE":    "DORMANT",
    # PDL expired — same treatment as dormant
    "PDL EXPIRED":  "DORMANT",
    "PDL EXPERED":  "DORMANT",
    "PDL EXPRED":   "DORMANT",
    "PDL EXPIRY":   "DORMANT",
    "PDL EXPIRE":   "DORMANT",
    "PDL-EXPIRED":  "DORMANT",
    "PDLEXPIRED":   "DORMANT",
    # Completed variants
    "COMPLETED":    "COMPLETED",
    "TESTED":       "COMPLETED",  # Ruiru branch
    "COMPLETE":     "COMPLETED",
    "COMPLTED":     "COMPLETED",
    "COMPLETD":     "COMPLETED",
    # Offloaded variants
    "OFFLOADED":    "OFFLOADED",
    "0FFLOADED":    "OFFLOADED",
    "OFFLOAED":     "OFFLOADED",
    "OFFFLOADED":   "OFFLOADED",
    "OFFLOOADED":   "OFFLOADED",
    "OFLOADED":     "OFFLOADED",
}


def normalise_status(raw: str) -> str:
    cleaned = str(raw).strip().upper()
    return STATUS_NORMALISATION.get(cleaned, cleaned)


def clean_datetime(date_str):
    """
    Converts various date formats into a timezone-aware datetime.

    Supported formats:
    - 28/4/2026  or  28/04/2026   (DD/M/YYYY — standard local format)
    - 2026-08-04 0:00:00          (YYYY-DD-MM — Excel export quirk)
    - 2026-08-04                  (YYYY-DD-MM — Excel export quirk)
    """
    if not date_str:
        return None

    date_str = str(date_str).strip()

    # Fix stray double-slashes e.g. "29//3/2023"
    while "//" in date_str:
        date_str = date_str.replace("//", "/")

    # DD/MM/YYYY — standard local format
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return timezone.make_aware(datetime.strptime(date_str, fmt))
        except ValueError:
            pass

    # YYYY-DD-MM — Excel quirk (year first, then day, then month)
    date_part = date_str.split(" ")[0]
    try:
        year, day, month = date_part.split("-")
        y, d, m = int(year), int(day), int(month)
        if 1 <= m <= 12 and 1 <= d <= 31 and 2000 <= y <= 2100:
            return timezone.make_aware(datetime(y, m, d))
    except (ValueError, TypeError):
        pass

    # Last resort: YYYY-MM-DD ISO order
    try:
        year, month, day = date_part.split("-")
        y, m, d = int(year), int(month), int(day)
        if 1 <= m <= 12 and 1 <= d <= 31 and 2000 <= y <= 2100:
            return timezone.make_aware(datetime(y, m, d))
    except (ValueError, TypeError):
        pass

    return None  # caller falls back to timezone.now()


def to_decimal(value, default=Decimal("0")):
    """Safely convert a CSV string value to Decimal."""
    try:
        cleaned = str(value).strip().replace(",", "")
        if not cleaned:
            return default
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return default


def is_valid_row(row):
    """
    True only for real student rows.
    Rejects subtotal rows, blank rows, and header-repeat rows.
    """
    name   = str(row.get("name",   "")).strip()
    course = str(row.get("course", "")).strip()

    if not name or not course:
        return False

    if name.upper() in ("NAME", "NAMES", "STUDENT NAME", "STUDENT'S NAME"):
        return False

    return True


def get_course_name(course_str: str) -> tuple:
    """
    Returns (display_name, is_refresher).
    Any course string containing REF / REFF / REFRESHER maps to REFRESHER.
    """
    upper = course_str.strip().upper()
    is_refresher = any(token in upper for token in ("REF", "REFRESHER", "REFF"))
    return ("REFRESHER", True) if is_refresher else (course_str.strip(), False)


class Command(BaseCommand):
    help = "Import historical student data from a branch MERGED_DATA.csv file."

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to the CSV file.")
        parser.add_argument("branch", type=str, help="Branch code (e.g. ZIM, JUJ).")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report without writing to the database.",
        )

    def handle(self, *args, **options):
        csv_file_path = options["csv_file"]
        branch_code = options["branch"]
        dry_run = options["dry_run"]

        if not os.path.exists(csv_file_path):
            raise CommandError(f"File does not exist: {csv_file_path}")

        try:
            branch = Branch.objects.get(branch_code=branch_code)
        except Branch.DoesNotExist:
            raise CommandError(f"Branch with code '{branch_code}' not found.")

        self.stdout.write(self.style.NOTICE(
            f"{'[DRY RUN] ' if dry_run else ''}Opening: {csv_file_path} — Branch: {branch.name}"
        ))

        with open(csv_file_path, mode="r", encoding="utf-8") as f:
            reader = list(csv.DictReader(f))

        # ── Pass 1: build course cache ────────────────────────────────────────
        # Scan all valid rows once to ensure every course exists before
        # we start creating students. Avoids repeated per-row DB lookups.
        course_cache = {}   # display_name -> Course instance
        courses_to_update = []

        for row in reader:
            if not is_valid_row(row):
                continue
            display_name, is_refresher = get_course_name(row["course"])
            if display_name in course_cache:
                continue
            fee = to_decimal(row.get("fee", 0))
            course = Course.objects.filter(
                category=display_name, class_name=display_name
            ).first()
            if course:
                if fee > course.amount:
                    course.amount = fee
                    courses_to_update.append(course)
            else:
                course, _ = Course.objects.get_or_create(
                    category=display_name,
                    class_name=display_name,
                    defaults={
                        "amount": fee,
                        "is_refresher_course": is_refresher,
                        "lessons": "",
                    },
                )
            course_cache[display_name] = course

        if not dry_run and courses_to_update:
            for c in courses_to_update:
                c.save(update_fields=["amount", "updated_at"])

        # ── Pass 2: import students ───────────────────────────────────────────
        imported = skipped_status = skipped_invalid = skipped_duplicate = errors = 0
        row_num = 0

        for row in reader:
            if not is_valid_row(row):
                skipped_invalid += 1
                continue

            row_num += 1
            raw_status = row.get("branch_status", "")
            status = normalise_status(raw_status)

            if status not in IMPORT_AS_DORMANT:
                skipped_status += 1
                continue

            # Re-run safety: skip if this student name+branch combo already exists
            full_name = str(row["name"]).strip()[:255]
            if Student.objects.filter(branch=branch, full_name=full_name).exists():
                skipped_duplicate += 1
                self.stdout.write(self.style.WARNING(
                    f"  SKIP already in DB: {full_name}"
                ))
                continue

            display_name, _ = get_course_name(row["course"])
            course = course_cache.get(display_name)
            if not course:
                errors += 1
                self.stdout.write(self.style.ERROR(
                    f"  ERROR course not found for '{row['course']}'"
                    f" — skipping row {row_num} ({row.get('name')})"
                ))
                continue

            paid = to_decimal(row.get("paid", 0))
            fee = to_decimal(row.get("fee", 0))
            reg_date = clean_datetime(row.get("date")) or timezone.now()
            phone = str(row.get("phone", "")).strip()[:20]
            id_number = str(row.get("id_no", "")).strip()[:50]
            if dry_run:
                imported += 1
                self.stdout.write(
                    f"  [DRY RUN] row {row_num:03d} — {full_name} — {status}"
                )
                continue

            try:
                with transaction.atomic(), signals_disabled():
                    admission_number = generate_admission_number(branch)
                    # Student — dormant students land as dormant on the Student model
                    student = Student.objects.create(
                        branch=branch,
                        admission_number=admission_number,
                        full_name=full_name,
                        phone=phone,
                        id_number=id_number,
                        status="dormant",
                        created_at=reg_date,
                    )

                    discount = max(course.amount - fee, Decimal("0"))

                    sc = StudentCourse.objects.create(
                        student=student,
                        course=course,
                        status="dormant",
                        amount_agreed=fee,
                        discount=discount,
                        payment_reference=admission_number,
                        registration_date=reg_date,
                    )

                    # Only create a payment transaction if there's something to record
                    if paid > 0:
                        PaymentTransaction.objects.create(
                            student=student,
                            student_course=sc,
                            amount=paid,
                            payment_method="bank",
                            reference_code=admission_number,
                            description="Balance Brought Forward",
                            status="completed",
                            payment_type="REGISTRATION",
                            transaction_date=timezone.now(),
                            data="",
                        )

                    sync_student_status(student)

                imported += 1

            except Exception as exc:
                errors += 1
                self.stdout.write(self.style.ERROR(
                    f"  ERROR row {row_num} {admission_number} ({full_name}): {exc}"
                ))

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 55))
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry_run else ''}Import complete — {branch.name}"
        ))
        self.stdout.write(f"  Total valid rows   : {row_num}")
        self.stdout.write(f"  Imported           : {imported}")
        self.stdout.write(f"  Skipped (status)   : {skipped_status}")
        self.stdout.write(f"  Skipped (invalid)  : {skipped_invalid}")
        self.stdout.write(f"  Skipped (duplicate): {skipped_duplicate}")
        self.stdout.write(
            self.style.ERROR(f"  Errors             : {errors}")
            if errors else
            f"  Errors             : {errors}"
        )
        self.stdout.write(self.style.SUCCESS("═" * 55))
