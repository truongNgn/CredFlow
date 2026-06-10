import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


package_features = Table(
    "package_features",
    Base.metadata,
    Column("package_id", UUID(as_uuid=True), ForeignKey("packages.id", ondelete="CASCADE"), primary_key=True),
    Column("feature_id", UUID(as_uuid=True), ForeignKey("features.id", ondelete="CASCADE"), primary_key=True),
)


class Package(Base):
    __tablename__ = "packages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    credit_amount: Mapped[int] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    features: Mapped[list["Feature"]] = relationship(
        secondary=package_features, back_populates="packages", lazy="selectin"
    )
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="package")
