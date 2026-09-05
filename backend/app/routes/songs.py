from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db
from app.models.song import Song, SongSummary
from app.services import song_service
from app.services.search_service import search_songs

router = APIRouter(prefix="/api/songs", tags=["songs"])


@router.get("", response_model=list[SongSummary])
async def list_songs(
    search: str | None = None,
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict]:
    return await search_songs(db, search, difficulty)


@router.get("/{song_id}", response_model=Song)
async def get_song(song_id: str, db: AsyncIOMotorDatabase = Depends(get_db)) -> Song:
    song = await song_service.get_song_by_id(db, song_id)
    if song is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    return song
