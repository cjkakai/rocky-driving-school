from django.contrib import admin
from .models import PDLBooking, Exam, ExamBooking, ExamResult

admin.site.register(PDLBooking)
admin.site.register(Exam)
admin.site.register(ExamBooking)
admin.site.register(ExamResult)
