"""API routers."""

from fastapi import APIRouter

from app.api.methods import router as methods_router
from app.api.sessions import router as sessions_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(sessions_router)
api_router.include_router(methods_router)
