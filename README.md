# Full-Stack Calculator

A small take-home calculator built as a minimal monorepo. The UI uses React 18, strict TypeScript, and Vite; the API uses Go's standard `net/http` library with no third-party backend dependencies. The Go service is the sole source of arithmetic results—the browser only collects operands and an operation, submits them, and displays the response.

## Architecture

```text
.
├── backend/             # Go calculator, HTTP handlers, configuration, and tests
├── frontend/            # React UI, typed API client, styles, and Vitest tests
├── docs/COVERAGE.md     # Current measured coverage and intentional gaps
├── compose.yaml         # Production frontend/backend stack
├── .dockerignore        # Minimal container build context
├── AGENTS.md            # Assignment and repository rules
├── AI_PROMPTS.md        # Prompts used to produce and verify the project
├── PLAN.md              # Architecture and implementation plan
├── go.work              # Go workspace
└── package.json         # npm workspace commands
```

`POST /api/v1/calculate` is the only calculation endpoint. During development, Vite proxies `/api` to `http://localhost:8080`; deployed builds can instead use `VITE_API_BASE_URL`. The backend validates JSON, operands, operations, finite values, and arithmetic errors before returning structured JSON.

## Prerequisites

- Go 1.22 or newer.
- Node.js 20.19 or newer and npm. Verification used Node 20.20.1 and npm 10.8.2.
- `curl` for the API examples.
- Docker Engine with Docker Compose for the optional container workflow.

## Setup and run

From the repository root, install the frontend dependencies:

```sh
npm install
```

The Go backend uses only the standard library and needs no separate dependency-install command.

Start the backend in one terminal:

```sh
go run ./backend
```

Start the frontend in a second terminal:

```sh
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:8080/api/health`.

## Docker

Docker Desktop (or another Docker Engine with Compose) can build and run the production stack with one command from the repository root:

```sh
docker compose up --build -d
```

Open `http://localhost:8081`. Nginx serves the compiled React assets and proxies `/api` to the internal Go service; the backend is not published on the host.

Check container state and the proxied health endpoint:

```sh
docker compose ps
curl http://localhost:8081/api/health
```

Stop and remove the stack:

```sh
docker compose down
```

No secrets or local environment files are copied into the images. Compose supplies only the backend port and allowed browser origin.

## Environment variables

| Variable | Application | Default | Purpose |
|---|---|---|---|
| `PORT` | Backend | `8080` | HTTP listening port. |
| `ALLOWED_ORIGIN` | Backend | `http://localhost:5173` | Exact browser origin allowed by CORS. |
| `VITE_API_BASE_URL` | Frontend | Empty | Backend origin for independently hosted builds; empty uses same-origin `/api` and the Vite development proxy. |

Reference values are in `backend/.env.example` and `frontend/.env.example`. Go does not load `.env` files automatically; export backend variables in the shell or process environment. Vite loads `frontend/.env` when present. Local `.env` files are ignored.

## API examples

Successful decimal addition:

```sh
curl -i -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d '{"left":1.25,"operator":"add","right":2.5}'
```

The response is HTTP `200` with `{"result":3.75}`.

Exponentiation is binary:

```sh
curl -i -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d '{"left":2,"operator":"power","right":3}'
```

Square root is unary, so `right` must be omitted:

```sh
curl -i -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d '{"left":81,"operator":"square_root"}'
```

Failing division by zero:

```sh
curl -i -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d '{"left":8,"operator":"divide","right":0}'
```

The response is HTTP `422` with `{"error":{"code":"division_by_zero","message":"right operand must not be zero when dividing"}}`.

A negative square root also returns HTTP `422` with code `negative_square_root`:

```sh
curl -i -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d '{"left":-1,"operator":"square_root"}'
```

Supported operators are `add`, `subtract`, `multiply`, `divide`, `power`, and `square_root`. `GET /api/health` returns `{"status":"ok"}`.

## Verification and coverage

Run these from the repository root:

```sh
gofmt -l backend
go vet ./backend/...
go test ./backend/...
go test -cover ./backend/...
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

A successful `gofmt -l backend` prints nothing. Current measured coverage and scope are documented in [docs/COVERAGE.md](docs/COVERAGE.md).

## Design decisions and assumptions

- Arithmetic and arithmetic validation live only in Go. Frontend `Number` conversion serializes entered operands; it does not calculate or repair results.
- A single versioned endpoint keeps the contract explicit and small.
- Go's standard library avoids backend dependency and framework overhead.
- Structured errors separate stable machine codes from user-facing messages.
- The frontend disables duplicate evaluation while a request is pending and preserves input when the service fails.
- CORS permits one configured exact origin; the local Vite proxy avoids CORS during normal development.

## Edge cases

The backend rejects malformed or trailing JSON, unknown fields, missing or invalid operands, unsupported operations, incorrect methods, non-finite operands/results, oversized bodies, and division by positive or negative zero, negative square roots, extra unary operands, and non-real or overflowing power results. The UI supports decimals, negative results, keyboard entry, clear, backspace, a new calculation after a result, loading feedback, backend errors, and narrow mobile layouts.

## Floating-point assumptions

Operands and results are IEEE-754 `float64` values. This is appropriate for a general calculator assessment but can display familiar binary floating-point effects such as `0.1 + 0.2`. Non-finite input and overflow results are rejected. The application does not provide financial decimal semantics, arbitrary precision, rounding modes, or locale-specific number parsing.

## Tradeoffs and future improvements

The project favors reviewability and the four-hour scope over deployment infrastructure and advanced features. Given more time, useful improvements would include end-to-end browser tests in CI, configurable multi-origin CORS, request logging/observability, decimal or arbitrary-precision modes for specialized domains, and production TLS/orchestration configuration. Percentage and frontend arithmetic remain outside the assignment.