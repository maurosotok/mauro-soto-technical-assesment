# Implementation Plan

## Proposed architecture

- A small npm-workspaces monorepo with `frontend` and `backend` applications.
- The frontend is a responsive Vite-powered React TypeScript calculator with a typed API client and focused component state.
- The backend is a Go `net/http` service. It owns request validation, arithmetic, error handling, and result serialization.
- During development, Vite proxies `/api` requests to the Go service. `VITE_API_BASE_URL` can point production builds at an independently hosted backend.

## API contract

Calculator endpoint:

`POST /api/v1/calculate`

Binary request:

```json
{
  "left": 12.5,
  "operator": "add",
  "right": 3
}
```

Unary square-root request (`right` must be omitted):

```json
{
  "left": 81,
  "operator": "square_root"
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
    "message": "operator must be one of: add, subtract, multiply, divide, power, square_root"
  }
}
```

Operational endpoint:

- `GET /api/health` returns `{"status":"ok"}`.

Runtime configuration:

- `PORT` defaults to `8080`.
- `ALLOWED_ORIGIN` defaults to `http://localhost:5173`.
- `VITE_API_BASE_URL` configures the frontend API origin; an empty value uses the Vite `/api` development proxy.

Operands and results use Go `float64`. `power` is binary; `square_root` is unary and rejects a supplied `right` operand. Requests with invalid or non-finite operands, division by zero, negative square roots, and calculations that produce a non-finite result are rejected with structured errors.

## Directory structure

```text
.
├── AGENTS.md
├── AI_PROMPTS.md
├── PLAN.md
├── README.md
├── docs/COVERAGE.md
├── go.work
├── package.json
├── backend/
│   ├── .env.example
│   ├── calculator.go
│   ├── calculator_test.go
│   ├── handler.go
│   ├── handler_test.go
│   ├── main.go
│   ├── server.go
│   └── server_test.go
└── frontend/
    ├── .env.example
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── vitest.config.ts
    └── src/
        ├── App.test.tsx
        ├── App.tsx
        ├── api.ts
        ├── main.tsx
        ├── setupTests.ts
        ├── styles.css
        └── vite-env.d.ts
```
## Acceptance criteria

- The repository contains the requested handoff documentation and preserves the exact prompts used.
- The frontend starts with Vite, submits all six operations to the backend, and renders backend results and structured errors.
- The backend starts with only the Go standard library and serves health and versioned calculation endpoints.
- The backend is the only source of arithmetic results.
- Calculator service and HTTP error paths have focused table-driven tests.
- Frontend linting, behavior tests, coverage, strict TypeScript checks, and the production build pass.
- Go formatting, static checks, tests, and coverage checks pass.
- Generated dependencies, build artifacts, environment files, and editor/OS noise are ignored.
- No Git commit is created for this implementation step.

## Risks

- Binary floating-point is compact and dependency-free but does not provide decimal financial semantics.
- Very large finite operands can overflow; the service explicitly rejects non-finite results.
- CORS and `VITE_API_BASE_URL` must target the deployed frontend and backend origins outside local development.
- Time can be lost on styling or abstractions that do not improve the assessed behavior.

## Four-hour time budget

- 0:00–0:25 — inspect requirements, establish contract, and scaffold.
- 0:25–1:20 — implement and test backend calculation/validation behavior.
- 1:20–2:25 — implement frontend flow and API integration.
- 2:25–3:10 — add UI states, accessibility, and focused styling.
- 3:10–3:40 — integration and edge-case testing.
- 3:40–4:00 — clean build, documentation, and final manual review.
