"""Case-insensitive partial-match search over songs.

Uses a $regex query rather than Mongo's $text index: $text tokenizes into
whole words and can't match "Perf" against "Perfect", but the product spec
requires partial matches, so substring regex is the correct tool here even
though it doesn't scale as well as a text index. Fine for a demo catalog;
swap for a real search service (Atlas Search, Algolia, ...) if the catalog
grows.
"""

import re

from motor.motor_asyncio import AsyncIOMotorDatabase


def build_song_filter(search: str | None, difficulty: str | None) -> dict:
    filters: list[dict] = []

    if search:
        pattern = re.escape(search.strip())
        filters.append(
            {
                "$or": [
                    {"title": {"$regex": pattern, "$options": "i"}},
                    {"artist": {"$regex": pattern, "$options": "i"}},
                ]
            }
        )

    if difficulty:
        filters.append({"difficulty": difficulty})

    if not filters:
        return {}
    if len(filters) == 1:
        return filters[0]
    return {"$and": filters}


async def search_songs(db: AsyncIOMotorDatabase, search: str | None, difficulty: str | None) -> list[dict]:
    query = build_song_filter(search, difficulty)
    cursor = db.songs.find(query).sort("title", 1)
    return await cursor.to_list(length=200)
