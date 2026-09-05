from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import chords, songs, theory, users, versions

settings = get_settings()

app = FastAPI(title="GuitarFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(songs.router)
app.include_router(chords.router)
app.include_router(theory.router)
app.include_router(versions.router)
app.include_router(users.router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
