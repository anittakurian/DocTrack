from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from datetime import date

from .models import Patient, Appointment, MedicalRecord, Attachment
from .serializers import (
    UserSerializer, RegisterSerializer, PatientSerializer,
    AppointmentSerializer, MedicalRecordSerializer, AttachmentSerializer
)
from .ai_services import format_consultation_note, generate_patient_summary, run_ocr_on_report


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)


class UserMeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        # Enforce multi-tenancy and soft delete filter
        return Patient.objects.filter(doctor=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete: set is_active=False instead of deleting row
        instance.is_active = False
        instance.save()
        # Soft-delete all future scheduled appointments for this patient
        Appointment.objects.filter(patient=instance, status='Scheduled').update(status='Cancelled')


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Appointment.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return MedicalRecord.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return Attachment.objects.filter(patient__doctor=self.request.user)

    def perform_create(self, serializer):
        # Fetch target patient and double-check doctor ownership
        patient_id = self.request.data.get('patient')
        patient = get_object_or_404(Patient, id=patient_id, doctor=self.request.user)
        serializer.save(patient=patient)


class DashboardStatsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        doctor = request.user
        today = date.today()

        # Gather metrics
        total_patients = Patient.objects.filter(doctor=doctor, is_active=True).count()
        total_appointments = Appointment.objects.filter(doctor=doctor).count()
        appointments_today = Appointment.objects.filter(doctor=doctor, date=today).count()
        completed_consultations = Appointment.objects.filter(doctor=doctor, status='Completed').count()

        # Recent 5 patients registered
        recent_patients = Patient.objects.filter(doctor=doctor, is_active=True).order_by('-created_at')[:5]
        # Upcoming 5 scheduled appointments
        upcoming_appointments = Appointment.objects.filter(
            doctor=doctor, 
            status='Scheduled', 
            date__gte=today
        ).order_by('date', 'time')[:5]

        return Response({
            "metrics": {
                "total_patients": total_patients,
                "total_appointments": total_appointments,
                "appointments_today": appointments_today,
                "completed_consultations": completed_consultations,
            },
            "recent_patients": PatientSerializer(recent_patients, many=True).data,
            "upcoming_appointments": AppointmentSerializer(upcoming_appointments, many=True).data
        })


# --- AI Endpoints ---

class AIFormatNoteView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        raw_text = request.data.get('raw_text', '')
        if not raw_text:
            return Response({"error": "raw_text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        formatted_text = format_consultation_note(raw_text)
        return Response({"formatted_text": formatted_text})


class AIPatientSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id, doctor=request.user, is_active=True)
        # Fetch history records
        records = MedicalRecord.objects.filter(patient=patient, doctor=request.user).order_by('-visit_date')
        summary = generate_patient_summary(patient, records)
        return Response({"summary": summary})


class AIOCRView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_bytes = uploaded_file.read()
            mime_type = uploaded_file.content_type or 'image/jpeg'
            
            ocr_text = run_ocr_on_report(file_bytes, mime_type)
            return Response({"extracted_text": ocr_text})
        except Exception as e:
            return Response({"error": f"OCR failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
