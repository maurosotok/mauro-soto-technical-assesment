# Implementation Plan

## Proposed architecture

- A small npm-workspaces monorepo with `frontend` and `backend` applications.
- The frontend is a Vite-powered React TypeScript single page that will collect operands and an operation, call the backend, and render its response.
- The backend is a Go `net/http` service. It will own request validation, arithmetic, error handling, and result serialization.
- During development, Vite will proxy `/api` requests to the Go service. This avoids frontend environment-specific URLs and local CORS configuration.

## API contract

Planned calculator endpoint (not part of the initial scaffold):

`POST /api/calculate`

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
    "code": "invalid_operation",
    "message": "operator must be one of: add, subtract, multiply, divide"
  }
}
```

Operational endpoint included in the scaffold:

- `GET /api/health` returns `{"status":"ok"}`.

The exact numeric representation and edge-case policy (division by zero, overflow, and precision) will be decided before implementing the calculator endpoint.

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
│   └── main.go
└── frontend/
    ├── index.html
    ├── go.work
├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        └── vite-env.d.ts
```

## Acceptance criteria

- The repository contains the requested documentation and preserves the original prompt.
- The frontend starts with Vite and renders a placeholder page.
- The backend starts with only the Go standard library and serves its health endpoint.
- No calculator UI, arithmetic endpoint, or arithmetic logic exists yet.
- TypeScript strict checks and the frontend production build pass.
- Go tests/build checks pass once a Go toolchain is available.
- Generated dependencies, build artifacts, environment files, and editor/OS noise are ignored.
- No Git commit is created.

## Risks

- The assessment's unstated calculator rules may affect the API's numeric representation and error behavior.
- Floating-point expectations may require a decimal strategy; decide this before implementation rather than changing the contract late.
- A missing local Go toolchain blocks runtime verification of the backend.
- Time can be lost on styling or abstractions that do not improve the assessed behavior.

## Four-hour time budget

- 0:00–0:25 — inspect requirements, establish contract, and scaffold.
- 0:25–1:20 — implement and test backend calculation/validation behavior.
- 1:20–2:25 — implement frontend flow and API integration.
- 2:25–3:10 — add UI states, accessibility, and focused styling.
- 3:10–3:40 — integration and edge-case testing.
- 3:40–4:00 — clean build, documentation, and final manual review.
