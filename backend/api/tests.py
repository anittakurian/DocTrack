from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, time

from .models import Patient, Appointment, MedicalRecord

class AuthenticationTests(APITestCase):
    def test_doctor_registration(self):
        url = reverse('auth_register')
        data = {
            'username': 'testdoctor',
            'email': 'doctor@test.com',
            'password': 'strongpassword123',
            'first_name': 'Jane',
            'last_name': 'Doe'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testdoctor')


class PatientManagementTests(APITestCase):
    def setUp(self):
        # Create two separate doctor accounts
        self.doctor_a = User.objects.create_user(username='doctor_a', password='password123')
        self.doctor_b = User.objects.create_user(username='doctor_b', password='password123')
        
        # Create a patient for Doctor A
        self.patient_a = Patient.objects.create(
            doctor=self.doctor_a,
            first_name='Alice',
            last_name='Smith',
            dob=date(1990, 5, 12),
            gender='Female',
            phone='1234567890',
            email='alice@example.com'
        )

    def test_get_patients_requires_auth(self):
        url = reverse('patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_doctor_sees_only_own_patients(self):
        # Log in as Doctor A
        self.client.force_authenticate(user=self.doctor_a)
        url = reverse('patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['first_name'], 'Alice')

        # Log in as Doctor B (should see no patients)
        self.client.force_authenticate(user=self.doctor_b)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_soft_delete_patient(self):
        # Log in as Doctor A
        self.client.force_authenticate(user=self.doctor_a)
        
        # Schedule an appointment
        appointment = Appointment.objects.create(
            patient=self.patient_a,
            doctor=self.doctor_a,
            date=date.today(),
            time=time(10, 0),
            status='Scheduled'
        )

        url = reverse('patient-detail', args=[self.patient_a.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Check database: patient is soft-deleted (is_active=False)
        self.patient_a.refresh_from_db()
        self.assertFalse(self.patient_a.is_active)

        # Check that patient is excluded from active query list
        list_url = reverse('patient-list')
        list_response = self.client.get(list_url)
        self.assertEqual(len(list_response.data), 0)

        # Check that scheduled appointments for the patient are cancelled
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'Cancelled')


class AppointmentSchedulingTests(APITestCase):
    def setUp(self):
        self.doctor = User.objects.create_user(username='doctor', password='password123')
        self.patient = Patient.objects.create(
            doctor=self.doctor,
            first_name='Bob',
            last_name='Jones',
            dob=date(1985, 10, 24),
            gender='Male'
        )
        self.client.force_authenticate(user=self.doctor)

    def test_create_appointment(self):
        url = reverse('appointment-list')
        data = {
            'patient': self.patient.id,
            'date': '2026-06-20',
            'time': '14:30:00',
            'notes': 'Follow up check'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        
        apt = Appointment.objects.get()
        self.assertEqual(apt.patient, self.patient)
        self.assertEqual(apt.status, 'Scheduled')
