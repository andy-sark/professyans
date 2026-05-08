# 00 · Индекс проекта

**Читай этот файл первым.** Он ориентирует в проекте за 3 минуты и указывает, какой следующий документ открыть для конкретной задачи.

---

## Что это за проект

Цифровая реализация активизирующих методик профориентации Н. С. Пряжникова: **Формула-7, Формула-5, «Кто? Что? Где?», «Перекрёсток».** Это *не* психодиагностический тест, а инструмент размышления. «Процесс важнее результата» — это не лозунг, а архитектурное ограничение (см. `01_ARCHITECTURE.md` §«Почему так»).

Подробная методологическая основа — в спецификациях `professyans_spec_v2.md` и `perekrestok_spec_v2.md` (в корне project knowledge). Этот набор документов их *не дублирует* — только технически интерпретирует.

---

## Текущее состояние

| Компонент | Статус | Примечание |
|---|---|---|
| Формула-7 | ✅ полный флоу | frontend + backend + тесты |
| Формула-5 | ✅ полный флоу | 45 карт, 5 групп, hints draft-база |
| Графическая молекула | план | итерация 5: drag-and-drop, эмерджентные ядра |
| КЧГ | план | итерация 6, с матрицей связей К↔Ч↔Г |
| Перекрёсток | план | итерация 7, опросник 222 вопроса, 4 подчасти |
| Backend API | ✅ работает | FastAPI + PostgreSQL, F-5 endpoint в составе итерации 4 |
| Docker-compose | ✅ готов | не тестировался под нагрузкой |
| Desktop (dmg/exe) | план | итерация 9, PyWebView + PyInstaller |
| Авторизация, консультант | план | итерация 8 |
| Экспорт PDF | план | итерация 10, pdfmake на клиенте |
| i18n | план | итерация 10, ru → uk, en |

Полная дорожная карта: `05_ROADMAP_TASKS.md`.

---

## Карта репозитория

```
professyans/
├── .cursor/                   Project rules для AI-агентов (Cursor-specific)
│   └── rules/
│       ├── 00-global.mdc         alwaysApply: true  (красные линии)
│       ├── 10-architecture.mdc   agent-requested    (рационал)
│       ├── 20-data-contract.mdc  auto-attached      (при правке JSON)
│       └── 30-parity.mdc         auto-attached      (при правке логики)
├── AGENTS.md                  Cross-tool инструкции (читают все AI-агенты)
├── .cursorignore              Файлы, полностью скрытые от AI (секреты, БД)
├── .cursorindexingignore      Файлы вне семантического поиска (lockfiles, кеши)
│
├── frontend/                  React 18 + TS + Vite + Tailwind + Zustand
│   ├── src/
│   │   ├── types/             TS-зеркало core/models.py
│   │   ├── data/formula7/     тонкие обёртки над shared-data JSON
│   │   ├── data/formula5/     то же для F-5
│   │   ├── store/             Zustand session store (auto-persist)
│   │   ├── lib/
│   │   │   ├── common/        generic validation, hints, openQuestions
│   │   │   ├── f7/            тонкие обёртки над common
│   │   │   ├── f5/            то же для F-5
│   │   │   ├── tracker.ts     трекинг процесса (method-agnostic)
│   │   │   └── api.ts         opt-in sync с backend
│   │   ├── components/
│   │   │   ├── ui/            Button, ProgressBar
│   │   │   ├── layout/        Shell
│   │   │   ├── cards/         RankCard
│   │   │   ├── common/        TrackOption, LegendChip, FormulaTray, CandidateGrid
│   │   │   └── results/       MoleculeMap, InsightBlock, CardsBadgeList, HintsList
│   │   └── screens/
│   │       ├── HomeScreen, HistoryScreen
│   │       ├── formula7/      F7Intro → F7Ranking → … → F7Results
│   │       └── formula5/      F5Intro → F5Ranking → … → F5Results
│   └── Dockerfile, nginx.conf
│
├── backend/                   FastAPI + SQLAlchemy 2.0
│   ├── app/
│   │   ├── api/               sessions.py, methods.py
│   │   ├── db/                models.py (SessionRecord с JSON-blob)
│   │   ├── schemas/           Pydantic response-models
│   │   ├── config.py          pydantic-settings
│   │   └── main.py            create_app(), CORS, lifespan
│   ├── tests/                 8 integration-тестов через TestClient
│   └── Dockerfile
│
├── core/                      Python-пакет общей логики
│   ├── src/professyans_core/
│   │   ├── models.py          Pydantic с camelCase alias
│   │   ├── paths.py           resolver для shared-data
│   │   └── methods/
│   │       ├── common.py      generic validate_formula, match_hints, compute_insights
│   │       ├── formula7.py    F-7 namespace + detect_schzh_conflicts
│   │       └── formula5.py    F-5 namespace (без СЧЖ)
│   └── tests/                 50 тестов
│
├── shared-data/               CANONICAL JSON — единственный источник правды
│   ├── formula7/
│   │   ├── cards.json         75 карточек + meta
│   │   ├── provocations.json  ~30 провокаций с триггерами
│   │   └── hints.json         18 сигнатур + 5 SCHZH-конфликтов
│   └── formula5/
│       ├── cards.json         45 карточек + meta (bonusSize: 2)
│       └── hints.json         5 draft-сигнатур (TD-4)
│
├── docs/                      ← ТЫ ЗДЕСЬ
├── docker-compose.yml         postgres + backend + frontend
├── README.md                  quick-start
└── CHANGELOG.md
```

---

## Где искать что

Для разных типов задач сначала читай указанный документ:

| Нужно… | Читай |
|---|---|
| Понять, *почему* архитектура именно такая | `01_ARCHITECTURE.md` |
| Добавить/изменить карточку, подсказку, провокацию | `02_DATA_CONTRACT.md` |
| Разобраться в стиле кода TS или Python | `03_CONVENTIONS.md` |
| Написать промпт для Cursor | `04_CURSOR_PLAYBOOK.md` |
| Взять следующую задачу из roadmap | `05_ROADMAP_TASKS.md` |
| Понять, какой раздел спеки где реализован | `06_SPEC_MAP.md` |
| Закоммитить / ветку создать / release | `07_GIT_WORKFLOW.md` |
| Узнать, что Cursor видит автоматически | `../AGENTS.md` + `../.cursor/rules/` |

---

## Минимальный контекст для нового Claude-чата

Если ты новый Claude в новом чате, для старта продуктивной работы нужно:

1. Прочитать **этот файл** (00_INDEX).
2. Прочитать **01_ARCHITECTURE** (3 минуты) — чтобы не предлагать решения, противоречащие принципам.
3. Открыть **04_CURSOR_PLAYBOOK** — там шаблоны промптов.
4. Смотреть **05_ROADMAP_TASKS** для следующей задачи.
5. **Не нужно** читать спеки целиком, только в точечных разделах через `06_SPEC_MAP`.

---

## Ключевые принципы (кратко)

Эти пять пунктов — обязательны к соблюдению в любой задаче. Развёрнуто — в `01_ARCHITECTURE`.

1. **Активизирующая, не диагностическая.** Никаких «ваш тип личности», «рекомендуемые профессии:», геймификации.
2. **Процесс важнее результата.** Фиксируется и показывается пользователю (трекинг, история колебаний).
3. **Parity TS ↔ Python.** Любая логика, реализованная в `frontend/src/lib/f7/`, должна быть в `core/src/professyans_core/methods/formula7.py`, и наоборот.
4. **Canonical JSON.** Карточки/провокации/подсказки — в `shared-data/`, TS и Python читают оттуда.
5. **Offline-first.** Frontend работает без backend. Sync — opt-in.

---

## Команды-шпаргалка

```bash
# Тесты всех трёх пакетов
cd core && pytest                      # 50 тестов, ~0.5с
cd backend && pytest                   # 9 тестов, ~3с
cd frontend && npm test                # 61 unit-тест (vitest)
cd frontend && npm run typecheck       # TS strict

# Билд и запуск
cd frontend && npm run build           # Vite prod
cd backend && uvicorn app.main:app     # FastAPI на 8000
docker compose up --build              # всё сразу
```

---

## Открытые вопросы (к релизу)

Решения, отложенные осознанно — пересматриваются к релизу полного функционала.

### Нейминг продукта

Рабочее имя **«Профессьянс»** используется на этапе разработки. К релизу — пересмотр.

**Почему не окончательное:** слово читается с запинкой («Профе-ссьянс»), плохо запоминается, перегружено для непрофильной аудитории. Идеальный момент для финального выбора — когда продукт сформирован и понятен реальный tone of voice.

**Рассматривался ProfSolit** (от "professional orientation solitaire") — отклонён: в русском первые полсекунды звучит как «проф. солит/солёный», смысл скрыт за 3 шагами расшифровки, сливается с перегруженным префиксом «Проф-».

**Направления для финального выбора** (не готовые кандидаты, а категории):
- **Метафора методики**: Грани, Узор, Расклад, Формула, Молекула.
- **От процесса пользователя**: Развилка, Компас, Тропа.
- **От наследия автора**: Пряжа (Пряжников + метафора «нити судьбы»).
- **Короткий «пустой» звук** в духе Figma/Miro: 3–7 букв без нагруженного смысла.

**Критерии проверки кандидата:**
1. 4 из 5 знакомых через сутки правильно воспроизводят название.
2. Домен `.app`/`.ru`/`.pro` свободен.
3. Русский носитель читает без запинки.
4. Нет коллизий со значениями в других языках.

**Техническая стоимость переименования:** низкая. Find/replace `Профессьянс → <NEW>`, `professyans → <new>` по коду/конфигам, ~30 минут через Cursor. Архитектура и логика не затрагиваются.

**Действие:** до релиза использовать `Профессьянс`. Когда продукт будет готов — задача «финальный нейминг + переименование» отдельной веткой, с обновлением `package.json`, `pyproject.toml`, `README.md`, доменов, иконок.
