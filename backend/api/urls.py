from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, UserMeView, PatientViewSet, AppointmentViewSet,
    MedicalRecordViewSet, AttachmentViewSet, DashboardStatsView,
    AIFormatNoteView, AIPatientSummaryView, AIOCRView
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'records', MedicalRecordViewSet, basename='record')
router.register(r'files', AttachmentViewSet, basename='file')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserMeView.as_view(), name='auth_me'),
    
    # Dashboard analytics
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    
    # AI service endpoints
    path('ai/format-note/', AIFormatNoteView.as_view(), name='ai_format_note'),
    path('ai/patient-summary/<int:patient_id>/', AIPatientSummaryView.as_view(), name='ai_patient_summary'),
    path('ai/ocr/', AIOCRView.as_view(), name='ai_ocr'),
    
    # Viewset routes
    path('', include(router.urls)),
]
