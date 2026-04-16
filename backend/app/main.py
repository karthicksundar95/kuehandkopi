from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Base, engine, get_db
from app.models import GameSession, Lead, RedemptionCode
from app.schemas import (
    ClaimBody,
    ClaimResponse,
    GameCompleteBody,
    GameCompleteResponse,
    GameStartResponse,
)
from app.seed import ensure_code_pool
from app.tokens import decode_win_token, issue_win_token

dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        ensure_code_pool(db)
    yield


app = FastAPI(title="Kueh & Kopi Campaign API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=None)
def root():
    """Avoid a bare 404 when opening the API host in a browser without a built frontend."""
    index = dist_dir / "index.html"
    if dist_dir.is_dir() and index.is_file():
        return FileResponse(index)
    return {
        "service": "Kueh & Kopi Campaign API",
        "health": "/health",
        "docs": "/docs",
        "hint": "Run the website with Vite: cd frontend && npm run dev → http://localhost:5173 "
        "(proxies /api to this server). Or npm run build, then restart uvicorn to serve the SPA from port 8000.",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/game/start", response_model=GameStartResponse)
@limiter.limit("30/minute")
def game_start(request: Request, db: Session = Depends(get_db)) -> GameStartResponse:
    _ = request
    session = GameSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return GameStartResponse(session_id=session.id)


@app.post("/api/game/complete", response_model=GameCompleteResponse)
@limiter.limit("20/minute")
def game_complete(
    request: Request,
    body: GameCompleteBody,
    db: Session = Depends(get_db),
) -> GameCompleteResponse:
    _ = request
    session = db.get(GameSession, body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.claimed_at is not None:
        raise HTTPException(status_code=400, detail="Session already claimed")
    if session.won_at is None:
        session.won_at = datetime.utcnow()
        db.add(session)
        db.commit()
    token = issue_win_token(session.id)
    return GameCompleteResponse(win_token=token)


@app.post("/api/claim", response_model=ClaimResponse)
@limiter.limit("10/minute")
def claim_prize(
    request: Request,
    body: ClaimBody,
    db: Session = Depends(get_db),
) -> ClaimResponse:
    _ = request
    if not body.consent:
        raise HTTPException(status_code=400, detail="Consent required")

    try:
        session_id = decode_win_token(body.win_token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    session = db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.won_at is None:
        raise HTTPException(status_code=400, detail="Game not completed")
    if session.claimed_at is not None:
        raise HTTPException(status_code=400, detail="Prize already claimed")

    existing_lead = db.scalar(select(Lead).where(Lead.session_id == session_id))
    if existing_lead:
        raise HTTPException(status_code=400, detail="Already claimed")

    code_row = db.scalars(
        select(RedemptionCode)
        .where(RedemptionCode.assigned_at.is_(None))
        .order_by(RedemptionCode.id)
        .limit(1),
    ).first()

    if not code_row:
        ensure_code_pool(db, minimum=50)
        code_row = db.scalars(
            select(RedemptionCode)
            .where(RedemptionCode.assigned_at.is_(None))
            .order_by(RedemptionCode.id)
            .limit(1),
        ).first()
    if not code_row:
        raise HTTPException(status_code=503, detail="No codes available")

    lead = Lead(
        session_id=session_id,
        name=body.name.strip(),
        email=str(body.email),
        phone=body.phone.strip() if body.phone else None,
        consent=body.consent,
        redemption_code=code_row.code,
    )
    db.add(lead)
    db.flush()

    code_row.assigned_at = datetime.utcnow()
    code_row.lead_id = lead.id
    session.claimed_at = datetime.utcnow()
    db.add(code_row)
    db.add(session)
    db.commit()

    return ClaimResponse(code=code_row.code)


if dist_dir.is_dir():

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404)
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index = dist_dir / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(status_code=404)
