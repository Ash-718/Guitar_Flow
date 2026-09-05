from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.firebase_auth import get_current_user_id
from app.dependencies import get_db
from app.models.version import UserSongVersion, VersionCreate, VersionUpdate
from app.services import song_service, version_service

router = APIRouter(tags=["versions"])


@router.get("/api/songs/{song_id}/versions", response_model=list[UserSongVersion])
async def list_song_versions(
    song_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[UserSongVersion]:
    return await version_service.list_versions(db, user_id, song_id)


@router.post(
    "/api/songs/{song_id}/versions",
    response_model=UserSongVersion,
    status_code=status.HTTP_201_CREATED,
)
async def create_song_version(
    song_id: str,
    payload: VersionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserSongVersion:
    song = await song_service.get_song_by_id(db, song_id)
    if song is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    return await version_service.create_version(db, user_id, song_id, payload)


@router.put("/api/versions/{version_id}", response_model=UserSongVersion)
async def update_version(
    version_id: str,
    payload: VersionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserSongVersion:
    existing = await version_service.get_version(db, version_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
    if existing.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your version")

    updated = await version_service.update_version(db, version_id, payload)
    return updated


@router.delete("/api/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(
    version_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    existing = await version_service.get_version(db, version_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
    if existing.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your version")

    await version_service.delete_version(db, version_id)
