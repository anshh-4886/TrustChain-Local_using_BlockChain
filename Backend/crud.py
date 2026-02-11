from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Vendor, Customer, Credit, Sale
from auth import hash_password, verify_password
from schemas import SignupRequest

def create_vendor(db: Session, data: SignupRequest) -> Vendor:
    v = Vendor(
        ownerName=data.ownerName.strip(),
        mobile=data.mobile.strip(),
        passwordHash=hash_password(data.password),
        businessType=data.businessType.strip(),
        city=data.city.strip(),
        upi=(data.upi.strip() if data.upi else None),
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

def get_vendor_by_mobile(db: Session, mobile: str):
    return db.query(Vendor).filter(Vendor.mobile == mobile).first()

def authenticate_vendor(db: Session, mobile: str, password: str):
    v = get_vendor_by_mobile(db, mobile)
    if not v:
        return None
    if not verify_password(password, v.passwordHash):
        return None
    return v

def create_customer(db: Session, vendor_id: int, name: str, phone: str | None, notes: str | None):
    c = Customer(vendorId=vendor_id, name=name.strip(), phone=(phone.strip() if phone else None), notes=(notes.strip() if notes else None))
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

def list_customers(db: Session, vendor_id: int):
    return db.query(Customer).filter(Customer.vendorId == vendor_id).order_by(Customer.id.desc()).all()

def delete_customer(db: Session, vendor_id: int, customer_id: int) -> bool:
    c = db.query(Customer).filter(Customer.vendorId == vendor_id, Customer.id == customer_id).first()
    if not c:
        return False
    db.delete(c)
    db.commit()
    return True

def create_credit(db: Session, vendor_id: int, customer_id: int, amount: float, due_date: str | None):
    cr = Credit(vendorId=vendor_id, customerId=customer_id, amount=float(amount), dueDate=due_date, status="pending")
    db.add(cr)
    db.commit()
    db.refresh(cr)
    return cr

def mark_credit_paid(db: Session, vendor_id: int, credit_id: int, paid_date: str | None):
    cr = db.query(Credit).filter(Credit.vendorId == vendor_id, Credit.id == credit_id).first()
    if not cr:
        return None
    cr.status = "paid"
    cr.paidDate = paid_date
    db.commit()
    db.refresh(cr)
    return cr

def list_credits(db: Session, vendor_id: int):
    return db.query(Credit).filter(Credit.vendorId == vendor_id).order_by(Credit.id.desc()).all()

def create_sale(db: Session, vendor_id: int, date: str, mode: str, amount: float):
    s = Sale(vendorId=vendor_id, date=date, mode=mode, amount=float(amount))
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

def list_sales(db: Session, vendor_id: int):
    return db.query(Sale).filter(Sale.vendorId == vendor_id).order_by(Sale.id.desc()).all()

def kpis(db: Session, vendor_id: int):
    total_sales = db.query(func.coalesce(func.sum(Sale.amount), 0.0)).filter(Sale.vendorId == vendor_id).scalar() or 0.0
    pending = db.query(func.coalesce(func.sum(Credit.amount), 0.0)).filter(Credit.vendorId == vendor_id, Credit.status != "paid").scalar() or 0.0
    recovered = db.query(func.coalesce(func.sum(Credit.amount), 0.0)).filter(Credit.vendorId == vendor_id, Credit.status == "paid").scalar() or 0.0
    return {
        "totalSales": float(total_sales),
        "pendingUdhaar": float(pending),
        "recovered": float(recovered),
    }