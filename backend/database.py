from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Connect to PostgreSQL, fallback to sqlite for dev if env var not set
DATABASE_URL_ENV = os.getenv("DATABASE_URL")

if not DATABASE_URL_ENV:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./tvt_dev.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL_ENV
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"connect_timeout": 2} if "postgresql" in SQLALCHEMY_DATABASE_URL else {})
        # Test connection
        conn = engine.connect()
        conn.close()
    except Exception:
        # Fallback to local SQLite database in dev
        SQLALCHEMY_DATABASE_URL = "sqlite:///./tvt_dev.db"
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
