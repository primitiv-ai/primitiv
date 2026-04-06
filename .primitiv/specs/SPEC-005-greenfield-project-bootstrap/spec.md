---
type: spec
id: SPEC-005
title: "Greenfield Project Bootstrap Command"
status: completed
version: 3
branch: "spec/SPEC-005-greenfield-project-bootstrap"
author: "Dieu"
createdAt: "2026-03-23T12:00:00.000Z"
updatedAt: "2026-03-23T12:30:00.000Z"
---

# SPEC-005: Greenfield Project Bootstrap Command

## Description

Primitiv currently enables iterative, spec-driven development on existing projects (the 1-to-100 journey) but has no capability to bootstrap a brand-new project from scratch (the 0-to-1 journey). When a user starts a greenfield project, they must manually set up everything before Primitiv's pipeline can take over.

This spec introduces a new `/primitiv.bootstrap` command that scaffolds a working, constitution-compliant project foundation. The command is **stack-agnostic** and **archetype-aware** — it adapts to what the user is actually building, whether that's a full-stack web application, a CLI tool, a standalone script, a library, a data pipeline, or an API service.

Not every project needs a database, a framework, or authentication. The bootstrap command's first question is *what kind of thing are you building?* — and everything that follows adapts accordingly.

## Acceptance Criteria

### Prerequisites & Validation
- [ ] The command checks for an initialized Primitiv workspace (`.primitiv/` directory with `.state.json`)
- [ ] If no constitutions exist, the command does not block — it enters an interactive flow to determine the project shape
- [ ] If constitutions exist, the command extracts the tech stack from the development and architecture constitutions

### Project Archetype Selection
- [ ] The command first asks the user to select a **project archetype**:
  - **Web Application** — full-stack or frontend app with UI, routing, possibly database and auth
  - **API Service** — backend service exposing HTTP/gRPC endpoints, possibly with database
  - **CLI Tool** — command-line application with argument parsing and terminal I/O
  - **Script / Automation** — standalone script or automation job (cron, data pipeline, ETL, bot)
  - **Library / Package** — reusable module published for consumption by other projects
  - **Worker / Background Service** — long-running process, queue consumer, event handler
- [ ] The archetype determines which service layers are **relevant**, **optional**, or **not applicable**:

  | Layer | Web App | API Service | CLI Tool | Script | Library | Worker |
  |---|---|---|---|---|---|---|
  | Web framework | required | required | n/a | n/a | n/a | n/a |
  | Database | optional | optional | optional | optional | n/a | optional |
  | Authentication | optional | optional | n/a | n/a | n/a | n/a |
  | UI framework | optional | n/a | n/a | n/a | n/a | n/a |
  | Arg parsing | n/a | n/a | required | optional | n/a | n/a |
  | Package publishing | n/a | n/a | optional | n/a | required | n/a |
  | Queue / messaging | n/a | optional | n/a | optional | n/a | required |
  | Containerization | optional | optional | optional | optional | n/a | optional |

- [ ] All prompts use the `AskUserQuestion` tool for interactive Q&A

### Interactive Stack Resolution
- [ ] If constitutions define the stack, the command presents it for confirmation: "Your constitutions specify [stack summary]. Proceed?"
- [ ] If no constitutions exist, the command asks the user to choose (contextual to the archetype):
  - **Language/runtime**: TypeScript/Node, Python, Go, Java, Ruby, Rust, C#/.NET, PHP, Bash, or other
  - **Framework** (only if archetype needs one): contextual options per language
  - **Database** (only if relevant): PostgreSQL, MySQL, SQLite, MongoDB, Redis, or none
  - **Other layers** as determined by archetype relevance table above
- [ ] For archetypes that don't need a framework (script, CLI, library), the command skips framework selection entirely
- [ ] For a "script" archetype, the command may scaffold as little as a single entry-point file, a config loader, and a test file

### Project Scaffolding (archetype-driven)
- [ ] Generates the project directory structure following conventions for the chosen language and archetype
- [ ] Sets up the chosen language with strict/recommended compiler/linter settings
- [ ] For each service layer marked as "required" or selected as "optional":
  - **Database**: connection config, base schema/migration with audit fields, ORM or query layer appropriate for the stack
  - **Authentication**: basic auth flow using the framework-native pattern
  - **Web/API framework**: routing, middleware, base endpoint (health check or hello world)
  - **CLI argument parsing**: parser setup, help text, base subcommand structure
  - **Library packaging**: build config, export structure, package manifest for the target registry (npm, PyPI, crates.io, etc.)
  - **Worker/queue**: consumer setup, connection config, base job handler
- [ ] For all archetypes, generates:
  - Testing framework configuration appropriate for the stack
  - Linting and formatting tooling native to the chosen language
  - A `.gitignore` appropriate for the stack
  - A `README.md` with setup and usage instructions
  - Environment variable configuration (`.env.example` or equivalent) when env vars are needed
  - A verification entry point (health-check endpoint, `--version` flag, test execution, or simple run)
- [ ] For archetypes that don't need infrastructure, no Docker Compose or service files are generated

### Primitiv Pipeline Integration
- [ ] Initializes the `.primitiv/` directory if not already present (reuses existing if present)
- [ ] If constitutions were not present, offers to generate them based on the choices made during bootstrap
- [ ] The generated project is immediately compatible with `/primitiv.specify`, `/primitiv.plan`, and `/primitiv.implement`
- [ ] Registers the bootstrap as SPEC-000 in the spec history (the foundational "spec zero")

### Post-Bootstrap Verification
- [ ] Installs dependencies using the stack's package manager (npm, pip, go mod, maven, bundler, cargo, dotnet restore, etc.) — or skips if the archetype has no dependencies (e.g., a Bash script)
- [ ] Runs a compilation or type-check to verify zero errors (when applicable)
- [ ] Runs the base test suite to verify the scaffold is functional
- [ ] Executes the verification entry point (starts the server, runs the script, executes the CLI with `--help`, imports the library)
- [ ] Reports a summary: archetype, stack, what was generated, and suggested next steps

## Constraints

- **Archetype-first**: The project archetype drives which questions are asked and which layers are scaffolded. Never ask about databases for a library. Never ask about UI frameworks for a script.
- **Stack-agnostic by design**: No hardcoded language, framework, or database. All scaffolding is driven by the resolved configuration.
- **Constitution-driven when available**: If constitutions define the stack, the scaffold respects them. The bootstrap command does not override or second-guess the constitutions.
- **Proportional complexity**: A script gets a single file and a test. A web app gets a full directory structure. The scaffold's complexity must match the archetype — never over-scaffold.
- **Idempotent on Primitiv state**: If `.primitiv/` already exists, the command must not overwrite or corrupt existing Primitiv configuration.
- **AI-generated scaffolding, not templates**: The command instructs the AI agent to generate the scaffold based on the resolved archetype and stack. No static template library to maintain.
- **Git-ready**: Proper `.gitignore` included. Ready for `git init` or works within an existing repo.
- **Single application**: One project per bootstrap invocation.

## Out of Scope

- **Cloud deployment scaffolding**: CI/CD pipelines, Terraform, cloud provider configuration — separate spec
- **Custom domain/hosting configuration**: DNS, SSL, hosting platform setup
- **Data seeding**: Beyond the minimal base schema — belongs in feature specs
- **Multi-app monorepo support**: Bootstrap targets a single application
- **Migration from other frameworks**: Covered by `/primitiv.migrate` (SPEC-003)
- **Template marketplace**: User-contributed or community templates — future enhancement
- **Production infrastructure**: Load balancers, managed databases, monitoring setup — separate spec
