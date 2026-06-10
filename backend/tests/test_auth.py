import pytest


@pytest.mark.asyncio
async def test_register_login_and_me(client):
    registered = await client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Password123!"},
    )
    assert registered.status_code == 201
    token = registered.json()["data"]["access_token"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["data"]["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_duplicate_registration_is_rejected(client):
    response = await client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "Password123!"},
    )
    assert response.status_code == 409
    assert response.json()["success"] is False
