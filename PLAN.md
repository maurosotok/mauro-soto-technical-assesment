# Implementation Plan

## Proposed architecture

- A small npm-workspaces monorepo with `frontend` and `backend` applications.
- The frontend is a Vite-powered React TypeScript single page that will collect operands and an operation, call the backend, and render its response.
- The backend is a Go `net/http` service. It owns request validation, arithmetic, error handling, and result serialization.
- During development, Vite proxies `/api` requests to the Go service. `VITE_API_BASE_URL` can point production builds at an independently hosted backend.

## API contract

Calculator endpoint:

`POST /api/v1/calculate`

Request:

```json
{
  "left": 12.5,
  "operator": "add",
  "right": 3
}
```

Success response (`200`):

```json
{
  "result": 15.5
}
```

Validation or arithmetic error (`400` or `422`):

```json
{
  "error": {
    "code": "unsupported_operation",
    "message": "operator must be one of: add, subtract, multiply, divide"
  }
}
```

Operational endpoint:

- `GET /api/health` returns `{"status":"ok"}`.

Runtime configuration:

- `PORT` defaults to `8080`.
- `ALLOWED_ORIGIN` defaults to `http://localhost:5173`.

Operands and results use Go `float64`. Requests with invalid or non-finite operands, division by zero, and calculations that produce a non-finite result are rejected with structured errors.

## Directory structure

```text
.
├── AGENTS.md
├── AI_PROMPTS.md
├── PLAN.md
├── .gitignore
├── go.work
├── package.json
├── backend/
│   ├── go.mod
│   ├── calculator.go
│   ├── calculator_test.go
│   ├── handler.go
│   ├── handler_test.go
│   ├── main.go
│   ├── server.go
│   └── server_test.go
└── frontend/
    ├── index.html
    ├── package.json
    ├── .env.example
    ├── eslint.config.js
    ├── vitest.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── App.test.tsx
        ├── api.ts
        ├── setupTests.ts
        ├── styles.css
        ├── main.tsx
        └── vite-env.d.ts
```

## Acceptance criteria

- The repository contains the requested documentation and preserves both prompts.
- The frontend starts with Vite, submits all four operations to the backend, and renders backend results and structured errors.
- The backend starts with only the Go standard library and serves health and versioned calculation endpoints.
- The backend is the only source of arithmetic results.
- Calculator service and HTTP error paths have focused table-driven tests.
- TypeScript strict checks and the frontend production build pass.
- Go formatting, static checks, tests, and coverage checks pass.
- Generated dependencies, build artifacts, environment files, and editor/OS noise are ignored.
- No Git commit is created for this implementation step.

## Risks

- Binary floating-point is compact and dependency-free but does not provide decimal financial semantics.
- Very large finite operands can overflow; the service explicitly rejects non-finite results.
- CORS allows one configured frontend origin and must be configured correctly outside local development.
- Time can be lost on styling or abstractions that do not improve the assessed behavior.

## Four-hour time budget

- 0:00–0:25 — inspect requirements, establish contract, and scaffold.
- 0:25–1:20 — implement and test backend calculation/validation behavior.
- 1:20–2:25 — implement frontend flow and API integration.
- 2:25–3:10 — add UI states, accessibility, and focused styling.
- 3:10–3:40 — integration and edge-case testing.
- 3:40–4:00 — clean build, documentation, and final manual review.