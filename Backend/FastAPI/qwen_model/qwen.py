import torch
import json
import re
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import gc


class MedicalParser:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MedicalParser, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        print("Loading Qwen3-4B-Instruct-2507 model...")

        self.model_name = "Qwen/Qwen3-4B-Instruct-2507"

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name,
            trust_remote_code=True
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )

        self.model.eval()
        print("Model loaded successfully!")

    def _clean_output(self, text):
        text = text.replace("```json", "").replace("```", "").strip()

        # Remove assistant prefix if exists
        if "assistant" in text:
            text = text.split("assistant")[-1].strip()

        return text

    def extract(self, raw_text):
        if not hasattr(self, "model") or self.model is None or not hasattr(self, "tokenizer"):
            self._load_model()
        #---------------------------
        #----working prompt ------
        #---------------------------

        system_prompt = """ 
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

                    {
                    "report_metadata": {
                        "sample_number": "",
                        "lab_name": "",
                        "lab_address": ""
                    },
                    "patient_information": {
                        "patient_name": "",
                        "age": "",
                        "sex": ""
                    },
                    "test_results": [
                        {
                        "test_name": "",
                        "result": "",
                        "unit": "",
                        "reference_range": ""
                        }
                    ]
                    }
                    """


        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_text}
        ]

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)

        with torch.inference_mode():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=1024,
                temperature=0.1,
                top_p=0.8,
                do_sample=True
            )

        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # FREE GPU MEMORY
        del outputs
        del inputs

        # 🔥 FULL MODEL CLEANUP
        del self.model
        del self.tokenizer

        self.model = None
        self.tokenizer = None

        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()

        gc.collect()

        cleaned = self._clean_output(response)

        print("\n\n")
        print("process completed")
        print(cleaned)
        print("\n\n")
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON returned",
                "raw_output": cleaned
            }


