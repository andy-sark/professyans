"""
professyans_core — shared business logic for Pryazhnikov methodologies.

This package is consumed by:
    - backend/      FastAPI web API (PostgreSQL-backed)
    - desktop/      PyInstaller-packaged local app (SQLite-backed)

Key design goals:
    1. Data-driven: all card content, norms, provocations live in
       shared-data/*.json, loaded at runtime.
    2. Stateless: no global state in core; all functions take a
       Session / inputs, return new Session / results.
    3. Parity with TypeScript frontend: same validation rules, same
       hint-matching algorithm, same process-tracking semantics.
"""

from professyans_core.models import (
    Card,
    CardState,
    GroupMeta,
    Method,
    ProcessInsights,
    ProcessTrace,
    Session,
    Track,
    TraceEvent,
)
from professyans_core.methods.formula7 import (
    F7,
    FormulaValidation,
    MatchedHint,
    SchzhConflictTriggered,
    compute_insights,
    detect_schzh_conflicts,
    match_hints,
    validate_formula,
)
from professyans_core.paths import data_dir, load_json

__version__ = "0.1.0"

__all__ = [
    "__version__",
    # Core types
    "Card",
    "CardState",
    "GroupMeta",
    "Method",
    "ProcessInsights",
    "ProcessTrace",
    "Session",
    "Track",
    "TraceEvent",
    # Formula-7
    "F7",
    "FormulaValidation",
    "MatchedHint",
    "SchzhConflictTriggered",
    "compute_insights",
    "detect_schzh_conflicts",
    "match_hints",
    "validate_formula",
    # Paths
    "data_dir",
    "load_json",
]
