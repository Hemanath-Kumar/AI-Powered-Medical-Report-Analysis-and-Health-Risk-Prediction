from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)
    
    

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"   # use email for login
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email
    


class OTP(models.Model):
    transaction_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    @classmethod
    def create_otp(cls, user, code, validity_minutes=5):
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timezone.timedelta(minutes=validity_minutes),
        )

    def is_valid(self, code):
        return self.code == code and timezone.now() <= self.expires_at
    
    def __str__(self):
        return self.user.email


class PersonalDetail(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="personal_detail",null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    dateOfBirth = models.DateField(blank=True, null=True)
    bloodType = models.CharField(max_length=5, choices=[
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ], blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ], blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.user.name
currentdate=timezone.now()

class MedicalReport(models.Model):
    MedicalReportid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="reports")

    summary = models.TextField(blank=True, null=True)
    encrypted_data_key = models.BinaryField(null=True, blank=True)
    encrypted_data_key_nonce = models.BinaryField(null=True, blank=True)

    created_at = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.name} --- {self.created_at} --- {self.MedicalReportid}"

class MedicalReportOCR(models.Model):
    report = models.ForeignKey(MedicalReport, on_delete=models.CASCADE, related_name="ocr_results")
    file_name = models.CharField(max_length=255)
    encrypted_extracted_text = models.BinaryField(null=True, blank=True)
    encrypted_extracted_text_nonce = models.BinaryField(null=True, blank=True)

    def __str__(self):
        return f"{self.report.user.name} --- {self.report.created_at} --- {self.report.MedicalReportid}"

class Predication(models.Model):
    Predicationid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user=models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="predications")
    summary= models.TextField(blank=True, null=True)
    # recommended_action= models.TextField(blank=True, null=True)
    probability_value = models.JSONField(blank=True, null=True)
    prediction_result=models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.name} --- {self.created_at} "