#!/usr/bin/env python3
"""Build the curriculum bundle. Fails loudly so bad content never ships."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from neuron_content import (  # noqa: E402
    CompileError,
    ContentError,
    GraphError,
    compile_curriculum,
    load_curriculum,
    write_bundle,
)

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile Neuron curriculum content.")
    parser.add_argument("--content", type=Path, default=ROOT / "content")
    parser.add_argument("--out", type=Path, default=ROOT / "src" / "generated")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    try:
        curriculum = load_curriculum(args.content)
        bundle, report = compile_curriculum(curriculum)
    except (ContentError, GraphError, CompileError) as exc:
        print(f"content build failed:\n  {exc}", file=sys.stderr)
        return 1

    target = write_bundle(bundle, args.out)

    if not args.quiet:
        worst = max(report.readability.items(), key=lambda kv: kv[1].grade)
        print(f"wrote {target.relative_to(ROOT)}")
        print(f"  {report.lessons} lessons across {report.worlds} worlds")
        print(f"  {report.total_weight} points available, reaching level {report.max_level_reachable}")
        print(f"  hardest read: {worst[0]} at grade {worst[1].grade}")
        for warning in report.warnings:
            print(f"  warning: {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
