import pytest

from app.services import credit_service
from tests.conftest import login


@pytest.mark.asyncio
async def test_purchase_success_updates_balance_and_features(client, seeded_db, monkeypatch):
    async def succeeds():
        return True

    monkeypatch.setattr(credit_service, "payment_succeeds", succeeds)
    token = await login(client, "user@example.com", "User123!")
    headers = {"Authorization": f"Bearer {token}"}

    purchased = await client.post(
        "/api/credits/purchase",
        headers=headers,
        json={"package_id": str(seeded_db["package_id"])},
    )
    assert purchased.status_code == 200
    assert purchased.json()["data"]["status"] == "success"
    assert purchased.json()["data"]["balance"] == 500
    assert {item["slug"] for item in purchased.json()["data"]["unlocked_features"]} == {
        "basic_api",
        "analytics",
        "image_generation",
    }

    balance = await client.get("/api/credits/balance", headers=headers)
    assert balance.json()["data"]["balance"] == 500


@pytest.mark.asyncio
async def test_purchase_failure_is_recorded_without_credit(client, seeded_db, monkeypatch):
    async def fails():
        return False

    monkeypatch.setattr(credit_service, "payment_succeeds", fails)
    token = await login(client, "user@example.com", "User123!")
    headers = {"Authorization": f"Bearer {token}"}

    purchased = await client.post(
        "/api/credits/purchase",
        headers=headers,
        json={"package_id": str(seeded_db["package_id"])},
    )
    assert purchased.status_code == 200
    assert purchased.json()["data"]["status"] == "failed"
    assert purchased.json()["data"]["balance"] == 0

    history = await client.get("/api/credits/transactions?page=1&page_size=10", headers=headers)
    assert history.status_code == 200
    assert history.json()["data"]["total"] == 1
    assert history.json()["data"]["items"][0]["status"] == "failed"
