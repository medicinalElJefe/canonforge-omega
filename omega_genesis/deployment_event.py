from __future__ import annotations

from dataclasses import dataclass, asdict
import argparse
import json

CANONICAL_BRANCH = "omega-genesis-v1-full"
SELF_BUILD_WORKFLOW = "OMEGA Governed Self-Build"


@dataclass(frozen=True)
class DeploymentDecision:
    allowed: bool
    checkout_ref: str
    reason: str
    boundary: str = (
        "This gate authorizes a deployment attempt from canonical Genesis only; "
        "it does not claim Cloudflare publication or live verification succeeded."
    )


def deployment_decision(*, event_name: str, head_branch: str | None = None,
                        workflow_name: str | None = None,
                        workflow_conclusion: str | None = None) -> DeploymentDecision:
    if event_name == "push":
        if head_branch == CANONICAL_BRANCH:
            return DeploymentDecision(True, CANONICAL_BRANCH, "canonical_push")
        return DeploymentDecision(False, CANONICAL_BRANCH, "noncanonical_push")
    if event_name == "workflow_run":
        if workflow_name != SELF_BUILD_WORKFLOW:
            return DeploymentDecision(False, CANONICAL_BRANCH, "untrusted_workflow")
        if head_branch != CANONICAL_BRANCH:
            return DeploymentDecision(False, CANONICAL_BRANCH, "noncanonical_self_build")
        if workflow_conclusion != "success":
            return DeploymentDecision(False, CANONICAL_BRANCH, "self_build_not_successful")
        return DeploymentDecision(True, CANONICAL_BRANCH, "successful_canonical_self_build")
    if event_name == "workflow_dispatch":
        return DeploymentDecision(True, CANONICAL_BRANCH, "authorized_manual_dispatch")
    return DeploymentDecision(False, CANONICAL_BRANCH, "unsupported_event")


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA canonical cloud deployment event gate")
    parser.add_argument("--event-name", required=True)
    parser.add_argument("--head-branch")
    parser.add_argument("--workflow-name")
    parser.add_argument("--workflow-conclusion")
    args = parser.parse_args()
    decision = deployment_decision(
        event_name=args.event_name,
        head_branch=args.head_branch,
        workflow_name=args.workflow_name,
        workflow_conclusion=args.workflow_conclusion,
    )
    print(json.dumps(asdict(decision), sort_keys=True))
    return 0 if decision.allowed else 2


if __name__ == "__main__":
    raise SystemExit(main())
