from pydantic import BaseModel, EmailStr, Field


class GameStartResponse(BaseModel):
    session_id: str


class GameCompleteBody(BaseModel):
    session_id: str


class GameCompleteResponse(BaseModel):
    win_token: str


class ClaimBody(BaseModel):
    win_token: str
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(None, max_length=40)
    consent: bool = False


class ClaimResponse(BaseModel):
    code: str
    message: str = "Show this code in-store to redeem your reward."
