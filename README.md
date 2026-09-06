# GuitarFlow

**Play songs your way.**

An interactive guitar-playing companion: search a song, view its lyrics and chords, customize the chords to how you actually play it, and enter a hands-free Play Mode that scrolls the chord sheet for you while you play.

## Problem Statement

Most online chord-sheet sites make you manually scroll while playing, and the chord arrangement they show is rarely how you personally want to play the song. GuitarFlow is built around one principle: **the app should help you *play* the song, not just *look it up***. That means:

- Chords you can tap and change, without ever losing the original arrangement.
- A real transpose engine (pitch-class math, not string replacement).
- A "simplify" pass that suggests beginner-friendly substitutions you can accept or reject.
- Correct capo math - toggling capo shows you a different chord shape for the *same* concert-key sound, it doesn't silently change the song's key.
- A Play Mode that scrolls continuously and hands-free, so you can set your phone down and just play.

## Features

- **Search** — case-insensitive, partial-match search across the demo catalog by title or artist, plus a "recently viewed" list.
- **Song View** — full chord sheet with chords aligned above the lyrics, key/BPM/capo/difficulty, distinct-chord chips, and the strumming pattern.
- **Chord editing** — tap any chord to change it (quick-pick common variants or a free-form custom chord). Edits only ever land on **My Version**; **Original** always shows the untouched arrangement.
- **Transpose** — up/down by semitone, backed by a real chromatic pitch-class algorithm with correct enharmonic spelling (`Bb -> B`, not `Bb -> Cb`), not naive text substitution.
- **Simplify** — suggests beginner-friendly substitutions (`F#m7 -> F#m`, `Dmaj7 -> D`, slash chords drop their bass note) with an explicit accept/reject preview.
- **Capo control** — change which capo fret you use without changing the song's actual (concert) key; the chord shapes shift, the `Key` display doesn't.
- **Chord diagrams** — tap any chord (in Play or Edit context) to see a data-driven fretboard diagram: open/muted strings, finger numbers, barre chords, and shapes anchored above the 4th fret.
- **Play Mode** — fullscreen, distraction-free, large text, continuous `requestAnimationFrame`-driven auto-scroll (not line jumps), pause/resume, restart, a speed slider + `-`/`+`, a progress bar, and keyboard shortcuts (`Space`, `Escape`, `↑`/`↓`).
- **Save versions** — signed-in users get their transpose/capo/chord edits saved per song and restored automatically next time they open it.
- **Metronome** — Web Audio "lookahead scheduler" for accurate timing (not a raw `setInterval` click), BPM `-`/`+`/slider, and a synced visual beat pulse.
- **Dark mode**, persisted and synced to your account once signed in.
- **Responsive** down to 375px, with chord sheets that scroll horizontally within their own container on narrow screens rather than breaking the page layout.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | Python 3.10, FastAPI, Motor (async MongoDB driver), Pydantic v2 |
| Database | MongoDB |
| Auth | Firebase Authentication (`firebase-admin` verifies tokens server-side) |
| Audio | Web Audio API (metronome + auto-scroll use `AudioContext`/`requestAnimationFrame`, never `setInterval` alone) |
| Testing | pytest + httpx + `mongomock-motor` (backend), Vitest + Testing Library (frontend) |

## Architecture

```
Browser (React SPA)
   |  fetch/axios + Firebase ID token
   v
FastAPI backend (Python 3.10)
   |  firebase-admin verifies the token on protected routes
   |  Motor (async)
   v
MongoDB
```

Frontend and backend are independent apps that only talk over HTTP - either can be redeployed or replaced without touching the other. Business logic (chord transposition/simplification, search, versioning) lives entirely in the backend so there's a single source of truth; the frontend is a thin client over the REST API plus local UI state (the in-progress edit before it's saved).

A user's customized song (a `UserSongVersion`) never duplicates the song - it stores a diff against the original (`chord_overrides`, `transpose_semitones`, `capo_override`) and the original `Song` document is never mutated.

## Folder Structure

```
guitarchords/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── chords/     ChordDiagram, ChordEditor, ChordDiagramPopup, SimplifyPreview
│       │   ├── song/       SectionBlock, ChordLyricLine, TransposeControl, CapoControl, ...
│       │   ├── playmode/   ProgressBar, SpeedControl
│       │   ├── metronome/  Metronome
│       │   ├── layout/     Header
│       │   └── ui/         Button, Modal
│       ├── pages/          Home, SongView, PlayMode, Login, Signup, SavedSongs
│       ├── hooks/          useAutoScroll, useMetronome
│       ├── contexts/       AuthContext, PreferencesContext
│       ├── services/       api.ts (axios), songService, chordService, theoryService,
│       │                   versionService, userService, firebase.ts
│       ├── utils/          chordRow, applyChordOverrides, flattenChords, songChords,
│       │                   recentlyViewed, chordRoot, metronomeBpm (+ *.test.ts alongside)
│       └── types/          song, chord, version, user
├── backend/
│   └── app/
│       ├── main.py         FastAPI app + router registration
│       ├── config.py       env-driven Settings
│       ├── database.py     Motor client
│       ├── dependencies.py get_db()
│       ├── auth/            firebase_auth.py - token verification, isolated
│       ├── models/          Pydantic schemas (song, chord, version, user, theory)
│       ├── routes/          songs, chords, theory, versions, users
│       ├── services/        song_service, search_service, version_service, user_service
│       ├── utils/           chord_parser.py, music_theory.py (transpose/simplify - the
│       │                    core music-theory module, see below)
│       ├── data/            demo_songs.json, chord_library.json
│       └── scripts/seed.py  idempotent DB seed
│   └── tests/               test_music_theory, test_routes, test_seed_data, conftest
```

### The music theory module

`backend/app/utils/chord_parser.py` decomposes a chord symbol into `(root, accidental, suffix, bass_root, bass_accidental)` via a regex grammar - it's a real parse, not a string search. `backend/app/utils/music_theory.py` then:

- **Transposes** by converting each note to a pitch class (0-11), shifting it, and re-spelling the result - preferring the input's own sharp/flat convention, except for the four pitch classes that are (almost) always written as a natural note (`C`, `E`, `F`, `B`), which are pinned in both scales.
- **Simplifies** via an explicit, expandable suffix table (`SIMPLIFIABLE_SUFFIXES`): `m7 -> m` (not `m7 -> ""`, which would silently turn a minor chord major), `maj7/7/sus2/sus4/add9 -> ""`, and a slash chord's bass is dropped independently of its suffix.

Both are exercised directly against the spec's own edge cases in `backend/tests/test_music_theory.py` (`G -> G#`, `Gm -> G#m`, `F#m7 -> Gm7`, `Bb -> B`, `C/E -> C#/F`, plus round-trip and octave-identity checks).

## Installation

**Prerequisites:** Node.js 20+, Python **3.10** (FastAPI/Pydantic's binary dependencies are best supported here - a much newer interpreter risks missing wheels), MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas)), and a [Firebase](https://console.firebase.google.com) project for real auth (optional for local dev - see below).

### Backend

```bash
cd backend
py -3.10 -m venv venv          # Windows; use `python3.10 -m venv venv` on macOS/Linux
./venv/Scripts/activate        # Windows; `source venv/bin/activate` on macOS/Linux
pip install -r requirements-dev.txt   # installs requirements.txt too, plus test tooling
cp .env.example .env           # then edit .env - see Environment Variables below
python -m app.scripts.seed     # seeds the 10 demo songs + chord library into MongoDB
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000/api`, with interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env           # then edit .env - see Environment Variables below
npm run dev
```

The app is now at `http://localhost:5173`.

## Environment Variables

### `backend/.env`

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` for local, or an Atlas `mongodb+srv://...` URI |
| `MONGODB_DB_NAME` | Database name (default `guitarflow`) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to a service account JSON (see Firebase Setup) |
| `FIREBASE_PROJECT_ID` | Only needed if you verify tokens *without* a service account (e.g. against a local Auth emulator or under Application Default Credentials) |
| `AUTH_DEV_BYPASS` | **Dev only.** When `true`, every protected route accepts a synthetic `dev-user` instead of a real Firebase token, so you can run the whole app before setting up Firebase. **Never set this to `true` in production.** |

### `frontend/.env`

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:8000/api` |
| `VITE_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | From your Firebase project's web app config |
| `VITE_USE_AUTH_EMULATOR` | **Dev only.** `true` routes auth to a local Firebase Auth emulator instead of a real project - no Firebase project needed. See Firebase Setup. |

## Database Setup

Any MongoDB works - a local install or a free [Atlas](https://www.mongodb.com/cloud/atlas) cluster (fastest path if you don't want to install anything: create a free cluster, add a database user, allow your IP, and copy the connection string into `MONGODB_URI`).

Collections (`songs`, `chord_library`, `users`, `user_song_versions`) and their indexes are created by the seed script - there's no separate migration step. Re-running `python -m app.scripts.seed` is safe: it replaces only the platform demo songs and chord library, never touching user accounts or saved versions.

## Firebase Setup

You have two options:

**Option A - a real Firebase project** (needed for a real deployment):
1. Create a project at the [Firebase console](https://console.firebase.google.com), enable **Authentication > Sign-in method > Email/Password**.
2. Project settings > General > "Your apps" > add a web app; copy the config values into `frontend/.env`.
3. Project settings > Service accounts > "Generate new private key"; save the JSON somewhere **outside the repo** and point `FIREBASE_SERVICE_ACCOUNT_PATH` at it. Set `AUTH_DEV_BYPASS=false`.

**Option B - no Firebase project needed, for local development:**
- Simplest: leave `backend/.env`'s `AUTH_DEV_BYPASS=true` (the default). Every protected route just works as a synthetic user; sign-up/login pages will say auth isn't configured, but everything else (search, edit, transpose, simplify, capo, diagrams, Play Mode, metronome) works fully.
- To exercise the *real* login/save flow without a Firebase project, run the local Auth emulator:
  ```bash
  npx firebase-tools emulators:start --only auth   # needs a firebase.json - see below
  ```
  with a `firebase.json` of `{"emulators": {"auth": {"port": 9099}}}`. Then set `frontend/.env`'s `VITE_USE_AUTH_EMULATOR=true`, and in the backend's shell (this must be a real process env var - the Admin SDK reads it directly, not `.env`): `export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`, set `backend/.env`'s `AUTH_DEV_BYPASS=false` and `FIREBASE_PROJECT_ID=` to any string. This is exactly how the full signup -> edit -> save -> reload flow was verified during development.

## Running Locally

Start MongoDB, then the backend (`uvicorn app.main:app --reload --port 8000` from `backend/`), then the frontend (`npm run dev` from `frontend/`). Open `http://localhost:5173`.

## Testing

```bash
# Backend (from backend/, venv activated)
pytest                    # 94 tests - music theory edge cases, routes, seed-data validation

# Frontend (from frontend/)
npm run test              # 29 tests - chord alignment, transpose/override composition,
                           # auto-scroll progress tracking, metronome BPM clamping, etc.
npx tsc -b                # type-check
```

Backend route tests run against `mongomock-motor`, so they need no live database. Music-theory tests specifically cover the spec's worked edge cases (`G -> G#`, `Gm -> G#m`, `F#m7 -> Gm7`, `Bb -> B`, `C/E -> C#/F`).

## Deployment

**Frontend** (static build): `npm run build` in `frontend/` produces `dist/`, deployable to Vercel, Netlify, or any static host. Set `VITE_API_BASE_URL` to your deployed backend's URL and the real `VITE_FIREBASE_*` values as environment variables in the host's dashboard.

**Backend** (ASGI app): deploy `app.main:app` to Render, Railway, Fly.io, or any host that runs `uvicorn`/`gunicorn`. Set `MONGODB_URI` to an Atlas cluster, `FIREBASE_SERVICE_ACCOUNT_PATH` to an uploaded service-account file (or inline the credential JSON via your host's secret storage and adjust `firebase_auth.py` to load it from an env var instead of a path), `CORS_ORIGINS` to your deployed frontend's URL, and **`AUTH_DEV_BYPASS=false`** (this is the one setting that must never be true in production). Run `python -m app.scripts.seed` once against the production database to load the demo catalog.

**Database:** MongoDB Atlas (a free M0 cluster is enough for the demo catalog).

## Future Improvements

The backend is deliberately structured so these can be added without reworking existing code:

- **AI-assisted arrangement**: "suggest easier chords" and "generate a beginner arrangement" already have a natural home in `music_theory.py`'s simplify pass; a future version could call an LLM there instead of (or alongside) the static suffix table.
- **Audio analysis pipeline**: BPM/key/chord detection and capo suggestion from an uploaded audio file - `sections`/`chords` already have the shape a detection pipeline would populate.
- **A licensed song-data provider**: `song_service.py` is the only place that reads from MongoDB's `songs` collection; swapping in a licensed API means changing that one module, not the routes or frontend.
- **Multiple named versions per song**: the data model (`UserSongVersion`) already supports it; the UI currently manages one "My Version" per user per song for simplicity.
- **Full-text/fuzzy search**: `search_service.py` isolates the search query so it can be swapped for Atlas Search or a dedicated search service as the catalog grows past what a regex scan handles well.
- **A basic tuner** (browser mic + pitch detection) - explicitly scoped out of this MVP per product decision, to avoid mic-permission/pitch-accuracy issues destabilizing the core app.
