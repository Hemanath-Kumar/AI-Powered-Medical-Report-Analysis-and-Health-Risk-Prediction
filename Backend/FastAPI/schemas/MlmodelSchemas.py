import json


from pydantic import BaseModel
from typing import Dict, Any, List

class MLmodelRequest(BaseModel):
    data: Dict[str, Any]

class MLmodelResponse(BaseModel):
    message: str
    data: Dict[str, Any]