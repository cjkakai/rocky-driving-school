from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import datetime, time, timedelta
from students.models import Student
from finance.models import PaymentTransaction
from bookings.models import PDLBooking, ExamBooking
from academics.models import StudentCourse


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary_stats(request):
    """
    Get daily summary stats (students registered, revenue, etc.)
    Automatically scoped by user role and branch
    """
    user = request.user
    today = timezone.now().date()
    start_of_day = timezone.make_aware(datetime.combine(today, time.min))
    end_of_day = timezone.make_aware(datetime.combine(today, time.max))

    # Get base queryset based on user role
    if user.role == "branch_user":
        branch_id = user.branch_id
        student_qs = Student.objects.filter(branch_id=branch_id)
        payment_qs = PaymentTransaction.objects.filter(
            student__branch_id=branch_id
        )
        pdl_qs = PDLBooking.objects.filter(
            student__branch_id=branch_id
        )
        exam_qs = ExamBooking.objects.filter(
            student__branch_id=branch_id
        )
    else:  # super_admin
        student_qs = Student.objects.all()
        payment_qs = PaymentTransaction.objects.all()
        pdl_qs = PDLBooking.objects.all()
        exam_qs = ExamBooking.objects.all()

    # Calculate metrics
    total_students_today = student_qs.filter(
        created_at__range=[start_of_day, end_of_day]
    ).count()

    revenue_today = payment_qs.filter(
        models.Q(transaction_date__range=[start_of_day, end_of_day]) |
        models.Q(transaction_date__isnull=True, created_at__range=[start_of_day, end_of_day]),
        status="completed"
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    pdl_bookings_today = pdl_qs.filter(
        created_at__range=[start_of_day, end_of_day]
    ).count()

    exams_today = exam_qs.filter(
        created_at__range=[start_of_day, end_of_day]
    ).count()

    return Response({
        'total_students_today': total_students_today,
        'revenue_today': float(revenue_today),
        'pdl_bookings_today': pdl_bookings_today,
        'exams_today': exams_today,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_feed(request):
    """
    Get recent activity feed (registrations, payments, bookings, exams)
    Automatically scoped by user role and branch
    """
    user = request.user
    limit = int(request.query_params.get('limit', 5))
    limit = min(limit, 10)  # Cap at 10

    # Branch filter
    if user.role == "branch_user":
        branch_filter = Q(student__branch_id=user.branch_id)
    else:  # super_admin
        branch_filter = Q()  # No filter needed

    activities = []

    pool = limit * 4  # fetch a wider pool from each source before merging

    for reg in StudentCourse.objects.filter(branch_filter).select_related('student', 'course').order_by('-registration_date')[:pool].values('student__full_name', 'student_id', 'course__class_name', 'registration_date'):
        activities.append({
            'type': 'student_registered',
            'student_name': reg['student__full_name'],
            'student_id': reg['student_id'],
            'description': f"Registered for {reg['course__class_name']}",
            'timestamp': reg['registration_date'].isoformat(),
        })

    for payment in PaymentTransaction.objects.filter(Q(status="completed") & branch_filter).select_related('student').order_by('-created_at')[:pool].values('student__full_name', 'student_id', 'amount', 'payment_method', 'created_at'):
        method_display = dict(PaymentTransaction.PAYMENT_METHODS).get(payment['payment_method'], payment['payment_method'])
        activities.append({
            'type': 'payment_received',
            'student_name': payment['student__full_name'],
            'student_id': payment['student_id'],
            'description': f"Payment: Ksh {payment['amount']} ({method_display})",
            'timestamp': payment['created_at'].isoformat(),
        })

    for booking in PDLBooking.objects.filter(branch_filter).select_related('student').order_by('-created_at')[:pool].values('student__full_name', 'student_id', 'created_at'):
        activities.append({
            'type': 'pdl_booked',
            'student_name': booking['student__full_name'],
            'student_id': booking['student_id'],
            'description': 'Booked practice driving session',
            'timestamp': booking['created_at'].isoformat(),
        })

    for booking in ExamBooking.objects.filter(branch_filter).select_related('student', 'exam').order_by('-created_at')[:pool].values('student__full_name', 'student_id', 'exam__exam_name', 'created_at'):
        activities.append({
            'type': 'exam_scheduled',
            'student_name': booking['student__full_name'],
            'student_id': booking['student_id'],
            'description': f"Scheduled exam: {booking['exam__exam_name']}",
            'timestamp': booking['created_at'].isoformat(),
        })

    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    activities = activities[:limit]

    return Response(activities)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def branch_performance(request):
    """
    Get branch performance data (admin/supervisor only)
    Returns per-branch metrics: student count, revenue, growth %
    """
    user = request.user

    # Admin check
    if user.role != "super_admin":
        return Response(
            {'detail': 'Only admins can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    now = timezone.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = current_month_start - timedelta(seconds=1)
    last_month_start = last_month_end.replace(day=1)

    from branches.models import Branch

    branch_qs = Branch.objects.annotate(
        total_students=Count("students", distinct=True),
        total_revenue=Sum(
            "students__payments__amount",
            filter=Q(students__payments__status="completed"),
        ),
        current_month_revenue=Sum(
            "students__payments__amount",
            filter=Q(
                students__payments__status="completed",
                students__payments__created_at__gte=current_month_start,
                students__payments__created_at__lt=now,
            ),
        ),
        last_month_revenue=Sum(
            "students__payments__amount",
            filter=Q(
                students__payments__status="completed",
                students__payments__created_at__gte=last_month_start,
                students__payments__created_at__lt=last_month_end,
            ),
        ),
    ).order_by(models.F("total_revenue").desc(nulls_last=True), "name")

    result = []
    for branch in branch_qs:
        cur = float(branch.current_month_revenue or 0)
        last = float(branch.last_month_revenue or 0)
        if last == 0:
            growth = 0 if cur == 0 else 100
        else:
            growth = ((cur - last) / last) * 100
        result.append({
            'id': branch.id,
            'name': branch.name,
            'location': branch.location,
            'total_students': branch.total_students or 0,
            'total_revenue': float(branch.total_revenue or 0),
            'growth_percentage': round(growth, 1),
        })

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_trend(request):
    """
    Get revenue trend data (monthly aggregation)
    Returns last 6-12 months of revenue
    """
    user = request.user
    months = int(request.query_params.get('months', 6))
    months = max(1, min(months, 24))  # Clamp between 1 and 24

    # Branch filter
    if user.role == "branch_user":
        payment_qs = PaymentTransaction.objects.filter(
            student__branch_id=user.branch_id,
            status="completed"
        )
    else:  # super_admin
        payment_qs = PaymentTransaction.objects.filter(status="completed")

    # Calculate date range — oldest month start
    now = timezone.now()
    abs_start = (now.year * 12 + now.month - 1) - (months - 1)
    cutoff = timezone.make_aware(datetime(abs_start // 12, abs_start % 12 + 1, 1))

    rows = (
        payment_qs
        .filter(created_at__gte=cutoff)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Sum("amount"))
        .order_by("month")
    )

    trend_data = [
        {
            'month': r['month'].strftime('%b'),
            'revenue': float(r['revenue'] or 0),
            'month_num': r['month'].month,
            'year': r['month'].year,
        }
        for r in rows
    ]

    return Response(trend_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_revenue_trend(request):
    """
    Get daily revenue for the current month.
    Branch-scoped: branch_user sees only their branch, super_admin sees all.
    """
    user = request.user
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if user.role == "branch_user":
        payment_qs = PaymentTransaction.objects.filter(
            student__branch_id=user.branch_id,
            status="completed",
        )
    else:
        payment_qs = PaymentTransaction.objects.filter(status="completed")

    rows = (
        payment_qs
        .filter(created_at__gte=month_start, created_at__lte=now)
        .annotate(day=TruncDay("created_at"))
        .values("day")
        .annotate(revenue=Sum("amount"))
        .order_by("day")
    )

    data = [
        {"period": r["day"].strftime("%b %d"), "revenue": float(r["revenue"] or 0)}
        for r in rows
    ]

    return Response({"data": data})
