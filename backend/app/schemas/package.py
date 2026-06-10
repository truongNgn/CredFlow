import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class FeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: str | None


class PackageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    price: Decimal = Field(ge=0, decimal_places=2)
    credit_amount: int = Field(gt=0)
    is_active: bool = True
    feature_slugs: list[str] = Field(default_factory=list)


class PackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    credit_amount: int | None = Field(default=None, gt=0)
    is_active: bool | None = None
    feature_slugs: list[str] | None = None


class PackageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    price: Decimal
    credit_amount: int
    is_active: bool
    features: list[FeatureResponse]
    created_at: datetime
    updated_at: datetime


class AdminStatsResponse(BaseModel):
    users: int
    transactions: int
    successful_revenue: Decimal
