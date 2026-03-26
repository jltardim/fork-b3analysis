"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="B3Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


from app.routes import auth, keys, profile, reports

app.include_router(auth.router)
app.include_router(keys.router)
app.include_router(profile.router)
app.include_router(reports.router)

from app.ws.handlers import router as ws_router

app.include_router(ws_router)
