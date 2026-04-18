# Changelog

Все значимые изменения проекта фиксируются здесь.
Формат следует [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Набор опорных документов `docs/00_INDEX.md` … `docs/07_GIT_WORKFLOW.md` для последующей работы в новых чатах и с Cursor.
- `AGENTS.md` в корне — cross-tool инструкции для AI-агентов (Cursor, Codex, Copilot, Windsurf, Amp, Devin) по стандарту agents.md (Linux Foundation).
- `.cursor/rules/*.mdc` — modern Cursor rules с YAML-frontmatter:
  - `00-global.mdc` (alwaysApply) — красные линии, базовые правила.
  - `10-architecture.mdc` (agent-requested) — рационал архитектурных решений.
  - `20-data-contract.mdc` (auto-attached к `shared-data/**`, `**/data/**`) — схемы JSON.
  - `30-parity.mdc` (auto-attached к логическим файлам) — правило TS↔Python parity.
- `.cursorignore` — секреты, локальные БД не уходят в AI-контекст.
- `.cursorindexingignore` — lockfiles, кеши, артефакты не засоряют семантический поиск.
- `.gitignore` покрывает Node, Python, БД, секреты, Docker и будущие desktop-артефакты.

### Changed
- **Миграция с legacy `.cursorrules` на новую структуру `.cursor/rules/*.mdc` + `AGENTS.md`.** Старый формат официально помечен как deprecated; новая схема даёт четыре режима активации (always / auto-attached по глобам / agent-requested / manual), cross-tool совместимость, лучшее управление контекстом.
- Обновлены `docs/00_INDEX.md` и `docs/04_CURSOR_PLAYBOOK.md` под новую структуру.

### Open questions
- **Нейминг продукта.** Рабочее имя «Профессьянс» сохраняется до релиза полного функционала. Подробности и направления поиска — в `docs/00_INDEX.md` §«Открытые вопросы». Технически переименование дешёвое: find/replace через Cursor после определения финального имени.

## [0.1.0] — 2026-04-18

### Added
- Монорепо: `frontend/`, `backend/`, `core/`, `shared-data/`.
- **Frontend** (React 18 + TS + Vite + Tailwind + Zustand):
  - Полный сквозной флоу Формулы-7: Intro → Ranking → Formula → Molecule → Results.
  - 75 карточек F-7 с авторскими формулировками, ~30 провокаций, 18 hint-сигнатур.
  - Трекинг процесса (колебания, возвраты, тайминги), показ инсайтов на финале.
  - Offline-first: localStorage + IndexedDB (Dexie).
  - Opt-in sync с backend (тумблер на HomeScreen).
  - Дизайн-система: бумажно-травяная палитра, Fraunces + Literata + IBM Plex Sans.
- **Core** (pure Python):
  - Pydantic-модели с camelCase-alias для wire-parity.
  - Port F-7 логики: `validate_formula`, `match_hints`, `detect_schzh_conflicts`, `compute_insights`, `derive_result`.
  - 24 pytest-теста, все зелёные (~0.4с).
- **Backend** (FastAPI + SQLAlchemy 2.0):
  - REST API: `/api/v1/sessions` CRUD + list + `/result`, `/api/v1/methods/f7/{cards,provocations,hints}`.
  - `SessionRecord` с JSON-blob + индексированные колонки.
  - SQLite для dev, PostgreSQL для prod через `DATABASE_URL`.
  - 8 integration-тестов через `fastapi.testclient.TestClient`.
- **Shared-data**: canonical JSON для 75 карточек + провокаций + hints, читается и TS, и Python.
- **Infrastructure**: Docker-compose с Postgres 16 + backend + frontend-nginx, Dockerfile для каждого пакета.
- **Server-side parity**: test `test_get_result_computes_hints_and_conflicts` проверяет, что бэк выдаёт те же hints, что считает фронт.
