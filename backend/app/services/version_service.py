from datetime import datetime, timezone
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.models.version import UserSongVersion, VersionCreate, VersionUpdate


async def list_versions(db: AsyncIOMotorDatabase, user_id: str, song_id: str) -> list[UserSongVersion]:
    cursor = db.user_song_versions.find({"user_id": user_id, "song_id": song_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=200)
    return [UserSongVersion.model_validate(doc) for doc in docs]


async def get_version(db: AsyncIOMotorDatabase, version_id: str) -> UserSongVersion | None:
    doc = await db.user_song_versions.find_one({"_id": version_id})
    if doc is None:
        return None
    return UserSongVersion.model_validate(doc)


async def create_version(
    db: AsyncIOMotorDatabase, user_id: str, song_id: str, payload: VersionCreate
) -> UserSongVersion:
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "user_id": user_id,
        "song_id": song_id,
        "name": payload.name,
        "transpose_semitones": payload.transpose_semitones,
        "capo_override": payload.capo_override,
        "chord_overrides": [o.model_dump() for o in payload.chord_overrides],
        "simplify_applied": payload.simplify_applied,
        "is_default": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.user_song_versions.insert_one(doc)
    return UserSongVersion.model_validate(doc)


async def update_version(
    db: AsyncIOMotorDatabase, version_id: str, payload: VersionUpdate
) -> UserSongVersion | None:
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if "chord_overrides" in updates and updates["chord_overrides"] is not None:
        updates["chord_overrides"] = [o if isinstance(o, dict) else o.model_dump() for o in updates["chord_overrides"]]
    updates["updated_at"] = datetime.now(timezone.utc)

    result = await db.user_song_versions.find_one_and_update(
        {"_id": version_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if result is None:
        return None
    return UserSongVersion.model_validate(result)


async def delete_version(db: AsyncIOMotorDatabase, version_id: str) -> bool:
    result = await db.user_song_versions.delete_one({"_id": version_id})
    return result.deleted_count > 0
