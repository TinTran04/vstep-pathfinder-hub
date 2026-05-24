from pathlib import Path
from app.services.llm_service import generate, extract_json
PROMPT_PATH = Path("app/prompts/writing_prompt.txt")
def score_essay(task_type: str, writing_prompt: str, essay: str) -> dict:
    template = PROMPT_PATH.read_text(encoding="utf-8")
    
    # Dùng replace thay vì .format() để tránh conflict với {} trong JSON template
    prompt = template.replace("{task_type}", task_type)
    prompt = prompt.replace("{writing_prompt}", writing_prompt)
    prompt = prompt.replace("{essay}", essay)
    
    raw = generate(prompt)
    print(f"[RAW OUTPUT]: {repr(raw[:300])}")
    result = extract_json(raw)

    print(f"[PARSED RESULT]: {result}")  # thêm dòng này
    print(f"[KEYS]: {list(result.keys())}")  # thêm dòng này
    required = ["overall","task_response","organization","vocabulary","grammar","feedback"]
    for field in required:
        if field not in result:
            raise ValueError(f"Missing field in AI response: {field}")
    return result, raw
