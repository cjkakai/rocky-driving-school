"""
Seed 30 completed lessons for StudentCourse payment_reference=KHW001
Run: python manage.py shell < seed_lessons_KHW001.py
"""
import django
django.setup()

from datetime import date, timedelta, time
from academics.models import StudentCourse, Lesson, Instructor
SC_REF       = "KHW006"
INSTRUCTOR_ID = 2        # Morris Odhiambo
LESSON_COUNT  = 30
START_DATE    = date(2025, 1, 6)   # Monday — adjust if needed
START_TIME    = time(8, 0)
END_TIME      = time(10, 0)

sc = StudentCourse.objects.select_related("student", "course").get(payment_reference=SC_REF)
instructor = Instructor.objects.get(pk=INSTRUCTOR_ID)
student    = sc.student
branch     = student.branch

print(f"Seeding {LESSON_COUNT} lessons for {student.full_name} — {sc.course.class_name}")

lessons = []
current_date = START_DATE
created = 0

while created < LESSON_COUNT:
    # Skip weekends
    if current_date.weekday() < 5:
        lessons.append(Lesson(
            student_course=sc,
            student=student,
            branch=branch,
            instructor=instructor,
            vehicle=None,
            date=current_date,
            start_time=START_TIME,
            end_time=END_TIME,
            lesson_type="practical",
            status="completed",
            notes=f"Lesson {created + 1}",
        ))
        created += 1
    current_date += timedelta(days=1)

Lesson.objects.bulk_create(lessons)
print(f"Done — {LESSON_COUNT} lessons created from {START_DATE} to {current_date - timedelta(days=1)}")

# Verify
total = sc.lessons.filter(status="completed").count()
required = sc.course.lessons
print(f"Completed lessons: {total}/{required} — lessons_complete: {total >= required}")
