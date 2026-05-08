# Профессьянс

Цифровая реализация активизирующих методик профориентации Н. С. Пряжникова: «Формула-7», «Формула-5», «Кто? Что? Где?» и опросник «Перекрёсток».

**Что работает прямо сейчас:** полный сквозной флоу Формулы-7 и Формулы-5 на frontend (React + TS) и на backend (FastAPI + PostgreSQL), с единым Python-ядром общей логики и общими UI-примитивами в `components/common/`. КЧГ и Перекрёсток подключаются отдельными модулями в следующих итерациях.

---

## Архитектура монорепо

````
```
professyans/
├── frontend/             React 18 + TypeScript + Vite + Tailwind
├── backend/              FastAPI + SQLAlchemy 2.0 + PostgreSQL / SQLite
├── core/                 Python-пакет с общей бизнес-логикой
│                         (scoring, validation, hint matching)
│                         Потребляется и backend, и будущим desktop.
├── shared-data/          Canonical JSON: F-7 (75 карт + provocations
│                         + hints) и F-5 (45 карт + hints draft).
│                         Читается фронтом (через Vite alias @shared-data)
│                         и Python-ядром (через PROFESSYANS_DATA_DIR).
├── docs/                 Опорные документы проекта (INDEX, ARCHITECTURE,
│                         DATA_CONTRACT, CONVENTIONS, CURSOR_PLAYBOOK,
│                         ROADMAP_TASKS, SPEC_MAP, GIT_WORKFLOW).
├── .cursor/rules/        Cursor project rules (*.mdc с YAML-frontmatter).
├── AGENTS.md             Cross-tool инструкции для AI-агентов.
├── .cursorignore         Файлы, скрытые от AI-контекста (секреты, БД).
├── .cursorindexingignore Файлы вне семантического поиска (кеши, dist).
├── docker-compose.yml    Postgres + backend + frontend одной командой.
├── README.md             (этот файл)
├── CHANGELOG.md          История изменений.
├── professyans_spec_v2.md   Спецификация карточных методик.
└── perekrestok_spec_v2.md   Спецификация опросника.
```
````

### Единый источник данных

Вся содержательная «плоть» методик — 75 карточек Формулы-7, 45 карточек Формулы-5, ~30 провокаций F-7, 18 + 5 подсказочных сигнатур, 5 конфликтов СЧЖ — лежит в `shared-data/formula{7,5}/*.json`. Менять формулировки можно без пересборки фронта; psycholog-редактор правит JSON напрямую.

### Parity между клиентом и сервером

Бизнес-логика реализована дважды — TypeScript для offline-first frontend и Python для server-side API. Корректность совпадения обеспечена:

- общими JSON-данными;
- явным «зеркалом типов» (`core/src/professyans_core/models.py` ↔ `frontend/src/types/`);
- тестами: 50 pytest для Python-ядра (~0.5с) и 9 integration-тестов FastAPI (включая F-7 и F-5 endpoints), 61 unit-тест на frontend через vitest.

---

## Запуск

### Вариант 1. Всё одной командой (Docker)

```bash
docker compose up --build
```

После старта:

- **Frontend:** <http://localhost:8080>
- **Backend health:** <http://localhost:8000/health>
- **OpenAPI UI:** <http://localhost:8000/docs>
- **Postgres:** `localhost:5433`, user `professyans`, pass `professyans`

### Вариант 2. Локально, только frontend

Работает полностью офлайн на localStorage + IndexedDB, без бэкенда.

```bash
cd frontend
npm install
npm run dev
```

Открыть <http://localhost:5173>. Это рекомендуемый режим для быстрой итерации по UI и текстам провокаций.

### Вариант 3. Локально, frontend + backend

```bash
# Terminal 1 — backend
cd core && pip install -e ".[dev]"
cd ../backend && pip install -e ".[dev]"
uvicorn app.main:app --reload
# backend на http://localhost:8000, SQLite в ./professyans.db

# Terminal 2 — frontend с настроенным API
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```

На главной появится тумблер «Облачное резервирование» — sync opt-in, frontend остаётся offline-first.

---

## Тесты

```bash
# Python-ядро: 50 тестов за ~0.5с (логика F-7 + F-5)
cd core && pytest

# Backend: 9 integration-тестов
cd backend && pytest

# Frontend: 61 unit-тест через vitest + статическая проверка типов
cd frontend && npm test
cd frontend && npm run typecheck
```
---

### Запуск тестов

Для core достаточно pytest в чистом venv:

```bash
cd core && pytest
```

Для backend-тестов нужно сначала установить оба пакета в editable-режиме — иначе `pytest` упадёт на `ModuleNotFoundError: fastapi` при сборе тестов:

```bash
pip install -e core/
pip install -e 'backend/[dev]'
cd backend && pytest
```

Для frontend:

```bash
cd frontend
npm install
npm test          # unit-тесты через vitest
npm run typecheck # TypeScript strict
npm run build     # prod-сборка
```
---

## Принципы разработки

Спецификации `perekrestok_spec_v2.md` и `professyans_spec_v2.md` — **обязательное чтение**. Три ключевых принципа:

1. **Процесс важнее результата.** Фиксируется каждое перемещение карточки, история колебаний, возвраты (см. `frontend/src/lib/tracker.ts` и `core/src/professyans_core/methods/formula7.py::compute_insights`). Это не тест — это активизация размышления.

2. **Минимум манипуляции.** Нет «правильных» ответов, нет скрытых весов. Алгоритмы подсчёта подсказок открыты в исходниках; в v2 — кнопка «как это считается» рядом с каждым автоматическим выводом.

3. **Пятая фаза критична.** Экран результатов (`frontend/src/screens/formula7/F7Results.tsx`) не даёт «диагноза»: молекула как карта, трекинг как зеркало, напряжения без исправления, открытые вопросы вместо выводов. См. `professyans_spec_v2.md` §4.3.

Антипаттерны и список «никогда не делать» — в `professyans_spec_v2.md` §16.

---

## Дорожная карта

| Итерация | Содержание | Статус |
|---|---|---|
| 1 | Каркас frontend + Формула-7 полный флоу | ✅ готово |
| 2 | Python-ядро + FastAPI backend + Postgres, интеграция | ✅ готово |
| 3 | Opt-in sync frontend ↔ backend, Docker | ✅ готово |
| 4 | Формула-5 — полный vertical slice (data + core + lib + UI + backend) | ✅ готово |
| 4.5 | Технический долг (UI-примитивы в common, тесты, parity) | 🟡 в процессе |
| 5 | Графическая молекула (drag-and-drop, эмерджентные ядра) | план |
| 6 | КЧГ (с матрицей связей К↔Ч↔Г) | план |
| 7 | Перекрёсток (опросник, 222 вопроса) | план |
| 8 | Авторизация, режим консультанта | план |
| 9 | Desktop: PyWebView + SQLite + PyInstaller → dmg/exe | план |
| 10 | Экспорт PDF, i18n (ru/uk/en), a11y audit | план |

---

## Авторство методик

Реализованные в проекте методики («Формула-7», «Формула-5», «Кто? Что? Где?», опросник «Перекрёсток») разработаны Н. С. Пряжниковым. Этот проект — техническая реализация, выполненная с уважением к авторской методологии и опубликованным работам автора. Коммерческое использование предполагает консультацию с правообладателем методики. Программный код проекта распространяется отдельно от методического содержания — вопрос лицензии на код будет решён отдельной задачей.

---

**Версия:** 0.5.0 · Май 2026
