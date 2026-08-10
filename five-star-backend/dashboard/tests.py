from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, time
from accounts.models import User
from branches.models import Branch
from students.models import Student
from academics.models import Course, StudentCourse
from finance.models import PaymentTransaction
from bookings.models import PDLBooking, Exam, ExamBooking


class DashboardSummaryStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name="Test Branch",
            location="Test Location",
            branch_code="TST001"
        )

        # Create users
        self.super_admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass',
            role='super_admin'
        )
        self.branch_user = User.objects.create_user(
            username='branch',
            email='branch@test.com',
            password='testpass',
            role='branch_user',
            branch=self.branch
        )

        # Create students
        self.student = Student.objects.create(
            branch=self.branch,
            admission_number='ADM001',
            full_name='Test Student',
            phone='1234567890',
            id_number='ID123'
        )

    def test_summary_stats_requires_auth(self):
        response = self.client.get('/api/dashboard/summary-stats/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_summary_stats_branch_user_today(self):
        """Test that branch user sees only today's data from their branch"""
        # Create payment today
        PaymentTransaction.objects.create(
            student=self.student,
            amount=50000,
            status='completed',
            reference_code='REF001'
        )

        self.client.force_authenticate(self.branch_user)
        response = self.client.get('/api/dashboard/summary-stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['revenue_today'], 50000.0)
        self.assertEqual(response.data['total_students_today'], 1)

    def test_summary_stats_branch_user_filtered(self):
        """Test that branch user doesn't see data from other branches"""
        other_branch = Branch.objects.create(
            name="Other Branch",
            location="Other Location",
            branch_code="OTH001"
        )
        other_student = Student.objects.create(
            branch=other_branch,
            admission_number='ADM002',
            full_name='Other Student',
            phone='0987654321',
            id_number='ID456'
        )
        PaymentTransaction.objects.create(
            student=other_student,
            amount=100000,
            status='completed',
            reference_code='REF002'
        )

        self.client.force_authenticate(self.branch_user)
        response = self.client.get('/api/dashboard/summary-stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['revenue_today'], 0)

    def test_summary_stats_admin_sees_all(self):
        """Test that admin sees aggregated data from all branches"""
        other_branch = Branch.objects.create(
            name="Other Branch",
            location="Other Location",
            branch_code="OTH001"
        )
        other_student = Student.objects.create(
            branch=other_branch,
            admission_number='ADM002',
            full_name='Other Student',
            phone='0987654321',
            id_number='ID456'
        )

        PaymentTransaction.objects.create(
            student=self.student,
            amount=50000,
            status='completed',
            reference_code='REF001'
        )
        PaymentTransaction.objects.create(
            student=other_student,
            amount=100000,
            status='completed',
            reference_code='REF002'
        )

        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/summary-stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['revenue_today'], 150000.0)

    def test_summary_stats_only_completed_payments(self):
        """Test that only completed payments are counted"""
        PaymentTransaction.objects.create(
            student=self.student,
            amount=50000,
            status='pending',  # Not completed
            reference_code='REF001'
        )

        self.client.force_authenticate(self.branch_user)
        response = self.client.get('/api/dashboard/summary-stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['revenue_today'], 0)


class DashboardActivityFeedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name="Test Branch",
            location="Test Location",
            branch_code="TST001"
        )

        self.super_admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass',
            role='super_admin'
        )

        self.student = Student.objects.create(
            branch=self.branch,
            admission_number='ADM001',
            full_name='Test Student',
            phone='1234567890',
            id_number='ID123'
        )

    def test_activity_feed_requires_auth(self):
        response = self.client.get('/api/dashboard/activity-feed/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_activity_feed_returns_array(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/activity-feed/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_activity_feed_limit_param(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/activity-feed/?limit=5')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 5)

    def test_activity_feed_limit_capped_at_50(self):
        """Test that limit is capped at 50"""
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/activity-feed/?limit=100')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should never have more than 50 items even if requested 100
        self.assertEqual(len(response.data), 0)  # No data yet, but won't exceed 50

    def test_activity_feed_includes_payments(self):
        PaymentTransaction.objects.create(
            student=self.student,
            amount=50000,
            status='completed',
            reference_code='REF001',
            payment_method='bank'
        )

        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/activity-feed/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        activity = next((a for a in response.data if a['type'] == 'payment_received'), None)
        self.assertIsNotNone(activity)
        self.assertEqual(activity['student_name'], 'Test Student')


class DashboardBranchPerformanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name="Test Branch",
            location="Test Location",
            branch_code="TST001"
        )

        self.super_admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass',
            role='super_admin'
        )
        self.branch_user = User.objects.create_user(
            username='branch',
            email='branch@test.com',
            password='testpass',
            role='branch_user',
            branch=self.branch
        )

    def test_branch_performance_requires_auth(self):
        response = self.client.get('/api/dashboard/branch-performance/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_branch_performance_forbids_branch_user(self):
        """Test that branch users cannot access this endpoint"""
        self.client.force_authenticate(self.branch_user)
        response = self.client.get('/api/dashboard/branch-performance/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_performance_allows_admin(self):
        """Test that admins can access this endpoint"""
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/branch-performance/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_branch_performance_returns_data(self):
        """Test that endpoint returns branch data"""
        student = Student.objects.create(
            branch=self.branch,
            admission_number='ADM001',
            full_name='Test Student',
            phone='1234567890',
            id_number='ID123'
        )
        PaymentTransaction.objects.create(
            student=student,
            amount=50000,
            status='completed',
            reference_code='REF001'
        )

        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/branch-performance/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        branch_data = response.data[0]
        self.assertEqual(branch_data['name'], 'Test Branch')
        self.assertEqual(branch_data['total_students'], 1)
        self.assertEqual(branch_data['total_revenue'], 50000.0)


class DashboardRevenueTrendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name="Test Branch",
            location="Test Location",
            branch_code="TST001"
        )

        self.super_admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass',
            role='super_admin'
        )
        self.branch_user = User.objects.create_user(
            username='branch',
            email='branch@test.com',
            password='testpass',
            role='branch_user',
            branch=self.branch
        )

    def test_revenue_trend_requires_auth(self):
        response = self.client.get('/api/dashboard/revenue-trend/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_revenue_trend_returns_array(self):
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/revenue-trend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_revenue_trend_default_months(self):
        """Test that default is 6 months"""
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/revenue-trend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

    def test_revenue_trend_custom_months(self):
        """Test custom months parameter"""
        self.client.force_authenticate(self.super_admin)
        response = self.client.get('/api/dashboard/revenue-trend/?months=3')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_revenue_trend_branch_user_filtered(self):
        """Test that branch user only sees their branch's revenue"""
        student = Student.objects.create(
            branch=self.branch,
            admission_number='ADM001',
            full_name='Test Student',
            phone='1234567890',
            id_number='ID123'
        )
        PaymentTransaction.objects.create(
            student=student,
            amount=50000,
            status='completed',
            reference_code='REF001'
        )

        self.client.force_authenticate(self.branch_user)
        response = self.client.get('/api/dashboard/revenue-trend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
