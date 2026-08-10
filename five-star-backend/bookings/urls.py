from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PDLBookingViewSet, ExamViewSet, ExamBookingViewSet, ExamResultViewSet

router = DefaultRouter()
router.register(r"pdl-bookings", PDLBookingViewSet, basename="pdl-bookings")
router.register(r"exams", ExamViewSet, basename="exams")
router.register(r"exam-bookings", ExamBookingViewSet, basename="exam-bookings")
router.register(r"exam-results", ExamResultViewSet, basename="exam-results")

urlpatterns = [path("", include(router.urls))]
