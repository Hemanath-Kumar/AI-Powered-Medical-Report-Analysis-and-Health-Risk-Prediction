import json


from pydantic import BaseModel
from typing import Dict, Any

class OcrRequest(BaseModel):
    image: bytes

class OcrResponse(BaseModel):
      extracted_text: Dict[str, Any]