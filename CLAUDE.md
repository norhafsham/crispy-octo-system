# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A small, standalone TypeScript reference/education repo. Despite the name in
`package.json` ("safe-arithmetic-operations"), it has grown into two distinct
topics under one repo:

1. **Safe arithmetic utilities** — overflow/underflow-checked arithmetic
   (`safeAdd`, `safeSubtract`, etc.), documented at length in `README.md` and
   consumed by `src/examples.ts`.
2. **Smart-contract gas/storage optimization patterns** — plain TypeScript
   simulations (no real EVM/Solidity) of storage-access anti-patterns and
   their optimized equivalents, in `src/storage-optimization-examples.ts` and
   `docs/STORAGE_OPTIMIZATION_GUIDE.md`.

There is no application entry point, server, or test suite — this is a
collection of runnable example scripts plus documentation.

## ⚠️ Known broken state

**`src/arithmetic-utils.ts` does not exist in the repo**, even though it is:
- imported by `src/examples.ts` (`import { safeAdd, ... } from './arithmetic-utils'`),
- referenced as the `main` entry in `package.json`,
- documented extensively in `README.md` with a full API (`safeAdd`, `safeSubtract`,
  `safeMultiply`, `safeDivide`, `safeIncrement`, `safeDecrement`, `safeModulo`,
  `safePower`, `ArithmeticError`, `isWithinSafeRange`, `validateSafeInteger`,
  `getSafeRange`).

As a result, `npm run check`, `npm run build`, and `npm run example` all fail
today with `Cannot find module './arithmetic-utils'`. If asked to fix the
build or run the examples, the missing file needs to be created (or
`src/examples.ts` adjusted) — check with the user before assuming which is
correct, since the README's documented API is the best source of truth for
what `arithmetic-utils.ts` should export.

Similarly, `src/event-emission-examples.ts` and `docs/EVENT_EMISSION_GUIDE.md`
are described in detail in `docs/PR_SUGGESTIONS.md` (as a proposed PR) and
referenced by the `event-example` npm script, but **neither file exists**.
Treat `docs/PR_SUGGESTIONS.md` as a proposal/spec, not a description of
current code.

`docs/PR_TEMPLATE_STORAGE_OPTIMIZATION.md` is a PR description template for
the storage-optimization work — that work (`storage-optimization-examples.ts`)
*does* exist and compiles cleanly on its own.

## Commands

```bash
npm install          # install devDependencies (typescript, ts-node, @types/node)
npm run check        # tsc --noEmit — type-check only, no output files
npm run build        # tsc — compiles src/**/* to dist/ (currently fails, see above)
npm run example      # ts-node src/examples.ts (currently fails, see above)
npm run storage-example  # ts-node src/storage-optimization-examples.ts (works)
npm run event-example    # ts-node src/event-emission-examples.ts (file missing — will fail)
```

There is no test runner configured (no Jest/Vitest/Mocha, no `test` script).
There is no linter (no ESLint/Prettier config). Verification is limited to
`npm run check` and manually running the example scripts.

## Architecture notes

- **TypeScript config** (`tsconfig.json`): `strict: true`, target `ES2020`,
  CommonJS modules, `rootDir: src` / `outDir: dist`. Strict mode means
  `catch (error)` blocks receive `unknown`, not `any` — existing code narrows
  with `error instanceof ArithmeticError` before reading `.message`.
- **`src/examples.ts`**: usage demonstrations for the (missing) arithmetic
  utils — a `BankAccount` class and `SafeCounter` class built on top of
  `safeAdd`/`safeSubtract`/`safeIncrement`/`safeDecrement`, plus standalone
  example functions. Each example function is self-contained and callable
  independently; running the file directly (`require.main === module`) executes
  all of them in sequence.
- **`src/storage-optimization-examples.ts`**: self-contained, no imports from
  other src files. Simulates Solidity/EVM storage costs in plain TypeScript
  (a `StorageSimulator` class standing in for contract storage, with gas
  costs like `2100` per simulated `SLOAD` hardcoded as comments/constants) to
  contrast inefficient vs. efficient versions of the same operation. Each
  pattern is a pair of functions named `inefficientX` / `efficientX`:
  1. Cache array in memory (`inefficientArrayAccess` / `efficientArrayAccess`)
  2. Cache struct fields (`inefficientStructAccess` / `efficientStructAccess`)
  3. Use mappings instead of linear search (`inefficientLinearSearch` / `efficientMappingLookup`)
  4. Single-pass vs. multi-pass aggregation (`inefficientMultiPassAggregation` / `efficientSinglePassAggregation`)
  5. Batch operations (`inefficientBatchUpdates` / `efficientBatchUpdates`)

  `runStorageOptimizationExamples()` is the exported entry point that runs
  all pairs and prints a gas comparison; it's invoked when the file is run
  directly via `ts-node`.
- **`docs/`** holds long-form guides and PR write-ups rather than API docs:
  `STORAGE_OPTIMIZATION_GUIDE.md` (the conceptual guide backing the
  storage-optimization examples, written in terms of Solidity gas costs even
  though the TS code only simulates them), `PR_SUGGESTIONS.md` (a proposal
  for event-emission examples, not yet implemented), and
  `PR_TEMPLATE_STORAGE_OPTIMIZATION.md` (a PR description template for the
  storage-optimization feature).

## Conventions to follow

- New "safe" numeric helpers should throw a custom `ArithmeticError` on
  invalid operations (matching the pattern documented in `README.md`), not
  return sentinel values or silently clamp.
- Gas/storage-optimization examples pair an `inefficientX` function with an
  `efficientX` function operating on the same simulated data, and log an
  estimated gas cost for comparison — follow this naming and comparison
  structure for any new pattern in that file.
- Comments use ❌/✅ markers to call out bad vs. good approaches inline, in
  both docs and code — keep this style consistent within existing files.
