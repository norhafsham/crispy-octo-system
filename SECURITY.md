# Security Policy

## Scope

`safe-arithmetic-operations` is an educational TypeScript repository. It has no runtime
dependencies — TypeScript, ts-node, and vitest are dev dependencies only.

Two parts of `src/` are worth distinguishing when judging whether something is a
security issue:

- **`src/arithmetic-utils.ts`** is real, self-contained library code. Overflow and
  underflow checks against `Number.MAX_SAFE_INTEGER` / `MIN_SAFE_INTEGER` are the
  correctness guarantee this file exists to provide, so a way to get a silently
  out-of-range result past `validateSafeInteger` is a genuine defect worth reporting.
- **`src/event-emission-examples.ts`** and **`src/storage-optimization-examples.ts`**
  are *simulations* of Solidity/EVM patterns written in plain TypeScript. There is no
  blockchain, no contract, and no gas metering. The `estimatedGas` figures are
  illustrative constants, not measurements. Findings about the simulated gas model or
  the demo data generators are documentation issues rather than vulnerabilities.

This code is published to be read and learned from. It is not hardened for production
use, and nothing here should be treated as audited.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main` (1.0.x) | Yes |

There are no releases or tags. `main` is the only supported ref — fixes land there and
are not backported.

## Reporting a Vulnerability

Report privately through GitHub Security Advisories:

**https://github.com/norhafsham/crispy-octo-system/security/advisories/new**

That keeps the report unpublished while it is triaged. Please do not open a public issue
for something exploitable.

Helpful to include, where you have it:

- The file and line, or a failing input
- What you expected versus what happened
- Whether it reproduces on current `main`

For anything non-exploitable — a wrong doc, a misleading gas estimate, a broken command
in `CLAUDE.md` — a normal issue or pull request is the better route.

## What to Expect

This is a personal educational project maintained on a best-effort basis, without an
on-call rotation or a guaranteed response window. Reports are read and acknowledged when
the maintainer is available.

If a report is accepted, the fix lands on `main` and the advisory is published with
credit unless you ask otherwise. If it is declined, you will get the reasoning — most
often that the finding concerns the simulated contract behaviour described under
**Scope** rather than executable library code.

## Automated Analysis

CodeQL runs on every push and pull request to `main`, and weekly on a schedule
(`.github/workflows/codeql.yml`).

Note that CodeQL flags `Math.random()` as insecure randomness wherever it appears. In
this repository the random values feed demo fixtures in
`src/storage-optimization-examples.ts` — they are not tokens, keys, nonces, or anything
security-bearing. Those call sites now use `crypto.randomInt` regardless, so the alert
should not recur, but a future report of the same shape is worth checking against actual
usage before treating it as a finding.
