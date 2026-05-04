from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("signup/", views.SignupView.as_view(), name="signup"),
    path("verify-otp/", views.VerifyOTPView.as_view(), name="verify-otp"),
    path("signin/",views.SigninView.as_view(), name="signin"),
    path("users/profile/",views.ProfileView.as_view(), name="profile"),
    # path("resend-otp/", views.ResendOTPView.as_view(), name="resend-otp"),  # optional but useful,
    path("upload-medical-report/", views.UploadMedicalReportView.as_view(), name="upload-medical-report"),
    path("dashboard-data/", views.Dashboard_Data_View.as_view(),name="dashboard-data"),
    # path("report/<str:category>/", views.ReportView.as_view(),name="report")
    path("reports/analysis/", views.ReportAnalysisView.as_view(), name="report-analysis"),
    path("reports/report-ai-insights/", views.ReportAiInsightsView.as_view(), name="report-ai-insights"),

    path("detection/analyze/", views.PredictDiseaseView.as_view(), name="detection-analyze"),
    path("detection/ai-insights/", views.DetectionAiInsightsView.as_view(), name="detection-ai-insights"),

    
]
