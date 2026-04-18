# Профессьянс

Цифровая реализация активизирующих методик профориентации Н. С. Пряжникова: «Формула-7», «Формула-5», «Кто? Что? Где?» и опросник «Перекрёсток».

**Что работает прямо сейчас:** полный сквозной флоу Формулы-7 на frontend (React + TS) и на backend (FastAPI + PostgreSQL), с единым Python-ядром общей логики. Формула-5, КЧГ и Перекрёсток подключаются отдельными модулями в следующих итерациях.

---

## Архитектура монорепо

```
professyans/
├── frontend/             React 18 + TypeScript + Vite + Tailwind
├── backend/              FastAPI + SQLAlchemy 2.0 + PostgreSQL / SQLite
├── core/                 Python-пакет с общей бизнес-логикой
│                         (scoring, validation, hint matching)
│                         Потребляется и backend, и будущим desktop.
├── shared-data/          Canonical JSON — карточки, провокации, подсказки.
│                         Читается фронтом (через Vite alias @shared-data)
│                         и Python-ядром (через PROFESSYANS_DATA_DIR).
├── docker-compose.yml    Postgres + backend + frontend одной командой.
└── README.md             (этот файл)
```

### Единый источник данных

Вся содержательная «плоть» методики — 75 карточек Формулы-7, ~30 провокаций, 18 подсказочных сигнатур, 5 конфликтов СЧЖ — лежит в `shared-data/formula7/*.json`. Менять формулировки можно без пересборки фронта; psycholog-редактор правит JSON напрямую.

### Parity между клиентом и сервером

Бизнес-логика реализована дважды — TypeScript для offline-first frontend и Python для server-side API. Корректность совпадения обеспечена:

- общими JSON-данными;
- явным «зеркалом типов» (`core/src/professyans_core/models.py` ↔ `frontend/src/types/`);
- тестами: 24 pytest для Python-ядра (~0.4с) и 8 integration-тестов FastAPI, включая явную проверку, что `derive_result` на сервере возвращает тот же набор подсказок, что вычисляет фронтенд.

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
# Python-ядро: 24 теста за ~0.4с (бизнес-логика F7)
cd core && pytest

# Backend: 8 integration-тестов через httpx TestClient
cd backend && pytest

# Frontend: статическая проверка типов
cd frontend && npm run typecheck
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
| 3 | Opt-in sync frontend ↔ backend, Docker infrastructure | ✅ готово |
| 4 | Формула-5 как JSON-файл + reuse F7-движка | план |
| 5 | КЧГ (с матрицей связей К↔Ч↔Г) | план |
| 6 | Перекрёсток (опросник, 222 вопроса, таблицы пересечений) | план |
| 7 | Авторизация, режим консультанта, live-доступ | план |
| 8 | Desktop: PyWebView + SQLite + PyInstaller → dmg/exe | план |
| 9 | Экспорт PDF, i18n (ru/uk/en), a11y audit | план |

---

**Версия:** 0.1.0 · Апрель 2026
