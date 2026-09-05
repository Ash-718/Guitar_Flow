"""Seeds MongoDB with the GuitarFlow demo song catalog and chord library.

Run with:  python -m app.scripts.seed
Safe to re-run: platform-sourced songs and the chord library are replaced,
nothing user-generated (versions, users) is touched.
"""

import asyncio
import json
from pathlib import Path

from app.database import close_client, get_database

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


async def seed() -> None:
    db = get_database()

    songs = json.loads((DATA_DIR / "demo_songs.json").read_text(encoding="utf-8"))
    chords = json.loads((DATA_DIR / "chord_library.json").read_text(encoding="utf-8"))

    await db.songs.delete_many({"source": "platform"})
    if songs:
        await db.songs.insert_many(songs)

    await db.chord_library.delete_many({})
    if chords:
        await db.chord_library.insert_many(chords)

    await db.songs.create_index([("title", "text"), ("artist", "text")])
    await db.user_song_versions.create_index([("user_id", 1), ("song_id", 1)])
    await db.users.create_index("firebase_uid", unique=True)

    print(f"Seeded {len(songs)} songs and {len(chords)} chord library entries.")


async def main() -> None:
    try:
        await seed()
    finally:
        await close_client()


if __name__ == "__main__":
    asyncio.run(main())
