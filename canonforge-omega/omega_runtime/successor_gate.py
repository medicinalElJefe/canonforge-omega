from __future__ import annotations

from typing import Any, Dict, Iterable, List, Mapping

from .warp_candidate import canonical_sha256, validate_candidate_capsule


SUCCESSOR_REVISION_R183 = "R183"
SUCCESSOR_SCHEMA_R183 = "OMEGA_SUCCESSOR_SUPERIORITY_R183"
SUCCESSOR_PROMOTION_SCHEMA_R183 = "OMEGA_SUCCESSOR_PROMOTION_PACKET_R183"
SUCCESSOR_SCAR_SCHEMA_R183 = "OMEGA_SUCCESSOR_SCAR_PACKET_R183"

SUCCESSOR_METRIC_WEIGHTS_R183: Dict[str, float] = {
    "correctness": 0.18,
    "regressionSafety": 0.14,
    "missionFit": 0.13,
    "proofCoverage": 0.12,
    "capabilityCoverage": 0.10,
    "interactiveEfficiency": 0.08,
    "resourceEfficiency": 0.06,
    "recoverability": 0.06,
    "continuity": 0.06,
    "federationConnectivity": 0.04,
    "sovereignConnectivity": 0.03,
}

HARD_NON_REGRESSION_METRICS_R183 = (
    "correctness",
    "regressionSafety",
    "proofCoverage",
    "recoverability",
    "continuity",
    "federationConnectivity",
    "sovereignConnectivity",
)

REQUIRED_VERIFICATION_STAGES_R183 = (
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "verify_candidate",
)

REQUIRED_CONNECTIONS_R183 = (
    "canonicalEdge",
    "swarm",
    "genesisMachine",
    "opticalMachine",
    "sovereignHost",
    "sai",
)


class SuccessorGateError(ValueError):
    pass


def _clamp01(value: Any) -> float:
    number = float(value)
    return max(0.0, min(1.0, number))


def _hash64(value: Any) -> bool:
    if not isinstance(value, str) or len(value) != 64:
        return False
    return all(ch in "0123456789abcdef" for ch in value.lower())


def _git_sha(value: Any) -> bool:
    if not isinstance(value, str) or len(value) not in {40, 64}:
        return False
    return all(ch in "0123456789abcdef" for ch in value.lower())


def _unique_strings(values: Iterable[Any] | None) -> List[str]:
    out: List[str] = []
    for raw in values or []:
        value = str(raw or "").strip()
        if value and value not in out:
            out.append(value)
    return out


def _metric_vector(raw: Mapping[str, Any] | None) -> tuple[Dict[str, float], List[str]]:
    source = dict(raw or {})
    values: Dict[str, float] = {}
    missing: List[str] = []
    for key in SUCCESSOR_METRIC_WEIGHTS_R183:
        try:
            values[key] = _clamp01(source[key])
        except (KeyError, TypeError, ValueError, OverflowError):
            missing.append(key)
    return values, missing


def _weighted_score(values: Mapping[str, float]) -> float:
    return sum(float(values.get(key, 0.0)) * weight for key, weight in SUCCESSOR_METRIC_WEIGHTS_R183.items())


def _verification_truth(raw: Mapping[str, Any] | None) -> Dict[str, Any]:
    source = dict(raw or {})
    stages = source.get("stages") if isinstance(source.get("stages"), list) else []
    by_kind = {
        str(row.get("kind") or ""): row
        for row in stages
        if isinstance(row, dict)
    }
    missing: List[str] = []
    invalid_evidence: List[str] = []
    for kind in REQUIRED_VERIFICATION_STAGES_R183:
        row = by_kind.get(kind)
        if not row or str(row.get("state") or "").upper() != "VERIFIED":
            missing.append(kind)
        elif not _hash64(row.get("evidenceSha256")):
            invalid_evidence.append(kind)
    return {
        "complete": not missing and not invalid_evidence,
        "required": list(REQUIRED_VERIFICATION_STAGES_R183),
        "missing": missing,
        "invalidEvidence": invalid_evidence,
        "evidenceHashes": [
            (by_kind.get(kind) or {}).get("evidenceSha256")
            for kind in REQUIRED_VERIFICATION_STAGES_R183
        ],
    }


def _connection_truth(raw: Mapping[str, Any] | None) -> Dict[str, Any]:
    source = dict(raw or {})
    missing = [key for key in REQUIRED_CONNECTIONS_R183 if source.get(key) is not True]
    return {
        "complete": not missing,
        "required": list(REQUIRED_CONNECTIONS_R183),
        "missing": missing,
        "observed": {key: source.get(key) is True for key in REQUIRED_CONNECTIONS_R183},
    }


def _continuation(blockers: List[str], candidate: Mapping[str, Any], score_delta: float, scar_severity: float) -> Dict[str, Any]:
    target = ", ".join(blockers) if blockers else "material mission-fit improvement"
    high_scar = scar_severity >= 0.35
    return {
        "continueDevelopment": True,
        "nextMission": {
            "priority": "DEVELOPMENT",
            "projection": "BUILD",
            "mode": "PULSE" if high_scar else "AUTO",
            "requestedCells": 12 if high_scar else 144,
            "providerBudget": 0 if high_scar else 2,
            "branchConcurrency": 1 if high_scar else 3,
            "allowFullAuto": False,
            "operatorAuthorizedFull": False,
            "intent": (
                f"Advance {candidate.get('candidateId') or 'R178 candidate'} as an additive successor. "
                f"Preserve every admitted capability and resolve these measured deficits before re-evaluation: {target}. "
                f"Current weighted successor delta={score_delta:.6f}. Return proof receipts; do not mutate Canon or self-promote."
            ),
            "expansionProof": {"previousStageVerified": False},
        },
        "authority": "CONTINUATION_PROPOSAL_THROUGH_R180_GOVERNOR_NOT_EXECUTION_AUTHORITY",
    }


def evaluate_successor_r183(payload: Mapping[str, Any]) -> Dict[str, Any]:
    body = dict(payload or {})
    candidate = dict(body.get("candidate") or {})
    predecessor = dict(body.get("predecessor") or {})
    successor = dict(body.get("successor") or {})
    policy = dict(body.get("policy") or {})

    try:
        valid_candidate = validate_candidate_capsule(candidate)
        candidate_identity_ok = True
        identity_reasons: List[str] = []
    except Exception as exc:
        valid_candidate = candidate
        candidate_identity_ok = False
        identity_reasons = [f"CANDIDATE_IDENTITY_INVALID:{exc}"]

    try:
        regression_tolerance = max(0.0, min(0.05, float(policy.get("regressionTolerance", 0.005))))
        improvement_floor = max(0.0001, min(0.25, float(policy.get("improvementFloor", 0.005))))
    except (TypeError, ValueError, OverflowError) as exc:
        raise SuccessorGateError("invalid R183 policy") from exc

    predecessor_metrics, predecessor_missing = _metric_vector(predecessor.get("metrics"))
    successor_metrics, successor_missing = _metric_vector(successor.get("metrics"))
    missing_metrics = list(dict.fromkeys(predecessor_missing + successor_missing))

    predecessor_capabilities = _unique_strings(predecessor.get("capabilities"))
    successor_capabilities = _unique_strings(successor.get("capabilities"))
    capability_loss = [cap for cap in predecessor_capabilities if cap not in successor_capabilities]
    capability_gain = [cap for cap in successor_capabilities if cap not in predecessor_capabilities]

    predecessor_identity_valid = _git_sha(predecessor.get("canonicalGitSha"))
    verification = _verification_truth(successor.get("verification"))
    connections = _connection_truth(successor.get("connections"))

    deltas: Dict[str, float] = {}
    regressions: List[Dict[str, Any]] = []
    improvements: List[Dict[str, Any]] = []
    tradeoffs: List[Dict[str, Any]] = []
    hard = set(HARD_NON_REGRESSION_METRICS_R183)
    for key in SUCCESSOR_METRIC_WEIGHTS_R183:
        if key in missing_metrics:
            continue
        delta = successor_metrics[key] - predecessor_metrics[key]
        deltas[key] = delta
        if delta < -regression_tolerance:
            row = {"metric": key, "delta": delta, "hard": key in hard}
            regressions.append(row)
            if not row["hard"]:
                tradeoffs.append(row)
        if delta > regression_tolerance:
            improvements.append({"metric": key, "delta": delta})

    predecessor_score = None if missing_metrics else _weighted_score(predecessor_metrics)
    successor_score = None if missing_metrics else _weighted_score(successor_metrics)
    score_delta = None if predecessor_score is None or successor_score is None else successor_score - predecessor_score
    hard_regressions = [row for row in regressions if row["hard"]]
    material_improvement = (
        score_delta is not None
        and score_delta >= improvement_floor
        and bool(improvements or capability_gain)
    )

    blockers: List[str] = []
    if not candidate_identity_ok:
        blockers.extend(identity_reasons)
    if not predecessor_identity_valid:
        blockers.append("PREDECESSOR_CANONICAL_GIT_SHA_INVALID")
    if missing_metrics:
        blockers.append("MISSING_METRICS:" + ",".join(missing_metrics))
    if capability_loss:
        blockers.append("CAPABILITY_REGRESSION:" + ",".join(capability_loss))
    if hard_regressions:
        blockers.append("HARD_METRIC_REGRESSION:" + ",".join(row["metric"] for row in hard_regressions))
    if not material_improvement:
        blockers.append("MATERIAL_IMPROVEMENT_NOT_PROVED")
    if not verification["complete"]:
        blockers.append("VERIFICATION_INCOMPLETE:" + ",".join(verification["missing"] + verification["invalidEvidence"]))
    if not connections["complete"]:
        blockers.append("CONNECTION_PROOF_INCOMPLETE:" + ",".join(connections["missing"]))

    superior = (
        candidate_identity_ok
        and predecessor_identity_valid
        and not missing_metrics
        and not capability_loss
        and not hard_regressions
        and material_improvement
    )
    promotion_ready = superior and verification["complete"] and connections["complete"]
    scar_severity = min(
        1.0,
        max([abs(float(row["delta"])) for row in hard_regressions] or [0.0])
        + len(capability_loss) * 0.1
        + len(missing_metrics) * 0.02,
    )

    base: Dict[str, Any] = {
        "schema": SUCCESSOR_SCHEMA_R183,
        "revision": SUCCESSOR_REVISION_R183,
        "candidateId": valid_candidate.get("candidateId"),
        "candidateSha256": valid_candidate.get("capsuleSha256"),
        "predecessorCanonicalGitSha": predecessor.get("canonicalGitSha"),
        "superior": superior,
        "promotionReady": promotion_ready,
        "metricWeights": dict(SUCCESSOR_METRIC_WEIGHTS_R183),
        "hardNonRegressionMetrics": list(HARD_NON_REGRESSION_METRICS_R183),
        "policy": {"regressionTolerance": regression_tolerance, "improvementFloor": improvement_floor},
        "scores": {"predecessor": predecessor_score, "successor": successor_score, "delta": score_delta},
        "deltas": deltas,
        "improvements": improvements,
        "regressions": regressions,
        "tradeoffs": tradeoffs,
        "capabilities": {
            "predecessor": predecessor_capabilities,
            "successor": successor_capabilities,
            "gained": capability_gain,
            "lost": capability_loss,
            "preserved": not capability_loss,
        },
        "verification": verification,
        "connections": connections,
        "blockers": blockers,
        "authority": "SUCCESSOR_EVALUATION_NOT_CANON",
        "canonicalMutation": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
    }

    if promotion_ready:
        promotion_core = {
            "schema": SUCCESSOR_PROMOTION_SCHEMA_R183,
            "revision": SUCCESSOR_REVISION_R183,
            "predecessorCanonicalGitSha": predecessor["canonicalGitSha"],
            "candidateId": valid_candidate["candidateId"],
            "candidateSha256": valid_candidate["capsuleSha256"],
            "weightedImprovementDelta": score_delta,
            "improvedDimensions": improvements,
            "capabilityGain": capability_gain,
            "verificationEvidenceHashes": verification["evidenceHashes"],
            "connections": connections["observed"],
            "targetReleaseAuthority": "omega-v6-full-convergence",
            "nextAction": "OPEN_RELEASE_PR_THEN_RUN_CANONICAL_VERIFY_DEPLOY_AND_POST_DEPLOY_PROOFS",
            "authority": "PROMOTION_CANDIDATE_PACKET_NOT_RELEASE_AUTHORITY",
            "canonicalMutation": False,
            "githubMutationAuthorized": False,
            "deploymentAuthorized": False,
            "promotionAuthorized": False,
        }
        return {
            "ok": True,
            **base,
            "state": "SUPERIOR_SUCCESSOR_READY_FOR_RELEASE",
            "promotionPacket": {**promotion_core, "packetSha256": canonical_sha256(promotion_core)},
            "scarPacket": None,
            "continuation": None,
        }

    scar_core = {
        "schema": SUCCESSOR_SCAR_SCHEMA_R183,
        "revision": SUCCESSOR_REVISION_R183,
        "candidateId": valid_candidate.get("candidateId"),
        "candidateSha256": valid_candidate.get("capsuleSha256"),
        "predecessorCanonicalGitSha": predecessor.get("canonicalGitSha"),
        "blockers": blockers,
        "hardRegressions": hard_regressions,
        "capabilityLoss": capability_loss,
        "missingMetrics": missing_metrics,
        "missingVerification": verification["missing"] + verification["invalidEvidence"],
        "missingConnections": connections["missing"],
        "severity": scar_severity,
        "carryForward": True,
        "authority": "SUCCESSOR_SCAR_EVIDENCE_NOT_CANON",
        "canonicalMutation": False,
    }
    continuation = _continuation(blockers, valid_candidate, score_delta or 0.0, scar_severity)
    return {
        "ok": True,
        **base,
        "state": "SUPERIOR_BUT_PROOF_INCOMPLETE_CONTINUE" if superior else "NOT_YET_SUPERIOR_CONTINUE",
        "promotionPacket": None,
        "scarPacket": {**scar_core, "packetSha256": canonical_sha256(scar_core)},
        "continuation": continuation,
    }
