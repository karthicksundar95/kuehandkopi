import secrets

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import RedemptionCode


def ensure_code_pool(db: Session, minimum: int = 200) -> None:
    total = db.scalar(select(func.count()).select_from(RedemptionCode)) or 0
    if total >= minimum:
        return
    existing = set(db.scalars(select(RedemptionCode.code)).all())
    while total < minimum:
        code = f"KK-MANGO-{secrets.token_hex(3).upper()}"
        if code in existing:
            continue
        db.add(RedemptionCode(code=code))
        existing.add(code)
        total += 1
    db.commit()
