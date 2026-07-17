"""
Skin Cancer Classification - FastAPI Server
Serves the frontend SPA and exposes lesion analysis API endpoints.
"""

import os
import io
import base64
import json
import mimetypes
from typing import Optional

# Explicitly register mime types to prevent Windows registry MIME type corruption
mimetypes.init()
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from backend.analyzer import SkinLesionAnalyzer
from backend.data import LESION_METADATA

# ─── App Setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="DermAI — Skin Cancer Classification",
    description="AI-powered dermatological lesion analyzer using ABCD criteria",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
if not os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
    FRONTEND_DIR = BASE_DIR
SAMPLES_DIR  = os.path.join(BASE_DIR, "samples")

os.makedirs(SAMPLES_DIR, exist_ok=True)

# Mount static frontend files and samples
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")
app.mount("/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")

analyzer = SkinLesionAnalyzer()

# ─── Request Models ───────────────────────────────────────────────────────────
class Base64AnalysisRequest(BaseModel):
    image_data: str = ""           # base64-encoded JPEG/PNG (from webcam)
    filename: Optional[str] = None # demo sample shortcut


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/")
async def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path, media_type="text/html")


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "skin-cancer-classifier",
        "model": "OpenCV ABCD Lesion Analyzer v1.0"
    }


@app.get("/api/samples")
async def list_samples():
    """Return available demo sample images."""
    sample_meta = {
        "melanoma_lesion.jpg": {
            "title": "Melanoma — Critical Risk (Stage I)",
            "description": "Irregular dark lesion with high asymmetry and color variation",
            "risk_level": "Critical"
        },
        "bcc_lesion.jpg": {
            "title": "Basal Cell Carcinoma — High Risk",
            "description": "Pearly nodular lesion with raised border",
            "risk_level": "High"
        },
        "benign_mole.jpg": {
            "title": "Melanocytic Nevus — Benign Mole",
            "description": "Symmetric, uniform brown mole — no concern",
            "risk_level": "Low"
        },
        "seb_keratosis.jpg": {
            "title": "Seborrheic Keratosis — Benign",
            "description": "Waxy, stuck-on appearance. Completely harmless.",
            "risk_level": "Benign"
        }
    }

    results = []
    for fname, meta in sample_meta.items():
        fpath = os.path.join(SAMPLES_DIR, fname)
        if os.path.exists(fpath):
            results.append({
                "filename": fname,
                "url": f"/samples/{fname}",
                **meta
            })
    return results


@app.post("/api/analyze-base64")
async def analyze_base64(payload: Base64AnalysisRequest):
    """
    Analyze a lesion image from base64 data or demo filename.
    """
    try:
        # Demo sample shortcut
        if (not payload.image_data or payload.image_data.strip() == "") and payload.filename:
            objects = analyzer.analyze(filename=payload.filename)
            return {"filename": payload.filename, "objects": objects}

        # Decode base64 → numpy array
        b64 = payload.image_data
        if "," in b64:
            b64 = b64.split(",", 1)[1]

        img_bytes = base64.b64decode(b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image data")

        objects = analyzer.analyze(image_data=img, filename=payload.filename)
        return {"filename": payload.filename or "webcam_capture", "objects": objects}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-upload")
async def analyze_upload(file: UploadFile = File(...)):
    """Analyze an uploaded image file."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        objects = analyzer.analyze(image_data=img, filename=file.filename)
        return {"filename": file.filename, "objects": objects}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lesions")
async def get_lesion_catalog():
    """Return the full clinical lesion database for the frontend catalog."""
    return {
        key: {
            "name": v["name"],
            "medical_name": v["medical_name"],
            "risk_level": v["risk_level"],
            "risk_score": v["risk_score"],
            "color": v["color"],
            "description": v["description"],
            "icd_code": v["icd_code"],
            "prevalence": v["prevalence"],
        }
        for key, v in LESION_METADATA.items()
    }
