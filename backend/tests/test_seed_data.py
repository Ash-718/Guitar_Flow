import json
from pathlib import Path

import pytest

from app.models.chord import ChordLibraryEntry
from app.models.song import Song

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"


@pytest.fixture(scope="module")
def songs() -> list[dict]:
    return json.loads((DATA_DIR / "demo_songs.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def chords() -> list[dict]:
    return json.loads((DATA_DIR / "chord_library.json").read_text(encoding="utf-8"))


def test_at_least_eight_demo_songs(songs):
    assert len(songs) >= 8


def test_every_song_matches_schema(songs):
    for raw in songs:
        song = Song.model_validate(raw)
        assert song.title
        assert song.artist
        assert len(song.sections) >= 1


def test_songs_are_original_platform_content(songs):
    for raw in songs:
        assert raw["source"] == "platform"


def test_song_ids_are_unique(songs):
    ids = [s["_id"] for s in songs]
    assert len(ids) == len(set(ids))


def test_dataset_covers_required_chord_qualities(songs):
    used = {c["chord"] for s in songs for sec in s["sections"] for line in sec["lines"] for c in line["chords"]}
    assert any(c.endswith("m") and not c.endswith("maj7") and "/" not in c for c in used), "no minor chords"
    assert any(c.endswith("7") and "maj7" not in c for c in used), "no 7th chords"
    assert any("maj7" in c for c in used), "no maj7 chords"
    assert any("sus2" in c for c in used), "no sus2 chords"
    assert any("sus4" in c for c in used), "no sus4 chords"
    assert any("add9" in c for c in used), "no add9 chords"
    assert any("/" in c for c in used), "no slash chords"


def test_dataset_has_multi_section_and_long_song(songs):
    assert any(len(s["sections"]) >= 6 for s in songs), "no long song for auto-scroll testing"


def test_dataset_has_capo_song(songs):
    assert any(s["capo"] > 0 for s in songs), "no song demonstrating capo/concert-key distinction"


def test_dataset_has_difficulty_spread(songs):
    difficulties = {s["difficulty"] for s in songs}
    assert {"beginner", "intermediate", "advanced"}.issubset(difficulties)


def test_every_chord_entry_matches_schema(chords):
    for raw in chords:
        entry = ChordLibraryEntry.model_validate(raw)
        assert entry.name


def test_chord_library_covers_every_chord_used_in_songs(songs, chords):
    used = {c["chord"] for s in songs for sec in s["sections"] for line in sec["lines"] for c in line["chords"]}
    library_names = {c["name"] for c in chords}
    assert used.issubset(library_names)


def test_required_mvp_diagram_chords_present(chords):
    required = {"C", "D", "Dm", "E", "Em", "F", "G", "A", "Am", "B", "Bm"}
    library_names = {c["name"] for c in chords}
    assert required.issubset(library_names)


def test_diagram_fret_window_is_internally_consistent(chords):
    """A 4-fret diagram window can only show frets [base_fret, base_fret+3].
    A shape fretted above that window (e.g. Gm at frets 3-5, C#m at 4-6)
    needs base_fret raised to its lowest fretted position - otherwise the
    diagram would render dots off the visible board."""
    for entry in chords:
        diagram = entry.get("diagram")
        if not diagram:
            continue
        fretted = [f for f in diagram["frets"] if f > 0]
        if not fretted:
            continue
        base_fret = diagram["base_fret"]
        assert min(fretted) >= base_fret, f"{entry['name']}: base_fret {base_fret} is below its lowest fret {min(fretted)}"
        assert max(fretted) <= base_fret + 3, (
            f"{entry['name']}: fret {max(fretted)} falls outside the 4-fret window "
            f"starting at base_fret={base_fret}"
        )


def test_chord_positions_within_lyric_bounds(songs):
    for s in songs:
        for sec in s["sections"]:
            for line in sec["lines"]:
                lyric_len = len(line["lyrics"])
                for c in line["chords"]:
                    assert 0 <= c["position"] <= lyric_len


def test_chords_on_the_same_line_never_overlap(songs):
    """The frontend renders the chord row as plain fixed-width text with one
    chord name written at each position - two chords whose names overlap
    (e.g. "Gmaj7" at position 4 running into "Em7" at position 8) collide
    into unreadable text like "GmajEm7" instead of colliding gracefully."""
    for s in songs:
        for sec in s["sections"]:
            for line in sec["lines"]:
                chords = sorted(line["chords"], key=lambda c: c["position"])
                for a, b in zip(chords, chords[1:]):
                    a_end = a["position"] + len(a["chord"])
                    assert b["position"] >= a_end, (
                        f"{s['_id']} / {sec['name']}: {a['chord']!r}@{a['position']} "
                        f"overlaps {b['chord']!r}@{b['position']} in line {line['lyrics']!r}"
                    )
