#!/usr/bin/env python3
"""Teach the installed graphify which extra file extensions this repo uses.

graphify classifies files by extension against hardcoded sets in
`graphify/detect.py`. `DOC_EXTENSIONS` knows `.md`, `.mdx`, `.qmd`, `.skill` and
friends, but not `.mdc` — the extension Cursor requires for the rule files under
`.cursor/rules/`. So `.cursor/rules/caveman.mdc` lands in `unclassified`
alongside `.gitignore`, and never reaches the knowledge graph. Ask the graph
"what agent rule files does this repo ship" and you get five of six.

There is no supported way to extend those sets: no environment variable, no
config file, and the sets are plain module-level objects that `analyze.py` and
`watch.py` import by name. So this patches the installed package in place.

Because `.claude/hooks/session-start.sh` runs `uv tool install --upgrade
graphifyy` on every fresh remote session, any edit to site-packages is reverted
each time. The hook therefore calls this script *after* installing, which is the
only ordering that survives. Run it standalone the same way:

    python3 scripts/patch-graphify-extensions.py

Idempotent, and it verifies by importing the patched module rather than trusting
the edit — a graphify release that reshapes this line should fail loudly here
instead of silently dropping files from the corpus again.

The real fix belongs upstream in graphify; this is a local workaround.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

# Extensions this repo needs classified as documents, with why each is here.
WANTED = {
    ".mdc": "Cursor rule files under .cursor/rules/",
}

TARGET_SET = "DOC_EXTENSIONS"


def fail(msg: str) -> "NoReturn":  # type: ignore[name-defined]
    print(f"patch-graphify-extensions: {msg}", file=sys.stderr)
    raise SystemExit(1)


def find_detect_module() -> tuple[Path, str]:
    """Return (detect.py path, interpreter that imported it).

    The interpreter matters as much as the path: only the one that owns graphify
    can import the module back to verify the patch. System python3 generally
    cannot, since graphifyy is installed as an isolated uv tool.
    """
    probe = "import graphify.detect as d, pathlib; print(pathlib.Path(d.__file__))"

    # Prefer the interpreter graphify's own pipeline pinned, if a build recorded one.
    pinned = Path(__file__).resolve().parent.parent / "graphify-out" / ".graphify_python"
    candidates = []
    if pinned.exists():
        candidates.append(pinned.read_text(encoding="utf-8").strip())
    candidates.append(sys.executable)
    # uv installs console scripts beside their own interpreter.
    uv_tool = Path.home() / ".local" / "share" / "uv" / "tools" / "graphifyy" / "bin" / "python"
    candidates.append(str(uv_tool))

    for python in candidates:
        if not python:
            continue
        try:
            out = subprocess.run(
                [python, "-c", probe], capture_output=True, text=True, timeout=60
            )
        except (OSError, subprocess.SubprocessError):
            continue
        if out.returncode == 0 and out.stdout.strip():
            return Path(out.stdout.strip()), python

    fail("could not import graphify from any candidate interpreter. Is graphifyy installed?")


def verify(python: str, module: Path) -> set[str]:
    """Import the patched module and report what the set actually contains."""
    probe = f"import graphify.detect as d; print(' '.join(sorted(d.{TARGET_SET})))"
    out = subprocess.run([python, "-c", probe], capture_output=True, text=True, timeout=60)
    if out.returncode != 0:
        fail(f"patched module failed to import:\n{out.stderr.strip()}")
    return set(out.stdout.split())


def main() -> int:
    module, python = find_detect_module()
    present = verify(python, module)
    missing = {ext: why for ext, why in WANTED.items() if ext not in present}
    if not missing:
        print(f"{TARGET_SET} already covers {', '.join(sorted(WANTED))} - nothing to do.")
        return 0

    source = module.read_text(encoding="utf-8")
    pattern = re.compile(rf"^{TARGET_SET}\s*=\s*\{{(?P<body>[^}}]*)\}}", re.MULTILINE)
    match = pattern.search(source)
    if match is None:
        fail(
            f"could not find `{TARGET_SET} = {{...}}` in {module}. "
            "graphify's layout changed; update this script rather than leaving "
            "files silently unclassified."
        )

    additions = "".join(f", '{ext}'" for ext in sorted(missing))
    patched = source[: match.end("body")] + additions + source[match.end("body") :]
    module.write_text(patched, encoding="utf-8")

    # Drop stale bytecode so the next import reads the edited source.
    for cached in (module.parent / "__pycache__").glob("detect.*.pyc"):
        cached.unlink(missing_ok=True)

    now = verify(python, module)
    still_missing = [ext for ext in missing if ext not in now]
    if still_missing:
        fail(f"patch applied but {', '.join(still_missing)} still absent after reimport")

    for ext in sorted(missing):
        print(f"  + {ext:6s} {TARGET_SET}  ({missing[ext]})")
    print(f"patched {module}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
