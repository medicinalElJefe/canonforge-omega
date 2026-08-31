from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.deployment import append_jsonl, atomic_json
from omega_genesis.evolution import build_snapshot, load_policy


def run_cycle(data_dir: Path) -> dict:
    snapshot = build_snapshot(ROOT, data_dir)
    out_dir = data_dir / "evolution"
    out_dir.mkdir(parents=True, exist_ok=True)
    atomic_json(out_dir / "status.json", snapshot)
    atomic_json(out_dir / "backlog.json", {
        "schema": "omega.evolution.backlog.v1",
        "authority": snapshot["authority"],
        "observed_at": snapshot["observed_at"],
        "quality_vector": snapshot["quality_vector"],
        "backlog": snapshot["backlog"],
        "boundary": snapshot["boundary"],
    })
    append_jsonl(out_dir / "journal.jsonl", {
        "schema": "omega.evolution.journal.v1",
        "observed_at": snapshot["observed_at"],
        "quality_vector": snapshot["quality_vector"],
        "backlog_ids": [row["id"] for row in snapshot["backlog"]],
    })
    print(json.dumps(snapshot, indent=2))
    return snapshot


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA governed continuous-evolution observer and backlog compiler")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--data-dir", default=os.environ.get("OMEGA_DATA", "/data"))
    parser.add_argument("--interval", type=int, default=None)
    args = parser.parse_args()

    data_dir = Path(args.data_dir).expanduser().resolve()
    policy = load_policy(ROOT)
    interval = max(60, args.interval or policy.interval_seconds)

    if args.once or not args.watch:
        snapshot = run_cycle(data_dir)
        return 0 if snapshot["manifest"]["status"] == "PASS" and snapshot["provenance"]["status"] == "PASS" else 1

    while True:
        try:
            run_cycle(data_dir)
        except Exception as exc:
            out_dir = data_dir / "evolution"
            out_dir.mkdir(parents=True, exist_ok=True)
            failure = {
                "schema": "omega.evolution.snapshot.v1",
                "status": "QUARANTINE",
                "detail": f"{type(exc).__name__}: {exc}",
            }
            atomic_json(out_dir / "status.json", failure)
            append_jsonl(out_dir / "journal.jsonl", failure)
            print(json.dumps(failure), flush=True)
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
