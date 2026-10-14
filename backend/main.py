"""
NutriPulse Pro — Dedicated Python FastAPI Backend Server
© Ballapuram Prakash Royal. All Rights Reserved.
Run locally with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="NutriPulse Pro Clinical API",
    version="2.0.0",
    description="Mifflin-St Jeor BMR/TDEE & Atwater Macro Engine by Ballapuram Prakash Royal"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BiometricPayload(BaseModel):
    weight: float = 72.0
    height: float = 175.0
    age: int = 24
    gender: str = "male"
    activity_multiplier: float = 1.55
    cal_offset: int = 0
    protein_pct: float = 30.0
    carbs_pct: float = 40.0
    fat_pct: float = 30.0

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "NutriPulse Pro FastAPI",
        "owner": "Ballapuram Prakash Royal"
    }

@app.post("/api/tdee")
def calculate_tdee(data: BiometricPayload):
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age)
    bmr += 5 if data.gender.lower() == "male" else -161
    bmr_rounded = round(bmr)
    tdee = round(bmr_rounded * data.activity_multiplier)
    target_cal = max(1200, tdee + data.cal_offset)

    return {
        "bmr": bmr_rounded,
        "tdee": tdee,
        "targetCalories": target_cal,
        "macros": {
            "proteinG": round((target_cal * (data.protein_pct / 100)) / 4),
            "carbsG": round((target_cal * (data.carbs_pct / 100)) / 4),
            "fatG": round((target_cal * (data.fat_pct / 100)) / 9),
            "fiberG": round((target_cal / 1000) * 14)
        }
    }
