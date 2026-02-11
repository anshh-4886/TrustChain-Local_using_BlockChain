from pydantic import BaseModel, Field
from typing import Optional, Dict

class SignupRequest(BaseModel):
    ownerName: str = Field(min_length=1)
    mobile: str = Field(min_length=6)
    businessType: str = Field(min_length=1)
    city: str = Field(min_length=1)
    upi: Optional[str] = None
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    mobile: str = Field(min_length=1)
    password: str = Field(min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class VendorMeResponse(BaseModel):
    id: int
    ownerName: str
    mobile: str
    businessType: str
    city: str
    upi: Optional[str] = None
    profilePhotoUrl: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str = Field(min_length=1)
    phone: Optional[str] = None
    notes: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    vendorId: int
    name: str
    phone: Optional[str] = None
    notes: Optional[str] = None

class CreditCreate(BaseModel):
    customerId: int
    amount: float
    dueDate: Optional[str] = None

class CreditOut(BaseModel):
    id: int
    vendorId: int
    customerId: int
    amount: float
    dueDate: Optional[str] = None
    status: str
    paidDate: Optional[str] = None

class SaleCreate(BaseModel):
    date: str
    mode: str
    amount: float

class SaleOut(BaseModel):
    id: int
    vendorId: int
    date: str
    mode: str
    amount: float

class TrustScoreResponse(BaseModel):
    score: int
    tag: str
    breakup: Dict[str, int]