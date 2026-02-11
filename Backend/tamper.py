from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db  # (agar error aaye to niche import fix section dekho)

router = APIRouter(prefix="/chain", tags=["Tamper Detection"])


def verify_chain_for_vendor(db: Session, vendor_id: int):
    # Ordered by id is important
    rows = db.execute(
        text("""
            SELECT id, vendor_id, prev_hash, hash, createdAt, action
            FROM chain_entries
            WHERE vendor_id = :vendor_id
            ORDER BY id ASC
        """),
        {"vendor_id": vendor_id}
    ).mappings().all()

    if not rows:
        return {
            "vendor_id": vendor_id,
            "total_entries": 0,
            "is_valid": True,
            "message": "No entries for this vendor"
        }

    # First row must have prev_hash == GENESIS
    first = rows[0]
    if (first["prev_hash"] or "").upper() != "GENESIS":
        return {
            "vendor_id": vendor_id,
            "total_entries": len(rows),
            "is_valid": False,
            "broken_at_id": first["id"],
            "reason": "First entry prev_hash is not GENESIS",
            "expected_prev_hash": "GENESIS",
            "found_prev_hash": first["prev_hash"],
            "first_entry": dict(first)
        }

    # Check linking
    prev_hash = first["hash"]
    for i in range(1, len(rows)):
        cur = rows[i]
        if cur["prev_hash"] != prev_hash:
            return {
                "vendor_id": vendor_id,
                "total_entries": len(rows),
                "is_valid": False,
                "broken_at_id": cur["id"],
                "reason": "prev_hash mismatch (tamper suspected)",
                "expected_prev_hash": prev_hash,
                "found_prev_hash": cur["prev_hash"],
                "broken_entry": dict(cur),
                "previous_entry": dict(rows[i-1])
            }
        prev_hash = cur["hash"]

    return {
        "vendor_id": vendor_id,
        "total_entries": len(rows),
        "is_valid": True,
        "message": "Chain is valid"
    }


@router.get("/verify")
def verify_all_vendors(db: Session = Depends(get_db)):
    vendor_ids = db.execute(text("SELECT DISTINCT vendor_id FROM chain_entries")).scalars().all()

    results = []
    overall_ok = True

    for vid in vendor_ids:
        r = verify_chain_for_vendor(db, vid)
        results.append(r)
        if not r["is_valid"]:
            overall_ok = False

    return {
        "overall_valid": overall_ok,
        "vendors_checked": len(vendor_ids),
        "results": results
    }


@router.get("/verify/{vendor_id}")
def verify_one_vendor(vendor_id: int, db: Session = Depends(get_db)):
    return verify_chain_for_vendor(db, vendor_id)