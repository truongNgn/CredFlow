import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    credit: Mapped["UserCredit"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    unlocked_features: Mapped[list["UserFeature"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


from app.models.transaction import Transaction  # noqa: E402
from app.models.user_credit import UserCredit  # noqa: E402
from app.models.user_feature import UserFeature  # noqa: E402
