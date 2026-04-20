from fastapi import FastAPI
from app.api.v1.endpoints.health import router as health_router
from app.core.config import settings
from app.api.v1.endpoints.database import router as database_router
from app.db.init_db import init_db
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.voice_notes import router as notes_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(database_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(notes_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def read_root():
    return {"message": f"{settings.app_name} is running"}
