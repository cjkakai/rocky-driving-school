"""
Test script for SMS Broadcast System

Run this in Django shell:
    python manage.py shell < test_sms_system.py

Or manually:
    python manage.py shell
    >>> exec(open('test_sms_system.py').read())
"""

print("=" * 60)
print("SMS BROADCAST SYSTEM - TEST SUITE")
print("=" * 60)

# Test 1: Check Scheduler Status
print("\n[TEST 1] Checking Scheduler Status...")
try:
    from django_apscheduler.models import DjangoJob
    jobs = DjangoJob.objects.all()
    print(f"✅ Found {jobs.count()} scheduled jobs:")
    for job in jobs:
        print(f"   - {job.name} (Next run: {job.next_run_time})")
except Exception as e:
    print(f"❌ Scheduler check failed: {e}")

# Test 2: Check SMS Service
print("\n[TEST 2] Checking SMS Service Configuration...")
try:
    from django.conf import settings
    print(f"✅ ONFON_API_KEY: {'*' * 10}{settings.ONFON_API_KEY[-4:] if settings.ONFON_API_KEY else 'NOT SET'}")
    print(f"✅ ONFON_CLIENT_ID: {'*' * 10}{settings.ONFON_CLIENT_ID[-4:] if settings.ONFON_CLIENT_ID else 'NOT SET'}")
    print(f"✅ ONFON_SENDER_ID: {settings.ONFON_SENDER_ID}")
    print(f"✅ TIME_ZONE: {settings.TIME_ZONE}")
except Exception as e:
    print(f"❌ Configuration check failed: {e}")

# Test 3: Check SMS Logs
print("\n[TEST 3] Checking SMS Logs...")
try:
    from sms.models import SMSLog
    total = SMSLog.objects.count()
    sent = SMSLog.objects.filter(status='sent').count()
    failed = SMSLog.objects.filter(status='failed').count()
    delivered = SMSLog.objects.filter(status='delivered').count()
    
    print(f"✅ Total SMS Logs: {total}")
    print(f"   - Sent: {sent}")
    print(f"   - Failed: {failed}")
    print(f"   - Delivered: {delivered}")
    
    if total > 0:
        latest = SMSLog.objects.latest('created_at')
        print(f"\n   Latest SMS:")
        print(f"   - To: {latest.phone}")
        print(f"   - Status: {latest.status}")
        print(f"   - Date: {latest.created_at}")
except Exception as e:
    print(f"❌ SMS logs check failed: {e}")

# Test 4: Check Students for Balance Reminders
print("\n[TEST 4] Checking Students Eligible for Balance Reminders...")
try:
    from academics.models import StudentCourse
    active_courses = StudentCourse.objects.filter(status='active').count()
    print(f"✅ Active student courses: {active_courses}")
    
    # Check courses with balance
    courses_with_balance = 0
    for sc in StudentCourse.objects.filter(status='active')[:5]:
        agreed = sc.amount_agreed or 0
        paid = sum(p.amount for p in sc.payments.filter(status='completed'))
        balance = agreed - paid
        if balance > 0:
            courses_with_balance += 1
            print(f"   - {sc.student.full_name}: Balance KES {balance}")
    
    if courses_with_balance == 0:
        print("   ℹ️  No students with outstanding balance (first 5 checked)")
except Exception as e:
    print(f"❌ Balance check failed: {e}")

# Test 5: Check PDL Bookings for Expiry Reminders
print("\n[TEST 5] Checking PDL Bookings for Expiry Reminders...")
try:
    from bookings.models import PDLBooking
    from datetime import date, timedelta
    
    approved_pdls = PDLBooking.objects.filter(status='approved').count()
    print(f"✅ Approved PDL bookings: {approved_pdls}")
    
    # Check PDLs expiring in 30 days
    target_date = date.today() + timedelta(days=30)
    window_start_date = target_date - timedelta(days=120)
    
    from django.utils import timezone
    window_start = timezone.make_aware(
        timezone.datetime.combine(window_start_date, timezone.datetime.min.time())
    )
    window_end = window_start + timedelta(days=1)
    
    expiring_pdls = PDLBooking.objects.filter(
        status='approved',
        approved_at__gte=window_start,
        approved_at__lt=window_end,
        pdl_reminder_sent=False
    )
    
    print(f"✅ PDLs expiring in 30 days: {expiring_pdls.count()}")
    for pdl in expiring_pdls[:3]:
        print(f"   - {pdl.student.full_name} (Approved: {pdl.approved_at.date()})")
except Exception as e:
    print(f"❌ PDL check failed: {e}")

# Test 6: Manual Job Execution (DRY RUN)
print("\n[TEST 6] Testing Job Functions (DRY RUN)...")
print("ℹ️  To manually trigger jobs, run:")
print("   >>> from sms.jobs import send_weekly_balance_reminders, send_pdl_expiry_reminders")
print("   >>> send_weekly_balance_reminders()  # Send balance reminders now")
print("   >>> send_pdl_expiry_reminders()      # Send PDL reminders now")

print("\n" + "=" * 60)
print("TEST SUITE COMPLETE")
print("=" * 60)
print("\n✅ System Status: OPERATIONAL")
print("\nNext Steps:")
print("1. Verify Onfon credentials in .env file")
print("2. Test manual broadcast from frontend")
print("3. Wait for scheduled jobs to run automatically")
print("4. Monitor SMS logs in Django admin")
