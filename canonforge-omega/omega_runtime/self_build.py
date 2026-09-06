from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import uuid


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
    It never emits arbitrary shell text and never grants release promotion by itself.
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

    def _next_validation_kind(self) -> str:
        verified = [j for j in self.jobs if j.state == JobState.VERIFIED.value and j.kind in VALIDATION_SEQUENCE]
        if not verified:
            return VALIDATION_SEQUENCE[0]
        last = verified[-1].kind
        index = VALIDATION_SEQUENCE.index(last)
        return VALIDATION_SEQUENCE[(index + 1) % len(VALIDATION_SEQUENCE)]

    def ensure_next_job(self) -> Optional[BuildJob]:
        active = [j for j in self.jobs if j.state in {JobState.QUEUED.value, JobState.LEASED.value, JobState.RUNNING.value}]
        if active or self.mode == BuildMode.MANUAL:
            return active[0] if active else None
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

    def lease_next(self, agent_id: str) -> Optional[BuildJob]:
        self.ensure_next_job()
        for job in self.jobs:
            if job.state == JobState.QUEUED.value:
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
        if state in {JobState.VERIFIED, JobState.FAILED, JobState.BLOCKED, JobState.CANCELLED}:
            self.ensure_next_job()
        return job

    def status(self) -> Dict[str, Any]:
        self.ensure_next_job()
        active = next((j for j in self.jobs if j.state in {JobState.QUEUED.value, JobState.LEASED.value, JobState.RUNNING.value}), None)
        return {
            "mode": self.mode.value,
            "approved_root": str(self.approved_root),
            "active_job": None if active is None else asdict(active),
            "recent_jobs": [asdict(job) for job in self.jobs[-20:]],
            "safe_job_kinds": sorted(SAFE_JOB_KINDS),
            "validation_sequence": VALIDATION_SEQUENCE,
            "recursive_convergence": {
                "enabled": self.mode != BuildMode.MANUAL,
                "canonical_ref": "omega-v6-full-convergence",
                "genesis_ref": "omega-genesis-v1-full",
                "rule": "discover -> prune -> prove -> compute-truth -> build -> verify; never silently mutate production",
            },
            "promotion_boundary": "controller may converge/inspect/compute/build/test candidates; release promotion requires separate proof and deployment authority",
        }
