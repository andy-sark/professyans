# Changelog

Все значимые изменения проекта фиксируются здесь.
Формат следует [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation sweep итерации 4.6: синхронизация `README.md`, `docs/00_INDEX.md`, `docs/05_ROADMAP_TASKS.md`, `docs/06_SPEC_MAP.md` с фактическим состоянием после закрытия итерации 4 и в процессе 4.5.
- Добавлен `.env.example` с шаблонами `VITE_API_URL`, `DATABASE_URL`, `CORS_ALLOW_ORIGINS`, `LOG_LEVEL`.

### Changed
- Актуализирована roadmap-нумерация: итерация 4 закрыта, 4.5 в процессе, добавлена итерация 5 «Графическая молекула», остальные итерации сдвинуты на +1.
- В `README.md` обновлены метрики тестов (50 core / 9 backend / 61 frontend), добавлен дисклеймер «Авторство методик», версия повышена до `0.5.0`.

### Fixed
- Устранён рассинхрон «Формула-5 не реализована» в `docs/06_SPEC_MAP.md`: §6 теперь ссылается на реальные файлы F-5 и тесты.

### Open questions
- **Нейминг продукта.** Рабочее имя «Профессьянс» сохраняется до релиза полного функционала. Подробности и направления поиска — в `docs/00_INDEX.md` §«Открытые вопросы». Технически переименование дешёвое: find/replace через Cursor после определения финального имени.

## [0.5.0] — 2026-05 (в процессе, итерация 4.5)

### Added
- Закрыты технические долги TD-1, TD-2, TD-3, TD-10 (см. `docs/99_TECH_DEBT.md`).
- Унификация `HintSignature` через `frontend/src/lib/common/hints.ts`.
- Unit-тесты для `frontend/src/lib/tracker.ts` (16 тестов).
- README-секция «Запуск тестов» с явным рецептом venv.
- Parity-fix для `cardFirstShown === 0` в `frontend/src/lib/tracker.ts::computeDecisionTimes`.
- UI-примитивы в `frontend/src/components/common/`:
  - `TrackOption` (TD-8.1),
  - `FormulaTray` + `LegendChip` (TD-8.2).

### Changed
- `frontend/src/lib/tracker.ts::computeDecisionTimes` — truthy-check заменён на nullish-check для parity с Python.

## [0.4.0] — 2026-04-18 (итерация 4: Формула-5)

### Added
- **Формула-5** — полный vertical slice:
  - 45 карточек в `shared-data/formula5/cards.json` (с `bonusSize: 2`).
  - 5 draft-сигнатур в `shared-data/formula5/hints.json`.
  - `core/src/professyans_core/methods/formula5.py` — полный API F-5, parity с F-7 после рефакторинга в `methods/common.py`.
  - 26 pytest-тестов F-5 (контрольные отличия от F-7: Ц-2, О-3, О-8, У-7).
  - `frontend/src/lib/f5/` (validation, hints) — тонкие обёртки над `frontend/src/lib/common/`.
  - `frontend/src/data/formula5/` (cards, hints) — обёртки над JSON.
  - 26 vitest-тестов F-5 в `frontend/src/lib/f5/__tests__/`.
  - 5 экранов F-5 в `frontend/src/screens/formula5/`.
  - F-5 endpoint в `backend/app/api/sessions.py::get_result`.
  - `F5ResultResponse` schema в `backend/app/schemas/`.
  - F-5 интеграционный тест в `backend/tests/test_api.py`.

### Changed
- `core/src/professyans_core/methods/common.py` — generic `validate_formula`, `match_hints`, `compute_insights`. F-7 теперь использует общий код.
- `frontend/src/lib/common/` — TS-зеркало generic-логики.
- `validate_formula` принимает `bonus_size` через kwarg (default 0; F-5 передаёт 2).
- `frontend/src/components/results/` — общие result-блоки (`MoleculeMap`, `InsightBlock`, `CardsBadgeList`, `HintsList`). F-7 Results отрефакторен на их использование.
- HomeScreen: F-5 → `available: true`. `frontend/src/App.tsx`: добавлены роуты `/f5/intro` … `/f5/results`. ResumeAndGo поддерживает F-5.
- `shared-data/formula7/cards.json::meta` получил `bonusSize: 0` явно.

## [0.3.0] — 2026-04-18 (итерация 3 docs + cursor rules)

### Added
- Набор опорных документов `docs/00_INDEX.md` … `docs/07_GIT_WORKFLOW.md` для последующей работы в новых чатах и с Cursor.
- `AGENTS.md` в корне — cross-tool инструкции для AI-агентов.
- `.cursor/rules/*.mdc` — modern Cursor rules с YAML-frontmatter (`00-global`, `10-architecture`, `20-data-contract`, `30-parity`).
- `.cursorignore`, `.cursorindexingignore`, `.gitignore`.

### Changed
- **Миграция с legacy `.cursorrules` на новую структуру `.cursor/rules/*.mdc` + `AGENTS.md`.**

### Fixed
- Consistency-audit через Cursor: рассинхрон путей в README, `docs/06_SPEC_MAP.md`, `AGENTS.md`, cursor rules. Все пути приведены к полной репо-относительной форме.
- Номера итераций desktop выровнены (везде 8, было разночтение 7/8).

## [0.2.0] — 2026-04 (итерация 2: backend + sync)

### Added
- Python-ядро `core/` с Pydantic-моделями и portированной F-7 логикой (24 pytest, 0.4с).
- FastAPI backend с REST API (sessions CRUD, methods/, /result).
- SQLAlchemy 2.0 модели, JSON-blob storage, SQLite/Postgres support.
- 8 integration-тестов через `fastapi.testclient.TestClient`.
- Server-side parity тест `test_get_result_computes_hints_and_conflicts`.
- Opt-in sync: frontend `frontend/src/lib/api.ts`, debounced upsert на каждое изменение сессии.
- HomeScreen: тумблер «облачное резервирование».
- Docker-compose: postgres + backend + frontend (nginx).

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
