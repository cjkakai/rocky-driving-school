from django.urls import path
from .views import broadcast, sms_dlr

urlpatterns = [
    path("sms/broadcast/", broadcast, name="sms-broadcast"),
    path("sms/dlr/", sms_dlr, name="sms-dlr"),
]
