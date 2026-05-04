from django.db.models.signals import post_save,post_delete,pre_save
from django.dispatch import receiver
from .models import CustomUser, PersonalDetail, OTP,MedicalReport


@receiver(post_save, sender=CustomUser)
def create_personal_detail(sender, instance, created, **kwargs):
    """
    Automatically create a PersonalDetail record whenever a new CustomUser is created.
    """
    if created:
        PersonalDetail.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_personal_detail(sender, instance, **kwargs):
    """
    Ensure the related PersonalDetail is saved whenever the user is saved.
    """
    if hasattr(instance, 'personal_detail'):
        instance.personal_detail.save()


# Signal removed because MedicalReport does not have 'medicalimage' field.
# OCR logic moved to serializer.
