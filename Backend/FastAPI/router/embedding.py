from fastapi import APIRouter, Body, UploadFile, File, HTTPException
from PIL import Image
import io
from util import get_embedding_instance
from schemas.EmbeddingSchemas import EmbeddingRequest, EmbeddingResponse

router = APIRouter(prefix="/embedding")


@router.post("/extract", response_model=EmbeddingResponse)
async def extract(request: EmbeddingRequest = Body(...)):
    print("embedding request received")
    data = request.data
    try:
        embedding_result = get_embedding_instance(data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")
    print("emebedding complete")
    return {
        "extracted_text": embedding_result
    }