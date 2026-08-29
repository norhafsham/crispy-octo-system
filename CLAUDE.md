# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`safe-arithmetic-operations` is a small educational TypeScript repository — but by file count it is mostly *not* that. Orient yourself before searching:

- **`src/` (8 files)** is the actual project: a safe-math library plus three example/simulation modules. This is where nearly all work happens.
- **`ton-blockchain-docs/` (948 of ~970 tracked files)** is a vendored, unmodified copy of the upstream `ton-blockchain/docs` site. It is *not* part of this project — see the section below before touching or searching it.

Within `src/`, two purposes look related but aren't the same:

1. **`src/arithmetic-utils.ts`** is a real, self-contained safe-math library (overflow/underflow-checked arithmetic against JS's `Number.MAX_SAFE_INTEGER` / `MIN_SAFE_INTEGER` range).
2. **`src/event-emission-examples.ts`** and **`src/storage-optimization-examples.ts`** are *simulations* written to answer two GitHub issues about Solidity/EVM smart-contract patterns (event emission, storage gas costs). They use plain TypeScript/Node `EventEmitter` and hand-rolled "estimated gas" arithmetic to model Solidity behavior — there is no real blockchain, contract, or gas metering involved. Don't confuse the `estimatedGas` numbers in that file for anything measured; they're illustrative constants (`SLOAD` ≈ 2100, memory access ≈ 3).

The root project has no runtime dependencies — TypeScript/ts-node and vitest/coverage-v8 are the only dev dependencies.

## Commands

All root commands run from the repository root and cover `src/` only.

```bash
npm install          # install dev dependencies (typescript, ts-node, vitest, @types/node)
npm run check         # tsc --noEmit — typecheck the whole src/ tree
npm test               # vitest run — run the unit test suite (*.test.ts next to each source file)
npm run test:coverage   # vitest run --coverage — same suite plus a v8 coverage report (config in vitest.config.ts)
npm run build          # tsc — emit compiled JS + declarations to dist/
npm run example         # ts-node src/examples.ts — safe-arithmetic demos
npm run event-example    # ts-node src/event-emission-examples.ts
npm run storage-example   # ts-node src/storage-optimization-examples.ts
```

There is **no lint config** in this repo (no eslint config), despite some `docs/*.md` files referencing `npm run test:gas` — that refers to a hypothetical Hardhat/Foundry setup for actual Solidity contracts, not to anything present here. To sanity-check a change, run `npm run check` for types, `npm test` for unit tests, and `npm run example` / `npm run event-example` / `npm run storage-example` to exercise the code paths end-to-end (each file also runs its own demo when executed directly, guarded by `if (require.main === module)`).

To exercise a single exported function without running a whole file's demo block, import it via `ts-node -e`, e.g.:
```bash
npx ts-node -e "import { safeAdd } from './src/arithmetic-utils'; console.log(safeAdd(2, 3))"
```

### Tests and coverage

Test files live alongside their source (`src/arithmetic-utils.test.ts`, `src/examples.test.ts`, `src/event-emission-examples.test.ts`, `src/storage-optimization-examples.test.ts`) — 139 tests across 4 files at last check. `event-emission-examples.ts` and `storage-optimization-examples.ts` export their internal classes/functions (`Token`, `AccessControl`, `StatefulCounter`, the `inefficientX`/`efficientX` pattern functions, `StorageSimulator`, `generateTestData`, `generateTestUpdates`) specifically so tests can exercise them directly rather than scraping console output — keep those exports if you touch either file.

`vitest.config.ts` sets `coverage.all: true`, so every file under `src/` appears in the report even when no test imports it (an untested module reads 0% instead of vanishing). It also enforces **coverage thresholds that sit just below the current numbers** (lines 69 / statements 70 / branches 79 / functions 70, against actuals of roughly 69.7 / 70.7 / 79.2 / 70.1). The margin is under one percentage point, so deleting a covered test or adding a sizable uncovered branch will fail `npm run test:coverage` — and CI runs the coverage variant, not bare `npm test`. If you add uncovered code, add tests with it rather than lowering the floors. The remaining gap to 100% is almost entirely the demo functions each module runs under `require.main === module`.

### CI

- `.github/workflows/test.yml` — `npm ci` + `npm run check` + `npm run test:coverage` on Node 22, on push/PR to `main`.
- `.github/workflows/codeql.yml` — CodeQL static analysis on push/PR to `main`, plus weekly.

Neither workflow builds, tests, or lints `ton-blockchain-docs/`.

`tsconfig.json` has `strict: true` (ES2020, commonjs, rootDir `src` → outDir `dist`, `include: ["src/**/*"]`). Code throughout relies on strict-mode patterns (`??`, `?.`, non-null `!` only where a prior check guarantees presence) — keep new code compiling clean under strict mode rather than loosening the config.

## Architecture

- **`src/arithmetic-utils.ts`** — the only "product" module. Every operation (`safeAdd`, `safeSubtract`, `safeMultiply`, `safeDivide`, `safeModulo`, `safePower`, `safeIncrement`, `safeDecrement`) follows the same shape: validate operands with `validateSafeInteger`, compute, then validate the result too, throwing `ArithmeticError` (a named `Error` subclass) on any out-of-range value or division/modulo by zero. `isWithinSafeRange`/`getSafeRange`/`validateSafeInteger` are the shared primitives everything else is built from — extend this file by composing them rather than re-implementing range checks.
- **`src/examples.ts`** — consumes `arithmetic-utils.ts` and demonstrates it via a `BankAccount` and `SafeCounter` class plus standalone example functions; this is the reference for how the safe-math API is meant to be used (try/catch around every call, checking `instanceof ArithmeticError`).
- **`src/event-emission-examples.ts`** — `EventEmitter` subclasses (`StatefulCounter`, `Token`, `AccessControl`) each modeling one smart-contract event pattern (state-change events, ERC20-style Transfer/Approval, role-based access control). Written for GitHub Issue #1 ("Missing Event Emission"); the pattern to preserve if extending is "every state-changing method emits an event with enough context to reconstruct history off-chain."
- **`src/storage-optimization-examples.ts`** — paired `inefficientX`/`efficientX` functions (array access, struct-field access, lookup, aggregation, batch updates) over a `StorageSimulator`, each pair logging a simulated gas cost via `formatGasSavings` so the "before vs. after" contrast is visible when run. Written for GitHub Issue #2 ("Inefficient Storage Usage"). If adding a new pattern here, keep the inefficient/efficient pairing and the `estimatedGas` logging convention.
- **`docs/`** — reference material, not code: `EVENT_EMISSION_GUIDE.md` and `STORAGE_OPTIMIZATION_GUIDE.md` mirror the patterns in `event-emission-examples.ts` and `storage-optimization-examples.ts` respectively but in Solidity; `PR_SUGGESTIONS.md` and `PR_TEMPLATE_STORAGE_OPTIMIZATION.md` are pre-written PR descriptions for issues #1 and #2, kept as historical templates rather than living docs.
- **`scripts/`** — Python maintenance tooling for graphify, not part of the TypeScript build. `patch-graphify-extensions.py` patches the installed graphify package so it classifies `.mdc` files (there is no supported config hook for this, and `uv tool install --upgrade` reverts it — hence the re-run in the session-start hook). `inline-graph-viz.py` rewrites an exported `graph.html` with vis-network inlined so it renders offline / under a strict CSP.

Bad-vs-good contrasts are marked inline with ❌/✅ in both code and docs (`event-emission-examples.ts`, `storage-optimization-examples.ts`, and the four `docs/*.md` files) — keep that style consistent when extending existing files.

`README.md` is the user-facing companion to this file: same project, aimed at someone consuming the safe-math API rather than working on the repo. Its structure block, command list, and code samples were brought in line with the checkout — every snippet in it executes as written. Keep it that way if you change `src/`: in particular the utilities are integer-only, so any README example that multiplies by a fractional rate is wrong.

## The vendored `ton-blockchain-docs/` tree

`ton-blockchain-docs/` is a checked-in copy of the upstream `ton-blockchain/docs` site (added wholesale in commit `806a855`, "Vendor ton-blockchain/docs into ton-blockchain-docs/"). It is a **separate, self-contained npm project** — its own `package.json`, lockfile, Next.js 16 + Fumadocs toolchain, React 19, TypeScript 6, husky hooks, and `engines: node >=22.22 / npm >=11`. Its content is 472 `.mdx` docs pages plus assets under `content/`, `public/`, `snippets/`, `src/`, and `scripts/`.

Treat it as vendored third-party material:

- **It is excluded from the root TypeScript project.** Root `tsconfig.json` only includes `src/**/*`, so `npm run check` never sees it, and root `npm install` never installs its dependencies.
- **It is excluded from graphify** via `.graphifyignore`, which contains exactly `ton-blockchain-docs/`. Graph queries will not surface it.
- **Root CI does not build, test, lint, or spellcheck it.**
- **Do not edit it as part of ordinary work in this repo.** Changes belong upstream; local edits will drift from the vendored copy.
- **It dominates repo-wide searches.** A bare `grep`/`find` from the root returns overwhelmingly TON docs hits. Scope searches to `src/` (or pass `--exclude-dir=ton-blockchain-docs`) unless you specifically want the vendored docs.

If you do need to work inside it, use *its* commands from *its* directory (`npm ci`, `npm start`, `npm run check:types`, `npm run check:all`, `npm run fmt`, `npm run spell`) — and note its README warns local previews need ~9 GiB free RAM and builds ~12 GiB.

## Agent instruction files

Beyond this file, the repo ships an identical "caveman mode" response-style rule in **six** locations, one per agent tool's convention:

| File | Tool |
| --- | --- |
| `AGENTS.md` | generic / Codex |
| `.opencode/AGENTS.md` | opencode |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.clinerules/caveman.md` | Cline |
| `.cursor/rules/caveman.mdc` | Cursor (needs YAML frontmatter: `description`, `alwaysApply`) |
| `.windsurf/rules/caveman.md` | Windsurf (needs YAML frontmatter: `trigger`) |

The rule body is byte-identical across all six; only the frontmatter differs. **If you change the rule, change all six in the same commit** — a divergent copy means different agents behave differently on the same repo. The rule itself: terse responses, technical substance preserved, with code/commits/PRs still written normally.

`.claude/CLAUDE.md` holds Claude-specific memory (graphify pointer, user identity, current date) and is loaded alongside this file.

## Claude Code harness configuration

`.claude/settings.json` registers hooks that shape how sessions run here:

- **`PreToolUse`** on `Bash|Grep` and `Read|Glob` shells out to `graphify hook-guard search` / `read`. Each is wrapped in a `command -v graphify` check, so a missing binary degrades quietly instead of erroring on every tool call.
- **`SessionStart`** runs `.claude/hooks/session-start.sh`. It no-ops unless `CLAUDE_CODE_REMOTE=true` (local checkouts are assumed already provisioned). On remote containers it puts `$HOME/.local/bin` on `PATH`, runs `npm install`, installs graphify if absent (**PyPI package is `graphifyy`; the binary is `graphify`**), then re-applies `scripts/patch-graphify-extensions.py` — the patch must run *after* the install, since `uv tool install --upgrade` replaces site-packages and reverts it.

## graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

This project can carry a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships. **It is not generated in a fresh checkout** (`graphify-out/` is gitignored), so check for `graphify-out/graph.json` before relying on the query workflow, and fall back to ordinary search when it is absent.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- The graph never covers `ton-blockchain-docs/` — see `.graphifyignore`.
