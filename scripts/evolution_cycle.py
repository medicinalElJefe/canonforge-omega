from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.deployment import append_jsonl, atomic_json
from omega_genesis.evolution import build_snapshot, load_policy

_DIGEST_REF = re.compile(r"^ghcr\.io/.+@sha256:[0-9a-f]{64}$")
_HEX40 = re.compile(r"^[0-9a-f]{40}$")
_HEX64 = re.compile(r"^[0-9a-f]{64}$")


def materialize_selfbuild_evidence(data_dir: Path) -> dict:
    """Project the committed governed promotion ledger into this observer's evidence directory.

    The projection proves only that a governed self-build produced and published an immutable
    candidate image. It does not claim that a production host deployed that image.
    Existing run-scoped self-build evidence always wins and is never overwritten.
    """
    target = Path(data_dir) / "self-build" / "status.json"
    if target.is_file():
        try:
            payload = json.loads(target.read_text(encoding="utf-8"))
            return {"status": "EXISTING", "decision": payload.get("decision"), "path": str(target)}
        except Exception:
            return {"status": "EXISTING_INVALID", "path": str(target)}

    ledger_path = ROOT / "cloud" / "omega-cloud" / "promotion.json"
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"status": "UNAVAILABLE", "reason": f"{type(exc).__name__}: {exc}", "path": str(ledger_path)}

    valid = (
        ledger.get("schema") == "omega.cloud.promotion.v1"
        and ledger.get("decision") == "PROMOTE"
        and isinstance(ledger.get("image"), str)
        and bool(_DIGEST_REF.fullmatch(ledger["image"]))
        and isinstance(ledger.get("source_sha"), str)
        and bool(_HEX40.fullmatch(ledger["source_sha"]))
        and isinstance(ledger.get("manifest_sha256"), str)
        and bool(_HEX64.fullmatch(ledger["manifest_sha256"]))
        and isinstance(ledger.get("release_sha256"), str)
        and bool(_HEX64.fullmatch(ledger["release_sha256"]))
    )
    if not valid:
        return {"status": "QUARANTINE", "reason": "invalid_governed_promotion_ledger", "path": str(ledger_path)}

    payload = {
        "schema": "omega.evolution.selfbuild.evidence.v1",
        "decision": "PASS",
        "evidence_class": "verified_governed_build_promotion",
        "image": ledger["image"],
        "source_sha": ledger["source_sha"],
        "manifest_sha256": ledger["manifest_sha256"],
        "release_sha256": ledger["release_sha256"],
        "workflow_run_id": ledger.get("workflow_run_id"),
        "canonical_mutation": False,
        "boundary": "committed promotion ledger proves a governed self-build candidate; it is not proof of production deployment",
    }
    atomic_json(target, payload)
    return {"status": "MATERIALIZED", "decision": "PASS", "path": str(target), "source": str(ledger_path)}


def run_cycle(data_dir: Path) -> dict:
    materialize_selfbuild_evidence(data_dir)
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
