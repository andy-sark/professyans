# 06 · Карта «спека → код»

Привязка разделов спецификаций (`professyans_spec_v2.md` и `perekrestok_spec_v2.md`, оба лежат в корне репо) к файлам в кодовой базе. Когда нужно реализовать требование — находишь раздел здесь и видишь, какие файлы затрагиваются.

**Все пути в таблицах ниже — полные репозиторий-относительные**, от корня `professyans/`.

---

## professyans_spec_v2.md (общая спека)

### Часть I — Концептуальная основа

| Раздел | Тема | Реализация |
|---|---|---|
| §1 | Введение | — (мета-документ) |
| §2.1 | «Игра в тесты» | `frontend/src/screens/formula7/F7Intro.tsx` (формулировка введения), `frontend/src/screens/HomeScreen.tsx` (герой-секция) |
| §2.2 | Характеристики активизирующей методики | Сквозные — см. `docs/01_ARCHITECTURE.md` |
| §2.3 | Главное преимущество — оперативная корректировка | `frontend/src/store/sessionStore.ts::setCardState` (всегда можно поменять), `frontend/src/components/cards/RankCard.tsx` (4-state ring) |
| §2.4 | Три варианта взаимодействия | `frontend/src/screens/formula7/F7Intro.tsx` (выбор трека) |
| §2.5 | Одинаковая доступность | — (принцип; нет режима «эксперта» vs «пользователя») |
| §2.6 | Минимизация манипуляции | Отсутствие скрытых весов: `frontend/src/lib/f7/hints.ts` открыт; нет рекомендаций «ваш тип» |
| §2.7 | Сознательное разочарование в результатах | `frontend/src/screens/formula7/F7Results.tsx` (дисклеймеры «не диагноз») |
| §2.8 | Активизирующая стратегия | — (принцип) |

### Часть II — Архитектура

| Раздел | Тема | Реализация |
|---|---|---|
| §3.1 | Функциональные модули MOD-1..8 | `frontend/src/screens/HomeScreen.tsx` (MOD-1), `frontend/src/lib/common/`, `frontend/src/lib/f7/`, `frontend/src/lib/f5/` (MOD-2), `frontend/src/lib/tracker.ts` (MOD-5), `frontend/src/data/formula7/provocations.ts` (MOD-6), `frontend/src/screens/formula7/F7Results.tsx` + `frontend/src/components/results/` (MOD-7) |
| §3.2 | Требования к интерфейсу | `frontend/src/components/layout/Shell.tsx`, `frontend/tailwind.config.js`, `frontend/src/styles/index.css` |
| §3.3 | Технологический стек | `frontend/package.json`, `backend/pyproject.toml`, `core/pyproject.toml` |
| §3.4 | Нефункциональные требования | `frontend/src/lib/storage.ts` (прерывание/возврат, приватность) |
| §3.5 | Принцип компенсации | — (принцип разработки) |

### §4 — UX и пятифазная модель

| Раздел | Тема | Реализация |
|---|---|---|
| §4.1 | Пять фаз | Структура экранов F7: Intro → Ranking → Formula → Molecule → Results (`frontend/src/screens/formula7/`) |
| §4.2 | Проекция фаз на экраны | См. соответствие в `docs/05_ROADMAP_TASKS.md` и компоненты в `frontend/src/screens/formula7/` |
| §4.3 | Критически важная фаза 5 | `frontend/src/screens/formula7/F7Results.tsx` — целиком. **Критический файл**, любые изменения — с перепроверкой спеки. |
| §4.4 | Тон программы | Все текстовые константы в `frontend/src/screens/**/*.tsx` |
| §4.5 | «Незавершённое действие» | `frontend/src/screens/formula7/F7Results.tsx` — секция «Открытые вопросы» |
| §4.6 | Двухплановость | — (план; «примерочная» профессий — задача v2) |
| §4.7 | Экран выбора трека | `frontend/src/screens/formula7/F7Intro.tsx::TrackOption` компонент |

### §5 — Формула-7

| Раздел | Тема | Реализация |
|---|---|---|
| §5.1 | Концепция | — |
| §5.2 | Состав карточек (75) | `shared-data/formula7/cards.json` |
| §5.3 | Процедура (4 фазы) | `frontend/src/screens/formula7/F7Ranking.tsx`, `frontend/src/screens/formula7/F7FormulaBuild.tsx`, `frontend/src/screens/formula7/F7MoleculeBuild.tsx` |
| §5.3 «Правило автора» | Из каждой группы — хотя бы одна | `frontend/src/lib/f7/validation.ts::validateFormula`, `core/src/professyans_core/methods/formula7.py::validate_formula` |
| §5.4 | Диагностические акценты | `frontend/src/lib/f7/hints.ts::detectSchzhConflicts`, `frontend/src/screens/formula7/F7Results.tsx` секция «Напряжения» |

### §6 — Формула-5

| Раздел | Тема | Реализация |
|---|---|---|
| §6.1 | Концепция и аудитория (5–8 класс) | `frontend/src/screens/formula5/F5Intro.tsx` |
| §6.2 | Отличия от F-7 (Ц-2, О-3, О-8, У-7) | Контрольные тесты в `core/tests/test_formula5.py`, `frontend/src/lib/f5/__tests__/validation.test.ts` |
| §6.3 | Состав 45 карточек | `shared-data/formula5/cards.json` |
| §6.4 | Процедура (бонусные карты) | `frontend/src/screens/formula5/F5FormulaBuild.tsx`, validation: `core/src/professyans_core/methods/formula5.py::validate_formula` (читает `bonus_size`) |
| §6.5 | Подсказки (5 draft-сигнатур) | `shared-data/formula5/hints.json`, `frontend/src/lib/f5/hints.ts::matchHints` |

### §7 — КЧГ

| Раздел | Тема | Реализация |
|---|---|---|
| §7.x | Всё | НЕ РЕАЛИЗОВАНО. Задача — итерация 6 в `docs/05_ROADMAP_TASKS.md`. |

### §8 — Перекрёсток (в общей спеке)

| Раздел | Тема | Реализация |
|---|---|---|
| §8.x | Делегирование на `perekrestok_spec_v2.md` | См. ниже |

### Часть III — Движок

| Раздел | Тема | Реализация |
|---|---|---|
| §9 | Трекинг процесса | `frontend/src/lib/tracker.ts`, `core/src/professyans_core/methods/formula7.py::compute_insights` |
| §9.4 | Производные метрики | TS: `computeInsights`; Py: `compute_insights`. **Parity**: тестом прикреплены. |
| §9.5 | Триггеры провокаций | `frontend/src/data/formula7/provocations.ts` (объявление), `frontend/src/screens/formula7/F7Ranking.tsx` (показ) |
| §9.6 | Сравнение сессий | НЕ РЕАЛИЗОВАНО. План v2. |
| §9.7 | Экспорт трекинга | НЕ РЕАЛИЗОВАНО. Связано с PDF-экспортом, итерация 9. |
| §10 | Алгоритмы анализа | `frontend/src/lib/f7/validation.ts`, `frontend/src/lib/f7/hints.ts` ↔ `core/src/professyans_core/methods/formula7.py` |
| §10.1 | Состояние карточки (автомат) | `frontend/src/components/cards/RankCard.tsx`, `frontend/src/store/sessionStore.ts::setCardState` |
| §10.2 | Валидация формулы | `frontend/src/lib/f7/validation.ts::validateFormula` |
| §10.3 | База сигнатур для подсказок | `shared-data/formula7/hints.json`, `frontend/src/lib/f7/hints.ts::matchHints` |
| §10.4 | Сверка с СЧЖ | `detectSchzhConflicts` в `frontend/src/lib/f7/hints.ts`, `frontend/src/screens/formula7/F7Results.tsx` |
| §11 | Библиотека провокаций | `shared-data/formula7/provocations.json` |
| §11.5 | Архитектурное требование (JSON, версионирование) | ✅ ВЫПОЛНЕНО (`shared-data/`) |
| §12 | Модель данных | `frontend/src/types/`, `core/src/professyans_core/models.py`, `backend/app/db/models.py` |

### Часть IV — Режимы работы

| Раздел | Тема | Реализация |
|---|---|---|
| §13 | Активизирующий трек | Дефолтный тон всех экранов в `frontend/src/screens/formula7/` |
| §13.3 | Экран завершения активизирующего трека | `frontend/src/screens/formula7/F7Results.tsx` (секции «Открытые вопросы», «История процесса») |
| §14 | Закрытый трек | `frontend/src/screens/formula7/F7Intro.tsx::TrackOption` — выбор трека. Логика упрощённого флоу — УПРОЩЕНА, расширить в v2. |
| §15 | Режим консультанта | НЕ РЕАЛИЗОВАНО. Итерация 8 в `docs/05_ROADMAP_TASKS.md`. |

### Часть V — Границы

| Раздел | Тема | Реализация |
|---|---|---|
| §16 | Антипаттерны | `docs/01_ARCHITECTURE.md` §«Что менять нельзя», `docs/03_CONVENTIONS.md` §«Чего делать нельзя» |
| §17 | Критерии успеха | — (внешние критерии) |
| §18 | Дорожная карта | `docs/05_ROADMAP_TASKS.md` |
| §19 | Метапринципы | `docs/01_ARCHITECTURE.md` |
| §20 | Справочники | — |

---

## perekrestok_spec_v2.md (спека Перекрёстка)

Все разделы — НЕ РЕАЛИЗОВАНЫ. Задача — итерация 7 в `docs/05_ROADMAP_TASKS.md`.

При реализации планируется следующая структура файлов (пути от корня репо):

```
shared-data/perekrestok/
├── questions.json           §15 (все 222 вопроса)
├── spheres.json             §16 (20 сфер + нормы юн/дев)
├── means.json               §16 (5 групп средств + нормы)
├── education_levels.json    §16
├── autonomy_levels.json     §16
├── intersections.json       §16 (таблица «предметы × средства», 100 ячеек)
└── education_autonomy.json  §16 (таблица «образование × самостоятельность», 35 ячеек)

core/src/professyans_core/methods/
└── perekrestok.py           §9 (алгоритмы подсчёта), §10 (провокации),
                             §12–13 (треки)

frontend/src/screens/perekrestok/
├── PIntro.tsx               §3.2 (выбор пола + трек)
├── PQuestionnaire.tsx       §4.2 (основной цикл)
├── PPartSummary.tsx         §4.1 фаза 3 (сводки)
└── PResults.tsx             §4.1 фаза 5
```

---

## Как использовать эту карту

Когда берёшь задачу:

1. Найди раздел спеки, описывающий требование (например, §5.3 «Правило автора»).
2. По этой таблице найди файлы, которые нужно править (`frontend/src/lib/f7/validation.ts` + `core/src/professyans_core/methods/formula7.py`).
3. Открой файлы, изучи текущую реализацию.
4. Если нужно добавить новое — см. `docs/03_CONVENTIONS.md` §«Как добавить новый метод» или соответствующий шаблон.
5. При подаче Cursor-промпта — ссылайся через `@` на оба файла + сам раздел спеки, через `@professyans_spec_v2.md` (файл в корне репо).

Если нужного маппинга нет в этой таблице — значит требование ещё не реализовано (или на этапе планирования). Зафиксируй это как отдельную задачу в `docs/05_ROADMAP_TASKS.md`.
