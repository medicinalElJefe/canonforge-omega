from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.evolution import candidate_decision, load_policy, protected_path_violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare an OMEGA evolution candidate against a trusted baseline")
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--changed-paths")
    parser.add_argument("--policy-root", default=str(ROOT))
    parser.add_argument("--out")
    args = parser.parse_args()

    baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    candidate = json.loads(Path(args.candidate).read_text(encoding="utf-8"))
    policy = load_policy(Path(args.policy_root))

    changed: list[str] = []
    if args.changed_paths:
        changed = [
            line.strip()
            for line in Path(args.changed_paths).read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
    violations = protected_path_violations(changed, policy)
    decision = candidate_decision(
        baseline,
        candidate,
        require_strict=policy.require_strict_improvement,
    )
    errors = list(decision.get("errors") or [])
    if violations:
        errors.append("protected_paths_changed:" + ",".join(violations))

    result = {
        **decision,
        "status": "PROMOTE_CANDIDATE" if not errors else "QUARANTINE",
        "errors": errors,
        "protected_path_violations": violations,
        "changed_path_count": len(changed),
        "judge": "trusted baseline evolution policy and comparator",
        "canonical_merge": False,
    }
    raw = json.dumps(result, indent=2) + "\n"
    print(raw, end="")
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(raw, encoding="utf-8")
    return 0 if result["status"] == "PROMOTE_CANDIDATE" else 1


if __name__ == "__main__":
    raise SystemExit(main())
