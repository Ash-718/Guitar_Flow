from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ChordOverride(BaseModel):
    """Overrides the chord at one position in the original song."""

    section_index: int = Field(ge=0)
    line_index: int = Field(ge=0)
    chord_index: int = Field(ge=0)
    chord: str


class UserSongVersion(BaseModel):
    id: str = Field(validation_alias="_id")
    user_id: str
    song_id: str
    name: str = "My Version"
    transpose_semitones: int = 0
    capo_override: int | None = Field(default=None, ge=0, le=11)
    chord_overrides: list[ChordOverride] = Field(default_factory=list)
    simplify_applied: bool = False
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}


class VersionCreate(BaseModel):
    name: str = "My Version"
    transpose_semitones: int = 0
    capo_override: int | None = Field(default=None, ge=0, le=11)
    chord_overrides: list[ChordOverride] = Field(default_factory=list)
    simplify_applied: bool = False


class VersionUpdate(BaseModel):
    name: str | None = None
    transpose_semitones: int | None = None
    capo_override: int | None = Field(default=None, ge=0, le=11)
    chord_overrides: list[ChordOverride] | None = None
    simplify_applied: bool | None = None
