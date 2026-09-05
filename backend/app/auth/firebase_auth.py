"""Firebase ID token verification, isolated from the rest of the app.

Every protected route depends on `get_current_user_id`, which returns the
Firebase UID. When AUTH_DEV_BYPASS=true (dev only - see .env.example), a
fixed synthetic UID is returned so the rest of the app is testable before a
real Firebase project exists; this must never be enabled in production.
"""

from typing import Optional

import firebase_admin
from fastapi import Header, HTTPException, status
from firebase_admin import auth as firebase_auth_sdk
from firebase_admin import credentials

from app.config import get_settings

_app: Optional[firebase_admin.App] = None
DEV_BYPASS_UID = "dev-user"


def _ensure_initialized() -> None:
    global _app
    if _app is not None:
        return
    settings = get_settings()
    if settings.firebase_service_account_path:
        cred = credentials.Certificate(settings.firebase_service_account_path)
        _app = firebase_admin.initialize_app(cred)
    else:
        _app = firebase_admin.initialize_app()


async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    settings = get_settings()

    if settings.auth_dev_bypass:
        return DEV_BYPASS_UID

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        _ensure_initialized()
        decoded = firebase_auth_sdk.verify_id_token(token)
    except Exception as exc:
        # Covers a genuinely bad/expired token as well as Firebase not being
        # configured at all (e.g. no service account yet) - either way the
        # caller isn't authenticated, which is a 401, not a server error.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc
    return decoded["uid"]


async def get_optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    """Like get_current_user_id, but returns None instead of raising when
    no credential is present - for routes that personalize output for
    logged-in users but still work for anonymous ones."""
    if not authorization:
        return None
    return await get_current_user_id(authorization)
