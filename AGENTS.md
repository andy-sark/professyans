# AGENTS.md

Инструкции для AI-агентов (Cursor, Codex, Copilot, Windsurf, Amp, Devin, Jules, Aider), работающих в этом репозитории. README.md — для людей; этот файл — для агентов.

## Что за проект

Цифровая реализация активизирующих методик профориентации Н. С. Пряжникова: Формула-7, Формула-5, КЧГ, Перекрёсток. Монорепо из четырёх пакетов: `frontend/`, `backend/`, `core/`, `shared-data/`.

**Принципиально не диагностический** инструмент. Методика активизирует размышление, а не выдаёт «результат». Этот принцип диктует UX, формулировки и архитектуру — см. `docs/01_ARCHITECTURE.md`.

## Обязательное чтение перед работой

Порядок вхождения в проект для нового агента:

1. `docs/00_INDEX.md` — карта репозитория за 3 минуты.
2. `.cursor/rules/00-global.mdc` — красные линии, базовые правила (агенты, не поддерживающие `.cursor/rules/`, должны прочитать этот файл вручную).
3. `docs/01_ARCHITECTURE.md` — почему всё именно так.
4. По необходимости: `02_DATA_CONTRACT.md`, `03_CONVENTIONS.md`, `04_CURSOR_PLAYBOOK.md`.

Спеки методик (`professyans_spec_v2.md`, `perekrestok_spec_v2.md`) — авторитетный источник по требованиям. Не перечитывать целиком; использовать `docs/06_SPEC_MAP.md` для точечного доступа.

## Команды

```bash
# Тесты (полный набор, быстрый: ~4 секунды)
cd core && pytest                    # 24 теста
cd backend && pytest                 # 8 integration
cd frontend && npm run typecheck     # TS strict

# Билды
cd frontend && npm run build         # Vite prod, ~10с
cd backend && uvicorn app.main:app   # FastAPI на :8000

# Dev-стек одной командой
docker compose up --build            # postgres + backend + nginx-frontend
```

**Правило:** после любой правки прогоняй минимум соответствующий тестовый набор. Не мержить код с падающими тестами.

## Стек

| Слой | Технология | Детали |
|---|---|---|
| Frontend | React 18 + TypeScript strict | Vite, Tailwind, Zustand, Dexie, Framer Motion |
| Backend | FastAPI + SQLAlchemy 2.0 | Pydantic v2, psycopg, uvicorn |
| Core | Pure Python 3.11+ | Pydantic v2, без IO |
| Data | JSON в `shared-data/` | canonical для всех потребителей |
| DB | Postgres (prod) / SQLite (dev, desktop) | через `DATABASE_URL` |
| Container | Docker + docker-compose | для one-command dev |

## Стиль кода

### TypeScript
- Strict mode, никаких `any`.
- Функциональные компоненты + hooks. Zustand для глобального стейта, `useState` для локального.
- Tailwind с кастомной палитрой: `paper-{50..300}`, `ink-{400..900}`, `sage-{100..700}`, `terra-{300..700}`. Никаких `#hex` inline.
- Шрифты: `font-display` (Fraunces), `font-body` (Literata), `font-ui` (IBM Plex Sans).
- PascalCase для компонентов, camelCase для функций, UPPER_SNAKE для констант данных.
- Алиасы `@/` и `@shared-data/`, не `../../../`.

### Python
- 3.11+, type hints везде, `mypy --strict` проходит.
- `CamelModel` (из `core.models`) для всего на wire — даёт camelCase на wire, snake_case в Python.
- SQLAlchemy 2.0 синтаксис: `Mapped[X]`, `mapped_column`, `select()`.
- Ruff: line 100, правила `E, F, W, I, N, B, UP, C4, SIM`.
- snake_case / PascalCase / UPPER_SNAKE_CASE по стандарту PEP 8.

### Русский / английский
- **Русский**: UI-строки, комментарии про методологию, коды карточек (Ц-6, СЧЖ-4).
- **Английский**: имена функций/переменных/файлов, ключи JSON (кроме кодов карточек), commit messages.

## Архитектурные инварианты (никогда не нарушать)

1. **`core/` — pure Python.** Никаких `import fastapi`, `import sqlalchemy`, `import backend.*`. Проверка: `grep -r "import fastapi\|import sqlalchemy" core/src/` → пусто.
2. **Данные в JSON.** Правишь формулировку карточки — **только в `shared-data/<method>/*.json`**, никогда в TS или Python.
3. **Parity TS↔Python.** Логика в `frontend/src/lib/` и `core/src/professyans_core/methods/` должна давать одинаковые результаты. Тест-сигнал: `backend/tests/test_api.py::test_get_result_computes_hints_and_conflicts`.
4. **Offline-first.** Frontend работает без backend. Sync — opt-in, не обязательный.
5. **Трекинг процесса — ядро методики, не фича.** Не удалять «для оптимизации».

Полный список — в `.cursor/rules/00-global.mdc` §«Красные линии».

## Правила изменения данных

JSON в `shared-data/` — source of truth для 4 типов файлов:

- `cards.json` — карточки методики + meta (groups, mainGroups, rankingOrder, formulaSize).
- `provocations.json` — провокации с триггерами.
- `hints.json` — подсказочные сигнатуры + SCHZH-конфликты.
- `questions.json` — только для Перекрёстка, 222 вопроса.

**Авторские формулировки дословно из спецификации.** Не выдумывай, не сглаживай, не переводи. Расширение базы провокаций/подсказок — отдельной задачей с психологом, помечать `"draft": true`.

Детально — в `docs/02_DATA_CONTRACT.md` и `.cursor/rules/20-data-contract.mdc`.

## Процесс работы

1. **Новая задача** → прочитай `docs/05_ROADMAP_TASKS.md` (может быть уже готовое описание).
2. **Ветка**: `git checkout -b <prefix>/<kebab-case-name>`. Префиксы: `feat/`, `fix/`, `data/`, `docs/`, `chore/`, `refactor/`, `test/`. См. `docs/07_GIT_WORKFLOW.md`.
3. **Реализуй**: если бизнес-логика — помни о parity (правь обе стороны).
4. **Тесты**: все три набора зелёные.
5. **Коммит**: Conventional Commits — `<type>(<scope>): <russian summary>`. Примеры в `docs/07_GIT_WORKFLOW.md`.
6. **CHANGELOG.md**: обнови секцию `[Unreleased]`.
7. **Merge в main**.

## Что делать при неопределённости

- **Не выдумывай.** Если промпт неполный или противоречит спеке — уточни, не решай «на своё усмотрение».
- **Не ломай работающее.** Все тесты должны оставаться зелёными; если красное — откати и разбирайся.
- **Спеки главнее.** При противоречии между документами в `docs/` и `professyans_spec_v2.md` / `perekrestok_spec_v2.md` — спека главнее. `docs/` — рабочая выжимка, может отставать.

## Границы: чего делать нельзя

1. Добавлять геймификацию: очки, рейтинги, достижения, сравнение с другими.
2. Показывать формулировки вроде «ваш тип личности», «рекомендуемые профессии:», «процент совпадения».
3. Делать авторизацию обязательной.
4. Ротировать/перефразировать провокации автоматически — они авторские.
5. Выключать правило «хотя бы одна из каждой группы» в валидации.
6. Хранить PII без явного opt-in экрана.
7. Коммитить `.env`, `*.db`, `node_modules/`, `dist/`.

Полный список — в `docs/01_ARCHITECTURE.md` §«Что менять нельзя» и `docs/03_CONVENTIONS.md` §«Чего делать нельзя».

## Карта подпакетов

| Пакет | Язык | Точка входа | Тесты |
|---|---|---|---|
| `frontend/` | TypeScript | `src/main.tsx` | `npm run typecheck`, будущий Vitest |
| `backend/` | Python | `app/main.py::create_app` | `pytest` в `backend/tests/` |
| `core/` | Python | `src/professyans_core/__init__.py` | `pytest` в `core/tests/` |
| `shared-data/` | JSON | — | валидируется тестами core |

Если добавляется новый подпакет (например, `desktop/` в итерации 8) — создай в нём свой `AGENTS.md` с инструкциями, специфичными для подпакета. Агенты читают ближайший AGENTS.md в дереве каталогов.
