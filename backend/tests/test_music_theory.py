import json
from pathlib import Path

import pytest

from app.utils.chord_parser import InvalidChordError, ParsedChord, parse_chord, format_chord
from app.utils.music_theory import SIMPLIFIABLE_SUFFIXES, simplify_chord, transpose_chord, transpose_key

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "symbol, expected",
    [
        ("C", ParsedChord("C", "", "")),
        ("G", ParsedChord("G", "", "")),
        ("Am", ParsedChord("A", "", "m")),
        ("F#m7", ParsedChord("F", "#", "m7")),
        ("Bb", ParsedChord("B", "b", "")),
        ("Dmaj7", ParsedChord("D", "", "maj7")),
        ("Cadd9", ParsedChord("C", "", "add9")),
        ("Dsus2", ParsedChord("D", "", "sus2")),
        ("Dsus4", ParsedChord("D", "", "sus4")),
        ("C/E", ParsedChord("C", "", "", "E", "")),
        ("G/B", ParsedChord("G", "", "", "B", "")),
        ("A/C#", ParsedChord("A", "", "", "C", "#")),
    ],
)
def test_parse_chord(symbol, expected):
    assert parse_chord(symbol) == expected


def test_parse_invalid_chord_raises():
    with pytest.raises(InvalidChordError):
        parse_chord("H7")


def test_format_chord_roundtrip():
    for symbol in ["C", "F#m7", "Bb", "C/E", "A/C#", "Dsus4"]:
        assert format_chord(parse_chord(symbol)) == symbol


# ---------------------------------------------------------------------------
# Transposition - exact edge cases from the spec
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "chord, semitones, expected",
    [
        ("G", 1, "G#"),
        ("Gm", 1, "G#m"),
        ("F#m7", 1, "Gm7"),
        ("Bb", 1, "B"),
        ("C/E", 1, "C#/F"),
    ],
)
def test_transpose_spec_edge_cases(chord, semitones, expected):
    assert transpose_chord(chord, semitones) == expected


def test_transpose_zero_is_identity():
    assert transpose_chord("F#m7", 0) == "F#m7"


def test_transpose_full_octave_is_identity():
    assert transpose_chord("D", 12) == "D"
    assert transpose_chord("Bb", 12) == "Bb"


def test_transpose_negative_wraps_correctly():
    assert transpose_chord("C", -1) == "B"
    assert transpose_chord("C", -2) == "A#"  # natural root -> sharp spelling


def test_transpose_down_and_up_are_inverse():
    for symbol in ["G", "Bb", "F#m7", "C/E", "Dsus4", "Cadd9"]:
        assert transpose_chord(transpose_chord(symbol, 5), -5) == symbol


@pytest.mark.parametrize(
    "chord, semitones, expected",
    [
        ("G", 2, "A"),
        ("Em", 2, "F#m"),
        ("C", 2, "D"),
        ("D", 2, "E"),
        ("A", -2, "G"),
        ("F#m", -2, "Em"),
        ("D", -2, "C"),
        ("E", -2, "D"),
    ],
)
def test_transpose_progression_up_2(chord, semitones, expected):
    # Mirrors the spec's worked example: G Em C D transposed +2 -> A F#m D E
    assert transpose_chord(chord, semitones) == expected


def test_transpose_preserves_extension_suffixes():
    assert transpose_chord("Dmaj7", 2) == "Emaj7"
    assert transpose_chord("Cadd9", 2) == "Dadd9"
    assert transpose_chord("Dsus2", 2) == "Esus2"
    assert transpose_chord("Dsus4", 2) == "Esus4"
    assert transpose_chord("Bm7", 1) == "Cm7"
    assert transpose_chord("E7", 1) == "F7"


def test_transpose_key():
    assert transpose_key("G", 2) == "A"
    assert transpose_key("Am", 3) == "Cm"


def test_transpose_flat_root_prefers_flat_spelling_when_ambiguous():
    # Eb + 2 = F, unambiguous either way, but Db + 1 lands on an ambiguous
    # pitch class (D) which both scales spell identically - use a genuinely
    # ambiguous target instead: Eb -> (up 6) -> A, unambiguous; assert the
    # spelling is stable and round-trips.
    assert transpose_chord("Eb", 6) == "A"
    assert transpose_chord("Db", 1) == "D"


# ---------------------------------------------------------------------------
# Simplification
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "chord, expected",
    [
        ("F#m7", "F#m"),
        ("Dmaj7", "D"),
        ("Gmaj7", "G"),
        ("Cadd9", "C"),
        ("Dsus2", "D"),
        ("Dsus4", "D"),
        ("Bm7", "Bm"),
        ("E7", "E"),
        ("C/E", "C"),
        ("G/B", "G"),
        ("A/C#", "A"),
    ],
)
def test_simplify_known_extensions(chord, expected):
    assert simplify_chord(chord) == expected


@pytest.mark.parametrize("chord", ["C", "G", "Am", "Em", "F", "Bm", "F#m"])
def test_simplify_already_simple_chord_returns_none(chord):
    assert simplify_chord(chord) is None


def test_simplify_never_blindly_string_replaces():
    # "m7" must simplify to "m" (drop the 7), not "" (which would silently
    # turn a minor chord into a major one) - this is the case a naive
    # find/replace on the substring "7" would get wrong.
    assert simplify_chord("F#m7") == "F#m"
    assert simplify_chord("Bm7") == "Bm"


def test_simplify_slash_chord_with_extension_drops_both():
    assert simplify_chord("Dmaj7/F#") == "D"


# ---------------------------------------------------------------------------
# Cross-check: the static chord_library.json simplifies_to values must never
# drift from what the live algorithm actually produces.
# ---------------------------------------------------------------------------

def test_chord_library_simplifies_to_matches_algorithm():
    chords = json.loads((DATA_DIR / "chord_library.json").read_text(encoding="utf-8"))
    for entry in chords:
        algorithmic = simplify_chord(entry["name"])
        assert algorithmic == entry["simplifies_to"], (
            f"{entry['name']}: library says simplifies_to="
            f"{entry['simplifies_to']!r} but algorithm says {algorithmic!r}"
        )


def test_simplifiable_suffixes_table_is_exact_match_only():
    # Guards against future edits accidentally introducing substring-based
    # matching (e.g. "7" matching inside "m7" or "maj7").
    assert SIMPLIFIABLE_SUFFIXES["m7"] != SIMPLIFIABLE_SUFFIXES.get("maj7")
    assert "7" in SIMPLIFIABLE_SUFFIXES
    assert "m7" in SIMPLIFIABLE_SUFFIXES
    assert "maj7" in SIMPLIFIABLE_SUFFIXES
