import os

# Backend folder ka absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Always keep DB inside Backend folder
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "trustchain.db")

# If DATABASE_URL env is not set, use SQLite in Backend/
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

SECRET_KEY = os.getenv("SECRET_KEY", "trustchain_change_this_secret")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = int(os.getenv("TOKEN_EXPIRE_DAYS", "30"))

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")