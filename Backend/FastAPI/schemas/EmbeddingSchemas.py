import json


from pydantic import BaseModel
from typing import Dict, Any, List

class EmbeddingRequest(BaseModel):
    data: List[str]

class EmbeddingResponse(BaseModel):
    extracted_text: List[List[float]]