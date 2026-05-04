import random
import threading
from async_timeout import timeout
from click import prompt
from django.core.mail import send_mail
import httpx
from rest_framework_simplejwt.tokens import RefreshToken
import json
from .models import MedicalReportOCR,MedicalReport
import io
import queue
import time
import re
from Rag.rag import rag_pipeline_class
from environ import Env
from collections import defaultdict

from rest_framework.response import Response
import threading
import logging
from django.conf import settings
import requests
import threading
import logging
from django.conf import settings


env=Env()
env.read_env()

def generate_otp():
    return str(random.randint(100000, 999999))



logger = logging.getLogger(__name__)

def send_otp_email(user, otp):
    def email_task():
        try:
            response = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "sender": {"name": "SocialNetwork", "email": "socialnetwork.website7@gmail.com"},
                    "to": [{"email": user.email}],
                    "subject": "Your OTP Code",
                    "textContent": f"Your OTP is {otp}. It expires in 5 minutes.",
                }
            )
            response.raise_for_status()
            print(f"OTP email sent successfully to {user.email}", flush=True)
        except Exception as e:
            print(f"Failed to send OTP email to {user.email}: {e}", flush=True)

    threading.Thread(target=email_task, daemon=True).start()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }




#encrypt data
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

#encrypt data 
def encrypt_data(data, data_key):
    aesgcm = AESGCM(data_key)
    nonce = os.urandom(12)   # 96-bit nonce for GCM
    encrypted = aesgcm.encrypt(nonce, data, None)
    return nonce, encrypted

def encrypt_data_key(data_key, master_key):
    aesgcm = AESGCM(master_key)
    nonce = os.urandom(12)
    encrypted_key = aesgcm.encrypt(nonce, data_key, None)
    return nonce, encrypted_key

#decrypt data

def decrypt_data(nonce, encrypted_data, data_key):
    aesgcm = AESGCM(data_key)
    decrypted = aesgcm.decrypt(nonce, encrypted_data, None)
    return decrypted

def decrypt_data_key(nonce, encrypted_key, master_key):
    aesgcm = AESGCM(master_key)
    decrypted_key = aesgcm.decrypt(nonce, encrypted_key, None)
    return decrypted_key



PATTERNS = {

    # Blood Sugar
    "blood_sugar": re.compile(r"sugar|glucose|fbs|fpg|fasting\s*glucose|rbs|random\s*glucose|ppbs|post\s*prandial", re.I),
    "hba1c": re.compile(r"hba1c|glycated\s*hemoglobin", re.I),

    # Lipid Profile (Ratios and highly specific ones must be matched first!)
    "chol_hdl_ratio": re.compile(r"chou?/hdl|cholesterol/hdl", re.I),
    "ldl_hdl_ratio": re.compile(r"ldl/hdl", re.I),
    "vldl": re.compile(r"v[\s\.]*l[\s\.]*d[\s\.]*l", re.I),
    "hdl": re.compile(r"\bh[\s\.]*d[\s\.]*l", re.I),
    "ldl": re.compile(r"\bl[\s\.]*d[\s\.]*l", re.I),
    "total_cholesterol": re.compile(r"total\s*cholesterol", re.I),
    "triglycerides": re.compile(r"triglycerides?", re.I),

    # Kidney Function
    "creatinine": re.compile(r"creatinine|catainine", re.I),
    "urea": re.compile(r"urea|blood\s*urea", re.I),
    "bun": re.compile(r"bun|blood\s*urea\s*nitrogen", re.I),
    "uric_acid": re.compile(r"uric\s*acid", re.I),
    "egfr": re.compile(r"egfr|estimated\s*gfr", re.I),

    # Liver Function
    "sgpt_alt": re.compile(r"sgpt|alt|alanine\s*aminotransferase", re.I),
    "sgot_ast": re.compile(r"sgot|ast|aspartate\s*aminotransferase", re.I),
    "bilirubin_total": re.compile(r"total\s*bilirubin", re.I),
    "bilirubin_direct": re.compile(r"direct\s*bilirubin", re.I),
    "bilirubin_indirect": re.compile(r"indirect\s*bilirubin", re.I),
    "alkaline_phosphatase": re.compile(r"alkaline\s*phosphatase|alp", re.I),
    "protein_total": re.compile(r"total\s*protein", re.I),
    "albumin": re.compile(r"albumin", re.I),
    "globulin": re.compile(r"globulin", re.I),
    "a_g_ratio": re.compile(r"a\s*/\s*g\s*ratio", re.I),

    # Complete Blood Count
    "hemoglobin": re.compile(r"ha?emoglobin|hb\b", re.I),
    "rbc": re.compile(r"\brbc\b|red\s*blood\s*cells?", re.I),
    "wbc": re.compile(r"\bwbc\b|white\s*blood\s*cells?", re.I),
    "platelets": re.compile(r"platelet\s*count|platelets?", re.I),
    "hematocrit": re.compile(r"hematocrit|hct", re.I),
    "mcv": re.compile(r"\bmcv\b|mean\s*corpuscular\s*volume", re.I),
    "mch": re.compile(r"\bmch\b", re.I),
    "mchc": re.compile(r"\bmchc\b", re.I),
    "rdw": re.compile(r"\brdw\b", re.I),

    # Thyroid
    "tsh": re.compile(r"\btsh\b|thyroid\s*stimulating\s*hormone", re.I),
    "t3": re.compile(r"\bt3\b|triiodothyronine", re.I),
    "t4": re.compile(r"\bt4\b|thyroxine", re.I),
    "free_t3": re.compile(r"free\s*t3", re.I),
    "free_t4": re.compile(r"free\s*t4", re.I),

    # Electrolytes
    "sodium": re.compile(r"sodium|\bna\+\b", re.I),
    "potassium": re.compile(r"potassium|\bk\+\b", re.I),
    "chloride": re.compile(r"chloride|\bcl-\b", re.I),
    "calcium": re.compile(r"calcium", re.I),
    "magnesium": re.compile(r"magnesium", re.I),
    "phosphorus": re.compile(r"phosphorus|phosphate", re.I),

    # Vitamins
    "vitamin_d": re.compile(r"vitamin\s*d|25[-\s]*oh\s*vitamin\s*d", re.I),
    "vitamin_b12": re.compile(r"vitamin\s*b12|cobalamin", re.I),
    "folate": re.compile(r"folate|folic\s*acid", re.I),

    # Urine Test
    "urine_ph": re.compile(r"urine\s*ph", re.I),
    "urine_protein": re.compile(r"urine\s*protein", re.I),
    "urine_glucose": re.compile(r"urine\s*glucose", re.I),
    "urine_ketone": re.compile(r"urine\s*ketone", re.I),
    "urine_rbc": re.compile(r"urine\s*rbc", re.I),
    "urine_wbc": re.compile(r"urine\s*wbc", re.I),

    # Vitals
    "blood_pressure": re.compile(r"\bbp\b|blood\s*pressure", re.I),
    "pulse": re.compile(r"pulse|heart\s*rate", re.I),
    "temperature": re.compile(r"temperature|temp", re.I),
    "weight": re.compile(r"\bwt\b|\bweight\b|\bcwt\b", re.I),
    "height": re.compile(r"\bht\b|\bheight\b", re.I),
    "bmi": re.compile(r"\bbmi\b|body\s*mass\s*index", re.I),
}

#ReportView Get Request
def categorize_tests(reports):

    result = defaultdict(list)

    for report in reports:
        
        date = report["created_at"]

        for ocr in report.get("ocr_results", []):

            tests = ocr.get("decrypted_text", {}).get("test_results", [])

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

                        result[key].append({
                            "date": date,
                            "value": value
                        })
                        matched = True
                        break

                # If no pattern matched, passthrough the original name dynamically
                if not matched and name:
                    clean_name = name.lower().strip().replace(" ", "_")
                    try:
                        parsed_val = float(value)
                    except:
                        parsed_val = value

                    result[clean_name].append({
                        "date": date,
                        "value": parsed_val
                    })

    return dict(result)






class OCRTaskQueue:
    _instance = None
    _queue = queue.Queue()
    _worker_thread = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCRTaskQueue, cls).__new__(cls)
            cls._instance._worker_thread = None
            cls._instance._report_tracker = {}
            cls._instance._lock = threading.Lock()
            cls._instance._start_worker()
        return cls._instance

    def _start_worker(self):
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._worker_thread = threading.Thread(target=self._worker, daemon=True)
            self._worker_thread.start()

    def _worker(self):
        print("OCR Worker started")
        from django.db import close_old_connections
        while True:
            try:
                task = self._queue.get()
                if task is None:
                    break
               
                close_old_connections()
                # Unpack all 4 arguments including file_name
                report_instance, image_bytes, data_key, file_name = task
                self._process_ocr(report_instance, image_bytes, data_key, file_name)
                
                self._mark_done(report_instance)
                self._queue.task_done()
            except Exception as e:
                print(f"Error in OCR worker: {e}")

    def _process_ocr(self, report_instance, image_bytes, data_key, file_name):
        fastapi_url = env('fastapi_url')
        report_id   = report_instance.MedicalReportid

        # ── Step 1: wake FastAPI (free tier may be cold) ──────────────────────
        for _ in range(6):
            try:
                r = httpx.get(f"{fastapi_url}health", timeout=10.0)
                if r.json().get("model_ready"):
                    break
            except Exception:
                pass
            print(f"Waiting for FastAPI to be ready... [{report_id}]")
            time.sleep(10)

        # ── Step 2: submit job — returns instantly ────────────────────────────
        job_id = None
        for attempt in range(3):
            try:
                r = httpx.post(
                    f"{fastapi_url}ocr/submit",
                    files={"file": (file_name, image_bytes, "image/jpeg")},
                    timeout=httpx.Timeout(connect=15.0, read=30.0, write=30.0, pool=10.0)
                )
                r.raise_for_status()
                job_id = r.json()["job_id"]
                print(f"OCR job submitted: {job_id} for report {report_id}")
                break
            except Exception as e:
                print(f"Submit attempt {attempt+1} failed: {e}")
                time.sleep(2 ** attempt)

        if not job_id:
            print(f"OCR submit failed after retries for report {report_id}")
            return

        # ── Step 3: poll until done ───────────────────────────────────────────
        poll_interval = 15       # seconds between polls
        max_wait      = 900      # 15 minutes max
        elapsed       = 0
        result_text   = None

        while elapsed < max_wait:
            time.sleep(poll_interval)
            elapsed += poll_interval

            try:
                r = httpx.get(
                    f"{fastapi_url}ocr/result/{job_id}",
                    timeout=httpx.Timeout(connect=10.0, read=15.0, write=10.0, pool=10.0)
                )
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                print(f"Poll error for {job_id}: {e}")
                continue

            status = data["status"]
            print(f"OCR poll [{elapsed}s] status={status} job={job_id} report={report_id}")

            if status == "done":
                raw = data.get("result", "")
                if isinstance(raw, str):
                    result_text = raw
                elif isinstance(raw, (dict, list)):
                    result_text = json.dumps(raw, ensure_ascii=False)
                break

            elif status == "failed":
                print(f"OCR job failed on FastAPI side: {data.get('error')}")
                break

            # status == "queued" or "processing" → keep polling

        # ── Step 4: cleanup job from FastAPI ─────────────────────────────────
        try:
            httpx.delete(f"{fastapi_url}ocr/result/{job_id}", timeout=5.0)
        except Exception:
            pass

        # ── Step 5: save to DB (your existing logic, unchanged) ──────────────
        if not report_instance:
            return

        ocr_report = MedicalReportOCR.objects.create(
            report=report_instance,
            file_name=file_name
        )

        try:
            print("\n\n\n")
            print("Encrypting data key")
            master_key = env('MASTER_KEY').encode('utf-8')
            nonce2, encrypted_data_key = encrypt_data_key(data_key, master_key)
            report_instance.encrypted_data_key = encrypted_data_key
            report_instance.encrypted_data_key_nonce = nonce2
            report_instance.save()
            print("Data key encrypted and saved successfully")
            print("\n\n\n")
        except Exception as e:
            print(f"Error saving data key: {e}")

        if result_text:
            print("\n\n\n")
            print("Encrypting extracted text")
            nonce, encrypted = encrypt_data(result_text.encode('utf-8'), data_key)
            ocr_report.encrypted_extracted_text = encrypted
            ocr_report.encrypted_extracted_text_nonce = nonce
            ocr_report.save()
            print("Extracted text encrypted and saved successfully")
            print("\n\n\n")
            print("RAG Pipeline started")
            rag = rag_pipeline_class()
            rag.rag_data_upload_pipeline(
                data=result_text,
                user_id=report_instance.user.id,
                report_id=report_instance.MedicalReportid,
                user_name=report_instance.user.name,
                created_at=report_instance.created_at
            )
            print("RAG Pipeline completed")
            print("\n\n\n")

        print(f"\n--- OCR worker completed for {report_id} ---\n")
            

        # ---------------- TRACKING ---------------- #
    def _mark_done(self, report_instance):
        print("MARK DONE CALLED")  
        report_id = report_instance.MedicalReportid

        with self._lock:
            tracker = self._report_tracker.get(report_id)

            if tracker:
                tracker["done"] += 1

                print(f"Progress: {tracker['done']}/{tracker['total']} for report {report_id}")

                if tracker["done"] == tracker["total"]:
                    print(f"All OCR done for report {report_id} ")

                    # Run summary
                    self._run_summary(report_instance)

                    # cleanup
                    del self._report_tracker[report_id]

    # ---------------- SUMMARY ---------------- #
    def _run_summary(self, report_instance):
        try:
            print(f"Running AI summary for report {report_instance.MedicalReportid}")

            rag=rag_pipeline_class()
            
            rag.AI_report_summary(report_instance)

            print("Summary completed ")

        except Exception as e:
            print(f"Summary failed: {e}")

    def add_task(self, report_instance, image_file, data_key):
        image_file.seek(0)
        image_bytes = image_file.read()
        file_name = image_file.name
        self._queue.put((report_instance, image_bytes, data_key, file_name))
        print(f"Added OCR task for report {report_instance.MedicalReportid} to queue")

# Initialize the queue
ocr_queue = OCRTaskQueue()

def run_ocr_task(report_instance, image_file, data_key):
    total = len(image_file)
    print(total)
    # Initialize tracking
    with ocr_queue._lock:
        ocr_queue._report_tracker[report_instance.MedicalReportid] = {
            "total": total,
            "done": 0
        }

    # Add all images to queue
    for image in image_file:
        ocr_queue.add_task(report_instance, image, data_key)












