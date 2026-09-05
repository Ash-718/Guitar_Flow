import pytest

from app.config import get_settings
from tests.conftest import OTHER_USER_ID, TEST_USER_ID


# ---------------------------------------------------------------------------
# Songs
# ---------------------------------------------------------------------------

async def test_list_songs_returns_all_demo_songs(client):
    resp = await client.get("/api/songs")
    assert resp.status_code == 200
    assert len(resp.json()) == 10


async def test_search_is_case_insensitive_partial_match(client):
    resp = await client.get("/api/songs", params={"search": "morn"})
    assert resp.status_code == 200
    titles = [s["title"] for s in resp.json()]
    assert "Morning Light" in titles


async def test_search_matches_artist_too(client):
    resp = await client.get("/api/songs", params={"search": "wren"})
    assert resp.status_code == 200
    artists = {s["artist"] for s in resp.json()}
    assert artists == {"Wren & Sable"}
    assert len(resp.json()) == 3


async def test_search_no_match_returns_empty_list(client):
    resp = await client.get("/api/songs", params={"search": "zzz_nonexistent"})
    assert resp.status_code == 200
    assert resp.json() == []


async def test_filter_by_difficulty(client):
    resp = await client.get("/api/songs", params={"difficulty": "beginner"})
    assert resp.status_code == 200
    assert all(s["difficulty"] == "beginner" for s in resp.json())
    assert len(resp.json()) > 0


async def test_get_song_detail(client):
    resp = await client.get("/api/songs/song-morning-light")
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Morning Light"
    assert len(body["sections"]) > 0
    assert body["sections"][0]["lines"][0]["chords"][0]["chord"] == "G"


async def test_get_song_not_found(client):
    resp = await client.get("/api/songs/does-not-exist")
    assert resp.status_code == 404
    assert "detail" in resp.json()


# ---------------------------------------------------------------------------
# Chords
# ---------------------------------------------------------------------------

async def test_list_chords(client):
    resp = await client.get("/api/chords")
    assert resp.status_code == 200
    assert len(resp.json()) == 31


async def test_get_chord_detail(client):
    resp = await client.get("/api/chords/C")
    assert resp.status_code == 200
    body = resp.json()
    assert body["root"] == "C"
    assert body["diagram"]["frets"] == [-1, 3, 2, 0, 1, 0]


async def test_get_chord_not_found(client):
    resp = await client.get("/api/chords/Zx9")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Transpose / Simplify (thin wrappers - full coverage lives in test_music_theory)
# ---------------------------------------------------------------------------

async def test_transpose_endpoint(client):
    resp = await client.post("/api/transpose", json={"chords": ["G", "Em", "C", "D"], "semitones": 2})
    assert resp.status_code == 200
    assert resp.json()["chords"] == ["A", "F#m", "D", "E"]


async def test_simplify_endpoint(client):
    resp = await client.post("/api/simplify", json={"chords": ["F#m7", "C"]})
    assert resp.status_code == 200
    suggestions = resp.json()["suggestions"]
    assert suggestions[0] == {"original": "F#m7", "simplified": "F#m"}
    assert suggestions[1] == {"original": "C", "simplified": None}


# ---------------------------------------------------------------------------
# Versions (auth required, ownership enforced)
# ---------------------------------------------------------------------------

async def test_create_and_list_version(client):
    create_resp = await client.post(
        "/api/songs/song-morning-light/versions",
        json={"name": "My Version", "transpose_semitones": 2, "chord_overrides": []},
    )
    assert create_resp.status_code == 201
    version = create_resp.json()
    assert version["user_id"] == TEST_USER_ID
    assert version["song_id"] == "song-morning-light"

    list_resp = await client.get("/api/songs/song-morning-light/versions")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


async def test_create_version_for_missing_song_404(client):
    resp = await client.post("/api/songs/does-not-exist/versions", json={"name": "x"})
    assert resp.status_code == 404


async def test_update_version(client):
    create_resp = await client.post("/api/songs/song-morning-light/versions", json={"name": "Draft"})
    version_id = create_resp.json()["id"]

    update_resp = await client.put(f"/api/versions/{version_id}", json={"name": "Renamed"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Renamed"


async def test_update_someone_elses_version_is_forbidden(client, db):
    await db.user_song_versions.insert_one(
        {
            "_id": "v-other-user",
            "user_id": OTHER_USER_ID,
            "song_id": "song-morning-light",
            "name": "Not yours",
            "transpose_semitones": 0,
            "capo_override": None,
            "chord_overrides": [],
            "simplify_applied": False,
            "is_default": False,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        }
    )
    resp = await client.put("/api/versions/v-other-user", json={"name": "Hijacked"})
    assert resp.status_code == 403


async def test_delete_version(client):
    create_resp = await client.post("/api/songs/song-morning-light/versions", json={"name": "Temp"})
    version_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/versions/{version_id}")
    assert delete_resp.status_code == 204

    list_resp = await client.get("/api/songs/song-morning-light/versions")
    assert list_resp.json() == []


async def test_delete_nonexistent_version_404(client):
    resp = await client.delete("/api/versions/does-not-exist")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

async def test_sync_then_get_me(client):
    sync_resp = await client.post("/api/users/sync", json={"display_name": "Alex", "email": "a@example.com"})
    assert sync_resp.status_code == 200
    assert sync_resp.json()["firebase_uid"] == TEST_USER_ID

    me_resp = await client.get("/api/users/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["display_name"] == "Alex"


async def test_get_me_before_sync_is_404(client):
    resp = await client.get("/api/users/me")
    assert resp.status_code == 404


async def test_update_preferences(client):
    await client.post("/api/users/sync", json={"display_name": "Alex", "email": "a@example.com"})
    resp = await client.put("/api/users/me/preferences", json={"scroll_speed": 75.0, "dark_mode": False})
    assert resp.status_code == 200
    prefs = resp.json()["preferences"]
    assert prefs["scroll_speed"] == 75.0
    assert prefs["dark_mode"] is False


# ---------------------------------------------------------------------------
# Auth dependency itself (bypasses HTTP - exercises real vs dev-bypass modes)
# ---------------------------------------------------------------------------

async def test_dev_bypass_returns_fixed_uid(monkeypatch):
    from app.auth.firebase_auth import DEV_BYPASS_UID, get_current_user_id

    get_settings.cache_clear()
    monkeypatch.setenv("AUTH_DEV_BYPASS", "true")
    uid = await get_current_user_id(authorization=None)
    assert uid == DEV_BYPASS_UID
    get_settings.cache_clear()


async def test_missing_token_without_bypass_is_401(monkeypatch):
    from app.auth.firebase_auth import get_current_user_id
    from fastapi import HTTPException

    get_settings.cache_clear()
    monkeypatch.setenv("AUTH_DEV_BYPASS", "false")
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization=None)
    assert exc_info.value.status_code == 401
    get_settings.cache_clear()


async def test_garbage_token_without_bypass_is_401_not_500(monkeypatch):
    from app.auth.firebase_auth import get_current_user_id
    from fastapi import HTTPException

    get_settings.cache_clear()
    monkeypatch.setenv("AUTH_DEV_BYPASS", "false")
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization="Bearer not-a-real-token")
    assert exc_info.value.status_code == 401
    get_settings.cache_clear()
