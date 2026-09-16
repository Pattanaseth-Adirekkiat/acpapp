import os
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from database import create_user, get_user_by_email, update_user_token

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "acp-secret-key-change-in-production")
ALGORITHM = "HS256"


class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    email: str
    token: str


def create_jwt_token(email: str) -> str:
    payload = {
        "sub": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: AuthRequest):
    user = await get_user_by_email(payload.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = bcrypt.hashpw(
        payload.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    await create_user(payload.email, hashed_password)
    token = create_jwt_token(payload.email)
    await update_user_token(payload.email, token)

    return AuthResponse(email=payload.email, token=token)


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest):
    user = await get_user_by_email(payload.email)

    if user is None or not bcrypt.checkpw(
        payload.password.encode("utf-8"), user["password"].encode("utf-8")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_jwt_token(payload.email)
    await update_user_token(payload.email, token)

    return AuthResponse(email=payload.email, token=token)