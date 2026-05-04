from ocr_Model.ocr import ocr
from qwen_model.qwen import MedicalParser
from embedd.Embedding import embedding
import threading
from openai import OpenAI
import base64
import io
from PIL import Image
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI
from environ import Env
import os
env=Env()
env_path = os.path.join(os.path.dirname(__file__), '.env')
env.read_env(env_path)

# ── Singletons ────────────────────────────────────────────────────────────────
_ocr_instance       = None
_parser_instance    = None
_embedding_instance = None
_model_lock         = threading.Lock()
_models_ready       = False

# ── Startup loader (call once at FastAPI lifespan) ────────────────────────────
def warm_up_ocr():
    global _ocr_instance, _parser_instance, _models_ready
    with _model_lock:
        if _models_ready:
            return
        # --- TO SWITCH TO LOCAL MODELS ---
        # Uncomment the two model initialization lines below to load the local models into memory.
        # This will use your local hardware instead of the NVIDIA Cloud APIs.
        print("Loading OCR model (GLM)...")
        # _ocr_instance = ocr()
        print("Loading MedicalParser (Qwen3-4B)...")
        # _parser_instance = MedicalParser()
        # ---------------------------------
        _models_ready = True
        print("All models loaded and cached.")

def is_model_ready() -> bool:
    return _models_ready




def AI_summary(data):

    print("AI summary started")

    prompt = ChatPromptTemplate.from_messages([
            ("system",""" 
                    You are a medical report parser.

                    Extract:
                    - report_metadata
                    - patient_information
                    - test_results (as list)

                    IMPORTANT RULES:

                    1. Preserve section headings such as "LIPID PROFILE", "LIVER FUNCTION TEST", "RENAL PANEL", etc.
                    2. If a test appears under a heading, prepend the heading to the test_name using this format:
                    "Heading - Test Name"
                    Example: "Lipid Profile - Total Cholesterol"
                    3. Do NOT guess test names.
                    4. Use exact text from the report.
                    5. If any value is missing, leave it empty.
                    6. Do NOT hallucinate new tests.
                    7. If the document is an OPD ticket or hospital visit record (not a lab report), 
                    extract clinical measurements such as BP, Pulse, Weight, Temperature, CWT, etc. 
                    into test_results using their exact names as written.
                    8. For vitals:
                    - test_name = exact text (e.g., "BP", "Pulse", "Wt", "CWT")
                    - result = numeric or recorded value
                    - unit = unit if present (e.g., mmHg, /min, kg)
                    - reference_range = ""
                    9. If multiple readings exist (e.g., BP measured twice), include each as separate entries.
                    10. Do NOT create artificial section headings for OPD tickets.
                    11. If no lab tests are present, but vitals are present, still populate test_results.
                    12. Return ONLY valid JSON.
                    13. Do NOT explain.
                    14. Do NOT add markdown.

                    Follow this JSON schema strictly:

                    {{
                    "report_metadata": {{
                        "sample_number": "",
                        "lab_name": "",
                        "lab_address": ""
                    }},
                    "patient_information": {{
                        "patient_name": "",
                        "age": "",
                        "sex": ""
                    }},
                    "test_results": [
                        {{
                        "test_name": "",
                        "result": "",
                        "unit": "",
                        "reference_range": ""
                        }}
                    ]
                    }}
                    """
            ),
            ("user",
            """Analyze this medical report and generate the output.
        {data}
        """)
        ])
    llm = ChatOpenAI(
        model="mistralai/mistral-large-3-675b-instruct-2512",
        api_key=env("nvidia_llm"),
        base_url="https://integrate.api.nvidia.com/v1"
        )

    chain = prompt | llm

    result = chain.invoke({"data": data})

    print("AI summary completed")

    return result


def extract_text_from_image(image_input):
    if isinstance(image_input, Image.Image):
        buffered = io.BytesIO()
        # Convert to RGB if it's RGBA to avoid errors when saving as JPEG
        if image_input.mode in ('RGBA', 'P'): 
            image_input = image_input.convert('RGB')
        image_input.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        image_uri = f"data:image/jpeg;base64,{img_str}"
    else:
        image_uri = image_input

    client = OpenAI(
        api_key=env("nvidia_ocr"),
        base_url="https://integrate.api.nvidia.com/v1"
    )

    response = client.chat.completions.create(
        model="meta/llama-3.2-90b-vision-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all text from this image perfectly, preserving spatial layout where possible. Do not include any explanations."},
                {"type": "image_url", "image_url": {"url": image_uri}}
            ]
        }],
        temperature=0.1,
        max_tokens=2048,
    )
    
    extracted_text = response.choices[0].message.content
    
    return extracted_text

# ── Inference (reuses loaded models) ──────────────────────────────────────────
def get_ocr_instance(image):
    print(" Fast API OCR started")
    if not _models_ready:
        warm_up_ocr()                        # fallback safety net
    # --- TO SWITCH TO LOCAL MODELS ---
    # 1. Comment out the Cloud API calls (`extract_text_from_image` and `AI_summary`).
    # 2. Uncomment the local model calls (`_ocr_instance.excude_ocr` and `_parser_instance.extract`).
    
    # --- OCR STEP ---
    # raw_result = _ocr_instance.excude_ocr(image)  # [LOCAL] Uncomment this
    raw_result = extract_text_from_image(image)     # [CLOUD] Comment this out

    # --- LLM PARSING STEP ---
    result = AI_summary(raw_result)                 # [CLOUD] Comment this out
    # result = _parser_instance.extract(raw_result) # [LOCAL] Uncomment this
    # ---------------------------------
    print(" Fast API OCR completed")
    return result.content

def get_embedding_instance(data):
    print(" Fast API Embedding started")
    global _embedding_instance
    if _embedding_instance is None:
        with _model_lock:
            if _embedding_instance is None:             # double-checked locking
                _embedding_instance = embedding()
    print(" Fast API Embedding completed")
    return _embedding_instance.embed(data)