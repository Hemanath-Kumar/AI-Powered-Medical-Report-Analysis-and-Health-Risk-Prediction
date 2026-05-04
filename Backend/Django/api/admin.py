from django.contrib import admin 
from .models import CustomUser,OTP,PersonalDetail,MedicalReport,MedicalReportOCR,Predication
# Register your models here.

admin.site.register(CustomUser)
admin.site.register(OTP)


# admin.site.register(MedicalReport)

@admin.register(Predication)
class predictionAdmin(admin.ModelAdmin):
    readonly_fields = (
        "Predicationid",
        "user",
        "summary",
        "probability_value",
        "prediction_result",
    )
    fields = (
        "user",
        "summary",
        "probability_value",
        "prediction_result",
        "created_at",
    )


@admin.register(PersonalDetail)
class PersonalDetailAdmin(admin.ModelAdmin):
    readonly_fields = ("user",)




@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    readonly_fields = (
        "user",
        "MedicalReportid",
        "encrypted_data_key_nonce",
        "summary",
        
    )
    fields = (
        "user",
        "MedicalReportid",
        "encrypted_data_key_nonce",
        "summary",
        "created_at",
    )

    # def encrypted_data_key_preview(self, obj):
    #     if obj.encrypted_data_key:
    #         return obj.encrypted_data_key.hex()[:50] + "..."
    #     return "None"

    # encrypted_data_key_preview.short_description = "Encrypted Data Key (Hex Preview)"



@admin.register(MedicalReportOCR)
class MedicalReportOCRAdmin(admin.ModelAdmin):
    readonly_fields = (
        "report",
       
        "encrypted_extracted_text",
        "encrypted_extracted_text_nonce",
        
        
    )