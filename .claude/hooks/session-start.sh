#!/bin/bash
# SessionStart hook: provision a fresh Claude Code on the web container so the
# repo's checks (npm run check / npm test) and its graphify PreToolUse hooks
# work without any manual setup.
set -euo pipefail

# Local checkouts are already set up by whoever cloned them; only provision
# remote sessions, which start from a bare container every time.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# uv and pip both install console scripts here.
export PATH="$HOME/.local/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ] && ! grep -qs 'HOME/.local/bin' "$CLAUDE_ENV_FILE"; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
fi

# devDependencies only: typescript, ts-node, vitest, @vitest/coverage-v8.
# `install` rather than `ci` so a warm container cache can short-circuit.
echo "session-start: installing npm dependencies"
npm install --no-audit --no-fund

# .claude/settings.json registers PreToolUse hooks that shell out to
# `graphify hook-guard`. Without the binary, every Bash/Grep/Read/Glob call
# invokes a missing command. PyPI package name is graphifyy, binary is graphify.
if command -v graphify >/dev/null 2>&1; then
  echo "session-start: graphify already present ($(graphify --version))"
elif command -v uv >/dev/null 2>&1; then
  echo "session-start: installing graphifyy via uv"
  uv tool install --upgrade graphifyy
else
  echo "session-start: installing graphifyy via pip"
  python3 -m pip install --quiet graphifyy \
    || python3 -m pip install --quiet --break-system-packages graphifyy
fi

echo "session-start: done"
