from typing import Literal

from pydantic import BaseModel, Field

Difficulty = Literal["beginner", "intermediate", "advanced"]


class ChordPlacement(BaseModel):
    """A single chord positioned above a lyric line."""

    chord: str
    position: int = Field(ge=0, description="Character offset into the lyric line")


class Barre(BaseModel):
    fret: int
    from_string: int = Field(alias="fromString")
    to_string: int = Field(alias="toString")

    model_config = {"populate_by_name": True}


class ChordDiagram(BaseModel):
    """Fretboard geometry for a 6-string guitar, low-E (string 6) to high-E (string 1)."""

    frets: list[int] = Field(description="Fret per string, -1 for muted, 0 for open, len 6")
    fingers: list[int] = Field(description="Finger number per string, 0 if none/open/muted, len 6")
    barre: Barre | None = None
    base_fret: int = Field(default=1, description="Fret shown at top of diagram")


class ChordLibraryEntry(BaseModel):
    id: str = Field(alias="_id")
    name: str
    root: str
    quality: str
    difficulty: Difficulty
    simplifies_to: str | None = None
    diagram: ChordDiagram | None = None

    model_config = {"populate_by_name": True}
