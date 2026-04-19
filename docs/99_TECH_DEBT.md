# Technical debt register

Living notes on known shortcuts and follow-ups.  
Закрытые пункты — вычёркивать или переносить в раздел «Closed» с датой и ссылкой на PR. Не удалять: полезна история решений.

---

## Open

_(none — add items above Closed as they appear.)_

---

## Closed

### TD-1 — Duplicate `HintSignature` definitions (frontend)

- **Closed:** 2026-04-18  
- **Task:** Iteration 4 / 4.5 (unify `HintSignature`; same release track as TD-1 closure in roadmap).  
- **Resolution:** Single `export interface HintSignature` in `frontend/src/lib/common/hints.ts`; `data/formula7/hints.ts` and `data/formula5/hints.ts` import and re-export via `export type { HintSignature }`. `lib/f7/hints.ts` already followed this pattern.

### TD-2 — `tracker.ts` / `computeInsights` without unit tests (frontend)

- **Closed:** 2026-04-18  
- **Task:** Iteration 4 / 4.5 / TD-2 — unit tests for `computeInsights` (parity scenarios with `core/tests/test_formula7.py` compute_insights) plus smoke tests for pure recorders (`recordCardShown`, `recordStateChange`, `recordStageTransition`, `recordProvocationShown`).  
- **Resolution:** `frontend/src/lib/__tests__/tracker.test.ts` added. Note: `computeDecisionTimes` uses truthiness on `cardFirstShown`; `firstShown === 0` is skipped in JS (Python uses `is not None`). Tests use non-zero bases for first-shown timestamps where deltas mirror the Python scenarios.

### TD-3. Установка venv для backend-тестов не задокументирована — Closed 2026-04-18

Резолюция: итерация 4.5 / TD-3. Добавлена секция «Запуск тестов» в `README.md` с явным рецептом `pip install -e core/ && pip install -e 'backend/[dev]'`.

### TD-4. База хинтов F-5 — 5 сигнатур вместо целевых 30–50

**Что.** `shared-data/formula5/hints.json` содержит 5 draft-сигнатур (h1-h5). `hints_meta.status: "draft"`, `hints_meta.target_in_v2: "30-50, совместно с психологом"`.

**Почему отложено.** Содержательная задача, требует психолога — не Cursor/Claude. Принципиальная позиция: не тащить F-7 сигнатуры в F-5 без валидации (см. §6.2, §16, §18.1 спеки и обсуждение в переписке 4.2b).

**Когда возвращаться.** Перед релизом F-5 пользователям. Или после MVP-тестирования с пилотной группой.

**Цена.** Зависит от работы с психологом. Технически — правка одного JSON-файла.

### TD-5. Провокации для F-5 отсутствуют

**Что.** `shared-data/formula5/` не содержит `provocations.json`. `_F5Data` в core не грузит провокации. На экранах F-5 (когда появятся в 4.3b) не будет card-level провокаций из §11 спеки.

**Почему отложено.** Аналогично TD-4: содержательная задача для психолога, не техническая. В Ф-5 интонация провокаций должна отличаться от Ф-7 (младше аудитория, 5–8 класс).

**Когда возвращаться.** Параллельно с TD-4, перед релизом F-5.

**Цена.** Написание JSON + подключение в `_F5Data` / `F5Namespace` + тесты. ~2-4 часа, не считая работы психолога.

### TD-6. `hints_meta` в F-5 JSON читается как `unknown` и не потребляется

**Что.** `shared-data/formula5/hints.json` содержит блок `hints_meta` (status, total, target_in_v2, not_ported_from_F7), но frontend и core его не читают и никак не показывают.

**Почему отложено.** Поле — документирующее, для будущих разработчиков. Показ пользователю «это черновая база подсказок» — UX-решение, которого не было в задаче 4.3a.

**Когда возвращаться.** При создании экрана результатов F-5 (4.3b) — обсудить, не стоит ли показать beta/draft-бейдж над подсказками.

**Цена.** ~15 минут: чтение поля в `data/formula5/hints.ts`, компонент-бейдж в UI.

### TD-7. Дубликат `HintSignature` в TS-слое

*Эта запись была в первой версии техдолга как дубликат TD-1 — забей, пропускаем.*

### TD-8. F-5 экраны скопированы из F-7 с правками (γ-подход)

**Что.** `F5Intro`, `F5Ranking`, `F5FormulaBuild`, `F5MoleculeBuild` частично дублируют структуру соответствующих F-7 экранов. Общие фрагменты (`TrackOption`, `LegendChip`, candidate-grid, formula-tray) не выделены в переиспользуемые компоненты.

**Почему отложено.** Преждевременная абстракция рискует создать god-components с методико-переключателем. Для двух методик γ-компромисс (копии с правками + часть общих блоков в `components/results/`) оправдан. Часть общих блоков уже выделена в 4.3b.1 — это не полное β, но и не полное копирование.

**Когда возвращаться.** Перед или во время разработки КЧГ (итерация 5) — третья методика сделает переиспользование явно выгодным. Или перед первой крупной UX-правкой formula-build / ranking-экранов.

**Цена.** ~4–6 часов: вытащить `TrackOption`, `LegendChip`, `CandidateGrid`, `FormulaTray` в `components/common/`, отрефакторить F-5 и F-7 экраны поверх примитивов.

### TD-9. UX-проверка счётчика формулы в F5FormulaBuild

**Что.** В F5FormulaBuild счётчик размера формулы показывает `n / 8-10` (диапазон через дефис в одной метке). При `n=0` читается как «надо набрать 10»; при `n=8` — неясно, достаточно ли.

**Почему отложено.** Оптимальный формат невозможно выбрать без реальных пользователей. В MVP оставлен буквальный диапазон из ТЗ.

**Когда возвращаться.** При первом UX-интервью или фокус-группе с F-5. Если счётчик читается двусмысленно — заменить на «n из 8» (базовый минимум) с отдельной более мягкой индикацией про бонус до 10.

**Цена.** ~30 минут в коде (одна строка JSX + тест). Главная стоимость — в получении UX-фидбэка.


### TD-10 — Parity fix: zero `cardFirstShown` in `computeDecisionTimes`

- **Closed:** 2026-04-18  
- **Task:** Iteration 4 / 4.5 / TD-10 — replace truthy check with nullish check in `frontend/src/lib/tracker.ts::computeDecisionTimes` and add a regression test for `cardFirstShown === 0`.  
- **Resolution:** `if (firstShown)` changed to `if (firstShown != null)` (parity with Python `is not None`); regression test added in `frontend/src/lib/__tests__/tracker.test.ts` (`decision time uses zero firstShown correctly ...`).
---

## Как добавлять записи

Формат: `### TD-N. Короткое название` → `**Что.**` → `**Почему отложено.**` → `**Когда возвращаться.**` → `**Цена.**`.

Нумерация сквозная, не сбрасывается по итерациям. Закрытые пункты — вычёркивать (strikethrough) или переносить в раздел «Closed» с датой и ссылкой на PR. Не удалять: полезна история решений.