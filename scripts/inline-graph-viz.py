#!/usr/bin/env python3
"""Make graphify's exported graph.html self-contained.

`graphify export html` writes a page that loads vis-network from unpkg at view
time. That fails in three situations this repo actually hits:

  * offline, or behind a proxy whose CA the browser does not trust — the fetch
    dies and the page renders an empty canvas with no visible error, so it looks
    like the graph built wrong rather than like a network problem;
  * anywhere a strict CSP blocks external hosts;
  * archived copies, which silently rot if the CDN version disappears.

This script rewrites the exported page with the library inlined, so it needs no
network at all. Run it after `graphify export html`:

    python3 scripts/inline-graph-viz.py

The library is cached inside graphify-out/ (already gitignored) so repeat runs
and offline runs cost nothing.

The CDN URL and its Subresource Integrity hash are parsed out of the HTML rather
than hardcoded here. A graphify upgrade that bumps vis-network keeps working, and
the SRI hash graphify already ships is verified against the downloaded bytes
before anything is inlined — a mismatch aborts rather than embedding unverified
code into a page you will open in a browser.
"""

from __future__ import annotations

import base64
import hashlib
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_HTML = REPO_ROOT / "graphify-out" / "graph.html"
CACHE_DIR = REPO_ROOT / "graphify-out"

# Matches the <script src=... integrity=... crossorigin=...></script> block that
# graphify/exporters/html.py emits. Attribute order and whitespace are both
# allowed to vary so a cosmetic upstream change does not silently stop matching.
SCRIPT_RE = re.compile(
    r'<script\b(?=[^>]*\bsrc\s*=\s*"(?P<src>https?://[^"]+)")'
    r'(?=[^>]*\bintegrity\s*=\s*"(?P<integrity>[^"]+)")'
    r'[^>]*>\s*</script>',
    re.IGNORECASE,
)

SUPPORTED_HASHES = {"sha256": hashlib.sha256, "sha384": hashlib.sha384, "sha512": hashlib.sha512}


def fail(msg: str) -> "NoReturn":  # type: ignore[name-defined]
    print(f"inline-graph-viz: {msg}", file=sys.stderr)
    raise SystemExit(1)


def verify_sri(payload: bytes, integrity: str) -> None:
    """Check payload against an SRI attribute, e.g. 'sha384-<base64>'.

    An SRI attribute may list several space-separated hashes; the spec says the
    strongest one wins, but any single match is sufficient proof of integrity, so
    accept the first algorithm we recognise and match on.
    """
    for token in integrity.split():
        algo, _, expected = token.partition("-")
        digest = SUPPORTED_HASHES.get(algo.lower())
        if digest is None or not expected:
            continue
        actual = base64.b64encode(digest(payload).digest()).decode("ascii")
        if actual == expected:
            return
        fail(
            f"integrity mismatch for {algo}\n"
            f"  expected: {expected}\n"
            f"  actual:   {actual}\n"
            "Refusing to inline unverified code."
        )
    fail(f"no usable hash in integrity attribute: {integrity!r}")


def fetch(url: str, cache: Path, integrity: str) -> str:
    """Return the library source, from cache when it is present and verified."""
    if cache.exists():
        payload = cache.read_bytes()
        verify_sri(payload, integrity)
        print(f"  using cached {cache.name} ({len(payload):,} bytes)")
        return payload.decode("utf-8")

    print(f"  fetching {url}")
    try:
        with urllib.request.urlopen(url, timeout=90) as response:  # noqa: S310 - URL comes from graphify's own output
            payload = response.read()
    except Exception as exc:  # urllib raises a wide range of transport errors
        fail(f"could not fetch {url}: {exc}\nRun once with network access to populate the cache.")

    verify_sri(payload, integrity)
    cache.write_bytes(payload)
    print(f"  verified and cached ({len(payload):,} bytes)")
    return payload.decode("utf-8")


def main(argv: list[str]) -> int:
    html_path = Path(argv[1]).resolve() if len(argv) > 1 else DEFAULT_HTML
    if not html_path.exists():
        fail(f"{html_path} not found. Run `graphify export html` first.")

    html = html_path.read_text(encoding="utf-8")
    match = SCRIPT_RE.search(html)
    if match is None:
        # Already inlined, or upstream changed shape. Either way there is nothing
        # safe to do, and re-running should be a no-op rather than an error.
        if "unpkg.com" in html or "cdn." in html:
            fail(
                f"{html_path.name} still references an external host but no "
                "<script src=... integrity=...> block matched. The upstream "
                "template changed shape; update SCRIPT_RE."
            )
        print(f"{html_path.name} is already self-contained - nothing to do.")
        return 0

    src, integrity = match.group("src"), match.group("integrity")
    print(f"{html_path.name}: found external script")
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    library = fetch(src, CACHE_DIR / f".{src.rsplit('/', 1)[-1]}", integrity)

    # `</script>` anywhere in the library would close the tag early. vis-network
    # does not contain one today, but escaping costs nothing and the failure mode
    # is a silently broken page.
    safe_library = library.replace("</script>", "<\\/script>")
    inlined = "<script>\n" + safe_library + "\n</script>"
    out = html[: match.start()] + inlined + html[match.end() :]

    if "unpkg.com" in out:
        fail("an external reference survived rewriting - refusing to write a broken page")

    html_path.write_text(out, encoding="utf-8")
    grew = len(out) - len(html)
    print(f"  inlined into {html_path.name} (+{grew:,} bytes) - no network needed to view")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
