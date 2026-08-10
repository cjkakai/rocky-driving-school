"""
Seed script — run with:  python manage.py shell < seed.py
Covers every model and every lifecycle state so the frontend has
realistic data to work with from day one.
"""
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from accounts.models import User
from branches.models import Branch
from students.models import Student
from academics.models import Course, StudentCourse
from finance.models import PaymentTransaction
from bookings.models import Exam, ExamBooking, ExamResult, PDLBooking
from students.lifecycle import sync_student_status

# ── helpers ───────────────────────────────────────────────────────────────────
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed database with realistic data"

    def handle(self, *args, **kwargs):
        # paste ALL your existing seed logic here

        def make_ref(prefix, n):
            return f"{prefix}-{str(n).zfill(4)}"

        # ── 1. Branches ───────────────────────────────────────────────────────────────

        utawala  = Branch.objects.create(name="Utawala",  location="Utawala, Nairobi",  branch_code="UTA")
        kahawa   = Branch.objects.create(name="Kahawa",   location="Kahawa, Nairobi",   branch_code="KAH")
        thika    = Branch.objects.create(name="Thika",    location="Thika, Kiambu",     branch_code="THI")
        buruburu = Branch.objects.create(name="Buruburu", location="Buruburu, Nairobi", branch_code="BUR")
        lumumba  = Branch.objects.create(name="Lumumba",  location="lumumbadrive, Nairobi",  branch_code="LUM")

        print("✓ Branches")

        # ── 2. Users ──────────────────────────────────────────────────────────────────

        # ── Super Admin ─────────────────────────────
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@fivestar.co.ke",
            password="super",
            role="super_admin",
        )
        admin.role = "super_admin"
        admin.save()


        # ── Branch Users ────────────────────────────
        uta_user = User.objects.create_user(
            username="uta",
            email="uta@fivestar.co.ke",
            password="branch",
            role="branch_user",
            branch=utawala,
        )

        kah_user = User.objects.create_user(
            username="kah",
            email="kah@fivestar.co.ke",
            password="branch",
            role="branch_user",
            branch=kahawa,
        )

        thi_user = User.objects.create_user(
            username="thi",
            email="thi@fivestar.co.ke",
            password="branch",
            role="branch_user",
            branch=thika,
        )

        bur_user = User.objects.create_user(
            username="bur",
            email="bur@fivestar.co.ke",
            password="branch",
            role="branch_user",
            branch=buruburu,
        )

        lum_user = User.objects.create_user(
            username="lum",
            email="lum@fivestar.co.ke",
            password="branch",
            role="branch_user",
            branch=lumumba,
        )


        print("✓ Users")

        # ── 3. Courses ────────────────────────────────────────────────────────────────

        class_b  = Course.objects.create(category="Class B",  class_name="Light Motor Vehicle",   lessons="30 lessons", amount=Decimal("15000"), max_discount=Decimal("2000"))
        class_c  = Course.objects.create(category="Class C",  class_name="Medium Commercial",      lessons="40 lessons", amount=Decimal("18000"), max_discount=Decimal("2000"))
        class_ce = Course.objects.create(category="Class CE", class_name="Heavy Commercial",       lessons="50 lessons", amount=Decimal("21000"), max_discount=Decimal("3000"))
        class_d  = Course.objects.create(category="Class D",  class_name="Passenger Service",      lessons="35 lessons", amount=Decimal("16000"), max_discount=Decimal("2000"))

        print("✓ Courses")

        # ── 4. Exams ──────────────────────────────────────────────────────────────────

        exam_active_1 = Exam.objects.create(
            exam_name="May 2026 EXAM 1",
            exam_date=date(2026, 5, 15),
            test_center="Kasarani",
            status="active",
            created_by=admin,
        )
        exam_active_2 = Exam.objects.create(
            exam_name="MAY 2026 EXAM 2",
            exam_date=date(2026, 6, 10),
            test_center="Thika",
            status="active",
            created_by=admin,
        )
        exam_closed = Exam.objects.create(
            exam_name="JUNE 2026 EXAM 1",
            exam_date=date(2026, 3, 20),
            test_center="Kasarani",
            status="active",
            created_by=admin,
        )

        print("✓ Exams")

        # ── 5. Students + full lifecycle ──────────────────────────────────────────────
        # We create students covering every meaningful state combination.

        def make_student(branch, name, phone, id_number, seq):
            code = branch.branch_code.upper()
            admission = f"{code}{str(seq).zfill(3)}"
            return Student.objects.create(
                branch=branch, admission_number=admission,
                full_name=name, phone=phone, id_number=id_number,
            )

        def make_payment(sc, amount, seq):
            ref = f"{sc.payment_reference}-PAY{seq}"
            pt = PaymentTransaction.objects.create(
                student_course=sc,
                student=sc.student,
                amount=Decimal(str(amount)),
                status="completed",
                reference_code=ref,
                payment_method="bank",
            )
            return pt

        def enroll(student, course, amount_agreed, discount=0, seq=0):
            existing = StudentCourse.objects.filter(student=student).count()
            base = student.admission_number
            if existing == 0:
                ref = base
            else:
                ref = f"{base}-{chr(ord('B') + existing - 1)}"
            return StudentCourse.objects.create(
                student=student, course=course,
                amount_agreed=Decimal(str(amount_agreed)),
                discount=Decimal(str(discount)),
                payment_reference=ref,
            )

        def approve_pdl(pdl, user=admin):
            pdl.status = "approved"
            pdl.approved_by = user
            pdl.approved_at = timezone.now() - timedelta(days=10)
            pdl.save()

        # ─────────────────────────────────────────────────────────────────────────────
        # NBI-001  Alice Kamau — active course, PDL active, exam confirmed (pending result)
        # ─────────────────────────────────────────────────────────────────────────────
        # ── 6. Students per branch (realistic lifecycle coverage) ─────────────

        # ─────────────────────────────────────────────
        # UTA-001 — Active + Exam Confirmed
        # ─────────────────────────────────────────────
        alice = make_student(utawala, "Alice Kamau", "0712000001", "10000001", 1)
        sc_alice = enroll(alice, class_b, 15000)
        make_payment(sc_alice, 15000, 1)

        pdl_alice = PDLBooking.objects.create(
            student=alice, student_course=sc_alice, booked_by=uta_user,
        )
        approve_pdl(pdl_alice)

        sc_alice.status = "active"
        sc_alice.save()

        ExamBooking.objects.create(
            student_course=sc_alice,
            student=alice,
            exam=exam_active_1,
            status="confirmed",
            booked_by=uta_user,
        )

        sync_student_status(alice)


        # ─────────────────────────────────────────────
        # UTA-002 — Pending PDL
        # ─────────────────────────────────────────────
        brian = make_student(utawala, "Brian Otieno", "0712000002", "10000002", 2)
        sc_brian = enroll(brian, class_c, 18000)
        make_payment(sc_brian, 5000, 1)

        PDLBooking.objects.create(
            student=brian, student_course=sc_brian, booked_by=uta_user,
        )

        sync_student_status(brian)


        # ─────────────────────────────────────────────
        # KAH-001 — Dormant (expired PDL)
        # ─────────────────────────────────────────────
        carol = make_student(kahawa, "Carol Wanjiku", "0712000003", "10000003", 1)
        sc_carol = enroll(carol, class_b, 15000)
        make_payment(sc_carol, 15000, 1)

        pdl_carol = PDLBooking.objects.create(
            student=carol, student_course=sc_carol, booked_by=kah_user,
        )
        pdl_carol.status = "approved"
        pdl_carol.approved_by = admin
        pdl_carol.approved_at = timezone.now() - timedelta(days=130)
        pdl_carol.save()

        sc_carol.status = "dormant"
        sc_carol.save()

        sync_student_status(carol)


        # ─────────────────────────────────────────────
        # THI-001 — Passed
        # ─────────────────────────────────────────────
        david = make_student(thika, "David Mwangi", "0712000004", "10000004", 1)
        sc_david = enroll(david, class_b, 15000)
        make_payment(sc_david, 15000, 1)

        pdl_david = PDLBooking.objects.create(
            student=david, student_course=sc_david, booked_by=thi_user,
        )
        approve_pdl(pdl_david)

        sc_david.status = "active"
        sc_david.save()

        eb = ExamBooking.objects.create(
            student_course=sc_david,
            student=david,
            exam=exam_closed,
            status="confirmed",
            booked_by=thi_user,
        )

        ExamResult.objects.create(
            exam_booking=eb,
            result="pass",
            recorded_by=admin,
        )

        sc_david.status = "passed"
        sc_david.save()

        sync_student_status(david)


        # ─────────────────────────────────────────────
        # BUR-001 — Failed + Retake Paid
        # ─────────────────────────────────────────────
        eve = make_student(buruburu, "Eve Njeri", "0712000005", "10000005", 1)
        sc_eve = enroll(eve, class_ce, 21000)
        make_payment(sc_eve, 21000, 1)

        pdl_eve = PDLBooking.objects.create(
            student=eve, student_course=sc_eve, booked_by=bur_user,
        )
        approve_pdl(pdl_eve)

        sc_eve.status = "active"
        sc_eve.save()

        eb = ExamBooking.objects.create(
            student_course=sc_eve,
            student=eve,
            exam=exam_closed,
            status="confirmed",
            booked_by=bur_user,
        )

        ExamResult.objects.create(
            exam_booking=eb,
            result="fail",
            recorded_by=admin,
        )

        # Apply retake
        sc_eve.status = "failed"
        sc_eve.save()

        eb.status = "pending"
        eb.exam = None
        eb.save()

        sc_eve.amount_agreed = Decimal("24000")
        sc_eve.status = "active"
        sc_eve.save()

        make_payment(sc_eve, 3000, 2)

        sync_student_status(eve)


        # ─────────────────────────────────────────────
        # LUM-001 — Fresh Registration
        # ─────────────────────────────────────────────
        frank = make_student(lumumba, "Frank Kariuki", "0712000006", "10000006", 1)
        sc_frank = enroll(frank, class_d, 16000)

        sync_student_status(frank)


        print("✓ Lifecycle students created across branches")
        # ── Summary ───────────────────────────────────────────────────────────────────
        print("\n── Seed complete ──────────────────────────────────────────────────────")
        print(f"  Branches:          {Branch.objects.count()}")
        print(f"  Users:             {User.objects.count()}")
        print(f"  Courses:           {Course.objects.count()}")
        print(f"  Exams:             {Exam.objects.count()}  (active: {Exam.objects.filter(status='active').count()}, closed: {Exam.objects.filter(status='closed').count()})")
        print(f"  Students:          {Student.objects.count()}")
        print(f"  StudentCourses:    {StudentCourse.objects.count()}")
        print(f"  Payments:          {PaymentTransaction.objects.count()}")
        print(f"  PDL Bookings:      {PDLBooking.objects.count()}")
        print(f"  Exam Bookings:     {ExamBooking.objects.count()}")
        print(f"  Exam Results:      {ExamResult.objects.count()}")
        print()
        print("  Login credentials:")
        print("    super_admin  →  admin / admin1234")
        print("    nairobi      →  nbi_staff / staff1234")
        print("    mombasa      →  msa_staff / staff1234")
        print("    kisumu       →  ksm_staff / staff1234")