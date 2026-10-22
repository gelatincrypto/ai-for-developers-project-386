# Project guide

## Current scaffold

- `Calendar.slnx`: .NET 10 solution.
- `src/Calendar.Api/Program.cs`: ASP.NET Core Minimal API; only `GET /api/health` returning `{"status":"ok"}`.
- `tests/Calendar.Api.Tests/HealthTests.cs`: xUnit smoke test using `WebApplicationFactory<Program>`; no separately running server needed.
- `frontend/src/App.tsx`: React/TypeScript health-status page; `frontend/src/main.tsx` configures Mantine.
- `frontend/vite.config.ts`: development-only `/api` proxy to `http://localhost:5005`.
- `.editorconfig` and `Directory.Build.props`: C# formatting and analyzer rules.
- `.github/workflows/ci.yml`: backend/frontend checks; `.github/workflows/release-please.yml`: repository-wide releases.

Booking is not implemented. Do not describe planned functionality as existing.

## Commands

Run from the repository root. Requires .NET 10 SDK, Node.js 22.20.0 and npm.

```sh
dotnet restore Calendar.slnx --configfile NuGet.Config
npm --prefix frontend ci
```

Start backend and frontend in separate terminals:

```sh
dotnet run --project src/Calendar.Api --launch-profile http
npm --prefix frontend run dev
```

Backend: `http://localhost:5005/api/health`. Frontend: `http://localhost:5173` (use the URL printed by Vite).

Checks, in order:

```sh
dotnet format Calendar.slnx --verify-no-changes --no-restore
dotnet build Calendar.slnx -c Release -warnaserror --no-restore
dotnet test Calendar.slnx -c Release --no-build --no-restore
npm --prefix frontend run lint
npm --prefix frontend run build
```

Apply C# formatting: `dotnet format Calendar.slnx --no-restore`.
Frontend lint uses Oxlint; `build` runs TypeScript checking (`tsc -b`) before Vite and writes `frontend/dist`.

## Repository constraints

- All agent-authored commits must use Conventional Commits: `feat:`, `fix:`, `test:`, `ci:`, `docs:` or `chore:`.
- Preserve `.github/workflows/hexlet-check.yml` and repository name `ai-for-developers-project-386`; do not delete or rename either.
- Restore NuGet packages only from public `https://api.nuget.org/v3/index.json`, using repository `NuGet.Config`. Do not add private feeds or change global/user NuGet configuration.
