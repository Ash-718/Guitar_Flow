from fastapi import APIRouter

from app.models.theory import (
    ChordSuggestion,
    SimplifyRequest,
    SimplifyResponse,
    TransposeRequest,
    TransposeResponse,
)
from app.utils.chord_parser import InvalidChordError
from app.utils.music_theory import simplify_chord, transpose_chord

router = APIRouter(prefix="/api", tags=["theory"])


@router.post("/transpose", response_model=TransposeResponse)
async def transpose(payload: TransposeRequest) -> TransposeResponse:
    result = []
    for chord in payload.chords:
        try:
            result.append(transpose_chord(chord, payload.semitones))
        except InvalidChordError:
            # A chord we can't parse (e.g. a free-form custom chord) is left
            # as-is rather than failing the whole request.
            result.append(chord)
    return TransposeResponse(chords=result)


@router.post("/simplify", response_model=SimplifyResponse)
async def simplify(payload: SimplifyRequest) -> SimplifyResponse:
    suggestions = []
    for chord in payload.chords:
        try:
            simplified = simplify_chord(chord)
        except InvalidChordError:
            simplified = None
        suggestions.append(ChordSuggestion(original=chord, simplified=simplified))
    return SimplifyResponse(suggestions=suggestions)
