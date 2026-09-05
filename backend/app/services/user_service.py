from datetime import datetime, timezone
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.models.user import PreferencesUpdate, User, UserSyncRequest


async def sync_user(db: AsyncIOMotorDatabase, firebase_uid: str, payload: UserSyncRequest) -> User:
    existing = await db.users.find_one({"firebase_uid": firebase_uid})
    if existing:
        updated = await db.users.find_one_and_update(
            {"firebase_uid": firebase_uid},
            {"$set": {"display_name": payload.display_name, "email": payload.email}},
            return_document=ReturnDocument.AFTER,
        )
        return User.model_validate(updated)

    doc = {
        "_id": str(uuid4()),
        "firebase_uid": firebase_uid,
        "display_name": payload.display_name,
        "email": payload.email,
        "preferences": {"scroll_speed": 40.0, "dark_mode": True},
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    return User.model_validate(doc)


async def get_user_by_firebase_uid(db: AsyncIOMotorDatabase, firebase_uid: str) -> User | None:
    doc = await db.users.find_one({"firebase_uid": firebase_uid})
    if doc is None:
        return None
    return User.model_validate(doc)


async def update_preferences(
    db: AsyncIOMotorDatabase, firebase_uid: str, payload: PreferencesUpdate
) -> User | None:
    updates = {f"preferences.{k}": v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not updates:
        return await get_user_by_firebase_uid(db, firebase_uid)

    updated = await db.users.find_one_and_update(
        {"firebase_uid": firebase_uid},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        return None
    return User.model_validate(updated)
