# Календарь звонков


[![hexlet-check](https://github.com/gelatincrypto/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/gelatincrypto/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- C# / ASP.NET Core 10 Minimal API
- React / TypeScript / Vite / Mantine

## Установка

<!-- Опишите установку: клонирование, зависимости, переменные окружения -->

Для backend требуется .NET 10 SDK.
Для frontend — Node.js 22.20.0 и npm.

```bash
git clone https://github.com/gelatincrypto/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm --prefix frontend install
```

## Использование

<!-- Добавьте примеры запуска и запись asciinema — именно это смотрит работодатель -->

Из корня репозитория:

```bash
dotnet build Calendar.slnx
dotnet run --project src/Calendar.Api --launch-profile http
```

API доступен по адресу `http://localhost:5005`. Проверка работоспособности:

```bash
curl http://localhost:5005/api/health
```

Ожидаемый ответ: HTTP 200, `{"status":"ok"}`.

В другом терминале запустите frontend:

```bash
cd frontend
npm run dev
```

Откройте `http://localhost:5173` (точный адрес выводит Vite). На главной
странице (`/`) описан сервис, кнопка «Перейти к бронированию» ведёт на
`/booking`. Пока там заглушка: бронирование недоступно. На этой странице
показана доступность backend: запрос `/api/health` идёт через dev-proxy Vite
на `http://localhost:5005`; для проверки статуса backend должен быть запущен.

Проверка production-сборки из папки `frontend`:

```bash
npm run build
```

Результат находится в `frontend/dist`. Dev-proxy не входит в production-сборку;
при развёртывании нужно отдельно маршрутизировать `/api` на backend и направлять
запросы к SPA-маршрутам (например, `/booking`) на `index.html`.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## Тесты backend

Из корня репозитория:

```bash
dotnet test Calendar.slnx
```

В `tests/Calendar.Api.Tests` находится один smoke-тест xUnit: он запускает
API через `WebApplicationFactory<Program>` и проверяет, что `GET /api/health`
возвращает HTTP 200 и JSON `{"status":"ok"}`. Отдельно запускать backend
или frontend не нужно.

Фронтенд-тест маршрута с главной страницы на `/booking` запускается командой
`npm --prefix frontend test`. Для него backend не нужен.

Зависимости backend восстанавливаются только из публичного nuget.org:
репозиторный `NuGet.Config` исключает унаследованные источники пакетов.
Для обычного восстановления выполните:

```bash
dotnet restore Calendar.slnx
```

Глобальная и пользовательская конфигурации NuGet не изменяются.

## Форматирование и статический анализ

Из корня репозитория:

```bash
dotnet format Calendar.slnx --verify-no-changes --no-restore
dotnet build Calendar.slnx -c Release -warnaserror --no-restore
dotnet test Calendar.slnx -c Release --no-build --no-restore
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

Перед проверками восстановите зависимости (`dotnet restore Calendar.slnx`
и `npm --prefix frontend install`). Чтобы применить форматирование C#, выполните
`dotnet format Calendar.slnx --no-restore`.

Правила форматирования заданы в `.editorconfig`, встроенные анализаторы .NET
включены в `Directory.Build.props`. Сгенерированные C#-файлы исключены из
анализа по стандартным суффиксам. Frontend использует Oxlint и Vitest; команда `build`
сначала проверяет TypeScript (`tsc -b`), затем собирает приложение Vite.

## CI

Workflow `.github/workflows/ci.yml` запускается на каждый push во все ветки
и при открытии или обновлении pull request. Два независимых задания проверяют:

- Backend (.NET 10): restore только из nuget.org через `NuGet.Config`,
  форматирование, Release-сборку с предупреждениями как ошибками и smoke-тест.
- Frontend (Node.js 22): `npm ci`, Oxlint, Vitest и production-сборку;
  кеш npm привязан к `frontend/package-lock.json`.

Workflow имеет только право чтения содержимого репозитория. Существующие
workflow Хекслета не изменяются; публикация и развертывание не выполняются.

## Релизы

Отдельный workflow `.github/workflows/release-please.yml` запускает
[Release Please Action v4](https://github.com/googleapis/release-please-action)
после push в `main`. Стратегия `simple` ведет **одну версию всего репозитория**
в заголовке release PR и общем `CHANGELOG.md`; после merge release PR создаются
тег и GitHub Release. Отдельного `version.txt` сейчас нет; версии C#
и `frontend/package.json` отдельно не обновляются. Публикации пакетов нет.

1. В GitHub откройте **Settings → Actions → General → Workflow permissions**
   и включите **Allow GitHub Actions to create and approve pull requests**.
   Workflow использует штатный `GITHUB_TOKEN`, без дополнительных секретов/PAT;
   права `contents`, `issues`, `pull-requests: write` нужны для релизов, меток и PR.
2. Используйте Conventional Commits: `feat: ...` — новая возможность (minor),
   `fix: ...` — исправление (patch), `feat!: ...` — несовместимое изменение (major).
   `chore: ...`, `docs: ...`, `ci: ...` допустимы, но сами по себе обычно
   не создают релиз. При squash merge проверьте **итоговое сообщение коммита**.
3. После merge `feat:`/`fix:` в `main` workflow создаст или обновит release PR
   с версией и changelog. Проверьте его; после merge release PR следующий
   запуск создаст тег и GitHub Release.

**Проверка release PR:** события, созданные стандартным `GITHUB_TOKEN`, могут
не запустить CI автоматически; отсутствие проверок не означает успех.
До merge явно проверьте актуальный head PR в отдельном чистом checkout:
`git fetch origin pull/NUMBER/head`, затем `git switch --detach FETCH_HEAD`
и `git rev-parse HEAD`. Сверьте SHA с head PR и выполните все шаги
`.github/workflows/ci.yml` для backend и frontend (включая restore и `npm ci`);
зафиксируйте SHA и результаты в PR. При обновлении head повторите проверку.
Это локальная проверка, а не замена обязательным GitHub checks: если branch
protection требует их, не обходите правило — нужен отдельно настроенный
разрешенный запуск CI для этого head. PAT для этого workflow не вводится.

Подробнее: [Release Please и Conventional Commits](https://github.com/googleapis/release-please).

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
