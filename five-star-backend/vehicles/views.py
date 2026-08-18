from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import Vehicle
from .serializers import VehicleSerializer


def _is_admin(user):
    return user.role == "super_admin"


def _can_mutate(user, vehicle):
    """Branch user can only edit/delete vehicles assigned to their branch."""
    if _is_admin(user):
        return True
    return vehicle.branch_id is not None and vehicle.branch_id == user.branch_id


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def vehicle_list_create(request):
    if request.method == "GET":
        qs = Vehicle.objects.select_related("branch").all()
        if not _is_admin(request.user):
            # branch user sees their branch vehicles + general (no branch)
            qs = qs.filter(Q(branch_id=request.user.branch_id) | Q(branch__isnull=True))
        insurance_status = request.query_params.get("insurance_status")
        if insurance_status:
            qs = qs.filter(insurance_status=insurance_status)
        inspection_status = request.query_params.get("inspection_status")
        if inspection_status:
            qs = qs.filter(inspection_status=inspection_status)
        return Response(VehicleSerializer(qs, many=True).data)

    # POST
    data = request.data.copy()
    if not _is_admin(request.user):
        data["branch"] = request.user.branch_id
    serializer = VehicleSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, pk):
    try:
        vehicle = Vehicle.objects.select_related("branch").get(pk=pk)
    except Vehicle.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    if request.method == "GET":
        return Response(VehicleSerializer(vehicle).data)

    if not _can_mutate(request.user, vehicle):
        return Response({"detail": "Forbidden."}, status=403)

    if request.method == "PATCH":
        data = request.data.copy()
        if not _is_admin(request.user):
            data.pop("branch", None)  # branch users can't reassign branch
        serializer = VehicleSerializer(vehicle, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    vehicle.delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicle_stats(request):
    qs = Vehicle.objects.all()
    if not _is_admin(request.user):
        from django.db.models import Q
        qs = qs.filter(Q(branch_id=request.user.branch_id) | Q(branch__isnull=True))
    return Response({
        "total": qs.count(),
        "insurance_active": qs.filter(insurance_status="ACTIVE").count(),
        "insurance_expired": qs.filter(insurance_status="EXPIRED").count(),
        "inspection_due": qs.filter(inspection_status="DUE").count(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trip_analytics(request):
    """
    Returns vehicle usage analytics aggregated directly from Lesson records.
    No dependency on report submission — updates the moment a lesson is added.
    """
    from academics.models import Lesson
    from django.db.models import Count

    params    = request.query_params
    user      = request.user
    branch_id = user.branch_id if user.role == "branch_user" else params.get("branch")

    qs = Lesson.objects.filter(status="completed", vehicle__isnull=False)

    if params.get("date_from"):
        qs = qs.filter(date__gte=params["date_from"])
    if params.get("date_to"):
        qs = qs.filter(date__lte=params["date_to"])
    if branch_id:
        qs = qs.filter(branch_id=branch_id)

    top_vehicles = (
        qs
        .values("vehicle__registration_number", "vehicle__vehicle_name")
        .annotate(
            total_lessons=Count("id"),
            total_students=Count("student", distinct=True),
        )
        .order_by("-total_lessons")
    )

    totals = qs.aggregate(
        total_lessons=Count("id"),
        total_students=Count("student", distinct=True),
    )

    return Response({
        "top_vehicles": [
            {
                "registration":   r["vehicle__registration_number"],
                "name":           r["vehicle__vehicle_name"],
                "total_lessons":  r["total_lessons"],
                "total_students": r["total_students"],
            }
            for r in top_vehicles
        ],
        "total_lessons":  totals["total_lessons"]  or 0,
        "total_students": totals["total_students"] or 0,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicles_for_report(request):
    """Lightweight list for report form dropdown — accessible to all authenticated users."""
    return Response(
        list(Vehicle.objects.values("id", "registration_number", "vehicle_name"))
    )
