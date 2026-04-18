# 03 · Конвенции кода

Правила, которым должен следовать любой код, попадающий в репозиторий. Нарушения — не стилистические, а смысловые: они ломают parity и usability.

---

## Правило parity (главное)

Логика, реализованная в TypeScript, должна иметь точное соответствие в Python — и наоборот. Это железное правило, не пожелание.

### Что такое «логика»

- Алгоритмы валидации формулы: `lib/f7/validation.ts` ↔ `core/methods/formula7.py::validate_formula`.
- Матчинг подсказок: `lib/f7/hints.ts::matchHints` ↔ `core/methods/formula7.py::match_hints`.
- Детекция конфликтов: `detectSchzhConflicts` ↔ `detect_schzh_conflicts`.
- Вычисление инсайтов процесса: `lib/tracker.ts::computeInsights` ↔ `core/methods/formula7.py::compute_insights`.

### Что НЕ требует parity

- UI-логика (раскраска, анимации, фокус, drag-n-drop).
- Storage-слой (localStorage/IDB во фронте vs SQLAlchemy на бэке — разные системы).
- Маршрутизация, CORS, авторизация — только на бэке.
- Роутинг фронта, React-компоненты.

### Как проверить parity

1. `backend/tests/test_api.py::test_get_result_computes_hints_and_conflicts` — тест-сигнал. PUT-ит ту же сессию, что фронт, и проверяет, что вернётся `h4` (IT).
2. Если добавляешь новое поведение — обновляй оба пути в одном PR, с тестами с обеих сторон.

### Как добавить новое

1. Реализовать в `core/` + тест в `core/tests/`.
2. Реализовать в `frontend/src/lib/` + ручная проверка в dev-режиме.
3. При необходимости — endpoint в `backend/app/api/` + integration-тест.
4. Обновить `docs/02_DATA_CONTRACT.md`, если затронуты данные.

---

## TypeScript: конвенции

### Стиль

- **Strict TypeScript.** `tsconfig.json` включает `strict: true`. Не выключать для удобства — исправлять типы.
- **Именование:** файлы и экспорты — `PascalCase` для компонентов и типов, `camelCase` для функций и переменных, `SNAKE_CASE` для констант.
- **Константы данных** — `UPPER_SNAKE_CASE`: `F7_CARDS`, `F7_MAIN_GROUPS`, `F7_FORMULA_SIZE`.
- **Одна концепция на файл.** Компонент — один файл. Hook — один файл. Стор — один файл.
- **Без default exports** в компонентах (кроме artifact-ready минимализма, но у нас не artifact). Named exports легче рефакторить.

### React

- **Функциональные компоненты + hooks.** Никаких class-components.
- **Zustand для глобального стейта** (одна сессия пользователя). `useState` для локального UI-стейта компонента.
- **Никогда** не вызывай `useSession.getState()` в render — только в обработчиках событий. В render — селекторы: `const session = useSession((s) => s.session)`.
- **Анимации через Framer Motion** для карточек и переходов. CSS-transitions для мелочей.
- **Не используй localStorage/sessionStorage внутри artifacts** (в реальном frontend — OK, но внутри demo-артефактов в чате — запрещено).

### Tailwind

- **Дизайн-токены зафиксированы** в `tailwind.config.js`: `paper-{50..300}`, `ink-{400..900}`, `sage-{100..700}`, `terra-{300..700}`. Новые цвета — только через config, не через инлайн `#hex`.
- **Шрифтовые классы:** `font-display` (Fraunces), `font-body` (Literata), `font-ui` (IBM Plex Sans), `font-mono` (IBM Plex Mono).
- **Интервалы** по системе 4-8-12-16-20-24. Не использовать `gap-5` если рядом `gap-6` — выбирай одну последовательность в блоке.
- **`clsx` для условных классов**, не строковая конкатенация.

### Именование файлов

```
src/
├── types/card.ts               types — нижний регистр
├── components/ui/Button.tsx    components — PascalCase
├── screens/HomeScreen.tsx      screens — PascalCase + "Screen"
├── screens/formula7/F7Intro.tsx — префикс метода: F7, F5, KCHG, P (Перекрёсток)
├── lib/storage.ts              lib — нижний регистр, логические модули
└── store/sessionStore.ts       store — нижний регистр + "Store"
```

### Импорты

- Группы: сначала React / сторонние, потом алиасы, потом относительные.
- Использовать алиасы `@/` и `@shared-data/`, а не длинные относительные `../../../../`.

---

## Python: конвенции

### Стиль

- **Python 3.11+.** Используй `Self`, `dict[str, X]` (не `Dict`), union через `|`.
- **Type hints везде.** `mypy --strict` проходит.
- **`dataclass(frozen=True)`** для простых value-объектов, `BaseModel` (Pydantic) — для всего, что пересекает границу (HTTP, JSON, DB).
- **Ruff** с конфигом в `pyproject.toml` (line-length 100, правила `E, F, W, I, N, B, UP, C4, SIM`).
- **Именование:** `snake_case` для функций/переменных, `PascalCase` для классов, `UPPER_SNAKE_CASE` для констант.

### Pydantic

- Все модели наследуют `CamelModel` (в `core/models.py`) — это даёт `snake_case` в Python и `camelCase` на wire.
- `model_config = ConfigDict(populate_by_name=True)` чтобы принимать оба варианта.
- На wire (HTTP body) — всегда camelCase, чтобы был паритет с TS.

### FastAPI

- Роутеры в `backend/app/api/<feature>.py`, агрегируются в `api/__init__.py`.
- Зависимости через `Depends(get_db)` — не создавать SessionLocal() руками.
- Response models указываются в декораторе (`response_model=SessionSchema`), чтобы OpenAPI был корректным.
- Коды ошибок: 404 для «нет сущности», 400 для «ваш ввод неверен», 422 отдаёт FastAPI сам (валидация Pydantic).
- Никакого бизнес-кода в endpoint-функциях. Только оркестрация: взять из БД, вызвать `core`, сохранить обратно.

### SQLAlchemy 2.0

- **Только новый синтаксис:** `Mapped[X]`, `mapped_column`, `select()`, `db.execute(q).scalars().all()`.
- JSON-blob для сложного стейта (см. `db/models.py::SessionRecord`).
- `Index` для колонок, по которым будут частые WHERE.
- Миграции через Alembic (добавится в v2; сейчас `metadata.create_all` для dev).

### Тесты

- `pytest` + `pytest.mark.parametrize` для наборов кейсов.
- Один файл теста на один модуль (`test_formula7.py` ← `formula7.py`).
- Тесты должны быть детерминированы: никаких `time.time()` без мока.
- `conftest.py` для общих фикстур и environment setup.

---

## Тесты: что должно быть

### core/tests/

- Unit-тесты для каждой публичной функции в `core/`.
- Data-integrity тесты: количество карточек, инварианты групп, уникальность кодов.
- Parametrized тесты для регрессий: «каждая основная группа имеет 9 карточек».

### backend/tests/

- Integration через `fastapi.testclient.TestClient`.
- Один тест на endpoint + happy path + один error case.
- Server-side parity тест: PUT сессию с известными like-картами, проверить, что hint `h4` вернётся.

### frontend

- Пока только `npm run typecheck` как регрессионный барьер.
- В v2: Vitest + Testing Library для компонентных тестов. MSW для мока API в dev.

---

## Русский язык в коде

**Когда использовать русский:**
- Пользовательские строки (UI-тексты, формулировки карточек, провокации, тексты валидации).
- Комментарии, объясняющие методологию («см. спеку §4.3»).
- Коды карточек — кириллица по спеке (Ц-6, К-1, СЧЖ-4).

**Когда использовать английский:**
- Имена функций, переменных, классов, файлов.
- Имена ключей в JSON (кроме кодов карточек): `meta`, `groups`, `mainGroups`, `formulaSize`.
- Docstrings и комментарии, описывающие чисто техническое.
- Коммиты, PR-описания, имена веток.

Смешивать в одном предложении русский и английский — нормально для tech comments: `// recordStateChange — сохраняет пользовательское колебание`.

---

## Как добавить новый метод (F-5, KCHG, Перекрёсток)

Высокоуровневый процесс:

1. **Данные.** Создать `shared-data/<method>/cards.json` и прочие JSON-файлы по аналогии с F7.
2. **Core.** Добавить модуль `core/src/professyans_core/methods/<method>.py` с функциями по аналогии с `formula7.py` (validate, match_hints, compute_insights, derive_result).
3. **Типы фронта.** Создать `frontend/src/data/<method>/*.ts` — тонкие обёртки над JSON.
4. **Lib фронта.** Если есть специфичная логика (не общая со Shared), создать `frontend/src/lib/<method>/`.
5. **Экраны.** Создать `frontend/src/screens/<method>/` с компонентами по пятифазной модели.
6. **Роутинг.** Добавить маршруты в `App.tsx`.
7. **Меню.** Добавить в `HomeScreen.tsx::METHODS` с `available: true`.
8. **Backend.** Добавить поддержку `method: "<NEW>"` в `api/sessions.py::get_result` (диспетчер по методу).
9. **Тесты.** core/tests + backend/tests + ручная проверка фронта.
10. **Документация.** Обновить `docs/02_DATA_CONTRACT.md` с новыми кодами/группами.

Подробный разбор для каждого метода — в `05_ROADMAP_TASKS.md`.

---

## Чего делать нельзя

Этот список — зеркало «красных линий» из `01_ARCHITECTURE.md`, но с акцентом на код:

- **Нельзя** добавлять `import sqlalchemy` или `import fastapi` в `core/`.
- **Нельзя** менять формулировки карточек/провокаций в обход JSON.
- **Нельзя** выключать правило «хотя бы одна из каждой группы» в валидации F7.
- **Нельзя** добавлять геймификацию (очки, достижения, прогресс в процентах от «идеала», рейтинги).
- **Нельзя** хранить персональные данные (email, имя) без явного opt-in экрана.
- **Нельзя** делать `localStorage.setItem` с JWT/токенами — use `httpOnly` cookies когда появится auth.
- **Нельзя** удалять трекинг процесса «для оптимизации бандла».
- **Нельзя** автоматически резюмировать сессию без запроса у пользователя.
