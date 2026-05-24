from fastapi import APIRouter, HTTPException
from app.schemas.writing_schema import WritingRequest, WritingResponse
from app.services.writing_service import score_essay
from app.models.database import get_db
import sqlalchemy as sa
router = APIRouter()
@router.post("/score", response_model=WritingResponse)
async def score_writing(req: WritingRequest):
    try:
        result, raw = score_essay(req.task_type, req.prompt, req.essay)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()  # in ra terminal
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
    # Lưu DB (fire-and-forget, không block response)
    try:
        db = get_db()
        db.execute(sa.text("""
            INSERT INTO writing_results
            (task_type, prompt, essay, overall, task_response,
             organization, vocabulary, grammar, feedback, raw_response)
            VALUES (:task_type, :prompt, :essay, :overall, :task_response,
                    :organization, :vocabulary, :grammar, :feedback::jsonb, :raw)
        """), {**req.dict(), **result, "raw": raw})
        db.commit()
    except Exception as db_err:
        print(f"[DB ERROR] {db_err}")  # không fail request vì lỗi DB
    return result