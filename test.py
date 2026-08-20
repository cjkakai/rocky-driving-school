cat > /tmp/seed_lessons.py << 'EOF'
from datetime import date, timedelta, time
from academics.models import Lesson, StudentCourse, Instructor
from students.models import Student

# ── CONFIG ──────────────────────────────────────────────────────────
ADM_NUMBERS = [
    "KHW005",  # replace with real admission numbers
]

LESSONS_PER_STUDENT = 30   # how many lessons to seed per student
START_DATE = date(2025, 5, 1)  # first lesson date
LESSON_START = time(7, 0)
LESSON_END   = time(8, 0)
LESSON_TYPE  = "practical"
STATUS       = "completed"
# ────────────────────────────────────────────────────────────────────

for adm in ADM_NUMBERS:
    try:
        student = Student.objects.get(admission_number=adm)
    except Student.DoesNotExist:
        print(f"[SKIP] {adm} — student not found")
        continue

    sc = student.student_courses.exclude(status="transferred").first()
    if not sc:
        print(f"[SKIP] {adm} — no active student course")
        continue

    instructor = Instructor.objects.filter(branch=student.branch, is_active=True).first()
    branch = student.branch

    created = 0
    for i in range(LESSONS_PER_STUDENT):
        lesson_date = START_DATE + timedelta(days=i * 2)
        lesson, was_created = Lesson.objects.get_or_create(
            student_course=sc,
            student=student,
            date=lesson_date,
            start_time=LESSON_START,
            defaults=dict(
                end_time=LESSON_END,
                branch=branch,
                instructor=instructor,
                lesson_type=LESSON_TYPE,
                status=STATUS,
                notes=f"Lesson {i + 1}",
            ),
        )
        if was_created:
            created += 1

    print(f"[OK] {adm} | {student.full_name:<35} | course: {sc.course.class_name:<20} | seeded: {created} lessons")

print("\nDone.")
EOF

python manage.py shell < /tmp/seed_lessons.py
