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

## Prompt 4

> Read the repository instructions and inspect the current implementation. Add this complete prompt to AI_PROMPTS.md as Prompt 4.
>
> Run the frontend and backend together and complete the core integration.
>
> Verify all four operations through the browser, including decimals, negative results, division by zero, clear, backspace, keyboard input, a second calculation after a result, and the behavior when the backend is unavailable.
>
> Fix only concrete integration problems such as CORS configuration, API base URL handling, inconsistent error messages, loading behavior, focus behavior, or narrow mobile layout issues. Add example environment files where needed.
>
> Confirm through inspection that the frontend does not contain final arithmetic implementation and that the API contract is consistent across implementation, types, tests, and documentation.
>
> Re-run every backend formatting, static-analysis, test, and coverage command. Re-run every frontend lint, test, coverage, and production-build command.
>
> Do not add advanced operations, Docker, or broad refactors. Do not create a Git commit.
>
> Finish with a pass-or-fail result for every core requirement and list any unresolved evaluator risk.

## Prompt 5

> Read the original assignment and inspect the completed core application. Add this complete prompt to AI_PROMPTS.md as Prompt 5.
>
> Prepare the repository for evaluator handoff.
>
> Write a concise root README.md containing:
>
> Project overview and technology choices
> Architecture and directory structure
> Prerequisites
> Exact backend and frontend setup instructions
> How to run both applications
> Environment variables
> Successful and failing API examples
> Test and coverage commands
> Design decisions and assumptions
> Important edge cases
> Floating-point assumptions
> Tradeoffs and future improvements
>
> Generate fresh coverage results and create docs/COVERAGE.md with the exact commands, actual current percentages, covered areas, and any intentional gaps. Do not invent or estimate coverage numbers.
>
> Confirm AI_PROMPTS.md contains the exact prompts actually used and add a short statement that I reviewed and tested all generated changes.
>
> Review .gitignore, remove dead or generated files, check for secrets and machine-specific paths, and verify that the README instructions work for a clean clone.
>
> Run every command documented in the README. Do not create a Git commit. Report any documentation problem corrected and the final coverage results.

I reviewed and tested all generated changes.

## Prompt 6A

> Read the repository instructions and preserve all current behavior. Add this complete prompt to AI_PROMPTS.md as Prompt 6A.
>
> Add the smallest maintainable Docker setup that allows an evaluator to run the React frontend and Go backend together. Use production-oriented builds, correct service configuration, and no secrets.
>
> Add clear Docker instructions to the README. Build and run the complete stack locally. Verify the health endpoint and one successful browser calculation. Then rerun the existing non-Docker tests and builds.
>
> Do not change the application architecture or add unrelated tooling.
>
> If Docker cannot be successfully tested in this environment, remove the unverified configuration and report that Docker was intentionally omitted.
>
> Do not create a Git commit.
