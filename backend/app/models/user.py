from datetime import datetime, timezone

from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    scroll_speed: float = Field(default=40.0, gt=0, description="Auto-scroll speed in pixels/second")
    dark_mode: bool = True


class User(BaseModel):
    id: str = Field(validation_alias="_id")
    firebase_uid: str
    display_name: str = ""
    email: str = ""
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}


class UserSyncRequest(BaseModel):
    display_name: str = ""
    email: str = ""


class PreferencesUpdate(BaseModel):
    scroll_speed: float | None = Field(default=None, gt=0)
    dark_mode: bool | None = None
