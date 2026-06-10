from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.common import ApiResponse
from app.services.auth_service import authenticate_user, create_access_token, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, request)
    data = TokenResponse(access_token=create_access_token(user), user=UserResponse.model_validate(user))
    return ApiResponse(data=data, message="Registration successful")


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, request.email, request.password)
    data = TokenResponse(access_token=create_access_token(user), user=UserResponse.model_validate(user))
    return ApiResponse(data=data, message="Login successful")


@router.get("/me", response_model=ApiResponse[UserResponse])
async def me(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=UserResponse.model_validate(current_user), message="Current user retrieved")
