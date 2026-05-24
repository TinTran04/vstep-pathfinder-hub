from pydantic import BaseModel
from typing import List
class WritingRequest(BaseModel):
    task_type: str          # "task1" hoặc "task2"
    prompt: str             # đề bài
    essay: str              # bài làm của học sinh
class WritingResponse(BaseModel):
    overall: float
    task_response: float
    organization: float
    vocabulary: float
    grammar: float
    feedback: List[str]