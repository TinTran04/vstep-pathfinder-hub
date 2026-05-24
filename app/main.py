from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import writing, speaking
import traceback

app = FastAPI(title="VSTEP AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        traceback.print_exc()  # in full traceback ra terminal
        return JSONResponse(status_code=500, content={"detail": str(e)})

app.include_router(writing.router, prefix="/api/writing")
app.include_router(speaking.router, prefix="/api/speaking")

@app.get("/health")
def health():
    return {"status": "ok"}