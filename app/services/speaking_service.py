import os
from pathlib import Path
from app.services.whisper_service import transcribe
from app.services.llm_service import generate, extract_json
PROMPT_PATH = Path("app/prompts/speaking_prompt.txt")
def score_speaking(audio_path: str, speaking_prompt: str) -> dict:
    # Step 1: Speech → Text
    transcript = transcribe(audio_path)
    if not transcript or len(transcript.split()) < 5:
        raise ValueError("Transcript quá ngắn hoặc rỗng — kiểm tra lại audio")
    # Step 2: Text → Score
    template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = template.replace("{speaking_prompt}", speaking_prompt)
    prompt = prompt.replace("{transcript}", transcript)    
    raw = generate(prompt)
    result = extract_json(raw)
    result["transcript"] = transcript
    return result