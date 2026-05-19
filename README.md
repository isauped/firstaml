# First AML

A TypeScript library for calculating shipping costs

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

## Step 2 Assumptions

- Speedy shipping is an optional order-level pricing option.
- Speedy shipping is enabled through `speedyShipping?: boolean` on the order input.
- Speedy shipping is represented by an order-level line item type, not a parcel size.
- Speedy shipping does not participate in parcel classification logic.
- Parcel pricing is calculated first.
- Speedy shipping cost is calculated from the parcel subtotal.
- Speedy shipping cost is equal to the parcel subtotal, which means the final order total is doubled.
- Speedy shipping appears as a separate line item in the output.
- Speedy shipping does not modify individual parcel line item costs.
- If `speedyShipping` is omitted or `false`, no speedy shipping line item is added.
- The final order total is calculated from all line items after the optional speedy shipping line item is added.

## Step 3 Assumptions

- Each parcel now requires a `weight` property.
- Weight is provided in kilograms.
- Weight must be a positive finite number.
- Adding required `weight` is considered an intentional input contract change introduced by Step 3.
- Parcel type is still determined by dimensions only.
- Weight limits are evaluated after parcel type classification.
- Weight limits are inclusive:
  - Small parcel: up to and including 1kg
  - Medium parcel: up to and including 3kg
  - Large parcel: up to and including 6kg
  - XL parcel: up to and including 10kg
- Overweight charges apply only to the weight above the parcel type limit.
- Partial kilograms over the limit are rounded up to the next whole kilogram.
- Overweight charge is $2 per kg over the limit.
- Overweight charges are added directly to the parcel line item cost.
- Overweight charges are not represented as separate line items.
- Speedy shipping, if selected, is calculated after parcel line items include overweight charges.
- Existing parcel pricing and parcel classification behaviour should remain unchanged unless affected by overweight rules.
- Invalid weight input should throw a clear validation error.

## Architectural Notes

_Document key design decisions, trade-offs, and rationale here._
