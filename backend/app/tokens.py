from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def issue_win_token(session_id: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.win_token_ttl_minutes)
    payload = {
        "sub": session_id,
        "typ": "win",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_win_token(token: str) -> str:
    data = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    if data.get("typ") != "win":
        raise jwt.InvalidTokenError("wrong token type")
    sub = data.get("sub")
    if not isinstance(sub, str):
        raise jwt.InvalidTokenError("missing subject")
    return sub
