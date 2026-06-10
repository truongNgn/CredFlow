from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.common import ApiResponse
from app.schemas.credits import (
    BalanceResponse,
    PurchaseRequest,
    PurchaseResponse,
    TransactionPage,
    UserFeatureResponse,
)
from app.services import credit_service

router = APIRouter(prefix="/api/credits", tags=["credits"])


@router.post("/purchase", response_model=ApiResponse[PurchaseResponse])
async def purchase(
    request: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transaction, balance, unlocked = await credit_service.purchase_package(
        db, current_user, request.package_id
    )
    data = PurchaseResponse(
        transaction_id=transaction.id,
        status=transaction.status,
        credits_added=transaction.credits_added,
        balance=balance,
        unlocked_features=[credit_service.serialize_user_feature(link) for link in unlocked],
    )
    message = "Purchase successful" if transaction.status == "success" else "Payment failed"
    return ApiResponse(data=data, message=message)


@router.get("/balance", response_model=ApiResponse[BalanceResponse])
async def balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = BalanceResponse(balance=await credit_service.get_balance(db, current_user.id))
    return ApiResponse(data=data, message="Balance retrieved")


@router.get("/transactions", response_model=ApiResponse[TransactionPage])
async def transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await credit_service.get_transactions(db, current_user.id, page, page_size)
    return ApiResponse(data=data, message="Transactions retrieved")


@router.get("/features", response_model=ApiResponse[list[UserFeatureResponse]])
async def features(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    links = await credit_service.get_user_features(db, current_user.id)
    data = [credit_service.serialize_user_feature(link) for link in links]
    return ApiResponse(data=data, message="Unlocked features retrieved")
