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

## Step 1 Assumptions

- The library accepts an order containing one or more parcels.
- Each parcel contains a list of dimensions represented as positive numbers.
- Dimensions are provided in centimetres.
- The implementation should not assume fixed dimension names such as length, width, or height.
- At least one dimension is required per parcel.
- Parcel size is determined by evaluating all provided dimensions.
- Parcel categories are mutually exclusive and evaluated from smallest to largest.
- Boundary values move into the next category:
  - dimensions < 10cm => Small
  - dimensions < 50cm => Medium
  - dimensions < 100cm => Large
  - any dimension >= 100cm => XL
- The response includes:
  - one line item per parcel
  - parcel type
  - parcel cost
  - total order cost
- Runtime validation is performed at the library boundary:
  - dimensions must be finite numbers
  - dimensions must be greater than zero
- Invalid input should throw a clear validation error.

## Architectural Notes

_Document key design decisions, trade-offs, and rationale here._
