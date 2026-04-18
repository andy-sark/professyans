"""
Path resolver for the shared-data directory.

Resolution order:
    1. $PROFESSYANS_DATA_DIR env var (explicit override — used in Docker, tests)
    2. Walk up from the current file, look for a sibling `shared-data/` dir
       (works for local development from a monorepo checkout)
    3. Walk up from CWD (fallback for CLI usage)

Raises RuntimeError if the dir can't be found — we never ship without data.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def data_dir() -> Path:
    """Return the absolute path to the shared-data root."""
    # 1. Explicit env override
    env = os.environ.get("PROFESSYANS_DATA_DIR")
    if env:
        p = Path(env).resolve()
        if p.is_dir():
            return p
        raise RuntimeError(
            f"PROFESSYANS_DATA_DIR={env} is set but not a directory"
        )

    # 2. Walk up from this file
    here = Path(__file__).resolve()
    for parent in (here, *here.parents):
        candidate = parent.parent / "shared-data"
        if candidate.is_dir():
            return candidate

    # 3. Walk up from CWD
    cwd = Path.cwd().resolve()
    for parent in (cwd, *cwd.parents):
        candidate = parent / "shared-data"
        if candidate.is_dir():
            return candidate

    raise RuntimeError(
        "Cannot locate shared-data directory. "
        "Set PROFESSYANS_DATA_DIR or run from a monorepo checkout."
    )


def load_json(relative_path: str) -> Any:
    """Load a JSON file from the shared-data dir by relative path."""
    full = data_dir() / relative_path
    if not full.is_file():
        raise FileNotFoundError(f"No data file at {full}")
    with full.open("r", encoding="utf-8") as f:
        return json.load(f)
