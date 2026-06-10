"""Seed packages, features and demo users."""

import uuid
from decimal import Decimal

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext
from sqlalchemy.dialects import postgresql

revision = "0002_seed_data"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

FEATURES = [
    ("basic_api", "Basic API Access"),
    ("image_generation", "AI Image Generation"),
    ("analytics", "Advanced Analytics"),
    ("auto_post", "Auto Post Scheduler"),
    ("priority_support", "Priority Support"),
]
PACKAGES = [
    ("Basic", "Essential API access", 9, 100, ["basic_api"]),
    ("Pro", "Automation and analytics for growing teams", 29, 500, ["basic_api", "image_generation", "analytics"]),
    (
        "Enterprise",
        "Full platform access and priority support",
        99,
        2000,
        ["basic_api", "image_generation", "analytics", "auto_post", "priority_support"],
    ),
]


def upgrade() -> None:
    uuid_type = postgresql.UUID(as_uuid=True)
    feature_ids = {slug: uuid.uuid4() for slug, _ in FEATURES}
    package_ids = {name: uuid.uuid4() for name, *_ in PACKAGES}
    user_ids = {"admin@credflow.dev": uuid.uuid4(), "user@credflow.dev": uuid.uuid4()}

    features = sa.table(
        "features",
        sa.column("id", uuid_type),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
    )
    packages = sa.table(
        "packages",
        sa.column("id", uuid_type),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("price", sa.Numeric(10, 2)),
        sa.column("credit_amount", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    package_features = sa.table(
        "package_features",
        sa.column("package_id", uuid_type),
        sa.column("feature_id", uuid_type),
    )
    users = sa.table(
        "users",
        sa.column("id", uuid_type),
        sa.column("email", sa.String()),
        sa.column("password_hash", sa.String()),
        sa.column("role", sa.String()),
    )
    user_credits = sa.table(
        "user_credits",
        sa.column("id", uuid_type),
        sa.column("user_id", uuid_type),
        sa.column("balance", sa.Integer()),
    )

    op.bulk_insert(
        features,
        [
            {"id": feature_ids[slug], "slug": slug, "name": name, "description": f"{name} feature"}
            for slug, name in FEATURES
        ],
    )
    op.bulk_insert(
        packages,
        [
            {
                "id": package_ids[name],
                "name": name,
                "description": description,
                "price": Decimal(price),
                "credit_amount": credits,
                "is_active": True,
            }
            for name, description, price, credits, _ in PACKAGES
        ],
    )
    op.bulk_insert(
        package_features,
        [
            {"package_id": package_ids[name], "feature_id": feature_ids[slug]}
            for name, _, _, _, slugs in PACKAGES
            for slug in slugs
        ],
    )
    op.bulk_insert(
        users,
        [
            {
                "id": user_ids["admin@credflow.dev"],
                "email": "admin@credflow.dev",
                "password_hash": pwd_context.hash("Admin@123"),
                "role": "admin",
            },
            {
                "id": user_ids["user@credflow.dev"],
                "email": "user@credflow.dev",
                "password_hash": pwd_context.hash("User@123"),
                "role": "user",
            },
        ],
    )
    op.bulk_insert(
        user_credits,
        [
            {"id": uuid.uuid4(), "user_id": user_id, "balance": 0}
            for user_id in user_ids.values()
        ],
    )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@credflow.dev', 'user@credflow.dev'))"))
    connection.execute(sa.text("DELETE FROM users WHERE email IN ('admin@credflow.dev', 'user@credflow.dev')"))
    connection.execute(sa.text("DELETE FROM package_features"))
    connection.execute(sa.text("DELETE FROM packages WHERE name IN ('Basic', 'Pro', 'Enterprise')"))
    connection.execute(sa.text("DELETE FROM features WHERE slug IN ('basic_api', 'image_generation', 'analytics', 'auto_post', 'priority_support')"))
