---
type: dev-constitution
version: 2
stack:
  languages:
    - TypeScript (strict mode, no `any`)
  frameworks:
    - Next.js 16 (App Router)
    - Prisma ORM
    - Temporal (workflow engine)
    - better-auth
    - shadcn/ui + Radix + Tailwind CSS
    - Zod
  databases:
    - PostgreSQL
  infrastructure:
    - Docker Compose (local development)
conventions:
  codeStyle:
    - "Strict TypeScript — strict: true, no any, no @ts-ignore"
    - "ESLint with recommended + Next.js rules"
    - "Prettier for formatting"
    - "Named exports preferred over default exports"
    - "Absolute imports via @/ path alias"
    - "Server Components by default; 'use client' only when required"
    - "Colocate code with its feature; shared code in src/lib/"
    - "Zod schemas are the single source of truth for validation and types"
    - "No silent failures — every error must be logged and surfaced"
  testing:
    - Test-Driven Development (TDD) is mandatory
    - Write tests BEFORE implementation
    - No regressions allowed — all existing tests must pass before merging
    - Vitest for unit and integration tests
    - Playwright for end-to-end tests
    - Chrome DevTools MCP for UI/UX testing and visual verification
    - Minimum 80% code coverage; critical paths require 100%
    - Tests must validate against spec acceptance criteria
    - Every bug fix must include a regression test
    - Tests must verify that errors are logged, never swallowed
  documentation:
    - Code should be self-documenting through clear naming
    - JSDoc only for public API functions and complex logic
    - Specs are the source of truth — not comments
    - CHANGELOG maintained for user-facing changes
agentRules:
  - "SPEC IS TRUTH: Never deviate from the specification. If the spec is unclear, stop and clarify — do not assume."
  - "TDD MANDATORY: Write failing tests first, then implement to make them pass. Never write implementation before tests."
  - "ZERO REGRESSIONS: Run the full test suite before considering any task complete. A single failing test blocks the task."
  - "VALIDATE UI/UX: Use Chrome DevTools MCP to verify visual output, accessibility, and responsive behavior after UI changes."
  - "TYPE SAFETY: Never use `any`, `@ts-ignore`, or `as unknown as`. If the type system resists, the design is wrong."
  - "PRISMA ONLY: All database access goes through Prisma. No raw SQL outside of migrations."
  - "ZOD VALIDATES: All external input (forms, API requests, env vars) must be validated with Zod schemas."
  - "SERVER FIRST: Default to Server Components and Server Actions. Only use client components when browser APIs or interactivity require it."
  - "NO DEAD CODE: Do not leave commented-out code, unused imports, or placeholder implementations."
  - "ATOMIC CHANGES: Each task produces a single, focused, reviewable change. Do not bundle unrelated modifications."
  - "NO SILENT FAILURES: Every catch block must log the error with context. Empty catch blocks and swallowed errors are forbidden."
  - "LOG EVERYTHING MEANINGFUL: All mutations, auth events, and workflow transitions must produce structured log entries."
  - "AUDIT TRAIL: Security-sensitive operations must produce immutable audit records with actor, action, target, and timestamp."
updatedAt: "2026-03-14T22:25:00Z"
---

# Development Constitution — Primitive Platform

## 1. Core Development Philosophy

Four non-negotiable principles govern all development on the Primitive platform:

1. **Specifications are the truth.** The spec defines what gets built. If the code doesn't match the spec, the code is wrong. If the spec is ambiguous, development stops until the ambiguity is resolved — never assumed away.

2. **Test-Driven Development is mandatory.** Every feature, every fix, every change begins with a failing test that captures the expected behavior. Implementation exists solely to make tests pass. This is not optional.

3. **Zero regressions.** No change may cause an existing test to fail. The full test suite must pass before any task is considered complete. A regression is treated as a blocking defect.

4. **No silent failures.** Every error must be caught, logged with context, and surfaced appropriately. An error that disappears silently is worse than a crash — it hides system corruption and makes debugging impossible.

## 2. Language & Type Safety

### TypeScript — Strict Mode

All code is written in TypeScript with `strict: true` enabled. The type system is a safety net, not an obstacle.

**Hard rules:**
- No `any` type — ever. Use `unknown` and narrow with type guards when dealing with untyped external data.
- No `@ts-ignore` or `@ts-expect-error` — if the types don't work, fix the types.
- No unsafe type assertions (`as unknown as X`) — if a cast is needed, the design is wrong.
- All function parameters and return types must be inferable or explicitly typed.
- Zod schemas generate TypeScript types via `z.infer<>` — do not manually duplicate types that Zod can derive.

### Code Style

- **ESLint** with `next/core-web-vitals` and `typescript-eslint/recommended-type-checked` rules
- **Prettier** for consistent formatting (no debates about style)
- **Named exports** preferred — default exports only for Next.js page/layout conventions
- **Absolute imports** via `@/` path alias mapped to `src/`
- **No barrel files** (`index.ts` re-exports) — import directly from the source module

## 3. Testing Strategy

### TDD Workflow

The development cycle for every feature follows Red-Green-Refactor:

1. **Red**: Write a failing test that captures the expected behavior from the spec
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the implementation while keeping tests green

### Test Layers

| Layer | Tool | Scope | When |
|---|---|---|---|
| **Unit** | Vitest | Individual functions, hooks, utilities, Zod schemas | Every function with logic |
| **Integration** | Vitest + Prisma (test DB) | Server Actions, API routes, database operations | Every data mutation path |
| **E2E** | Playwright | Full user flows through the browser | Every user-facing feature |
| **UI/UX Verification** | Chrome DevTools MCP | Visual fidelity, accessibility, responsiveness, performance | After every UI change |

### Test Rules

- **No mocking of the database.** Integration tests run against a real PostgreSQL instance (Docker). Mock/prod divergence has caused real incidents — never again.
- **Every bug fix includes a regression test.** The test must fail against the buggy code and pass against the fix.
- **Tests validate spec acceptance criteria.** Each acceptance criterion from the spec maps to at least one test.
- **Coverage floor:** 80% overall, 100% for authentication flows, payment logic, and data mutations.
- **Tests must be deterministic.** No flaky tests. No time-dependent assertions without controlled clocks. No network calls without explicit mocking of the external boundary.
- **Tests must verify error handling.** Confirm that errors are logged with correct severity and context — never silently swallowed.

### UI/UX Testing with Chrome DevTools

After any UI change, use Chrome DevTools MCP to verify:

- **Visual correctness**: Screenshots match the expected design
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, color contrast
- **Responsiveness**: Layout integrity at mobile, tablet, and desktop breakpoints
- **Performance**: No layout shifts, reasonable paint times, no console errors
- **Dark mode**: All components render correctly in the dark theme (primary theme)

## 4. Server-Side First

### Server Components

Server Components are the default. Every component is a Server Component unless it explicitly needs:

- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, `navigator`)
- React hooks (`useState`, `useEffect`, `useRef`)
- Third-party client-only libraries

When a client component is needed, keep it as small as possible. Extract the interactive part into a thin client component and keep the data-fetching and rendering in Server Components.

### Server Actions

Server Actions are the primary mutation mechanism:

- Defined in `src/server/actions/` organized by domain
- Validated with Zod schemas at the entry point
- Return typed results (not raw data) using a consistent `{ success, data?, error? }` pattern
- Handle errors explicitly — never let exceptions bubble to the client unhandled
- Log every mutation with structured context (actor, action, target, result)

### Route Handlers

Route Handlers (`route.ts`) are reserved for:

- Webhook endpoints from external services
- OAuth callbacks
- Cases where Server Actions are technically insufficient

Do not create REST API endpoints for client-server communication — use Server Actions instead.

## 5. Database Conventions

### Prisma

- `schema.prisma` is the source of truth for the data model
- All schema changes require a migration (`prisma migrate dev`)
- Use a **singleton Prisma client** (`src/lib/db.ts`) — never instantiate multiple clients
- Use **interactive transactions** for multi-step atomic operations
- **No raw SQL** outside of migration files — Prisma's query builder handles all access

### Naming

- Models: `PascalCase` singular (`User`, `Project`, `Workflow`)
- Fields: `camelCase` (`createdAt`, `userId`, `isActive`)
- Relations: Named explicitly to avoid ambiguity
- Enums: `SCREAMING_SNAKE_CASE` values

### Data Integrity

- Foreign keys and cascading deletes defined at the schema level
- Soft deletes (`deletedAt` timestamp) for user-facing entities
- `createdAt` and `updatedAt` timestamps on every model
- Unique constraints enforced at the database level, not just application level

## 6. Validation — Zod

Zod is the single validation library. No alternatives (Yup, Joi, manual checks).

- **Input validation**: Every Server Action and Route Handler validates input with a Zod schema before processing
- **Form validation**: Client-side forms use Zod schemas for instant feedback
- **Env validation**: Environment variables are validated at startup with a Zod schema — the app refuses to start if env is invalid
- **Type derivation**: Use `z.infer<typeof schema>` to derive TypeScript types — never manually duplicate a type that exists as a Zod schema

Schemas live in `src/lib/validators/` organized by domain.

## 7. Error Handling — No Silent Failures

Silent failures are **forbidden**. Every error path must be explicit, logged, and surfaced.

### Rules

- **No empty catch blocks.** Every `catch` must log the error with structured context and either re-throw, return a typed error result, or take explicit recovery action.
- **No `catch (e) {}`** — this pattern is banned. Linting must flag it.
- **No swallowed Promise rejections.** Every `.catch()` and `try/catch` around async operations must handle the error meaningfully.
- **Fail loudly in development.** In local/dev environments, unhandled errors should crash the process to surface problems immediately.
- **Fail gracefully in production.** In production, errors are caught at boundaries, logged with full context, and the user receives a clear error state — never a blank screen or hanging spinner.

### Structured Error Results

Server Actions and internal functions return typed results:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } }
```

Every error result includes:
- `code`: A machine-readable error identifier (e.g., `AUTH_INVALID_TOKEN`, `VALIDATION_FAILED`)
- `message`: A human-readable description
- `details`: Optional context for debugging (stripped in production client responses)

### Error Boundaries

- Every route segment has an `error.tsx` boundary that catches rendering errors
- Error boundaries log the error, display a user-friendly message, and offer a retry action
- Global `global-error.tsx` catches catastrophic failures at the root level

## 8. Logging

All systems must produce structured logs sufficient for debugging, monitoring, and auditing.

### Structured Logging Format

All log entries must be structured JSON with these required fields:

```typescript
{
  timestamp: string;    // ISO 8601
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;      // Human-readable description
  service: string;      // "web" | "worker" | "temporal"
  context: {
    requestId?: string;  // Correlation ID for request tracing
    userId?: string;     // Authenticated user (if applicable)
    action?: string;     // What was being performed
    [key: string]: unknown;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;       // Included in dev, stripped in production
  };
}
```

### What Must Be Logged

| Event | Level | Required Context |
|---|---|---|
| Server Action invoked | `info` | action name, userId, input summary |
| Server Action failed | `error` | action name, userId, error details, input |
| Authentication success | `info` | userId, method, IP |
| Authentication failure | `warn` | attempted identity, method, IP, reason |
| Authorization denied | `warn` | userId, resource, required permission |
| Database mutation | `info` | model, operation (create/update/delete), recordId |
| Workflow started | `info` | workflowId, workflowType, input summary |
| Workflow failed | `error` | workflowId, workflowType, error, retry count |
| External service call | `info` | service, endpoint, response status, latency |
| External service failure | `error` | service, endpoint, error, retry policy |
| Environment startup | `info` | service, version, configuration summary |
| Unhandled exception | `fatal` | full error with stack trace |

### What Must NOT Be Logged

- Passwords, tokens, API keys, or secrets — ever
- Full request/response bodies containing PII
- Credit card numbers or financial credentials
- Session tokens or auth cookies

### Log Levels

- **debug**: Detailed diagnostic info (disabled in production)
- **info**: Normal operational events (mutations, auth, workflows)
- **warn**: Recoverable issues that may need attention (auth failures, deprecation usage)
- **error**: Failures requiring investigation (action failures, external service errors)
- **fatal**: Unrecoverable failures requiring immediate attention (process crashes, data corruption)

## 9. Integrity, Security & Auditability

### Audit Trail

Security-sensitive operations must produce **immutable audit records**. An audit record is a log entry that cannot be modified after creation and serves as legal/compliance evidence.

Auditable operations include:

| Operation | Audit Fields |
|---|---|
| User created / deleted | actor, target userId, timestamp |
| Role or permission changed | actor, target userId, old role, new role, timestamp |
| Login / logout | userId, method, IP, user agent, timestamp |
| Failed login attempt | attempted identity, IP, user agent, reason, timestamp |
| Data export / download | actor, data scope, timestamp |
| API key created / revoked | actor, key identifier (not the key itself), timestamp |
| Configuration changed | actor, setting, old value, new value, timestamp |
| Workflow manual override | actor, workflowId, action, reason, timestamp |

### Audit Record Structure

```typescript
{
  id: string;           // Unique audit record ID
  timestamp: string;    // ISO 8601, server time
  actor: {
    id: string;         // User or system ID
    type: "user" | "system" | "agent";
    ip?: string;
  };
  action: string;       // Machine-readable action code
  target: {
    type: string;       // Entity type (user, project, workflow)
    id: string;         // Entity ID
  };
  metadata: Record<string, unknown>;  // Action-specific details
  result: "success" | "failure" | "denied";
}
```

### Audit Storage Rules

- Audit records are **append-only** — no updates, no deletes
- Stored in a dedicated `AuditLog` Prisma model with no cascade deletes
- Retention period: minimum 1 year (configurable per compliance requirements)
- Queryable by actor, action, target, time range
- Audit records must never contain secrets, passwords, or raw tokens

### Data Integrity Rules

- **Referential integrity** enforced at the database level via foreign keys — never rely on application-level checks alone
- **Optimistic locking** for concurrent updates on critical entities (use `version` field + Prisma's `update` with `where` on version)
- **Checksums** for any data exports or transfers between systems
- **Soft deletes** for user-facing entities — hard deletes only for system-internal temporary data
- **Immutable fields**: `id`, `createdAt`, and audit trail fields must never be modified after creation

### Security in Code

- **Input validation at every boundary**: All data entering the system (HTTP requests, webhook payloads, queue messages) is validated with Zod before processing
- **Output encoding**: All user-supplied content rendered in HTML must be escaped (React handles this by default — never use `dangerouslySetInnerHTML` without sanitization)
- **CSRF protection**: Server Actions include built-in CSRF protection via Next.js; Route Handlers must implement explicit CSRF checks
- **Rate limiting**: Authentication endpoints and public APIs must be rate-limited
- **Secrets management**: All secrets via environment variables, validated at startup, never logged

## 10. Dependency Management

- Pin exact versions in `package.json` (no `^` or `~`) for reproducible builds
- Audit dependencies weekly for known vulnerabilities
- Prefer dependencies with strong TypeScript support
- Minimize dependency count — if a utility is <20 lines, write it inline rather than importing a package
- Lock file (`package-lock.json` or `pnpm-lock.yaml`) is always committed

## 11. Git & Version Control

- **Branch naming**: `feat/spec-id-short-description`, `fix/spec-id-short-description`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`)
- **PRs**: One PR per spec task. PR description references the spec and lists acceptance criteria verified.
- **No force pushes** to `main` or shared branches
- **All tests must pass** before merge — enforced by CI

## 12. Agent Rules Summary

AI agents working on this codebase must follow these rules without exception:

1. **Spec is truth** — never deviate, never assume
2. **TDD mandatory** — tests before implementation
3. **Zero regressions** — full suite must pass
4. **Validate UI/UX** — Chrome DevTools MCP after every UI change
5. **Type safety** — no `any`, no `@ts-ignore`, no unsafe casts
6. **Prisma only** — no raw SQL outside migrations
7. **Zod validates** — all external input validated
8. **Server first** — Server Components and Actions by default
9. **No dead code** — no commented-out code, no unused imports
10. **Atomic changes** — one focused change per task
11. **No silent failures** — every catch block must log with context; empty catch blocks are forbidden
12. **Log everything meaningful** — all mutations, auth events, and workflow transitions produce structured log entries
13. **Audit trail** — security-sensitive operations produce immutable audit records with actor, action, target, and timestamp

Violation of any rule blocks the task from completion.
