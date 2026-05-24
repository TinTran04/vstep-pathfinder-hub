import sys
import os

# Khởi tạo đường dẫn dự án
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.services.whisper_service import transcribe

# THÊM CHỮ r TRƯỚC ĐƯỜNG DẪN ĐỂ TRÁNH LỖI \a VÀ \p
audio_path = r"D:\project\app\services\test_audio.mp3"

text = transcribe(audio_path)
print(text)