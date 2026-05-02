import os
from dotenv import load_dotenv

load_dotenv()  # Load OPENAI_API_KEY from .env

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze_images
from typing import List

app = FastAPI(
    title="ChartAI API",
    description="AI-powered trading chart analysis via Gemini vision",
    version="1.0.0",
)

# Allow configurable origins for production (e.g. your Vercel URL)
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@app.get("/", summary="Health check")
def root():
    return {"status": "ok", "service": "ChartAI API"}

@app.post("/analyze-charts/", summary="Analyze multiple trading charts")
async def analyze_charts(
    files: List[UploadFile] = File(...),
    timeframes: List[str] = Form(...),
    symbol: str = Form("Unknown"),
    sessionDate: str = Form("Unknown")
):
    """
    Accept multiple chart image uploads with timeframes, send to Gemini vision,
    and return unified structured technical analysis as JSON.
    """
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 charts required for analysis.")
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 charts allowed.")
    if len(files) != len(timeframes):
        raise HTTPException(status_code=400, detail="Number of files and timeframes must match.")

    charts_data = []
    for file, tf in zip(files, timeframes):
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{file.content_type}'. Use PNG, JPEG, or WebP.",
            )

        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10 MB.")
            
        charts_data.append({
            "bytes": image_bytes,
            "timeframe": tf,
            "content_type": file.content_type
        })

    try:
        result = await analyze_images(charts_data, symbol=symbol, sessionDate=sessionDate)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")

    return result
