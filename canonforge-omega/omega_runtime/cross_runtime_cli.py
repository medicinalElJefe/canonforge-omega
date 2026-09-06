from __future__ import annotations

import argparse
import json

from .cross_runtime import native_reference_receipt


def main() -> int:
    parser = argparse.ArgumentParser(description="Execute one R173 native reference challenge and emit a receipt")
    parser.add_argument("--path", required=True)
    parser.add_argument("--input-json", required=True)
    args = parser.parse_args()
    receipt = native_reference_receipt(args.path, args.input_json)
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
