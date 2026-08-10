from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, UserListCreateView, UserDeleteView, ChangePasswordView, SessionListView, LogoutView, \
    RequestPasswordResetOTPView, VerifyPasswordResetOTPView, ResetPasswordWithOTPView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", UserDeleteView.as_view(), name="user-delete"),
    path("users/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("sessions/", SessionListView.as_view(), name="session-list"),
    path("password-reset/request-otp/", RequestPasswordResetOTPView.as_view(), name="password-reset-request-otp"),
    path("password-reset/verify-otp/", VerifyPasswordResetOTPView.as_view(), name="password-reset-verify-otp"),
    path("password-reset/reset/", ResetPasswordWithOTPView.as_view(), name="password-reset-reset"),
]
