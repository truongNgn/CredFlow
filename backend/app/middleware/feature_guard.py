from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Feature, User, UserFeature


def require_feature(slug: str) -> Callable[..., Coroutine[Any, Any, User]]:
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        feature_id = await db.scalar(select(Feature.id).where(Feature.slug == slug))
        if feature_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found")

        is_unlocked = await db.scalar(
            select(UserFeature.user_id).where(
                UserFeature.user_id == current_user.id,
                UserFeature.feature_id == feature_id,
            )
        )
        if is_unlocked is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{slug}' is not unlocked",
            )
        return current_user

    return dependency
