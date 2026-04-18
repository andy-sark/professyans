"""Pytest configuration: locate shared-data for tests."""

from __future__ import annotations

import os
from pathlib import Path


def pytest_configure() -> None:
    """Point PROFESSYANS_DATA_DIR at the monorepo's shared-data before tests run."""
    if "PROFESSYANS_DATA_DIR" in os.environ:
        return
    # tests/ → core/ → monorepo-root → shared-data/
    here = Path(__file__).resolve().parent
    shared = here.parent.parent / "shared-data"
    if shared.is_dir():
        os.environ["PROFESSYANS_DATA_DIR"] = str(shared)
