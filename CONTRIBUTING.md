# Contributing to Primitiv

Thanks for your interest in contributing to Primitiv.

## Development Setup

```bash
git clone https://github.com/primitiv-ai/primitiv.git
cd primitiv-spec-engine
npm install
npm run build
npm test
```

To test the CLI locally:

```bash
npm install -g .
primitiv --version
```

## Making Changes

1. Fork the repo and create a branch from `main`
2. Branch naming: `feat/<description>` or `fix/<description>`
3. Make your changes
4. Run `npm run build && npm test` to verify
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
6. Open a pull request against `main`

## What We're Looking For

- Bug fixes with reproduction steps
- Performance improvements with benchmarks
- New slash command templates
- Documentation improvements
- Test coverage improvements

## Code Style

- TypeScript strict mode (`no any`, `no @ts-ignore`)
- Vitest for tests
- Zod for runtime validation
- Keep it simple — don't over-abstract

## Reporting Issues

Use the [issue templates](https://github.com/primitiv-ai/primitiv/issues/new/choose) for bug reports and feature requests.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
