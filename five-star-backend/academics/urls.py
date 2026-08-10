from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, StudentCourseViewSet, LessonViewSet, InstructorViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"student-courses", StudentCourseViewSet, basename="student-courses")
router.register(r"lessons", LessonViewSet, basename="lessons")
router.register(r"instructors", InstructorViewSet, basename="instructors")

urlpatterns = [
    path("", include(router.urls)),
]
