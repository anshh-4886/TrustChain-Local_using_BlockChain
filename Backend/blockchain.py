import hashlib
import json
from datetime import datetime
from sqlalchemy.orm import Session
from models import ChainEntry

def sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def get_last_hash(db: Session, vendor_id: int) -> str:
    last = (
        db.query(ChainEntry)
        .filter(ChainEntry.vendor_id == vendor_id)
        .order_by(ChainEntry.id.desc())
        .first()
    )
    return last.hash if last else "GENESIS"

def add_block(db: Session, vendor_id: int, action: str, payload: dict):
    payload_hash = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")))
    prev_hash = get_last_hash(db, vendor_id)
    ts = datetime.utcnow()

    raw = f"{vendor_id}|{action}|{payload_hash}|{prev_hash}|{ts.isoformat()}"
    block_hash = sha256(raw)

    entry = ChainEntry(
        vendor_id=vendor_id,
        action=action,
        payload_hash=payload_hash,
        prev_hash=prev_hash,
        hash=block_hash,
        createdAt=ts
    )
    db.add(entry)
    db.commit()

def verify_chain(db: Session, vendor_id: int):
    entries = (
        db.query(ChainEntry)
        .filter(ChainEntry.vendor_id == vendor_id)
        .order_by(ChainEntry.id.asc())
        .all()
    )

    prev = "GENESIS"
    for e in entries:
        raw = f"{vendor_id}|{e.action}|{e.payload_hash}|{prev}|{e.createdAt.isoformat()}"
        if sha256(raw) != e.hash:
            return False, {"bad_block_id": e.id}
        prev = e.hash

    return True, {"blocks": len(entries)}