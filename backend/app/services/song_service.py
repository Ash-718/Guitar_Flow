from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.song import Song


async def get_song_by_id(db: AsyncIOMotorDatabase, song_id: str) -> Song | None:
    doc = await db.songs.find_one({"_id": song_id})
    if doc is None:
        return None
    return Song.model_validate(doc)
