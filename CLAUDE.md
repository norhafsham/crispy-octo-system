# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`safe-arithmetic-operations` is a small educational TypeScript repository. It has two purposes that look related but aren't the same:

1. **`src/arithmetic-utils.ts`** is a real, self-contained safe-math library (overflow/underflow-checked arithmetic against JS's `Number.MAX_SAFE_INTEGER` / `MIN_SAFE_INTEGER` range).
2. **`src/event-emission-examples.ts`** and **`src/storage-optimization-examples.ts`** are *simulations* written to answer two GitHub issues about Solidity/EVM smart-contract patterns (event emission, storage gas costs). They use plain TypeScript/Node `EventEmitter` and hand-rolled "estimated gas" arithmetic to model Solidity behavior — there is no real blockchain, contract, or gas metering involved. Don't confuse the `estimatedGas` numbers in that file for anything measured; they're illustrative constants (`SLOAD` ≈ 2100, memory access ≈ 3).

There are no runtime dependencies — only TypeScript/ts-node/jest as dev dependencies.

## Commands

```bash
npm install          # install dev dependencies (typescript, ts-node, jest, ts-jest, @types/node, @types/jest)
npm test              # jest — runs the src/**/__tests__/*.test.ts suite
npm run check         # tsc --noEmit — typecheck the whole src/ tree
npm run build          # tsc — emit compiled JS + declarations to dist/ (test files excluded)
npm run example         # ts-node src/examples.ts — safe-arithmetic demos
npm run event-example    # ts-node src/event-emission-examples.ts
npm run storage-example   # ts-node src/storage-optimization-examples.ts
```

`npm test` runs the real jest suite in `src/__tests__/arithmetic-utils.test.ts`, which covers `arithmetic-utils.ts` only (the one module with actual logic worth unit-testing — the event-emission/storage-optimization files are illustrative simulations, see below). `docs/*.md` files referencing `npm test` / `npm run test:gas` predate this and refer to a hypothetical Hardhat/Foundry setup for actual Solidity contracts, not to anything present here — there is still no lint config. To sanity-check a change, run `npm test` and `npm run check`, plus `npm run example` / `npm run event-example` / `npm run storage-example` to exercise the code paths (each file also runs its own demo when executed directly, guarded by `if (require.main === module)`).

Jest config lives in `jest.config.js` (ts-jest preset, `testMatch: ['**/__tests__/**/*.test.ts']` under `src/`). `tsconfig.json` excludes `src/**/__tests__/**` from `include` so `npm run build` never emits test files into `dist/`; ts-jest still compiles and typechecks test files independently of that exclude.

To exercise a single exported function without running a whole file's demo block, import it via `ts-node -e`, e.g.:
```bash
npx ts-node -e "import { safeAdd } from './src/arithmetic-utils'; console.log(safeAdd(2, 3))"
```

CI is CodeQL only (`.github/workflows/codeql.yml`): static analysis on push/PR to `main` and weekly (Sundays 00:00 UTC). There is no build/test gate in CI.

## Architecture

- **`src/arithmetic-utils.ts`** — the only "product" module. Every operation (`safeAdd`, `safeSubtract`, `safeMultiply`, `safeDivide`, `safeModulo`, `safePower`, `safeIncrement`, `safeDecrement`) follows the same shape: validate operands with `validateSafeInteger`, compute, then validate the result too, throwing `ArithmeticError` (a named `Error` subclass) on any out-of-range value or division/modulo by zero. `isWithinSafeRange`/`getSafeRange`/`validateSafeInteger` are the shared primitives everything else is built from — extend this file by composing them rather than re-implementing range checks. Covered by `src/__tests__/arithmetic-utils.test.ts` (jest); extend that file when adding new operations or edge cases rather than starting a second test file.
- **`src/examples.ts`** — consumes `arithmetic-utils.ts` and demonstrates it via a `BankAccount` and `SafeCounter` class plus standalone example functions; this is the reference for how the safe-math API is meant to be used (try/catch around every call, checking `instanceof ArithmeticError`).
- **`src/event-emission-examples.ts`** — four independent `EventEmitter` subclasses (`StatefulCounter`, `Token`, `AccessControl`) each modeling one smart-contract event pattern (state-change events, ERC20-style Transfer/Approval, role-based access control). Written for GitHub Issue #1 ("Missing Event Emission"); the pattern to preserve if extending is "every state-changing method emits an event with enough context to reconstruct history off-chain."
- **`src/storage-optimization-examples.ts`** — paired `inefficientX`/`efficientX` functions (array access, struct-field access, lookup, aggregation, batch updates) over a `StorageSimulator`, each pair logging a simulated gas cost so the "before vs. after" contrast is visible when run. Written for GitHub Issue #2 ("Inefficient Storage Usage"). If adding a new pattern here, keep the inefficient/efficient pairing and the `estimatedGas` logging convention.
- **`docs/`** — reference material, not code: `STORAGE_OPTIMIZATION_GUIDE.md` mirrors the patterns in `storage-optimization-examples.ts` but in Solidity; `PR_SUGGESTIONS.md` and `PR_TEMPLATE_STORAGE_OPTIMIZATION.md` are pre-written PR descriptions for issues #1 and #2, kept as historical templates rather than living docs.

## graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships (not currently generated in this checkout).

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
