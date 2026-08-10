from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Course, StudentCourse, CourseTransfer, Lesson, Instructor
from .serializers import CourseSerializer, StudentCourseSerializer, LessonSerializer, InstructorSerializer, VehicleSerializer
from students.lifecycle import apply_pdl_reactivation, apply_retake, mark_refresher_completed, on_payment_completed, sync_student_status


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("category", "class_name")
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("registration_only") == "true":
            qs = qs.filter(is_active_for_registration=True)
        return qs


class StudentCourseViewSet(viewsets.ModelViewSet):
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StudentCourse.objects.select_related("student", "course").prefetch_related(
            "payments", "exam_bookings__exam", "pdl_bookings",
        ).all()
        user = self.request.user
        if user.role == "branch_user":
            qs = qs.filter(student__branch=user.branch)
        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        student = serializer.validated_data.get("student")
        course = serializer.validated_data.get("course")
        existing_count = StudentCourse.objects.filter(student=student).count()
        base = student.admission_number
        if existing_count == 0:
            payment_reference = base
        else:
            suffix = chr(ord("B") + existing_count - 1)
            payment_reference = f"{base}-{suffix}"
        serializer.save(payment_reference=payment_reference, status="onboarded")
        from students.lifecycle import sync_student_status
        sync_student_status(student)

    @action(detail=True, methods=["post"])
    def activate_course(self, request, pk=None):
        """Reactivate a dormant course (adds reactivation penalty)."""
        sc = self.get_object()
        if sc.status != "dormant":
            return Response(
                {"detail": "Only dormant courses can be reactivated."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        apply_pdl_reactivation(sc)
        return Response(StudentCourseSerializer(sc, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def apply_retake(self, request, pk=None):
        """Book a retake for a failed course (adds retake fee)."""
        sc = self.get_object()
        if sc.status != "failed":
            return Response(
                {"detail": "Only failed courses can have a retake applied."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        apply_retake(sc)
        return Response(StudentCourseSerializer(sc, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def mark_completed(self, request, pk=None):
        """Manually complete a refresher course."""
        sc = self.get_object()
        if not sc.course.is_refresher_course:
            return Response(
                {"detail": "Only refresher courses can be manually completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if sc.status == "completed":
            return Response(
                {"detail": "Course is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        agreed = sc.amount_agreed or 0
        paid = sum(p.amount for p in sc.payments.filter(status="completed"))
        if agreed - paid > 0:
            return Response(
                {"detail": "Cannot complete a course with an outstanding balance."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        mark_refresher_completed(sc)
        return Response(StudentCourseSerializer(sc, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def transfer_course(self, request, pk=None):
        """Transfer a student from this course to a new one, carrying forward a credit."""
        if request.user.role not in ("super_admin",):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        old_sc = self.get_object()

        if old_sc.status in ("transferred", "completed"):
            return Response(
                {"detail": "This course is already terminal and cannot be transferred."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_course_id = request.data.get("new_course_id")
        reason = request.data.get("reason", "")
        if not new_course_id:
            return Response({"detail": "new_course_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_course = Course.objects.get(pk=new_course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if new_course.id == old_sc.course_id:
            return Response({"detail": "New course must differ from the current course."}, status=status.HTTP_400_BAD_REQUEST)

        from finance.models import PaymentTransaction
        from finance.views import _compute_balance_snapshot

        with transaction.atomic():
            completed_payments = list(
                old_sc.payments.filter(status="completed")
                .order_by("transaction_date", "created_at")
            )
            credit = sum(p.amount for p in completed_payments)

            # Retire old course
            old_sc.status = "transferred"
            old_sc.save(update_fields=["status", "updated_at"])

            # Build new payment_reference
            existing_count = StudentCourse.objects.filter(student=old_sc.student).count()
            base = old_sc.student.admission_number
            suffix = chr(ord("A") + existing_count)  # A=first extra, B=second, etc.
            new_payment_ref = f"{base}-{suffix}"

            # Create new StudentCourse
            new_sc = StudentCourse.objects.create(
                student=old_sc.student,
                course=new_course,
                amount_agreed=new_course.amount,
                payment_reference=new_payment_ref,
                status="onboarded",
            )

            # Move existing completed payments to the new course, recalculating
            # balance snapshots in chronological order.
            for payment in completed_payments:
                prev_bal, new_bal = _compute_balance_snapshot(new_sc, payment.amount)
                payment.student_course = new_sc
                payment.receipt_previous_balance = prev_bal
                payment.receipt_new_balance = new_bal
                payment.save(update_fields=[
                    "student_course", "receipt_previous_balance",
                    "receipt_new_balance", "updated_at",
                ])

            # Trigger lifecycle transitions on new course
            if completed_payments:
                new_sc.refresh_from_db()
                on_payment_completed(new_sc)

            # Audit record
            CourseTransfer.objects.create(
                old_student_course=old_sc,
                new_student_course=new_sc,
                credit_amount=credit,
                reason=reason,
                transferred_by=request.user,
            )

            sync_student_status(old_sc.student)

        return Response(
            StudentCourseSerializer(new_sc, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def _base_queryset(self):
        return Lesson.objects.select_related(
            "student_course__course", "student", "branch",
            "instructor", "vehicle", "created_by",
        )

    def get_queryset(self):
        user = self.request.user
        qs = self._base_queryset()
        if user.role == "branch_user":
            qs = qs.filter(student__branch=user.branch)
        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)
        student_course_id = self.request.query_params.get("student_course_id")
        if student_course_id:
            qs = qs.filter(student_course_id=student_course_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        student_course = serializer.validated_data.get("student_course")
        # Branch user can only create lessons for their own branch's students
        if user.role == "branch_user":
            if student_course and student_course.student.branch != user.branch:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add lessons for students in your branch.")
        branch = serializer.validated_data.get("branch") or (
            student_course.student.branch if student_course else None
        )
        serializer.save(
            student=student_course.student,
            branch=branch,
            created_by=user,
        )

    def perform_update(self, serializer):
        user = self.request.user
        lesson = self.get_object()
        if user.role == "branch_user" and lesson.student.branch != user.branch:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit lessons for students in your branch.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == "branch_user" and instance.student.branch != user.branch:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete lessons for students in your branch.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Returns lesson progress summary for a student."""
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response({"detail": "student_id is required."}, status=400)

        user = request.user
        if user.role == "branch_user":
            from students.models import Student
            try:
                student = Student.objects.get(pk=student_id, branch=user.branch)
            except Student.DoesNotExist:
                return Response({"detail": "Not found."}, status=404)

        student_course_id = request.query_params.get("student_course_id")

        qs = self._base_queryset().filter(student_id=student_id)
        if student_course_id:
            qs = qs.filter(student_course_id=student_course_id)

        total = qs.count()
        completed = qs.filter(status="completed").count()
        scheduled = qs.filter(status="scheduled").count()
        cancelled = qs.filter(status="cancelled").count()
        no_show = qs.filter(status="no_show").count()

        total_minutes = sum(
            l.duration_minutes for l in qs.filter(status="completed")
        )

        import re
        from academics.models import StudentCourse
        if student_course_id:
            sc_qs = StudentCourse.objects.filter(pk=student_course_id).select_related("course")
        else:
            sc_qs = StudentCourse.objects.filter(
                student_id=student_id
            ).exclude(status="transferred").select_related("course")

        total_required = 0
        for sc in sc_qs:
            match = re.search(r"\d+", sc.course.lessons or "")
            total_required += int(match.group()) if match else 0

        return Response({
            "total": total,
            "completed": completed,
            "scheduled": scheduled,
            "cancelled": cancelled,
            "no_show": no_show,
            "total_minutes": total_minutes,
            "total_required": total_required,
            "remaining": max(0, total_required - completed),
        })


class InstructorViewSet(viewsets.ModelViewSet):
    serializer_class = InstructorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Instructor.objects.select_related("branch")
        if self.request.query_params.get("include_inactive") != "true":
            qs = qs.filter(is_active=True)
        if user.role == "branch_user" and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    def perform_destroy(self, instance):
        # Soft-delete: deactivate instead of hard delete
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        instructor = self.get_object()
        instructor.is_active = True
        instructor.save(update_fields=["is_active"])
        return Response(InstructorSerializer(instructor).data)
