# 07 · Git-workflow

Практики работы с локальным git + облачным зеркалом (GitHub / GitLab / Bitbucket / self-hosted Gitea).

---

## Первичный setup (один раз)

```bash
# Из корня проекта:
cd professyans

git init
git branch -M main
git add .
git commit -m "chore: initial import of MVP (frontend + backend + core)"

# Создать репозиторий на облачном хостинге через веб-интерфейс, потом:
git remote add origin git@github.com:<user>/professyans.git
git push -u origin main
```

**Перед `git add .` убедись**, что `.gitignore` в корне корректный (см. `../.gitignore` в репозитории). Файлы, которые НЕ должны попасть в git:

- `**/node_modules/`, `**/dist/`, `**/.venv/`, `**/__pycache__/`
- `*.db`, `*.db-journal` (SQLite-локальные базы)
- `*.tsbuildinfo` (TypeScript incremental build)
- `.env`, `.env.local` (секреты)
- `professyans.db`, `test_professyans.db` (локальные SQLite)

---

## Стратегия ветвления

**Trunk-based с короткими feature-ветками.** Подходит для соло-разработки и малых команд.

```
main ────●──●──●──●──●──●──●──── (всегда зелёная, всегда деплойная)
          \       /   \       /
           f/a──●       f/b──●    (feature-ветки, короткоживущие, 1-3 дня)
```

### Именование веток

| Префикс | Назначение | Пример |
|---|---|---|
| `feat/` | новая фича | `feat/f5-cards-data` |
| `fix/` | багфикс | `fix/ranking-scroll-jitter` |
| `refactor/` | рефакторинг без смены поведения | `refactor/extract-common-validation` |
| `docs/` | только документация | `docs/update-cursor-playbook` |
| `chore/` | инфраструктура, зависимости | `chore/bump-fastapi-to-0.115` |
| `data/` | только `shared-data/` | `data/add-provocation-k8` |
| `test/` | только тесты | `test/parity-f7-hints` |

Имена: английский, kebab-case, длина до 50 символов, содержат *результат*, не процесс («add-cards» а не «working-on-cards»).

### Жизненный цикл ветки

```bash
git checkout main
git pull
git checkout -b feat/f5-cards-data

# ... работа ...
git add <files>
git commit -m "feat(formula5): добавить 45 карточек F-5 из спеки §6.3"

# Чаще пушить, чтобы не потерять:
git push -u origin feat/f5-cards-data

# Перед мержем — актуализировать ветку:
git checkout main && git pull
git checkout feat/f5-cards-data
git rebase main  # или merge — твой выбор

# Мёрдж через PR или локально:
git checkout main
git merge --no-ff feat/f5-cards-data
git push origin main

# Удалить отработанную ветку:
git branch -d feat/f5-cards-data
git push origin --delete feat/f5-cards-data
```

---

## Формат коммитов (Conventional Commits)

Структура:

```
<type>(<scope>): <short summary, одно предложение>

<optional body — если нужно объяснить «зачем», не «что»>

<optional footer — ссылки на issue, breaking changes>
```

### Типы

| Тип | Когда |
|---|---|
| `feat` | новая функциональность |
| `fix` | багфикс |
| `refactor` | рефакторинг без смены поведения |
| `docs` | только документация |
| `style` | форматирование, whitespace, без логики |
| `test` | только тесты |
| `chore` | инфраструктура, зависимости, сборка |
| `data` | изменения в `shared-data/` |
| `perf` | оптимизация |

### Scope (область)

Один из: `frontend`, `backend`, `core`, `data`, `docs`, `infra`, `formula7`, `formula5`, `kchg`, `perekrestok`, `auth`, `desktop`.

Можно пропускать если коммит затрагивает много областей.

### Примеры хороших коммитов

```
feat(formula7): добавить тумблер "показывать историю процесса" на HomeScreen

Пользователи с тревогой по поводу surveillance'а просили скрывать
трекинг на экране результатов. Значение хранится в localStorage,
по умолчанию включено (трекинг — ядро методики, см. спеку §9).

Closes #42
```

```
fix(backend): корректно обрабатывать пустой trace.events в derive_result

При сессии с track=closed trace.events пустой, что ломало
compute_insights. Добавлены guards и regression-тест.
```

```
data(formula7): исправить description у К-3 (пропущено слово "аудитории")

Сверено с книгой ВАКО 2005, с. 88.
```

```
docs: добавить раздел "Как добавить новую методику" в 03_CONVENTIONS.md
```

### Примеры плохих коммитов (не делать)

```
update        ← неясно, что и зачем
fixes         ← множественное число скрывает, что сделано
wip           ← WIP не должен попадать в main
stuff         ← no comment
добавил       ← нет scope, нет type
```

### Сообщения — на русском или английском

Тип и scope — английский (стандарт). Summary — русский (понятно команде). Body — любой, но стабильно:

```
feat(formula7): включить sticky-футер на экране ранжирования

На длинных группах кнопка "дальше" уходила далеко вниз.
Теперь появляется sticky после первых трёх карточек.
```

---

## Типичные ошибки и как их избежать

### «Случайно закоммитил .env»

```bash
# Удалить из ветки и запушить удаление:
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: удалить случайно закоммиченный .env"

# Если .env УЖЕ был запушен — СЕКРЕТЫ СКОМПРОМЕТИРОВАНЫ.
# Нужно ротировать их (новые пароли/ключи) + использовать git filter-branch
# или BFG Repo-Cleaner для вычистки из истории.
```

### «Слишком большой коммит»

Разбить на несколько перед пушем:

```bash
git reset HEAD~1          # отменить последний коммит, изменения остаются
git add <file1>            # добавить только одну логическую группу
git commit -m "feat(X): ..."
git add <file2>
git commit -m "fix(Y): ..."
```

### «Конфликт при rebase»

```bash
# Во время rebase git останавливается на конфликте.
# Открой конфликтный файл, разреши вручную (найди <<<<<<<, >>>>>>>).
git add <resolved-file>
git rebase --continue

# Если всё пошло не так:
git rebase --abort
```

### «Сломал main»

```bash
# Откат к последнему известному хорошему состоянию:
git log --oneline              # найти хэш хорошего коммита
git reset --hard <hash>
git push --force-with-lease    # осторожно: переписывает историю на remote
```

**Force-push только в feature-ветки!** В main — никогда без согласования команды.

---

## CHANGELOG.md

Ведётся вручную в формате [Keep a Changelog](https://keepachangelog.com/). Обновляется при каждом мёрже в main. Структура:

```markdown
# Changelog

## [Unreleased]
### Added
- Формула-5: модуль данных, core-логика, UI-экраны.

## [0.2.0] — 2026-05-10
### Added
- Opt-in sync frontend ↔ backend, тумблер на HomeScreen.
- Docker-compose для one-command dev.
### Changed
- Перенос данных F-7 в canonical shared-data/formula7/*.json.
### Fixed
- Типовая ошибка в tsconfig.node.json, блокировавшая typecheck.

## [0.1.0] — 2026-04-18
### Added
- Полный сквозной флоу Формулы-7 (frontend + backend + core).
- 24 теста core, 8 integration-тестов backend.
```

---

## Гитхуки (опционально, но рекомендуется)

Pre-commit хук, блокирующий коммит с падающими тестами:

```bash
# .git/hooks/pre-commit (выставить chmod +x)
#!/bin/sh
set -e

echo "→ core tests..."
(cd core && python -m pytest -q)

echo "→ backend tests..."
(cd backend && python -m pytest -q)

echo "→ frontend typecheck..."
(cd frontend && npm run typecheck)

echo "✓ all checks passed"
```

В облачном CI-provider'е (GitHub Actions, GitLab CI) — зеркалировать эти же проверки.

---

## Версионирование (SemVer)

- `0.x.y` — pre-release, breaking changes возможны в minor.
- `1.0.0` — первый стабильный релиз (после того, как все 4 методики реализованы).
- `1.x.0` — новая фича без breaking changes.
- `1.0.x` — багфиксы.

Тегирование:

```bash
git tag -a v0.2.0 -m "release: opt-in sync + docker"
git push origin v0.2.0
```

---

## Рекомендуемые алиасы

В `~/.gitconfig`:

```ini
[alias]
    st = status -sb
    co = checkout
    br = branch
    lg = log --oneline --graph --decorate --all -20
    last = log -1 HEAD
    unstage = reset HEAD --
    amend = commit --amend --no-edit
```

Использование: `git st`, `git lg`, `git co main`.
