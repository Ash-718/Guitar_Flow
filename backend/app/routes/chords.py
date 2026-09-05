from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db
from app.models.chord import ChordLibraryEntry

router = APIRouter(prefix="/api/chords", tags=["chords"])


@router.get("", response_model=list[ChordLibraryEntry])
async def list_chords(db: AsyncIOMotorDatabase = Depends(get_db)) -> list[dict]:
    cursor = db.chord_library.find({}).sort("name", 1)
    return await cursor.to_list(length=500)


@router.get("/{name}", response_model=ChordLibraryEntry)
async def get_chord(name: str, db: AsyncIOMotorDatabase = Depends(get_db)) -> dict:
    doc = await db.chord_library.find_one({"_id": name})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Chord '{name}' not in library")
    return doc
