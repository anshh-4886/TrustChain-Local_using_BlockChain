from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from config import SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_DAYS
from database import get_db
from models import Vendor

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

DEMO_VENDOR_ID = 1  # demo vendor fix id (optional)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_token(vendor_id: int) -> str:
    exp = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(vendor_id), "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_vendor(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> Vendor:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = creds.credentials
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        vendor_id = int(data.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=401, detail="User not found")
    return vendor

def auth_response(vendor: Vendor):
    """
    Use this in /auth/login and /auth/signup response.
    """
    token = create_token(vendor.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "vendor_id": vendor.id,
        "ownerName": getattr(vendor, "ownerName", None) or getattr(vendor, "owner_name", None),
        "mobile": getattr(vendor, "mobile", None),
    }