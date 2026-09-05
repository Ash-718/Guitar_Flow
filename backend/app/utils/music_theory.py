"""Transposition and simplification built on real pitch-class arithmetic.

Transposition parses a chord into (root, accidental[, bass]), converts each
note to a pitch class (0-11), shifts it by N semitones on a 12-tone
chromatic circle, and re-spells the result - it never does substring
replacement on the chord name. Enharmonic spelling of the *result* prefers
sharps unless the *input* note was itself spelled with a flat, and the four
pitch classes that are (almost) always written as a natural note (C, E, F, B)
are pinned in both scales so e.g. Bb -> B rather than the theoretically
"consistent" but practically unused Cb.

Simplification is driven by a small, explicit, expandable suffix map
(SIMPLIFIABLE_SUFFIXES) rather than a hardcoded per-chord-name table, so it
composes correctly with transposition (e.g. simplify(transpose(F#m7)) is
consistent) and new extensions can be added in one place.
"""

from app.utils.chord_parser import ParsedChord, format_chord, parse_chord

SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLAT_SCALE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

_NOTE_TO_PC: dict[str, int] = {}
for _scale in (SHARP_SCALE, FLAT_SCALE):
    for _pc, _name in enumerate(_scale):
        _NOTE_TO_PC[_name] = _pc

# Simplification: suffix -> simplified suffix. Exact-match only (no prefix/
# substring guessing), so "m7" and "maj7" and "7" never collide with each
# other. Expand this table to teach the simplifier new chord extensions.
SIMPLIFIABLE_SUFFIXES: dict[str, str] = {
    "maj7": "",
    "m7": "m",
    "7": "",
    "sus2": "",
    "sus4": "",
    "add9": "",
    "6": "",
    "m6": "m",
    "9": "",
    "maj9": "",
    "m9": "m",
}


def _note_to_pc(root: str, accidental: str) -> int:
    key = f"{root}{accidental}"
    if key not in _NOTE_TO_PC:
        raise ValueError(f"Unknown note '{key}'")
    return _NOTE_TO_PC[key]


def _transpose_note(root: str, accidental: str, semitones: int) -> tuple[str, str]:
    pc = _note_to_pc(root, accidental)
    new_pc = (pc + semitones) % 12
    scale = FLAT_SCALE if accidental == "b" else SHARP_SCALE
    new_name = scale[new_pc]
    new_root, new_accidental = new_name[0], new_name[1:]
    return new_root, new_accidental


def transpose_chord(symbol: str, semitones: int) -> str:
    """Transposes a single chord symbol by `semitones` (may be negative)."""
    if semitones == 0:
        return symbol

    parsed = parse_chord(symbol)
    new_root, new_accidental = _transpose_note(parsed.root, parsed.accidental, semitones)

    new_bass_root = None
    new_bass_accidental = ""
    if parsed.is_slash:
        new_bass_root, new_bass_accidental = _transpose_note(
            parsed.bass_root, parsed.bass_accidental, semitones
        )

    return format_chord(
        ParsedChord(
            root=new_root,
            accidental=new_accidental,
            suffix=parsed.suffix,
            bass_root=new_bass_root,
            bass_accidental=new_bass_accidental,
        )
    )


def transpose_key(key: str, semitones: int) -> str:
    """Keys are written the same way as chord roots ('G', 'Am', 'F#'...)."""
    return transpose_chord(key, semitones)


def simplify_chord(symbol: str) -> str | None:
    """Returns a beginner-friendlier chord, or None if there's nothing to simplify.

    Two independent things can be simplified: a known "advanced" suffix
    (7, maj7, m7, sus2, sus4, add9, ...) and a slash-chord bass note. If
    neither applies, the chord is already as simple as this module knows
    how to make it and None is returned so callers can leave it untouched.
    """
    parsed = parse_chord(symbol)

    simplified_suffix = SIMPLIFIABLE_SUFFIXES.get(parsed.suffix)
    has_bass = parsed.is_slash

    if simplified_suffix is None and not has_bass:
        return None

    final_suffix = simplified_suffix if simplified_suffix is not None else parsed.suffix
    return format_chord(ParsedChord(root=parsed.root, accidental=parsed.accidental, suffix=final_suffix))
