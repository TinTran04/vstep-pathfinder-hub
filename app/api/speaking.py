# app/api/speaking.py
import os
import uuid
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.speaking_service import score_speaking
from app.models.database import get_db
import sqlalchemy as sa

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/score")
async def score_speaking_api(
    audio: UploadFile = File(...),
    speaking_prompt: str = Form(...)
):
    ext = audio.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    audio_path = os.path.join(UPLOAD_DIR, filename)

    with open(audio_path, "wb") as f:
        f.write(await audio.read())

    try:
        result = score_speaking(audio_path, speaking_prompt)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

    # Lưu DB (phần này PDF bị thiếu)
    try:
        db = get_db()
        db.execute(sa.text("""
            INSERT INTO speaking_results
            (transcript, overall, fluency, vocabulary, grammar, relevance, feedback)
            VALUES (:transcript, :overall, :fluency, :vocabulary, :grammar, :relevance, :feedback::jsonb)
        """), {
            "transcript": result.get("transcript", ""),
            "overall": result["overall"],
            "fluency": result["fluency"],
            "vocabulary": result["vocabulary"],
            "grammar": result["grammar"],
            "relevance": result["relevance"],
            "pronunciation": result.get("pronunciation", ""),
            "feedback": json.dumps(result["feedback"]),
        })
        db.commit()
    except Exception as db_err:
        print(f"[DB ERROR] {db_err}")

    return result