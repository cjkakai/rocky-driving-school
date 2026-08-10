from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, students_summary

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='students')

urlpatterns = [
    path('students/summary/', students_summary, name='students-summary'),
    path('', include(router.urls)),
]