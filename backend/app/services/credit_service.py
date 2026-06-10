import asyncio
import math
import random
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import Package, Transaction, User, UserCredit, UserFeature
from app.schemas.credits import TransactionPage, TransactionResponse, UserFeatureResponse


async def payment_succeeds() -> bool:
    await asyncio.sleep(0.05)
    return random.random() < settings.payment_success_rate


async def purchase_package(db: AsyncSession, user: User, package_id: uuid.UUID) -> tuple[Transaction, int, list[UserFeature]]:
    try:
        package = await db.scalar(
            select(Package)
            .options(selectinload(Package.features))
            .where(Package.id == package_id, Package.is_active.is_(True))
        )
        if package is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")

        success = await payment_succeeds()
        transaction = Transaction(
            user_id=user.id,
            package_id=package.id,
            amount=package.price,
            credits_added=package.credit_amount if success else 0,
            status="success" if success else "failed",
        )
        db.add(transaction)

        credit = await db.scalar(
            select(UserCredit).where(UserCredit.user_id == user.id).with_for_update()
        )
        if credit is None:
            credit = UserCredit(user_id=user.id, balance=0)
            db.add(credit)
        if success:
            credit.balance += package.credit_amount
            existing_ids = set(
                await db.scalars(select(UserFeature.feature_id).where(UserFeature.user_id == user.id))
            )
            for feature in package.features:
                if feature.id not in existing_ids:
                    db.add(UserFeature(user_id=user.id, feature_id=feature.id))
        await db.flush()
        balance = credit.balance
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    unlocked = await get_user_features(db, user.id)
    return transaction, balance, unlocked


async def get_balance(db: AsyncSession, user_id: uuid.UUID) -> int:
    balance = await db.scalar(select(UserCredit.balance).where(UserCredit.user_id == user_id))
    return balance or 0


async def get_transactions(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
) -> TransactionPage:
    total = await db.scalar(
        select(func.count()).select_from(Transaction).where(Transaction.user_id == user_id)
    ) or 0
    transactions = list(
        (
            await db.scalars(
                select(Transaction)
                .options(selectinload(Transaction.package))
                .where(Transaction.user_id == user_id)
                .order_by(Transaction.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
    )
    items = [
        TransactionResponse(
            id=item.id,
            package_id=item.package_id,
            package_name=item.package.name if item.package else None,
            amount=item.amount,
            credits_added=item.credits_added,
            status=item.status,
            created_at=item.created_at,
        )
        for item in transactions
    ]
    return TransactionPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        pages=math.ceil(total / page_size) if total else 0,
    )


async def get_user_features(db: AsyncSession, user_id: uuid.UUID) -> list[UserFeature]:
    return list(
        (
            await db.scalars(
                select(UserFeature)
                .options(selectinload(UserFeature.feature))
                .where(UserFeature.user_id == user_id)
                .order_by(UserFeature.unlocked_at)
            )
        ).all()
    )


def serialize_user_feature(link: UserFeature) -> UserFeatureResponse:
    return UserFeatureResponse(
        id=link.feature.id,
        name=link.feature.name,
        slug=link.feature.slug,
        description=link.feature.description,
        unlocked_at=link.unlocked_at,
    )
