import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["JWT_SECRET"] = "test-secret"

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Feature, Package, User, UserCredit
from app.services.auth_service import hash_password


@pytest_asyncio.fixture
async def session_factory():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield factory
    await engine.dispose()


@pytest_asyncio.fixture
async def seeded_db(session_factory):
    async with session_factory() as db:
        basic = Feature(name="Basic API", slug="basic_api", description="Basic access")
        analytics = Feature(name="Analytics", slug="analytics", description="Reports")
        image_generation = Feature(
            name="Image Generation", slug="image_generation", description="Generate images"
        )
        auto_post = Feature(name="Auto Post", slug="auto_post", description="Schedule posts")
        package = Package(
            name="Pro",
            description="Pro package",
            price=29,
            credit_amount=500,
            features=[basic, analytics, image_generation],
        )
        admin = User(
            email="admin@example.com",
            password_hash=hash_password("Admin123!"),
            role="admin",
            credit=UserCredit(balance=0),
        )
        user = User(
            email="user@example.com",
            password_hash=hash_password("User123!"),
            role="user",
            credit=UserCredit(balance=0),
        )
        db.add_all([package, auto_post, admin, user])
        await db.commit()
        return {"package_id": package.id}


@pytest_asyncio.fixture
async def client(session_factory, seeded_db):
    async def override_get_db():
        async with session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


async def login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["data"]["access_token"]
