from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from .models import Vehicle
from .serializers import VehicleSerializer


def _admin_required(user):
    if user.role != "super_admin":
        return Response({"detail": "Forbidden."}, status=403)
    return None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def vehicle_list_create(request):
    err = _admin_required(request.user)
    if err:
        return err

    if request.method == "GET":
        qs = Vehicle.objects.all()
        insurance_status = request.query_params.get("insurance_status")
        if insurance_status:
            qs = qs.filter(insurance_status=insurance_status)
        inspection_status = request.query_params.get("inspection_status")
        if inspection_status:
            qs = qs.filter(inspection_status=inspection_status)
        return Response(VehicleSerializer(qs, many=True).data)

    serializer = VehicleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, pk):
    err = _admin_required(request.user)
    if err:
        return err

    try:
        vehicle = Vehicle.objects.get(pk=pk)
    except Vehicle.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    if request.method == "GET":
        return Response(VehicleSerializer(vehicle).data)

    if request.method == "PATCH":
        serializer = VehicleSerializer(vehicle, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    vehicle.delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicle_stats(request):
    err = _admin_required(request.user)
    if err:
        return err

    qs = Vehicle.objects.all()
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
    Returns vehicle trip analytics aggregated from TripEntry records.

    Used by VehicleCharts (Top Vehicles by Trips bar chart).

    Query params:
        date_from   — ISO date (filters on report__report_date)
        date_to     — ISO date
        branch      — branch pk (optional)

    Returns:
    {
        "top_vehicles": [
            {
                "registration": "KDL 123A",
                "name":         "Toyota Axio",
                "total_trips":  14,
                "total_students": 48
            },
            ...
        ],
        "total_trips":    42,
        "total_students": 156
    }
    """
    params    = request.query_params
    user      = request.user
    branch_id = user.branch_id if user.role == "branch_user" else params.get("branch")

    # TripEntry lives in the reports app
    from reports.models import TripEntry
    
    qs = TripEntry.objects.select_related("vehicle", "report")

    if params.get("date_from"):
        qs = qs.filter(report__report_date__gte=params["date_from"])
    if params.get("date_to"):
        qs = qs.filter(report__report_date__lte=params["date_to"])
    if branch_id:
        qs = qs.filter(report__branch_id=branch_id)

    # Top vehicles by trip count
    top_vehicles = (
        qs
        .filter(vehicle__isnull=False)
        .values("vehicle__registration_number", "vehicle__vehicle_name")
        .annotate(
            total_lessons=Sum("number_of_lessons"),
            total_students=Sum("number_of_students"),
        )
        .order_by("-total_lessons")
    )

    totals = qs.aggregate(
        total_lessons=Sum("number_of_lessons"),
        total_students=Sum("number_of_students"),
    )

    return Response({
        "top_vehicles": [
            {
                "registration":   r["vehicle__registration_number"],
                "name":           r["vehicle__vehicle_name"],
                "total_lessons":  r["total_lessons"]  or 0,
                "total_students": r["total_students"] or 0,
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
