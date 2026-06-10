import uuid

from fastapi import HTTPException, status
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Feature, Package, Transaction, User
from app.schemas.package import PackageCreate, PackageUpdate


def package_query():
    return select(Package).options(selectinload(Package.features))


async def list_packages(db: AsyncSession, include_inactive: bool = False) -> list[Package]:
    query = package_query().order_by(Package.price)
    if not include_inactive:
        query = query.where(Package.is_active.is_(True))
    return list((await db.scalars(query)).unique().all())


async def get_package(db: AsyncSession, package_id: uuid.UUID, include_inactive: bool = False) -> Package:
    query = package_query().where(Package.id == package_id)
    if not include_inactive:
        query = query.where(Package.is_active.is_(True))
    package = (await db.scalars(query)).unique().one_or_none()
    if package is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    return package


async def resolve_features(db: AsyncSession, slugs: list[str]) -> list[Feature]:
    unique_slugs = list(dict.fromkeys(slugs))
    if not unique_slugs:
        return []
    features = list((await db.scalars(select(Feature).where(Feature.slug.in_(unique_slugs)))).all())
    found = {feature.slug for feature in features}
    missing = sorted(set(unique_slugs) - found)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown feature slugs: {', '.join(missing)}",
        )
    return features


async def create_package(db: AsyncSession, request: PackageCreate) -> Package:
    package = Package(**request.model_dump(exclude={"feature_slugs"}))
    package.features = await resolve_features(db, request.feature_slugs)
    db.add(package)
    await db.commit()
    return await get_package(db, package.id, include_inactive=True)


async def update_package(db: AsyncSession, package_id: uuid.UUID, request: PackageUpdate) -> Package:
    package = await get_package(db, package_id, include_inactive=True)
    values = request.model_dump(exclude_unset=True, exclude={"feature_slugs"})
    for key, value in values.items():
        setattr(package, key, value)
    if request.feature_slugs is not None:
        package.features = await resolve_features(db, request.feature_slugs)
    await db.commit()
    return await get_package(db, package.id, include_inactive=True)


async def delete_package(db: AsyncSession, package_id: uuid.UUID) -> None:
    package = await get_package(db, package_id, include_inactive=True)
    package.is_active = False
    await db.commit()


async def list_features(db: AsyncSession) -> list[Feature]:
    return list((await db.scalars(select(Feature).order_by(Feature.name))).all())


async def get_admin_stats(db: AsyncSession) -> dict[str, int | Decimal]:
    users = await db.scalar(select(func.count()).select_from(User))
    transactions = await db.scalar(select(func.count()).select_from(Transaction))
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.status == "success")
    )
    return {
        "users": int(users or 0),
        "transactions": int(transactions or 0),
        "successful_revenue": Decimal(revenue or 0),
    }
