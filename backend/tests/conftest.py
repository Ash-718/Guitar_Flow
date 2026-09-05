import json
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.auth.firebase_auth import get_current_user_id
from app.dependencies import get_db
from app.main import app

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"
TEST_USER_ID = "test-user-123"
OTHER_USER_ID = "test-user-456"


@pytest_asyncio.fixture
async def db():
    client = AsyncMongoMockClient()
    database = client["guitarflow_test"]

    songs = json.loads((DATA_DIR / "demo_songs.json").read_text(encoding="utf-8"))
    chords = json.loads((DATA_DIR / "chord_library.json").read_text(encoding="utf-8"))
    if songs:
        await database.songs.insert_many(songs)
    if chords:
        await database.chord_library.insert_many(chords)

    yield database


@pytest_asyncio.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
