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

- **Search** — case-insensitive, partial-match search by title or artist, with difficulty filters, plus **recently viewed** and **favorites** (both kept on the device, so they work signed out).
- **Song View** — chord sheet with chords aligned above the lyrics, key/BPM/capo/difficulty, distinct-chord chips, strumming pattern, and `Play` as the unambiguous primary action.
- **Chord editing** — tap any chord to change it. The editor shows the *shape* of whatever you have selected, so you can watch a barre disappear before committing; pick a root and quality, or type any chord. Edits never touch the original arrangement.
- **Multiple named versions** — keep "Easy" and "Acoustic" side by side for the same song, switch between them and Original in one tap, and rename or delete them from a version manager. Saving is an explicit, named act, never a silent overwrite.
- **Unsaved work is kept** — customizations survive a refresh (and work before you have an account) via a small local draft that stores only the delta: the transpose, the capo, and the chords you actually changed — never a copy of the song.
- **Transpose** — up/down by semitone, backed by real chromatic pitch-class arithmetic with correct enharmonic spelling (`Bb -> B`, not `Bb -> Cb`), not naive text substitution.
- **Simplify** — suggests beginner-friendly substitutions (`F#m7 -> F#m`, `Dmaj7 -> D`, slash chords drop their bass note), previewed with occurrence counts and applied only if you accept.
- **Capo control** — change which capo fret you use without changing the song's actual (concert) key; the chord shapes shift, the `Key` display doesn't.
- **Chord diagrams** — tap any chord for a fretboard diagram: open/muted strings, finger numbers, barre chords. Chords outside the seeded library (which transposing leaves almost immediately) get a **movable barre shape derived from theory**, and anything that can't be built honestly says so rather than showing a wrong fingering.
- **Play Mode** — fullscreen and distraction-free, with continuous `requestAnimationFrame` auto-scroll (never line jumps), a count-in before the sheet moves, pause/resume, restart, a draggable progress bar, live speed and text-size controls, and a **screen wake lock** so the device doesn't sleep mid-song. Keyboard: `Space`, `Escape`, `↑`/`↓` speed, `←`/`→` seek, `R` restart.
- **My Songs** — every saved version, grouped by song, each one tap from Play Mode.
- **Metronome** — Web Audio "lookahead scheduler" for accurate timing (not a raw `setInterval` click), BPM `-`/`+`/slider, tap tempo, and a beat pulse synced to the scheduled clicks.
- **Honest error states** — a stopped backend, an unavailable database, a missing song and a failed save each say what actually happened, with a retry where retrying could help.
- **Dark by default**, with a light theme; both verified against WCAG AA contrast by a script (`npm run check:contrast`).
- **Responsive** down to 375px, with chord sheets that scroll horizontally inside their own container rather than breaking the page.

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

Frontend and backend are independent apps that only talk over HTTP - either can be redeployed or replaced without touching the other. Business logic (chord transposition/simplification, chord shapes, search, versioning) lives entirely in the backend so there's a single source of truth; the frontend is a thin client over the REST API plus local UI state.

A user's customized song (a `UserSongVersion`) never duplicates the song - it stores a diff against the original (`chord_overrides`, `transpose_semitones`, `capo_override`) and the original `Song` document is never mutated.

### Two lanes for customization

Customization is deliberately split, because "I'm fiddling with this right now" and "this is my
Easy version" are different things:

| | Draft | Saved version |
|---|---|---|
| Lives in | `localStorage` (`guitarflow:drafts`) | MongoDB (`user_song_versions`) |
| Needs an account | No | Yes |
| Named | No | Yes — several per song |
| Created by | Editing anything | Pressing Save and naming it |

A draft holds only the delta and records which saved version it started from
(`basedOnVersionId`), which is the hook a future sign-in merge would use to reconcile local
work against the account's own versions. Both lanes are read through one hook,
`useSongCustomization`, which is what lets the song page and Play Mode show the same
arrangement — and what lets Play Mode rebuild it from its own URL after a refresh instead of
depending on state passed during navigation.

## API

All routes are under `/api`. Interactive docs at `http://localhost:8030/docs`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | — | Liveness, and whether MongoDB is reachable (`{"status":"ok","database":"ok"}`) |
| `GET` | `/api/songs` | — | Search/browse. `?search=` (partial, case-insensitive, title or artist), `?difficulty=` |
| `GET` | `/api/songs/{id}` | — | One song with its full arrangement |
| `GET` | `/api/chords` | — | The seeded chord library |
| `GET` | `/api/chords/{name}` | — | One chord. Falls back to a **derived** movable shape when it isn't in the library; `404` when no correct shape can be built. Slash chords (`/api/chords/C/E`) are reachable |
| `POST` | `/api/transpose` | — | `{chords, semitones}` → transposed chords |
| `POST` | `/api/simplify` | — | `{chords}` → per-chord simplification suggestions (`null` when already simple) |
| `GET` | `/api/versions` | Yes | Every saved version, each paired with its song — backs My Songs |
| `GET` | `/api/songs/{id}/versions` | Yes | This song's saved versions |
| `POST` | `/api/songs/{id}/versions` | Yes | Save a new named version |
| `PUT` | `/api/versions/{id}` | Yes | Update or rename one |
| `DELETE` | `/api/versions/{id}` | Yes | Delete one |
| `POST` | `/api/users/sync` | Yes | Upsert the backend user record for the current Firebase UID |
| `GET` | `/api/users/me` | Yes | Current user + preferences |
| `PUT` | `/api/users/me/preferences` | Yes | Update scroll speed / dark mode |

Errors are typed rather than generic: an unreachable MongoDB is a `503` with an explanatory
`detail` (not an opaque `500`), a missing song is a `404`, and someone else's version is a
`403`. The frontend maps each of those to its own message, so "the backend isn't running",
"the database is down" and "that song doesn't exist" never collapse into one vague error.

## Folder Structure

```
guitarchords/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── chords/     ChordDiagram, ChordEditor, ChordDiagramPopup, SimplifyPreview
│       │   ├── song/       SectionBlock, ChordLyricLine, TransposeControl, CapoControl, ...
│       │   ├── playmode/   PlayControls, ProgressBar
│       │   ├── versions/   VersionSwitcher, SaveVersionDialog, VersionManager
│       │   ├── metronome/  Metronome
│       │   ├── layout/     Header, ErrorBoundary
│       │   └── ui/         Button, Icon, Modal, States, Skeleton, Badge
│       ├── pages/          Home, SongView, PlayMode, Login, Signup, SavedSongs
│       ├── hooks/          useSongCustomization, useArrangement, useAutoScroll,
│       │                   useMetronome, useWakeLock, useApiResource
│       ├── contexts/       AuthContext, PreferencesContext
│       ├── services/       api.ts (axios), apiError.ts, songService, chordService,
│       │                   theoryService, versionService, userService, firebase.ts
│       ├── utils/          chordRow, applyChordOverrides, flattenChords, songChords,
│       │                   recentlyViewed, favorites, songDraft, localStore, songStub,
│       │                   chordRoot, metronomeBpm (+ *.test.ts alongside)
│       ├── test/           setup, fixtures, renderWithProviders
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
│       │                    core music-theory module, see below), chord_shapes.py
│       │                    (derives movable barre shapes for chords outside the library)
│       ├── data/            demo_songs.json, chord_library.json
│       └── scripts/seed.py  idempotent DB seed
│   └── tests/               test_music_theory, test_chord_shapes, test_routes,
│                            test_seed_data, conftest
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
uvicorn app.main:app --reload --port 8030
```

The API is now at `http://localhost:8030/api`, with interactive docs at `http://localhost:8030/docs`.

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
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:8030/api` |
| `VITE_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | From your Firebase project's web app config |
| `VITE_USE_AUTH_EMULATOR` | **Dev only.** `true` routes auth to a local Firebase Auth emulator instead of a real project - no Firebase project needed. See Firebase Setup. |
| `VITE_AUTH_DEV_BYPASS` | **Dev only.** Mirrors the backend's `AUTH_DEV_BYPASS`. With both `true`, the whole signed-in experience (saving versions, syncing preferences) runs against a synthetic local user with no Firebase project at all. It is ignored in production builds — the flag only has an effect while Vite is running in dev mode — but keep it out of deployed `.env` files regardless. |

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

Start MongoDB, then the backend (`uvicorn app.main:app --reload --port 8030` from `backend/`), then the frontend (`npm run dev` from `frontend/`). Open `http://localhost:5173`.

The backend port matters: `frontend/.env` points `VITE_API_BASE_URL` at `http://localhost:8030/api`, so if you run uvicorn on a different port, change it in both places or the UI will (correctly) report that it can't reach the server.

With `AUTH_DEV_BYPASS=true` in `backend/.env` and `VITE_AUTH_DEV_BYPASS=true` in
`frontend/.env` — the defaults in both `.env.example` files — you can use the entire signed-in
product locally, including saving named versions, without setting up Firebase at all. "Log in"
accepts anything and signs you in as a local test user; the header shows a **Dev mode** badge
so this is never ambiguous.

## Testing

```bash
# Backend (from backend/, venv activated)
pytest                    # 475 tests

# Frontend (from frontend/)
npm run test              # 74 tests
npm run typecheck         # tsc -b
npm run lint              # oxlint
npm run check:contrast    # WCAG AA check on both themes' tokens
```

**Backend.** Route tests run against `mongomock-motor`, so they need no live database. The
music-theory tests cover the spec's worked edge cases directly (`G -> G#`, `Gm -> G#m`,
`F#m7 -> Gm7`, `Bb -> B`, `C/E -> C#/F`) plus round-trip and octave-identity checks.

`test_chord_shapes.py` verifies every *derived* chord shape by playing it back: for all 12
roots and every supported quality it recomputes the sounding pitch class of each unmuted
string from the guitar's tuning and asserts the result really is that chord, with the root in
the bass and within reach of the 4-fret diagram. A shape that dropped a chord tone, sounded a
foreign note or stranded the guitarist at the 11th fret fails there. (It caught exactly that
during development: `sus2` initially had only one movable form, which put `F#sus2` at fret 9.)

**Frontend.** Alongside the unit tests for chord alignment, transpose composition, auto-scroll
and metronome clamping, the page tests render the real `Home`, `SongView`, `PlayMode` and
`SavedSongs` components against mocked services and drive the actual flows: searching and
filtering, tapping a chord for its diagram, changing a chord in edit mode, previewing and
accepting Simplify, saving and switching between multiple named versions, and Play Mode's
count-in, transport, speed and text controls.

Two regressions are pinned deliberately:

- **Play Mode plays *your* version.** It resolves the arrangement from its own URL rather than
  from state handed over during navigation, so a refresh or a shared link no longer silently
  drops back to the original song.
- **Slow auto-scroll actually moves.** Position is accumulated as a float rather than by
  reading `scrollTop` back each frame — browsers may round that property, and at 10 px/s a
  frame is ~0.17px, so the rounded read would discard the remainder every frame and the sheet
  would never move.

## Accessibility

Keyboard-navigable throughout with a single visible `:focus-visible` treatment; dialogs trap
focus, restore it to whatever opened them, and close on `Escape`. Icon-only controls carry
labels, the chord sheet exposes each chord as a labelled button (and marks the ones you have
changed), and every interactive target clears 44px — including chords in the sheet, whose hit
area is grown with an overlay so the monospace column alignment that puts a chord over the
right syllable is not disturbed. `npm run check:contrast` verifies every foreground/background
token pair against WCAG AA in both themes, and `prefers-reduced-motion` is honoured.

## Deployment

**Frontend** (static build): `npm run build` in `frontend/` produces `dist/`, deployable to Vercel, Netlify, or any static host. Set `VITE_API_BASE_URL` to your deployed backend's URL and the real `VITE_FIREBASE_*` values as environment variables in the host's dashboard. Leave `VITE_AUTH_DEV_BYPASS` unset — it is inert in a production build by construction, but there is no reason for it to be there.

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
#   G u i t a r _ F l o w  
 