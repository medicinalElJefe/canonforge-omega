from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import uuid

from .warp_candidate import (
    SAFE_CANDIDATE_JOB_KINDS,
    WARP_BUILD_IMPORT_SCHEMA_R178,
    WarpCandidateError,
    candidate_job_payload,
    validate_candidate_capsule,
)


class BuildMode(str, Enum):
    MANUAL = "MANUAL"
    DEVELOPMENT_LOOP = "DEVELOPMENT_LOOP"
    CONTINUOUS_SOVEREIGN_BUILD = "CONTINUOUS_SOVEREIGN_BUILD"


class JobState(str, Enum):
    QUEUED = "QUEUED"
    LEASED = "LEASED"
    RUNNING = "RUNNING"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"
    VERIFIED = "VERIFIED"
    CANCELLED = "CANCELLED"


SAFE_JOB_KINDS = {
    "convergence_scan",
    "inspect_workspace",
    "inspect_runtime",
    "compute_truth_suite",
    "cross_runtime_validate",
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "capture_screenshot",
    "prepare_candidate",
    "verify_candidate",
    "cleanup_candidate",
}

VALIDATION_SEQUENCE = [
    "convergence_scan",
    "inspect_workspace",
    "inspect_runtime",
    "compute_truth_suite",
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "verify_candidate",
]


@dataclass
class BuildJob:
    id: str
    kind: str
    state: str
    created_at: str
    updated_at: str
    reason: str
    approved_root: str
    payload: Dict[str, Any] = field(default_factory=dict)
    lease_owner: Optional[str] = None
    evidence: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


class SovereignBuildController:
    """Persistent, bounded orchestration state for post-Hybrid self-development.

    Jobs are typed and allow-listed. The controller continuously advances a real
    convergence + validation cycle after authenticated host execution returns proof.
    R178 can import a cryptographically identified, strictly accounted R177 warp
    candidate, but only into a fixed local validation sequence. It never emits
    arbitrary shell text and never grants release promotion by itself.
    """

    def __init__(self, state_path: Path, approved_root: Path) -> None:
        self.state_path = state_path
        self.approved_root = approved_root.resolve()
        self.mode = BuildMode.DEVELOPMENT_LOOP
        self.jobs: List[BuildJob] = []
        self._load()

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _load(self) -> None:
        if not self.state_path.exists():
            return
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self.mode = BuildMode(raw.get("mode", BuildMode.DEVELOPMENT_LOOP.value))
            self.jobs = [BuildJob(**item) for item in raw.get("jobs", [])]
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            self.jobs = []
            self.mode = BuildMode.DEVELOPMENT_LOOP

    def _save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        body = {"mode": self.mode.value, "jobs": [asdict(job) for job in self.jobs[-250:]]}
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(body, indent=2, sort_keys=True), encoding="utf-8")
        tmp.replace(self.state_path)

    def set_mode(self, mode: BuildMode) -> Dict[str, Any]:
        self.mode = mode
        self._save()
        return self.status()

    def enqueue(self, kind: str, reason: str, payload: Optional[Dict[str, Any]] = None) -> BuildJob:
        if kind not in SAFE_JOB_KINDS:
            raise ValueError(f"unsupported governed build job: {kind}")
        now = self._now()
        job = BuildJob(
            id=str(uuid.uuid4()),
            kind=kind,
            state=JobState.QUEUED.value,
            created_at=now,
            updated_at=now,
            reason=reason,
            approved_root=str(self.approved_root),
            payload=payload or {},
        )
        self.jobs.append(job)
        self._save()
        return job

    @staticmethod
    def _is_candidate_job(job: BuildJob) -> bool:
        return isinstance(job.payload, dict) and job.payload.get("schema") == WARP_BUILD_IMPORT_SCHEMA_R178

    def _candidate_jobs(self, candidate_sha256: str) -> List[BuildJob]:
        return [
            job for job in self.jobs
            if self._is_candidate_job(job) and job.payload.get("candidate_sha256") == candidate_sha256
        ]

    def enqueue_warp_candidate(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        try:
            valid = validate_candidate_capsule(candidate)
        except WarpCandidateError as exc:
            raise ValueError(str(exc)) from exc
        candidate_sha = str(valid["capsuleSha256"])
        existing = self._candidate_jobs(candidate_sha)
        if existing:
            latest = existing[-1]
            return {
                "accepted": True,
                "deduplicated": True,
                "candidate_id": valid["candidateId"],
                "candidate_sha256": candidate_sha,
                "job": asdict(latest),
                "sequence": list(SAFE_CANDIDATE_JOB_KINDS),
                "canonical_mutation": False,
                "promotion_authorized": False,
            }
        payload = candidate_job_payload(valid, 0)
        job = self.enqueue(
            SAFE_CANDIDATE_JOB_KINDS[0],
            "R178 materialize the strict R177 warp-derived candidate capsule as an immutable local artifact before any source change is considered.",
            payload,
        )
        return {
            "accepted": True,
            "deduplicated": False,
            "candidate_id": valid["candidateId"],
            "candidate_sha256": candidate_sha,
            "job": asdict(job),
            "sequence": list(SAFE_CANDIDATE_JOB_KINDS),
            "canonical_mutation": False,
            "promotion_authorized": False,
        }

    def _advance_candidate(self, job: BuildJob) -> Optional[BuildJob]:
        if not self._is_candidate_job(job) or job.state != JobState.VERIFIED.value:
            return None
        payload = job.payload
        sequence = list(SAFE_CANDIDATE_JOB_KINDS)
        try:
            current_index = int(payload.get("sequence_index", -1))
        except (TypeError, ValueError):
            return None
        next_index = current_index + 1
        if next_index >= len(sequence):
            return None
        candidate = payload.get("candidate")
        if not isinstance(candidate, dict):
            return None
        candidate_sha = str(payload.get("candidate_sha256") or "")
        for existing in self._candidate_jobs(candidate_sha):
            if int(existing.payload.get("sequence_index", -1)) == next_index:
                return existing
        next_kind = sequence[next_index]
        reasons = {
            "run_tests": "R178 execute the full sovereign Python regression suite for the warp-derived candidate lineage.",
            "build_vite": "R178 typecheck the Cloudflare/Vite interface for the warp-derived candidate lineage.",
            "wrangler_dry_run": "R178 package the Worker in dry-run mode only; deployment remains unauthorized.",
            "verify_candidate": "R178 verify immutable candidate identity, local artifact, computation truth, tests and workspace state for human/release review.",
        }
        return self.enqueue(next_kind, reasons.get(next_kind, f"R178 governed candidate stage: {next_kind}"), candidate_job_payload(candidate, next_index))

    def _next_validation_kind(self) -> str:
        verified = [j for j in self.jobs if j.state == JobState.VERIFIED.value and j.kind in VALIDATION_SEQUENCE and not self._is_candidate_job(j)]
        if not verified:
            return VALIDATION_SEQUENCE[0]
        last = verified[-1].kind
        index = VALIDATION_SEQUENCE.index(last)
        return VALIDATION_SEQUENCE[(index + 1) % len(VALIDATION_SEQUENCE)]

    def ensure_next_job(self) -> Optional[BuildJob]:
        active = [j for j in self.jobs if j.state in {JobState.QUEUED.value, JobState.LEASED.value, JobState.RUNNING.value}]
        if active or self.mode == BuildMode.MANUAL:
            return self._preferred_active(active)
        kind = self._next_validation_kind()
        reasons = {
            "convergence_scan": "Inventory V6, Genesis, evolution and accepted donor branches; rebuild the governed capability genome before selecting the next repair.",
            "inspect_workspace": "Inspect the approved OMEGA workspace and report source/lineage/worktree state.",
            "inspect_runtime": "Inspect the sovereign runtime/toolchain before changing or promoting anything.",
            "compute_truth_suite": "Run the physically grounded R170 reference computation suite and return invariant/error evidence before accepting advanced-computation claims.",
            "run_tests": "Run the complete Python runtime test suite and return executable evidence.",
            "build_vite": "Validate the Cloudflare/Vite interface toolchain and return build/type evidence.",
            "wrangler_dry_run": "Dry-run the Worker package before any production deployment authority is considered.",
            "verify_candidate": "Run the final bounded candidate verification and return proof for the next development decision.",
        }
        return self.enqueue(kind, reasons[kind], {
            "acceptance": "material_user_visible_or_functional_delta",
            "no_promotion_without_proof": True,
            "canonical_ref": "omega-v6-full-convergence",
            "genesis_ref": "omega-genesis-v1-full",
            "cycle": VALIDATION_SEQUENCE,
            "computation_truth": {
                "required": True,
                "evidence_class": "DERIVED",
                "physical_dimension_claim": False,
                "optical_fullwave_claim": False,
            },
        })

    def _preferred_active(self, active: List[BuildJob]) -> Optional[BuildJob]:
        if not active:
            return None
        running = [job for job in active if job.state in {JobState.LEASED.value, JobState.RUNNING.value}]
        if running:
            return running[0]
        candidates = [job for job in active if self._is_candidate_job(job)]
        return candidates[0] if candidates else active[0]

    def lease_next(self, agent_id: str) -> Optional[BuildJob]:
        self.ensure_next_job()
        queued = [job for job in self.jobs if job.state == JobState.QUEUED.value]
        candidate_first = [job for job in queued if self._is_candidate_job(job)] + [job for job in queued if not self._is_candidate_job(job)]
        for job in candidate_first:
            job.state = JobState.LEASED.value
            job.lease_owner = agent_id
            job.updated_at = self._now()
            self._save()
            return job
        return None

    def update_job(self, job_id: str, state: JobState, evidence: Optional[Dict[str, Any]] = None,
                   error: Optional[str] = None) -> BuildJob:
        job = next((j for j in self.jobs if j.id == job_id), None)
        if job is None:
            raise KeyError(job_id)
        if state == JobState.VERIFIED and not evidence:
            raise ValueError("VERIFIED requires returned evidence")
        if job.lease_owner is None and state in {JobState.RUNNING, JobState.VERIFIED}:
            raise ValueError("host execution state requires a leased job")
        job.state = state.value
        job.updated_at = self._now()
        job.evidence = evidence or job.evidence
        job.error = error
        self._save()
        if state == JobState.VERIFIED and self._is_candidate_job(job):
            advanced = self._advance_candidate(job)
            if advanced is None:
                self.ensure_next_job()
        elif state in {JobState.VERIFIED, JobState.FAILED, JobState.BLOCKED, JobState.CANCELLED}:
            self.ensure_next_job()
        return job

    def _candidate_workflows(self) -> List[Dict[str, Any]]:
        grouped: Dict[str, Dict[str, Any]] = {}
        for job in self.jobs:
            if not self._is_candidate_job(job):
                continue
            candidate_sha = str(job.payload.get("candidate_sha256") or "")
            candidate = job.payload.get("candidate") or {}
            row = grouped.setdefault(candidate_sha, {
                "candidate_id": candidate.get("candidateId"),
                "candidate_sha256": candidate_sha,
                "source_warp_id": job.payload.get("source_warp_id"),
                "source_receipt_sha256": job.payload.get("source_receipt_sha256"),
                "stages": [],
                "ready_for_release_review": False,
                "canonical_mutation": False,
                "promotion_authorized": False,
            })
            row["stages"].append({
                "kind": job.kind,
                "sequence_index": job.payload.get("sequence_index"),
                "state": job.state,
                "job_id": job.id,
                "updated_at": job.updated_at,
            })
            if job.kind == "verify_candidate" and job.state == JobState.VERIFIED.value:
                row["ready_for_release_review"] = True
        return list(grouped.values())[-12:]

    def status(self) -> Dict[str, Any]:
        self.ensure_next_job()
        active_jobs = [j for j in self.jobs if j.state in {JobState.QUEUED.value, JobState.LEASED.value, JobState.RUNNING.value}]
        active = self._preferred_active(active_jobs)
        return {
            "mode": self.mode.value,
            "approved_root": str(self.approved_root),
            "active_job": None if active is None else asdict(active),
            "recent_jobs": [asdict(job) for job in self.jobs[-20:]],
            "safe_job_kinds": sorted(SAFE_JOB_KINDS),
            "validation_sequence": VALIDATION_SEQUENCE,
            "warp_candidate_r178": {
                "enabled": True,
                "schema": WARP_BUILD_IMPORT_SCHEMA_R178,
                "fixed_sequence": list(SAFE_CANDIDATE_JOB_KINDS),
                "workflows": self._candidate_workflows(),
                "boundary": "strict R177 receipts may enqueue bounded candidate validation; they never grant source mutation, GitHub mutation, deployment or promotion authority",
            },
            "recursive_convergence": {
                "enabled": self.mode != BuildMode.MANUAL,
                "canonical_ref": "omega-v6-full-convergence",
                "genesis_ref": "omega-genesis-v1-full",
                "rule": "discover -> prune -> prove -> compute-truth -> build -> verify; never silently mutate production",
            },
            "promotion_boundary": "controller may converge/inspect/compute/materialize/build/test candidates; release promotion requires separate proof and deployment authority",
        }
