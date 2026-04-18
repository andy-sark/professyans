"""Backend integration tests."""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

# Point shared-data env BEFORE importing app.main
_here = Path(__file__).resolve().parent
_shared = _here.parent.parent / "shared-data"
if _shared.is_dir():
    os.environ.setdefault("PROFESSYANS_DATA_DIR", str(_shared))

# Use a throwaway SQLite DB for tests
os.environ["DATABASE_URL"] = "sqlite:///./test_professyans.db"


@pytest.fixture(scope="module")
def client() -> Iterator[TestClient]:
    from app.main import app
    with TestClient(app) as c:
        yield c
    # Cleanup
    try:
        Path("test_professyans.db").unlink()
    except FileNotFoundError:
        pass


def _make_session_payload(session_id: str = "test-session-1") -> dict:
    now = int(time.time() * 1000)
    return {
        "id": session_id,
        "method": "F7",
        "track": "activating",
        "startedAt": now,
        "updatedAt": now,
        "currentStage": "f7.ranking:Ц",
        "cardStates": {
            "Ц-6": "like", "П-2": "like", "С-4": "like",
            "У-1": "like", "О-1": "like", "К-1": "like", "Ц-2": "like",
        },
        "formula": ["Ц-6", "П-2", "С-4", "У-1", "О-1", "К-1", "Ц-2"],
        "clusters": {
            "Ц-6": 0, "П-2": 0, "С-4": 0,
            "У-1": 1, "О-1": 1, "К-1": 1, "Ц-2": 1,
        },
        "trace": {"events": [], "cardFirstShown": {}, "cardChangeCount": {}},
        "notes": [],
    }


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_create_and_fetch_session(client: TestClient) -> None:
    payload = _make_session_payload("s-create-1")
    r = client.post("/api/v1/sessions", json=payload)
    assert r.status_code == 201, r.text
    assert r.json()["id"] == "s-create-1"

    r = client.get("/api/v1/sessions/s-create-1")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "s-create-1"
    assert body["method"] == "F7"
    assert len(body["formula"]) == 7


def test_update_session(client: TestClient) -> None:
    payload = _make_session_payload("s-update-1")
    client.post("/api/v1/sessions", json=payload)

    # Modify formula
    payload["formula"] = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "К-1", "Ц-2"]
    r = client.put("/api/v1/sessions/s-update-1", json=payload)
    assert r.status_code == 200

    r = client.get("/api/v1/sessions/s-update-1")
    assert r.json()["formula"][0] == "Ц-1"


def test_list_sessions(client: TestClient) -> None:
    # Seed a couple
    for i in range(3):
        client.post("/api/v1/sessions", json=_make_session_payload(f"s-list-{i}"))
    r = client.get("/api/v1/sessions?limit=10")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 3
    assert len(body["items"]) >= 3
    # Items sorted newest first
    timestamps = [it["startedAt"] for it in body["items"]]
    assert timestamps == sorted(timestamps, reverse=True)


def test_delete_session(client: TestClient) -> None:
    client.post("/api/v1/sessions", json=_make_session_payload("s-del-1"))
    r = client.delete("/api/v1/sessions/s-del-1")
    assert r.status_code == 204
    r = client.get("/api/v1/sessions/s-del-1")
    assert r.status_code == 404


def test_get_result_computes_hints_and_conflicts(client: TestClient) -> None:
    """Server-side derivation must match core library logic."""
    payload = _make_session_payload("s-result-1")
    client.post("/api/v1/sessions", json=payload)

    r = client.get("/api/v1/sessions/s-result-1/result")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["sessionId"] == "s-result-1"
    assert body["validation"]["ok"] is True
    # Ц-6 + П-2 + С-4 → IT hint (h4)
    hint_ids = [h["hintId"] for h in body["hints"]]
    assert "h4" in hint_ids


def test_get_methods_cards(client: TestClient) -> None:
    r = client.get("/api/v1/methods/f7/cards")
    assert r.status_code == 200
    body = r.json()
    assert len(body["cards"]) == 75
    assert r.headers["cache-control"].startswith("public")


def test_nonexistent_session_404(client: TestClient) -> None:
    r = client.get("/api/v1/sessions/nope-nope-nope")
    assert r.status_code == 404
