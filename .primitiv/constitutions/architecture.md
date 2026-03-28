---
type: arch-constitution
version: 1
patterns:
  style: "Monolithic modular Next.js application with workflow orchestration"
  communication: "Server Actions + tRPC-like patterns for client-server; Temporal for async workflows and orchestration; REST APIs for external integrations"
  dataFlow: "Client → Next.js Server Components/Actions → Prisma ORM → PostgreSQL; Long-running tasks → Temporal Workers → Prisma → PostgreSQL"
boundaries:
  - name: "Web Application"
    description: "Next.js 16 application serving the UI, API routes, and server-side logic"
    owns:
      - "Pages and layouts (App Router)"
      - "Server Components and Server Actions"
      - "API routes"
      - "Authentication flows (better-auth)"
      - "Client-side state and interactions"
  - name: "Data Layer"
    description: "Prisma ORM managing all database access to PostgreSQL"
    owns:
      - "Database schema and migrations"
      - "Data models and relations"
      - "Query logic and transactions"
      - "Seed scripts"
  - name: "Workflow Engine"
    description: "Temporal server orchestrating async, long-running, and scheduled workflows"
    owns:
      - "Workflow definitions"
      - "Activity implementations"
      - "Worker processes"
      - "Retry policies and timeouts"
      - "Scheduled and cron workflows"
  - name: "Authentication Boundary"
    description: "better-auth handling identity, sessions, and access control"
    owns:
      - "User registration and login"
      - "Session management"
      - "OAuth providers (if any)"
      - "Role-based access control"
      - "API key management"
  - name: "UI Component System"
    description: "shadcn/ui + Radix primitives + Tailwind CSS design system"
    owns:
      - "Reusable UI components"
      - "Theme configuration (dark mode)"
      - "Typography (Lato font)"
      - "Design tokens and CSS variables"
  - name: "Validation Layer"
    description: "Zod schemas used across client and server for type-safe validation"
    owns:
      - "Request/response validation schemas"
      - "Form validation schemas"
      - "Environment variable validation"
      - "Shared type definitions derived from schemas"
  - name: "Local Infrastructure"
    description: "Docker Compose managing local development services"
    owns:
      - "PostgreSQL container"
      - "Temporal server + UI containers"
      - "Network configuration"
      - "Volume persistence"
adrs: []
updatedAt: "2026-03-14T22:15:00Z"
---

# Architecture Constitution — Primitive Platform

## 1. Architecture Overview

The Primitive platform follows a **modular monolith** architecture built on Next.js 16 with the App Router. The application is structured as a single deployable unit with clear internal boundaries between the web layer, data layer, workflow engine, and authentication system.

This approach prioritizes simplicity and developer velocity — aligned with Primitive's core principle that simple architectures are easier to maintain — while preserving the ability to extract services later if scale demands it.

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack web application |
| **ORM** | Prisma | Type-safe database access and migrations |
| **Database** | PostgreSQL | Primary relational data store |
| **Validation** | Zod | Runtime type validation across client and server |
| **Workflows** | Temporal | Async job orchestration, retries, scheduling |
| **UI** | shadcn/ui + Radix + Tailwind CSS | Component library and styling |
| **Auth** | better-auth | Authentication and session management |
| **Local Dev** | Docker Compose | PostgreSQL + Temporal for local development |

## 3. Application Structure

### Next.js 16 — App Router

The application uses the Next.js App Router exclusively. Pages are organized using file-system routing with layouts, loading states, and error boundaries.

- **Server Components** are the default rendering strategy. Use client components only when interactivity is required.
- **Server Actions** handle mutations and form submissions. They provide type-safe server-side logic without dedicated API routes.
- **Route Handlers** (`route.ts`) are used only for webhook endpoints, external API integrations, or cases where Server Actions are insufficient.
- **Middleware** handles authentication checks, redirects, and request-level concerns.

### Directory Convention

```
src/
  app/                    # App Router pages and layouts
    (auth)/               # Auth-related routes (login, register)
    (dashboard)/          # Authenticated dashboard routes
    api/                  # Route handlers (webhooks, external APIs)
    layout.tsx            # Root layout (fonts, providers, theme)
  components/
    ui/                   # shadcn/ui components
    [feature]/            # Feature-specific components
  lib/
    auth.ts               # better-auth configuration
    db.ts                 # Prisma client singleton
    validators/           # Zod schemas
  server/
    actions/              # Server Actions organized by domain
  workflows/
    activities/           # Temporal activity implementations
    workflows/            # Temporal workflow definitions
    worker.ts             # Temporal worker entry point
prisma/
  schema.prisma           # Database schema
  migrations/             # Prisma migrations
  seed.ts                 # Database seeding
docker-compose.yml        # Local dev infrastructure
```

## 4. Data Layer — Prisma + PostgreSQL

Prisma is the sole interface to PostgreSQL. Direct SQL queries are prohibited except in migrations.

- **Schema-first**: The `schema.prisma` file is the source of truth for the data model.
- **Migrations**: All schema changes go through `prisma migrate dev` in development and `prisma migrate deploy` in production.
- **Client singleton**: A single Prisma client instance is shared across the application to prevent connection pool exhaustion.
- **Transactions**: Use Prisma interactive transactions for operations requiring atomicity.

## 5. Validation — Zod

Zod schemas are the single source of truth for runtime validation. They are used:

- In **Server Actions** to validate incoming data before processing
- In **forms** for client-side validation (integrated with React Hook Form or similar)
- For **environment variables** validation at startup
- To derive **TypeScript types** via `z.infer<>` — avoid duplicating types manually

Schemas live in `src/lib/validators/` organized by domain. Shared schemas are co-located with the domain they validate.

## 6. Workflow Engine — Temporal

Temporal handles all asynchronous, long-running, or scheduled work. It provides durable execution with automatic retries and timeout handling.

### When to use Temporal
- Operations that take more than a few seconds
- Multi-step processes requiring reliability (e.g., onboarding flows, data processing pipelines)
- Scheduled/recurring tasks (cron-like jobs)
- Operations requiring retry logic with backoff

### When NOT to use Temporal
- Simple CRUD operations
- Synchronous request/response flows
- Quick background tasks that can tolerate failure

### Architecture
- **Workflows** define the orchestration logic (deterministic, no side effects)
- **Activities** perform the actual work (API calls, database writes, external services)
- **Workers** run as a separate process alongside the Next.js application
- The Temporal server runs locally via Docker Compose and is a managed service in production

## 7. Authentication — better-auth

better-auth manages all authentication and session concerns.

- Configured in `src/lib/auth.ts` as the central auth configuration
- Session tokens are managed server-side
- Middleware enforces authentication on protected routes
- Role-based access control (RBAC) is implemented through better-auth's built-in mechanisms
- Credentials are never stored in plaintext (aligned with security principles)

## 8. UI System — shadcn/ui + Radix + Tailwind CSS

### Component Architecture
- **shadcn/ui** provides the base component library — components are copied into the project and owned by the codebase
- **Radix primitives** provide accessible, unstyled foundations for complex interactive components
- **Tailwind CSS** handles all styling with utility classes

### Theme
- **Dark mode** is the default and primary theme, implemented via Tailwind's `dark:` variant with class-based toggling
- **Font**: Lato loaded via `next/font/google` in the root layout
- **Design tokens**: Colors, spacing, and radii are defined as CSS variables in `globals.css` and referenced via Tailwind config

### Rules
- No inline styles — use Tailwind classes exclusively
- No CSS modules — Tailwind handles all styling concerns
- Component variants are managed via `cva` (class-variance-authority)
- All interactive components must be keyboard-accessible (Radix ensures this by default)

## 9. Local Development — Docker Compose

Docker Compose provides the local development infrastructure:

```yaml
services:
  postgres:       # PostgreSQL database
  temporal:       # Temporal server
  temporal-ui:    # Temporal web UI for workflow visibility
  temporal-admin: # Temporal admin tools (setup namespace)
```

The Next.js application itself runs natively (not containerized) for fast HMR and developer experience. Only infrastructure services run in Docker.

### Local workflow
1. `docker compose up -d` — start PostgreSQL and Temporal
2. `npx prisma migrate dev` — apply database migrations
3. `npm run dev` — start Next.js development server
4. `npm run worker` — start Temporal worker (separate process)

## 10. Communication Patterns

| From → To | Pattern | Notes |
|---|---|---|
| Client → Server | Server Components, Server Actions | Default for all UI-driven operations |
| Server → Database | Prisma Client | Type-safe queries, no raw SQL |
| Server → Temporal | Temporal Client SDK | Start workflows, query workflow state |
| Temporal → Database | Prisma Client (in activities) | Activities can read/write via Prisma |
| External → Server | Route Handlers (webhooks) | Validated with Zod schemas |

## 11. Key Architectural Decisions

1. **Modular monolith over microservices**: Simplicity first. A single deployable unit reduces operational overhead. Internal boundaries are enforced through directory structure and import conventions, not network calls.

2. **Server Components by default**: Minimizes client-side JavaScript. Client components are only used when browser APIs or interactivity are required.

3. **Temporal for async work**: Decouples long-running operations from the request/response cycle. Provides durability, retries, and observability out of the box.

4. **Zod as the single validation layer**: One validation library across the stack prevents schema drift between client and server.

5. **better-auth over NextAuth**: Simpler API surface, better TypeScript support, framework-agnostic auth logic that can migrate if needed.

6. **Dark mode primary**: The platform targets technical builders who overwhelmingly prefer dark interfaces. Light mode is secondary.

7. **Docker Compose for local only**: Production infrastructure is managed separately. Docker Compose provides a consistent, one-command local setup without dictating production topology.

## Per-Spec Tech Stack Log

- N/A (no infrastructure changes — CLI tooling only) (SPEC-001)
- N/A (no infrastructure changes — pipeline command updates only) (SPEC-002)
- N/A (no infrastructure changes — new MigrationManager module, CLI command, Zod schemas, slash command) (SPEC-003)
- N/A (no infrastructure changes — template-only update to primitiv.clarify command) (SPEC-004)
- N/A (no infrastructure changes — new GovernanceCompiler engine class, GovernanceContextSchema, primitiv compile CLI command, slash command template, downstream template updates; node:crypto built-in only) (SPEC-005)
