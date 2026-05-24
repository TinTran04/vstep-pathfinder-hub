from faster_whisper import WhisperModel
# Lần đầu sẽ download model (~150MB)
# device="cuda" nếu có GPU, "cpu" nếu không
_model = WhisperModel("base", device="cuda", compute_type="float16")
def transcribe(audio_path: str) -> str:
    segments, info = _model.transcribe(audio_path, language="en")
    transcript = " ".join(seg.text.strip() for seg in segments)
    return transcript.strip()