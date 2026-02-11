from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    ownerName = Column(String, nullable=False)
    mobile = Column(String, unique=True, index=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    businessType = Column(String, nullable=False)
    city = Column(String, nullable=False)
    upi = Column(String, nullable=True)
    profilePhotoUrl = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    vendorId = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Credit(Base):
    __tablename__ = "credits"
    id = Column(Integer, primary_key=True, index=True)
    vendorId = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    customerId = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    dueDate = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False)
    paidDate = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    vendorId = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class TrustPolicy(Base):
    __tablename__ = "trust_policies"
    id = Column(Integer, primary_key=True)
    businessType = Column(String, unique=True, index=True, nullable=False)
    minScore = Column(Integer, default=30)
    maxScore = Column(Integer, default=95)
    weightsJson = Column(Text, default="{}")

class ChainEntry(Base):
    __tablename__ = "chain_entries"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)
    payload_hash = Column(String, nullable=False)
    prev_hash = Column(String, nullable=False)
    hash = Column(String, nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)