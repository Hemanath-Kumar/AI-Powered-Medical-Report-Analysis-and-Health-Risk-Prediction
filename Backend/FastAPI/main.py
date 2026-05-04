from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import ocr, embedding, MLmodel
import asyncio

# ── Lifespan (must be defined BEFORE FastAPI()) ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading OCR models at startup...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, warm_up_ocr)  # runs in thread, won't block event loop
    print("Models ready.")
    yield

from util import warm_up_ocr  # import after lifespan def is fine, used inside it

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router)
app.include_router(embedding.router)
app.include_router(MLmodel.router)

# ── Health (single definition) ────────────────────────────────────────────────
@app.get("/health")
def health():
    from util import is_model_ready
    print("Health check hit")
    return {"status": "ok", "model_ready": is_model_ready()}

@app.get("/health/fastapi")
def health():
    print("Health check endpoint hit")
    return {"status": "ok"}

