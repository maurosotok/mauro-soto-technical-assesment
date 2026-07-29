# Repository Guide

## Assignment requirements

- Build a full-stack calculator as a take-home assessment within a strict four-hour limit.
- Use a React TypeScript frontend built with Vite.
- Use a Go backend, preferring the standard library and minimal dependencies.
- Keep the project as a minimal monorepo.
- The backend is the only source of arithmetic results. The frontend must never calculate, derive, or correct arithmetic results.
- Do not implement calculator functionality during the initial scaffold phase.
- Do not commit changes unless explicitly requested.

## Coding standards

- Keep implementations small, readable, and easy to review.
- Prefer Go's standard library; add a dependency only when its value clearly exceeds its cost.
- Use `gofmt` for Go source.
- Use strict TypeScript and functional React components.
- Keep API types explicit and validate all backend inputs.
- Return structured JSON errors with appropriate HTTP status codes.
- Keep arithmetic and validation rules in the backend; the frontend only collects input and renders API responses.
- Add focused tests alongside functionality, avoiding unnecessary abstraction.

## Verification commands

Run from the repository root unless noted:

```sh
npm install
npm run dev --workspace frontend
npm run build --workspace frontend
npm run typecheck --workspace frontend
go run ./backend
go test ./backend/...
```

For a production-like local check, start the backend and preview the built frontend:

```sh
go run ./backend
npm run preview --workspace frontend
```

## Arithmetic source-of-truth rule

The Go backend is the sole authority for every arithmetic result. Frontend code must not use JavaScript arithmetic to produce, precompute, validate, reconcile, or fall back to a calculator result. It may only submit an operation and operands, then display the backend response.
