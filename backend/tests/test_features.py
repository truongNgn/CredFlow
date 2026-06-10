import pytest

from app.services import credit_service
from tests.conftest import login


@pytest.mark.asyncio
async def test_feature_guard_before_and_after_purchase(client, seeded_db, monkeypatch):
    token = await login(client, "user@example.com", "User123!")
    headers = {"Authorization": f"Bearer {token}"}

    blocked = await client.get("/api/features/analytics", headers=headers)
    assert blocked.status_code == 403

    async def succeeds():
        return True

    monkeypatch.setattr(credit_service, "payment_succeeds", succeeds)
    purchased = await client.post(
        "/api/credits/purchase",
        headers=headers,
        json={"package_id": str(seeded_db["package_id"])},
    )
    assert purchased.status_code == 200

    analytics = await client.get("/api/features/analytics", headers=headers)
    image = await client.post("/api/features/generate-image", headers=headers)
    assert analytics.status_code == 200
    assert image.status_code == 200

    auto_post = await client.post("/api/features/auto-post", headers=headers)
    assert auto_post.status_code == 403
