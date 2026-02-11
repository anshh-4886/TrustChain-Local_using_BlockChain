import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import Vendor
from schemas import (
    SignupRequest, LoginRequest, TokenResponse, VendorMeResponse,
    CustomerCreate, CustomerOut, CreditCreate, CreditOut, SaleCreate, SaleOut, TrustScoreResponse
)
from crud import (
    create_vendor, get_vendor_by_mobile, authenticate_vendor,
    create_customer, list_customers, delete_customer,
    create_credit, mark_credit_paid, list_credits,
    create_sale, list_sales, kpis
)
from auth import create_token, get_current_vendor
from trustscore import compute_trust_score
from config import UPLOAD_DIR, ALLOWED_IMAGE_EXTS

from blockchain import add_block, verify_chain

router = APIRouter()

@router.get("/")
def root():
    return {"status": "ok", "message": "TrustChain Local Backend Running", "docs": "/docs"}

@router.get("/health")
def health():
    return {"ok": True}

@router.post("/auth/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = get_vendor_by_mobile(db, payload.mobile.strip())
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")

    v = create_vendor(db, payload)

    add_block(db, v.id, "SIGNUP", {
        "mobile": v.mobile,
        "ownerName": v.ownerName,
        "businessType": v.businessType,
        "city": v.city,
        "upi": v.upi
    })

    token = create_token(v.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    v = authenticate_vendor(db, payload.mobile.strip(), payload.password)
    if not v:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    add_block(db, v.id, "LOGIN", {"mobile": v.mobile})
    token = create_token(v.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/auth/me", response_model=VendorMeResponse)
def me(v: Vendor = Depends(get_current_vendor)):
    return {
        "id": v.id,
        "ownerName": v.ownerName,
        "mobile": v.mobile,
        "businessType": v.businessType,
        "city": v.city,
        "upi": v.upi,
        "profilePhotoUrl": v.profilePhotoUrl,
    }

@router.post("/profile/photo", response_model=VendorMeResponse)
def upload_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    v: Vendor = Depends(get_current_vendor)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(photo.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Only jpg/jpeg/png/webp allowed")

    filename = f"vendor_{v.id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(photo.file.read())

    v.profilePhotoUrl = f"/uploads/{filename}"
    db.add(v)
    db.commit()
    db.refresh(v)

    add_block(db, v.id, "UPLOAD_PHOTO", {"profilePhotoUrl": v.profilePhotoUrl})

    return {
        "id": v.id,
        "ownerName": v.ownerName,
        "mobile": v.mobile,
        "businessType": v.businessType,
        "city": v.city,
        "upi": v.upi,
        "profilePhotoUrl": v.profilePhotoUrl,
    }

@router.post("/customers", response_model=CustomerOut)
def add_customer(payload: CustomerCreate, db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    c = create_customer(db, v.id, payload.name, payload.phone, payload.notes)

    add_block(db, v.id, "ADD_CUSTOMER", {
        "customerId": c.id,
        "name": c.name,
        "phone": c.phone,
        "notes": c.notes
    })

    return {"id": c.id, "vendorId": c.vendorId, "name": c.name, "phone": c.phone, "notes": c.notes}

@router.get("/customers", response_model=list[CustomerOut])
def get_customers(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    rows = list_customers(db, v.id)
    return [{"id": r.id, "vendorId": r.vendorId, "name": r.name, "phone": r.phone, "notes": r.notes} for r in rows]

@router.delete("/customers/{customer_id}")
def remove_customer(customer_id: int, db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    ok = delete_customer(db, v.id, customer_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")

    add_block(db, v.id, "DELETE_CUSTOMER", {"customerId": customer_id})
    return {"ok": True}

@router.post("/credits", response_model=CreditOut)
def add_credit(payload: CreditCreate, db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    cr = create_credit(db, v.id, payload.customerId, payload.amount, payload.dueDate)

    add_block(db, v.id, "ADD_CREDIT", {
        "creditId": cr.id,
        "customerId": cr.customerId,
        "amount": cr.amount,
        "dueDate": str(cr.dueDate),
        "status": cr.status
    })

    return {
        "id": cr.id, "vendorId": cr.vendorId, "customerId": cr.customerId,
        "amount": cr.amount, "dueDate": cr.dueDate, "status": cr.status, "paidDate": cr.paidDate
    }

@router.get("/credits", response_model=list[CreditOut])
def get_credits(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    rows = list_credits(db, v.id)
    return [{
        "id": r.id, "vendorId": r.vendorId, "customerId": r.customerId,
        "amount": r.amount, "dueDate": r.dueDate, "status": r.status, "paidDate": r.paidDate
    } for r in rows]

@router.post("/credits/{credit_id}/paid", response_model=CreditOut)
def pay_credit(credit_id: int, db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    cr = mark_credit_paid(db, v.id, credit_id, None)
    if not cr:
        raise HTTPException(status_code=404, detail="Credit not found")

    add_block(db, v.id, "PAY_CREDIT", {"creditId": cr.id, "status": cr.status, "paidDate": str(cr.paidDate)})

    return {
        "id": cr.id, "vendorId": cr.vendorId, "customerId": cr.customerId,
        "amount": cr.amount, "dueDate": cr.dueDate, "status": cr.status, "paidDate": cr.paidDate
    }

@router.post("/sales", response_model=SaleOut)
def add_sale(payload: SaleCreate, db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    s = create_sale(db, v.id, payload.date, payload.mode, payload.amount)

    add_block(db, v.id, "ADD_SALE", {
        "saleId": s.id,
        "date": str(s.date),
        "mode": s.mode,
        "amount": s.amount
    })

    return {"id": s.id, "vendorId": s.vendorId, "date": s.date, "mode": s.mode, "amount": s.amount}

@router.get("/sales", response_model=list[SaleOut])
def get_sales(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    rows = list_sales(db, v.id)
    return [{"id": r.id, "vendorId": r.vendorId, "date": r.date, "mode": r.mode, "amount": r.amount} for r in rows]

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    return kpis(db, v.id)

@router.get("/trustscore", response_model=TrustScoreResponse)
def trust_score(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    score, tag, breakup = compute_trust_score(db, v.id, v.businessType)
    return {"score": score, "tag": tag, "breakup": breakup}

@router.get("/chain/verify/me")
def chain_verify_me(db: Session = Depends(get_db), v: Vendor = Depends(get_current_vendor)):
    ok, info = verify_chain(db, v.id)
    return {"ok": ok, "info": info}