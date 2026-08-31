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
    "inspect_workspace",
    "inspect_runtime",
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "capture_screenshot",
    "prepare_candidate",
    "verify_candidate",
    "cleanup_candidate",
}


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

    This controller intentionally does not execute arbitrary shell text. It emits typed
    jobs from SAFE_JOB_KINDS so the authenticated Windows agent can map them to an
    allow-listed executor. Promotion/deployment authority remains outside this class.
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

    def ensure_next_job(self) -> Optional[BuildJob]:
        active = [j for j in self.jobs if j.state in {JobState.QUEUED.value, JobState.LEASED.value, JobState.RUNNING.value}]
        if active or self.mode == BuildMode.MANUAL:
            return active[0] if active else None
        return self.enqueue(
            "inspect_workspace",
            "Development loop is online with no active job; inspect the approved OMEGA workspace and report the highest-impact bounded defect.",
            {"acceptance": "material_user_visible_or_functional_delta", "no_promotion_without_proof": True},
        )

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
            "promotion_boundary": "controller may inspect/build/test candidates; release promotion requires separate proof and deployment authority",
        }
