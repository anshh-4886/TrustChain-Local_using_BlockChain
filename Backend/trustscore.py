import json
from typing import Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import TrustPolicy, Credit, Sale

DEFAULT_POLICIES = {
    "Kirana / Grocery": {"min": 35, "max": 95, "w": {"repay": 0.50, "stability": 0.30, "debt": 0.20}},
    "Pharmacy": {"min": 40, "max": 95, "w": {"repay": 0.55, "stability": 0.30, "debt": 0.15}},
    "Food Stall / Restaurant": {"min": 30, "max": 92, "w": {"repay": 0.50, "stability": 0.35, "debt": 0.15}},
    "Salon": {"min": 30, "max": 92, "w": {"repay": 0.55, "stability": 0.25, "debt": 0.20}},
    "Freelancer": {"min": 25, "max": 90, "w": {"repay": 0.60, "stability": 0.20, "debt": 0.20}},
    "Other": {"min": 30, "max": 92, "w": {"repay": 0.55, "stability": 0.25, "debt": 0.20}},
}

def ensure_default_policies(db: Session):
    for bt, cfg in DEFAULT_POLICIES.items():
        row = db.query(TrustPolicy).filter(TrustPolicy.businessType == bt).first()
        if not row:
            row = TrustPolicy(
                businessType=bt,
                minScore=cfg["min"],
                maxScore=cfg["max"],
                weightsJson=json.dumps(cfg["w"])
            )
            db.add(row)
    db.commit()

def _clamp(x: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, x))

def _tag(score: int) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 65:
        return "Good"
    if score >= 45:
        return "Average"
    return "Risky"

def compute_trust_score(db: Session, vendor_id: int, business_type: str) -> Tuple[int, str, Dict[str, int]]:
    ensure_default_policies(db)

    policy = db.query(TrustPolicy).filter(TrustPolicy.businessType == business_type).first()
    if not policy:
        policy = db.query(TrustPolicy).filter(TrustPolicy.businessType == "Other").first()

    try:
        weights = json.loads(policy.weightsJson or "{}")
    except Exception:
        weights = {}

    w_repay = float(weights.get("repay", 0.55))
    w_stability = float(weights.get("stability", 0.25))
    w_debt = float(weights.get("debt", 0.20))

    total_credits = db.query(func.count(Credit.id)).filter(Credit.vendorId == vendor_id).scalar() or 0
    paid_credits = db.query(func.count(Credit.id)).filter(Credit.vendorId == vendor_id, Credit.status == "paid").scalar() or 0

    repayment_rate = 0
    if total_credits > 0:
        repayment_rate = int(round((paid_credits / total_credits) * 100))

    pending_amount = db.query(func.coalesce(func.sum(Credit.amount), 0.0)).filter(
        Credit.vendorId == vendor_id, Credit.status != "paid"
    ).scalar() or 0.0

    debt_ratio = int(round(min(100.0, pending_amount / 100.0)))

    last_sales = db.query(Sale.id).filter(Sale.vendorId == vendor_id).order_by(Sale.id.desc()).limit(10).all()
    last_sales_count = len(last_sales)

    stability = int(round(min(95.0, 40.0 + (last_sales_count * 5.0))))

    raw = int(round(
        (repayment_rate * w_repay) +
        (stability * w_stability) +
        ((100 - debt_ratio) * w_debt)
    ))

    score = _clamp(raw, int(policy.minScore or 30), int(policy.maxScore or 95))
    tag = _tag(score)

    breakup = {
        "repaymentRate": int(_clamp(repayment_rate, 0, 100)),
        "revenueStability": int(_clamp(stability, 0, 100)),
        "pendingDebtRatio": int(_clamp(debt_ratio, 0, 100)),
    }

    return score, tag, breakup