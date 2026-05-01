import pytest

from app.db.bootstrap import ensure_demo_data, ensure_demo_users


@pytest.mark.asyncio
async def test_ensure_demo_users_inserts_defaults_when_missing(test_db) -> None:
    assert await test_db.users.count_documents({}) == 0

    created = await ensure_demo_users(test_db, demo_mode=True)

    assert created == 3
    assert await test_db.users.count_documents({}) == 3
    emails = {
        doc["email"]
        async for doc in test_db.users.find({}, {"email": 1, "_id": 0})
    }
    assert emails == {
        "analyst.kim@corp.local",
        "lead.reyes@corp.local",
        "admin@corp.local",
    }


@pytest.mark.asyncio
async def test_ensure_demo_users_noop_when_demo_mode_disabled(test_db) -> None:
    created = await ensure_demo_users(test_db, demo_mode=False)
    assert created == 0
    assert await test_db.users.count_documents({}) == 0


@pytest.mark.asyncio
async def test_ensure_demo_data_seeds_cases_and_playbooks(test_db) -> None:
    created = await ensure_demo_data(test_db, demo_mode=True)

    assert created["users"] == 3
    assert created["cases"] > 0
    assert created["playbooks"] > 0
    assert await test_db.users.count_documents({}) == 3
    assert await test_db.cases.count_documents({}) == created["cases"]
    assert await test_db.playbooks.count_documents({}) == created["playbooks"]

    second_run = await ensure_demo_data(test_db, demo_mode=True)

    assert second_run == {"users": 0, "cases": 0, "playbooks": 0}
    assert await test_db.cases.count_documents({}) == created["cases"]
