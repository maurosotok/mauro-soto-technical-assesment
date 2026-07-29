# Coverage Report

Fresh coverage was generated on July 28, 2026 from the repository root. Percentages below are copied from the command output; they are not estimates.

## Backend

Command:

```sh
go test -cover ./backend/...
```

Result:

```text
ok  calculator/backend  coverage: 93.9% of statements
```

The backend tests cover all four operations, decimal and negative operands, non-finite operands and results, division by positive and negative zero, unsupported operations, configuration defaults and overrides, server construction, health and calculation methods, successful HTTP responses, structured request-validation failures, unexpected service failures, and allowed/disallowed CORS behavior.

Intentional gaps are process-level behavior in `main` (the blocking server lifecycle and fatal listen failure) and low-value I/O failure branches such as an unsuccessful JSON response write. Those paths are better suited to process or fault-injection tests than this focused assessment suite.

## Frontend

Command:

```sh
npm run test:coverage
```

Result:

| Metric | Covered | Percentage |
|---|---:|---:|
| Statements | 101 / 123 | 82.11% |
| Branches | 63 / 83 | 75.9% |
| Functions | 24 / 28 | 85.71% |
| Lines | 92 / 106 | 86.79% |

Per-file results:

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/App.tsx` | 82.4% | 73.13% | 84.61% | 88.04% |
| `src/api.ts` | 80% | 87.5% | 100% | 78.57% |

The frontend tests cover submission and rendering for every operation, decimals, a negative result, the backend division-by-zero message, clear, backspace, keyboard input, a second calculation using a backend result, an unavailable backend, loading feedback, and duplicate-submission prevention.

Intentional gaps include minor alternate input-state branches (such as repeated decimal/result-reset combinations), the defensive unknown-error fallback, malformed successful API responses, and unstructured non-5xx error responses. Arithmetic correctness is deliberately not implemented or unit-tested in the frontend because the Go backend is the required source of truth.