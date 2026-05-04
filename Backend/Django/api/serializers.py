from rest_framework import serializers
from .models import CustomUser,PersonalDetail,MedicalReport,MedicalReportOCR,Predication
from django.contrib.auth import authenticate
from .utils import run_ocr_task,decrypt_data,decrypt_data_key,categorize_tests
from environ import Env
import json
import re
env=Env()
env.read_env()

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ["email", "name", "password"]
        extra_kwargs = {
            "email": {"validators": []}
        }


    def create(self, validated_data):
        email = validated_data["email"]

        existing_user = CustomUser.objects.filter(email=email).first()

        if existing_user:
            if existing_user.is_active:
                raise serializers.ValidationError({"email": "Email ready exists and is verified."})
            
            # If inactive → clean old OTPs but DO NOT delete user
            existing_user.otps.filter(is_used=False).delete()
            return existing_user
        

        user = CustomUser.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
            is_active=False
        )

        return user



class SigninSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password = serializers.CharField(write_only=True)

    
    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
       
        if email and password:
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    ("Invalid email or password."),
                    code="authorization"
                )
        else:
            raise serializers.ValidationError(
                ("Must include 'email' and 'password'."),
                code="authorization"
            )

        data["user"] = user
        return data
    
class ProfileViewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = PersonalDetail
        fields = [
                "user",
                "phone",
                "dateOfBirth",
                "bloodType",
                "gender",
                "allergies",
            ]


class MedicalReportOCRSerializer(serializers.ModelSerializer):
    decrypted_text = serializers.SerializerMethodField()

    class Meta:
        model = MedicalReportOCR
        fields = [ "file_name", "decrypted_text"]

    def get_decrypted_text(self, obj):
        if not obj.report.encrypted_data_key or not obj.encrypted_extracted_text:
            return None

        master_key = env("MASTER_KEY").encode("utf-8")

        try:
            # 1. Decrypt data key
            decrypted_data_key = decrypt_data_key(
                nonce=obj.report.encrypted_data_key_nonce,
                encrypted_key=obj.report.encrypted_data_key,
                master_key=master_key
            )
            
            # 2. Decrypt extracted text
            decrypted_text = decrypt_data(
                nonce=obj.encrypted_extracted_text_nonce,
                encrypted_data=obj.encrypted_extracted_text,
                data_key=decrypted_data_key
            )
            
            if isinstance(decrypted_text, bytes):
                decrypted_text = decrypted_text.decode("utf-8")

            # Clean up potential markdown formatting from LLM/OCR response
            cleaned = decrypted_text.replace("```json", "").replace("```", "").strip()

            try:
                return json.loads(cleaned)

            except json.JSONDecodeError:
                # 5️Attempt simple auto-repair
                repaired = self._repair_json(cleaned)
                try:
                    return json.loads(repaired)
                except Exception:
                    # Always return consistent structure
                    return {
                        "is_valid_json": False,
                        "raw_text": cleaned
                    }
         
        except Exception as e:
            print("ERROR:", e)
            print("OCR ID:", obj.id)
            return {
                "error": str(e)
            }
    
    def _repair_json(self, text):
        # Remove trailing commas
        text = re.sub(r",\s*}", "}", text)
        text = re.sub(r",\s*]", "]", text)

        # Try to close missing braces
        open_braces = text.count("{")
        close_braces = text.count("}")
        if open_braces > close_braces:
            text += "}" * (open_braces - close_braces)

        return text

class UploadMedicalReportSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.name", read_only=True)
    ocr_results = MedicalReportOCRSerializer(many=True, read_only=True)
    created_at = serializers.SerializerMethodField()

    def get_created_at(self, obj):
        return obj.created_at.isoformat()

    class Meta:
        model = MedicalReport
        fields = [
            "MedicalReportid",
            "user",
            "created_at",
            "ocr_results",
        ]


class ReportSerializer(serializers.ModelSerializer):
    ocr_results = MedicalReportOCRSerializer(many=True, read_only=True)
    created_at = serializers.SerializerMethodField()

    def get_created_at(self, obj):
        return obj.created_at.isoformat()


    class Meta:
        model = MedicalReport
        fields = [
            "created_at",
            "ocr_results",
        ]

class PredicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Predication
        fields = [
            "Predicationid",
            "created_at",
            "summary",
            "probability_value",
            "prediction_result",
            
        ]
