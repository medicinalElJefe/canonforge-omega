from __future__ import annotations

import argparse
import json
from pathlib import Path

from omega_runtime.sai_training import train, status


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA R179 Sovereign SAI training/retrieval command")
    parser.add_argument("--root", default=".", help="Approved local source root to compile")
    parser.add_argument("--output", default=".omega/sai-training/release", help="Bounded SAI training output directory")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()
    result = status(output) if args.status else train(root, output)
    print(json.dumps(result, sort_keys=True, ensure_ascii=False))
    return 0 if result.get("state") not in {"FAILED", "RECEIPT_INVALID"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
