# First AML

A TypeScript library for AML (Anti-Money Laundering) screening.

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Run ESLint on `src/` |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |

## Running tests

```bash
npm test
```

Coverage is enforced at 80% lines. To see a full coverage report:

```bash
npm run test:coverage
```

## Running linting

```bash
npm run lint
```

ESLint uses the `strictTypeChecked` ruleset from `typescript-eslint`, which requires a valid `tsconfig.json` to enable type-aware rules.

## Running type-checking

```bash
npm run typecheck
```

This runs `tsc --noEmit` — same checks as the build but without writing output files.

---

## Assumptions

_Document any assumptions made about the problem domain, input formats, edge cases, or external data sources here._

## Architectural Notes

_Document key design decisions, trade-offs, and rationale here._
