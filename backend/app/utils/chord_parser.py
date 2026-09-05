"""Parses a guitar chord symbol into its structural components.

A chord symbol is decomposed as: <root><accidental><suffix>[/<bass_root><bass_accidental>]
e.g. "F#m7"   -> root=F,  accidental=#, suffix=m7
     "C/E"    -> root=C,  accidental='', suffix='', bass_root=E
     "A/C#"   -> root=A,  accidental='', suffix='', bass_root=C, bass_accidental=#
     "Dsus4"  -> root=D,  accidental='', suffix=sus4

This is a real grammar (not string replacement): transposition and
simplification both operate on these parsed parts, never on raw substrings.
"""

import re
from dataclasses import dataclass

_CHORD_RE = re.compile(r"^([A-G])(#|b)?([^/]*)(?:/([A-G])(#|b)?)?$")


class InvalidChordError(ValueError):
    pass


@dataclass(frozen=True)
class ParsedChord:
    root: str
    accidental: str  # '', '#', or 'b'
    suffix: str  # '', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', 'add9', ...
    bass_root: str | None = None
    bass_accidental: str = ""

    @property
    def is_slash(self) -> bool:
        return self.bass_root is not None


def parse_chord(symbol: str) -> ParsedChord:
    symbol = symbol.strip()
    match = _CHORD_RE.match(symbol)
    if not match:
        raise InvalidChordError(f"'{symbol}' is not a recognizable chord symbol")

    root, accidental, suffix, bass_root, bass_accidental = match.groups()
    return ParsedChord(
        root=root,
        accidental=accidental or "",
        suffix=suffix or "",
        bass_root=bass_root,
        bass_accidental=bass_accidental or "",
    )


def format_chord(parsed: ParsedChord) -> str:
    result = f"{parsed.root}{parsed.accidental}{parsed.suffix}"
    if parsed.bass_root:
        result += f"/{parsed.bass_root}{parsed.bass_accidental}"
    return result
