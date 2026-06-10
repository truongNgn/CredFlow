import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.package import FeatureResponse


class PurchaseRequest(BaseModel):
    package_id: uuid.UUID


class PurchaseResponse(BaseModel):
    transaction_id: uuid.UUID
    status: str
    credits_added: int
    balance: int
    unlocked_features: list[FeatureResponse]


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    package_id: uuid.UUID | None
    package_name: str | None
    amount: Decimal
    credits_added: int
    status: str
    created_at: datetime


class TransactionPage(BaseModel):
    items: list[TransactionResponse]
    page: int
    page_size: int
    total: int
    pages: int


class BalanceResponse(BaseModel):
    balance: int


class UserFeatureResponse(FeatureResponse):
    unlocked_at: datetime
