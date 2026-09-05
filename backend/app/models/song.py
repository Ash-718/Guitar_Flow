from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.models.chord import ChordPlacement, Difficulty


class StrummingPattern(BaseModel):
    pattern: str = Field(description="Space-separated D/U tokens, e.g. 'D D U U D U'")
    bpm: int = Field(gt=0)


class Line(BaseModel):
    lyrics: str
    chords: list[ChordPlacement] = Field(default_factory=list)


class Section(BaseModel):
    name: str
    lines: list[Line]


class Song(BaseModel):
    id: str = Field(validation_alias="_id")
    title: str
    artist: str
    key: str
    bpm: int = Field(gt=0)
    capo: int = Field(default=0, ge=0, le=11)
    difficulty: Difficulty
    tags: list[str] = Field(default_factory=list)
    strumming_pattern: StrummingPattern
    sections: list[Section]
    source: str = Field(default="platform", description="'platform' demo content or 'user_uploaded'")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}


class SongSummary(BaseModel):
    """Lightweight shape for search/list results - omits full lyrics/chords."""

    id: str = Field(validation_alias="_id")
    title: str
    artist: str
    key: str
    bpm: int
    difficulty: Difficulty
    tags: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}
