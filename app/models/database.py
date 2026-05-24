from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import json
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/vstep")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
def get_db():
    return SessionLocal()
