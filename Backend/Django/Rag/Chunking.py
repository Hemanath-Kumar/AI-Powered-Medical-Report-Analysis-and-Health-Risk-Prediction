import re
from collections import defaultdict


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

def normalize_test_name(name: str) -> str:
    
    if not isinstance(name, str):
        return "unknown"

    name = name.lower().strip()

    for key, pattern in PATTERNS.items():
        if pattern.search(name):
            return key

    # Return the clean original name instead of merging into "unknown/Other"
    return name



def process_report(data):
    grouped = defaultdict(list)

    if not isinstance(data, dict):
        return {}

    test_results = data.get("test_results") or []

    for item in test_results:

       
        if not isinstance(item, dict):
            print("Skipping invalid item:", item)
            continue

        raw_name = item.get("test_name", "")
        value = item.get("result", "")
        unit = item.get("unit", "")

        key = normalize_test_name(raw_name)

        grouped[key].append(f"{value} {unit}".strip())

    return grouped

def format_output(grouped, data):
    lines = []

    # Metadata
    meta = data.get("report_metadata", {})
    lines.append(f"Lab: {meta.get('lab_name', '')}")
    lines.append(f"Location: {meta.get('lab_address', '')}")
    lines.append("")

    lines.append("Patient Medical Summary:")

    display = {
        "hemoglobin": "Hemoglobin",
                "blood_sugar": "Blood Sugar",
                "urea": "Blood Urea",
                "creatinine": "Creatinine",
                "uric_acid": "Uric Acid",
                "total_cholesterol": "Total Cholesterol",
                "triglycerides": "Triglycerides",
                "hdl": "HDL",
                "ldl": "LDL",
        "vldl": "VLDL",
        "chol_hdl_ratio": "Chol/HDL Ratio",
        "ldl_hdl_ratio": "LDL/HDL Ratio",
        "unknown": "Other"
    }

    for key, values in grouped.items():
        name = display.get(key, key.replace("_", " ").title())
        lines.append(f"- {name}: {', '.join(values)}")

    return "\n".join(lines)

class chunking:
    def __init__(self,data):
        self.data=data
    def chunk(self):
        # chunking for vector db
        parsed_data = self.data
      
        if isinstance(parsed_data, str):
            import json
            try:
                parsed_data = json.loads(parsed_data)
            except:
                # Fallback: Use pattern to extract all content blocks from malformed string
                blocks = re.findall(r'\{[^{}]+\}', parsed_data)
                results = []
                for b in blocks:
                    tn = re.search(r'"test_name"\s*:\s*"([^"]+)"', b)
                    res = re.search(r'"result"\s*:\s*"([^"]+)"', b)
                    un = re.search(r'"unit"\s*:\s*"([^"]*)"', b)
                    if tn and res:
                        results.append({
                            "test_name": tn.group(1),
                            "result": res.group(1),
                            "unit": un.group(1) if un else ""
                        })
                parsed_data = {"test_results": results}

        grouped = process_report(parsed_data)
        output = format_output(grouped, parsed_data)

     
        return [output]
        