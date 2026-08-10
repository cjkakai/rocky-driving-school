from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, StudentCourseViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"student-courses", StudentCourseViewSet, basename="student-courses")

urlpatterns = [path("", include(router.urls))]
