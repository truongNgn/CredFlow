import pytest

from tests.conftest import login


@pytest.mark.asyncio
async def test_public_list_and_admin_crud(client):
    listed = await client.get("/api/packages")
    assert listed.status_code == 200
    assert listed.json()["data"][0]["name"] == "Pro"

    user_token = await login(client, "user@example.com", "User123!")
    forbidden = await client.post(
        "/api/admin/packages",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Basic", "price": "9.00", "credit_amount": 100},
    )
    assert forbidden.status_code == 403

    admin_token = await login(client, "admin@example.com", "Admin123!")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin_list = await client.get("/api/admin/packages", headers=admin_headers)
    assert admin_list.status_code == 200
    assert admin_list.json()["data"][0]["name"] == "Pro"
    assert (await client.get("/api/admin/features", headers=admin_headers)).status_code == 200
    stats = await client.get("/api/admin/stats", headers=admin_headers)
    assert stats.status_code == 200
    assert stats.json()["data"]["users"] == 2

    created = await client.post(
        "/api/admin/packages",
        headers=admin_headers,
        json={
            "name": "Basic",
            "description": "Starter",
            "price": "9.00",
            "credit_amount": 100,
            "feature_slugs": ["basic_api"],
        },
    )
    assert created.status_code == 201
    package_id = created.json()["data"]["id"]

    updated = await client.put(
        f"/api/admin/packages/{package_id}",
        headers=admin_headers,
        json={"credit_amount": 120},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["credit_amount"] == 120

    deleted = await client.delete(
        f"/api/admin/packages/{package_id}",
        headers=admin_headers,
    )
    assert deleted.status_code == 204
    assert (await client.get(f"/api/packages/{package_id}")).status_code == 404
