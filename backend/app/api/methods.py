"""
Read-only endpoints that serve the static methodology data.

The frontend typically bundles this at build time, but these endpoints
exist for:
    - Admin/debug tools that want to inspect the data over HTTP.
    - Future CMS-style updates without a frontend rebuild.
    - Third-party consumers wanting a standard API.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Response

from professyans_core.paths import load_json

router = APIRouter(prefix="/methods", tags=["methods"])

# 1 day of HTTP caching — data doesn't change between releases
_CACHE_HEADER = "public, max-age=86400"


def _cached(response: Response, body: Any) -> Any:
    response.headers["Cache-Control"] = _CACHE_HEADER
    return body


@router.get("/f7/cards")
def f7_cards(response: Response) -> Any:
    try:
        return _cached(response, load_json("formula7/cards.json"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/f7/provocations")
def f7_provocations(response: Response) -> Any:
    try:
        return _cached(response, load_json("formula7/provocations.json"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/f7/hints")
def f7_hints(response: Response) -> Any:
    try:
        return _cached(response, load_json("formula7/hints.json"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
