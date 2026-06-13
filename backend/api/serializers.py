from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Appointment, MedicalRecord, Attachment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            'id', 'first_name', 'last_name', 'dob', 'gender', 
            'phone', 'email', 'blood_group', 'address', 
            'emergency_contact', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class PatientMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ('id', 'first_name', 'last_name', 'phone', 'email')


class AppointmentSerializer(serializers.ModelSerializer):
    # Support read-only detailed nested patient representation
    patient_detail = PatientMinimalSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.none())

    class Meta:
        model = Appointment
        fields = ('id', 'patient', 'patient_detail', 'date', 'time', 'status', 'notes')
        read_only_fields = ('id',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamic scoping: filter the patient queryset by the request doctor
        request = self.context.get('request')
        if request and request.user:
            self.fields['patient'].queryset = Patient.objects.filter(
                doctor=request.user, 
                is_active=True
            )


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_detail = PatientMinimalSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.none())

    class Meta:
        model = MedicalRecord
        fields = ('id', 'patient', 'patient_detail', 'visit_date', 'symptoms', 'diagnosis', 'prescription', 'notes')
        read_only_fields = ('id',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamic scoping: filter the patient queryset by the request doctor
        request = self.context.get('request')
        if request and request.user:
            self.fields['patient'].queryset = Patient.objects.filter(
                doctor=request.user, 
                is_active=True
            )


class AttachmentSerializer(serializers.ModelSerializer):
    patient_detail = PatientMinimalSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.none())
    medical_record_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Attachment
        fields = ('id', 'patient', 'patient_detail', 'medical_record', 'medical_record_detail', 'file', 'file_url', 'uploaded_at')
        read_only_fields = ('id', 'file_url', 'uploaded_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user:
            self.fields['patient'].queryset = Patient.objects.filter(
                doctor=request.user, 
                is_active=True
            )

    def get_medical_record_detail(self, obj):
        if obj.medical_record:
            return {
                'id': obj.medical_record.id,
                'visit_date': obj.medical_record.visit_date,
                'diagnosis': obj.medical_record.diagnosis
            }
        return None
