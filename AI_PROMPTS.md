# AI Prompt Log

## Prompt 1

> I am completing a full-stack calculator take-home assessment with a strict four-hour limit. Inspect the current repository before changing anything.
>
> Create a minimal monorepo with a React TypeScript frontend using Vite and a Go backend. Prefer Go’s standard library and keep dependencies minimal.
>
> Create AGENTS.md, PLAN.md, and AI_PROMPTS.md at the repository root. In AGENTS.md, capture the assignment requirements, coding standards, verification commands, and the rule that the backend is the only source of arithmetic results. In PLAN.md, define the proposed architecture, API contract, directory structure, acceptance criteria, risks, and time budget. Add this complete prompt to AI_PROMPTS.md as Prompt 1.
>
> Scaffold both applications and confirm each can start, but do not implement calculator functionality yet. Add only the configuration and ignore files needed for a clean repository.
>
> Do not create a Git commit. At the end, report every file changed, every command run, the result of each command, and anything I must verify manually.

## Prompt 2

> Read AGENTS.md and PLAN.md before making changes. Add this complete prompt to AI_PROMPTS.md as Prompt 2.
>
> Implement the core Go backend. Expose a health endpoint and one versioned calculation endpoint that accepts an operation and the required numeric operands.
>
> Support addition, subtraction, multiplication, and division. Return consistent JSON success and structured error responses with appropriate HTTP status codes.
>
> Validate malformed JSON, missing or invalid operands, unsupported operations, extra trailing input, incorrect HTTP methods, non-finite values or results, and division by zero.
>
> Separate pure calculation logic from HTTP handlers and server configuration. Make the server port and allowed frontend origin configurable through environment variables with safe local defaults.
>
> Add meaningful table-driven tests for the calculation service and HTTP handlers. Include successful decimal and negative-number cases and all important error paths.
>
> Run Go formatting, static checks, tests, and coverage. Fix failures before stopping. Do not modify the frontend unless the API contract requires a small documentation update.
>
> Do not create a Git commit. Report the API contract, changed files, test results, coverage, and design decisions I should understand for an interview.
## Prompt 3

> Read AGENTS.md, PLAN.md, and the implemented backend API before making changes. Add this complete prompt to AI_PROMPTS.md as Prompt 3.
>
> Implement a professional, responsive React TypeScript calculator. Include a readable display, digits, decimal input, addition, subtraction, multiplication, division, clear, backspace, and equals. Add basic keyboard support and accessible labels and focus behavior.
>
> The frontend must call the Go API when the user requests a result. Do not calculate final results locally, do not use eval, and do not duplicate backend arithmetic rules.
>
> Use a typed API client configured through VITE_API_BASE_URL. Keep API access, calculator state, and presentation reasonably separated without overengineering.
>
> Handle loading, API errors, network failures, division-by-zero feedback, decimal input, negative results, clearing, and starting a new calculation after a result.
>
> Add frontend tests with the API client mocked. Cover number entry, operation selection, the API request, result display, error display, clearing, and at least one keyboard interaction.
>
> Run linting, tests, coverage if configured, and a production build. Fix failures before stopping.
>
> Do not create a Git commit. Report changed files, command results, coverage, and remaining manual browser checks.