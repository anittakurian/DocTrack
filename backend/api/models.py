from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=20)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True) # Soft delete field
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        ordering = ['-created_at']


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.patient} - {self.date} {self.time} ({self.status})"

    class Meta:
        ordering = ['date', 'time']


class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='records')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records')
    visit_date = models.DateField()
    symptoms = models.TextField()
    diagnosis = models.TextField(blank=True, null=True)
    prescription = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.patient} - {self.visit_date}"

    class Meta:
        ordering = ['-visit_date']


class Attachment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='attachments')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='attachments')
    # If Cloudinary is configured, we can upload directly, otherwise standard storage applies.
    file = models.FileField(upload_to='medical_attachments/')
    file_url = models.URLField(max_length=500, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Automatically populate file_url with the file's url after saving (local or Cloudinary url)
        super().save(*args, **kwargs)
        if self.file and not self.file_url:
            self.file_url = self.file.url
            super().save(update_fields=['file_url'])

    def __str__(self):
        return f"Attachment {self.id} for {self.patient}"
