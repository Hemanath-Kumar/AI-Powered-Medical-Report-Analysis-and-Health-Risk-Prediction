from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from PIL import Image
import io, uuid, time
from util import get_ocr_instance

router = APIRouter(prefix="/ocr")

# In-memory store — replace with Redis in production
job_store: dict = {}
job_store_lock = __import__("threading").Lock()

def _run_ocr_job(job_id: str, image_bytes: bytes):
    """Runs in background thread — can take 10+ min, no timeout pressure."""
    try:
        with job_store_lock:
            job_store[job_id]["status"] = "processing"

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result = get_ocr_instance(image)

        with job_store_lock:
            job_store[job_id] = {
                "status": "done",
                "result": result,
                "finished_at": time.time()
            }
        print(f"OCR job {job_id} completed.")

    except Exception as e:
        with job_store_lock:
            job_store[job_id] = {
                "status": "failed",
                "error": str(e),
                "finished_at": time.time()
            }
        print(f"OCR job {job_id} failed: {e}")


@router.post("/submit")
async def submit_ocr(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    contents = await file.read()
    try:
        Image.open(io.BytesIO(contents)).verify()   # validate image early
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    job_id = str(uuid.uuid4())
    with job_store_lock:
        job_store[job_id] = {"status": "queued", "submitted_at": time.time()}

    background_tasks.add_task(_run_ocr_job, job_id, contents)
    print(f"OCR job {job_id} queued.")
    return {"job_id": job_id}


@router.get("/result/{job_id}")
async def get_result(job_id: str):
    with job_store_lock:
        job = job_store.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "status": job["status"],                        # queued | processing | done | failed
        "result": job.get("result"),                    # None until done
        "error":  job.get("error"),
    }


@router.delete("/result/{job_id}")
async def cleanup_job(job_id: str):
    """Call this after DRF successfully receives the result."""
    with job_store_lock:
        job_store.pop(job_id, None)
    return {"deleted": job_id}