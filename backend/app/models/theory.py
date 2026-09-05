from pydantic import BaseModel


class TransposeRequest(BaseModel):
    chords: list[str]
    semitones: int


class TransposeResponse(BaseModel):
    chords: list[str]


class SimplifyRequest(BaseModel):
    chords: list[str]


class ChordSuggestion(BaseModel):
    original: str
    simplified: str | None = None


class SimplifyResponse(BaseModel):
    suggestions: list[ChordSuggestion]
