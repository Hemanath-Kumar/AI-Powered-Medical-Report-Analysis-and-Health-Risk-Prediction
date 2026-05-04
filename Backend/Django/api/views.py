from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import OTP,PersonalDetail,CustomUser,MedicalReport,MedicalReportOCR,Predication
from .utils import generate_otp, send_otp_email,get_tokens_for_user,run_ocr_task,categorize_tests, PATTERNS
from .serializers import SignupSerializer,SigninSerializer,ProfileViewSerializer,UploadMedicalReportSerializer,ReportSerializer, MedicalReportOCRSerializer,PredicationSerializer
from rest_framework.permissions import IsAuthenticated
import os 
import json
from Rag.rag import rag_pipeline_class
from Rag.vectordb import vector_db

import httpx
from environ import Env

env=Env()
env.read_env()
from django.utils import timezone
from dateutil.relativedelta import relativedelta




class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        # if not serializer.is_valid():
        #     print("ERROR:", serializer.errors)  
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.is_valid(raise_exception=True)
        # 1. create user
        user = serializer.save()

        # 2. generate otp
        otp_code = generate_otp()
        otp_obj = OTP.create_otp(user, otp_code)

        # 3. send email
        send_otp_email(user, otp_code)

        return Response({
            "transaction_id": str(otp_obj.transaction_id),
            "message": "OTP sent to email"
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    def post(self, request):
        transaction_id = request.data.get("transaction_id")
        otp_code = request.data.get("otp")
        try:
            otp_obj = OTP.objects.get(transaction_id=transaction_id, code=otp_code, is_used=False)

        except OTP.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not otp_obj.is_valid(otp_code):
            return Response({"error": "OTP Expired"}, status=status.HTTP_400_BAD_REQUEST)

        #OTP verified → activate user
        user = otp_obj.user
        user.is_active = True
        user.save()

        otp_obj.is_used = True
        otp_obj.save()
        token=get_tokens_for_user(user)
        return Response({"message": "Account verified successfully!",
                         "token":token,
                         "user":{"name":user.name,
                                 "email":user.email
                                 }
                         })
    


class SigninView(APIView):
    def post(self, request):
       
        serializer = SigninSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        token=get_tokens_for_user(user)


        return Response({
            "token": token,
            "user":{"name":user.name,
                    "email":user.email
                    }
        }, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):   
   
        # print(request.headers)

        try:
            user = request.user
            serializer = ProfileViewSerializer(user.personal_detail)
            # print(serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        
    def put(self, request):
        try:
            user = request.user
            
            # --- Manually update CustomUser fields (name/email) ---
            req_name = request.data.get("user")  # Frontend sends name as 'user'
            req_email = request.data.get("email")
            
            user_changed = False
            if req_name and req_name != user.name:
                user.name = req_name
                user_changed = True
                
            if user_changed:
                user.save()
            # ------------------------------------------------------

            # Use get_or_create to ensure PersonalDetail exists
            personal_detail, created = PersonalDetail.objects.get_or_create(user=user)
            
            serializer = ProfileViewSerializer(personal_detail, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )


class UploadMedicalReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            images = request.FILES.getlist("medicalimage")
            date = request.data.get("date")
            
            if not images:
                return Response(
                    {"error": "No images uploaded"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            
            medicalreport=MedicalReport.objects.create(
                user=user,
                created_at=date
            )
            
            data_key = os.urandom(32)  
            run_ocr_task(medicalreport,images,data_key)
   


            return Response(
                {"success": "Medical report uploaded successfully."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("ERROR:", str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        try:
            user = request.user
            # Get reports directly. 
            # Use prefetch_related to optimize the nested 'ocr_results' lookup
            medical_reports = MedicalReport.objects.filter(user=user).prefetch_related('ocr_results')

            serializer = UploadMedicalReportSerializer(medical_reports, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )



class Dashboard_Data_View(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):

        try:
            user = request.user
            medical_reports = MedicalReport.objects.filter(user=user).prefetch_related('ocr_results')
            serializer = ReportSerializer(medical_reports, many=True)

            data=categorize_tests(serializer.data)

            return Response(data, status=status.HTTP_200_OK)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )

class ReportAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            user = request.user
            medical_reports = MedicalReport.objects.filter(user=user).prefetch_related('ocr_results').order_by('-created_at')
            
            response_data = []
            
            for report in medical_reports:
                metrics = {}
                ocr_results = report.ocr_results.all()
                file_name = f"Medical Report - {report.created_at}"
                
                for ocr in ocr_results:
                    if ocr.file_name:
                        file_name = ocr.file_name
                    
                    ocr_data = MedicalReportOCRSerializer(ocr).data
                    decrypted = ocr_data.get("decrypted_text") or {}
                    tests = decrypted.get("test_results", [])
                    
                    for test in tests:
                        name = test.get("test_name", "")
                        value = test.get("result")
                        
                        matched = False
                        for key, pattern in PATTERNS.items():
                            if pattern.search(name):
                                if key != "blood_pressure":
                                    try:
                                        value = float(value)
                                    except:
                                        continue
                                metrics[key] = value
                                matched = True
                                break
                                
                        if not matched and name:
                            clean_name = name.lower().strip().replace(" ", "_")
                            try:
                                parsed_val = float(value)
                            except:
                                parsed_val = value
                            metrics[clean_name] = parsed_val
                
                response_data.append({
                    "id": str(report.MedicalReportid),
                    "reportName": "Medical Report",
                    "date": report.created_at.isoformat() if hasattr(report.created_at, 'isoformat') else str(report.created_at),
                    "type": "blood_test",
                    "metrics": metrics,
                    "aiSummary": report.summary or "Summary is currently being generated...",
                    "status": "completed" if report.summary else "processing",
                })
                
            return Response(response_data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )


class ReportAiInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            
            user = request.user
            reportId = request.data.get("reportId")
            type     = request.data.get("type") 

            vector_db_obj = vector_db()
            data = vector_db_obj.get_Report_Ai_Insights_summary(reportId, type)
            if data:
                return Response({"message": "AI insights already generated."}, status=status.HTTP_200_OK)
            
            else:
                medical_report = MedicalReport.objects.get(user=user, MedicalReportid=reportId)
                rag = rag_pipeline_class()
                
                if type == "food":
                    rag.Report_Ai_Insights_summary(medical_report, "food")
                elif type == "workout":
                    rag.Report_Ai_Insights_summary(medical_report, "workout")
                elif type == "short_summary":
                    rag.Report_Ai_Insights_summary(medical_report, "short_summary")
                elif type == "specialist":
                    rag.Report_Ai_Insights_summary(medical_report, "specialist") 
                else:
                    return Response({"message": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
            
                return Response({"message": "AI insights generated successfully."}, status=status.HTTP_200_OK)

        except MedicalReport.DoesNotExist:
            return Response({"message": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request):
        try:
            
            reportId = request.query_params.get("reportId")
            type     = request.query_params.get("type")     

            vector_db_obj = vector_db()
            data = vector_db_obj.get_Report_Ai_Insights_summary(reportId, type)

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PredictDiseaseView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
    
        try:
            
            # payload = {
            #     male: 1,
            #     age: 45,
            #     cigsPerDay: 0,
            #     BPMeds: 0,
            #     prevalentHyp: 0,
            #     diabetes: 0,
            #     totChol: 210,
            #     sysBP: 128,
            #     BMI: 24.6,
            #     glucose: 92,
            #     }

            user = request.user
            data=request.data
           
            try:
                r = httpx.post(
                    f"{env('fastapi_url')}MLmodel/predict",
                    timeout=httpx.Timeout(connect=10.0, read=15.0, write=10.0, pool=10.0),
                    json={"data": data}
                )
                r.raise_for_status()
                data = r.json()
              
                result= data["data"]["result"]
                probability= data["data"]["probability"]
                today = timezone.now().date()
                three_months_ago = today - relativedelta(months=3)
                print("1")
                report_ids = list(
                    MedicalReport.objects.filter(
                        user=user,
                        created_at__gte=three_months_ago
                    )
                )
                print("2")
                predication=Predication.objects.create(
                    user=user,
                    probability_value={"probability": probability},
                    prediction_result=result,
                    created_at=timezone.now()
                )
                # risk_score   = round(probability * 100, 1) 
                print("3")
                rag=rag_pipeline_class()
                rag.Prediction_AI_Summary(report_ids,predication)
                print("4")
               
                
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({"message": f"Error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({"message": "AI Summary generated successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)     

    def get(self,request):
        try:
            user = request.user
            Predication_reports = Predication.objects.filter(user=user)
            serializer = PredicationSerializer(Predication_reports, many=True)

            raw_data=serializer.data
           
           
            data=[]
            for item in raw_data:
                # Parse the summary string into a JSON object
                prediction_obj = {}
                ai_summary_obj = {}
                
                summary_raw = item.get("summary") or ""
                if summary_raw:
                    try:
                        # Clean up LLM output: remove markdown fences, json prefix, etc.
                        cleaned = summary_raw.strip()
                        
                        # Remove markdown code fences: ```json ... ``` or ``` ... ```
                        if "```" in cleaned:
                            import re
                            match = re.search(r'```(?:json)?\s*([\s\S]*?)```', cleaned)
                            if match:
                                cleaned = match.group(1).strip()
                        
                        # Remove leading "json" prefix (from partial fence stripping)
                        if cleaned.startswith("json"):
                            cleaned = cleaned[4:].strip()
                        
                        # Extract JSON object if there's extra text around it
                        first_brace = cleaned.find("{")
                        last_brace = cleaned.rfind("}")
                        if first_brace != -1 and last_brace != -1:
                            cleaned = cleaned[first_brace:last_brace + 1]
                        
                        parsed = json.loads(cleaned)
                        prediction_obj = parsed.get("prediction", {})
                        ai_summary_obj = parsed.get("aiSummary", {})
                    except (json.JSONDecodeError, Exception) as e:
                        print(f"Error parsing summary JSON: {e}")
                        print(f"Raw summary (first 200 chars): {summary_raw[:200]}")
                        # Fallback: return safe structure so frontend doesn't crash
                        prediction_obj = {
                            "condition": "Summary parsing error",
                            "confidence": 0,
                            "risk": "unknown",
                            "recommendations": []
                        }
                        ai_summary_obj = {
                            "summary": summary_raw,
                            "key_findings": [],
                            "doctors_note": ""
                        }

                data.append({
                    "id": item["Predicationid"],
                    "reportName": "Heart Disease Prediction",
                    "date": item["created_at"],
                    "prediction": prediction_obj,
                    "aiSummary": ai_summary_obj,
                })
       
            return Response(data, status=status.HTTP_200_OK)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )


class DetectionAiInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            
            user = request.user
            reportId = request.data.get("reportId")
            predictionQuestionId = request.data.get("predictionQuestionId")

            vector_db_obj = vector_db()
            data = vector_db_obj.get_prediction_Ai_Insights_summary(reportId, predictionQuestionId)

            if data:
                return Response({"message": "AI insights already generated."}, status=status.HTTP_200_OK)
            
            else:
                # Look up the Predication instance — the RAG method needs the model object,
                # not the raw string, because it accesses .user.id, .Predicationid, .user.name
                predication = Predication.objects.get(user=user, Predicationid=reportId)

                print("Generating AI insights...")
                rag = rag_pipeline_class()
                rag.Prediction_Ai_Insights_summary(predication, predictionQuestionId)
                print("AI insights generated successfully.")

            return Response({"message": "AI insights generated successfully."}, status=status.HTTP_200_OK)

        except Predication.DoesNotExist:
            return Response({"message": "Prediction not found"}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request):
        try:
            
            reportId = request.query_params.get("reportId")
            predictionQuestionId = request.query_params.get("predictionQuestionId")    
            vector_db_obj = vector_db()
            data = vector_db_obj.get_prediction_Ai_Insights_summary(reportId, predictionQuestionId)

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

