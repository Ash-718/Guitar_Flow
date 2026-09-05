from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.firebase_auth import get_current_user_id
from app.dependencies import get_db
from app.models.user import PreferencesUpdate, User, UserSyncRequest
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/sync", response_model=User)
async def sync_user(
    payload: UserSyncRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> User:
    return await user_service.sync_user(db, user_id, payload)


@router.get("/me", response_model=User)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> User:
    user = await user_service.get_user_by_firebase_uid(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call /api/users/sync first")
    return user


@router.put("/me/preferences", response_model=User)
async def update_my_preferences(
    payload: PreferencesUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> User:
    user = await user_service.update_preferences(db, user_id, payload)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call /api/users/sync first")
    return user
