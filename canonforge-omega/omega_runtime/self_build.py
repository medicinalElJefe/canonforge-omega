from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import hashlib
import json
import uuid

from .agent_sai_r179 import SAI_JOB_KINDS
from .warp_candidate import (
    SAFE_CANDIDATE_JOB_KINDS,
    WARP_BUILD_IMPORT_SCHEMA_R178,
    WarpCandidateError,
    candidate_job_payload,
    validate_candidate_capsule,
)


R221_PIPELINE_SCHEMA = "OMEGA_R221_TRAIN_RCWA_PIPELINE"
R221_TRAINING_KIND = "sai_repository_index"
R221_TRAINING_RECEIPT_SCHEMA = "OMEGA_SAI_TRAINING_RECEIPT_R179"
R221_RCWA_KIND = "cross_runtime_validate"
R221_RCWA_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"
R221_RCWA_RESULT_SCHEMA = "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175"
R221_RCWA_NATIVE_RESULT_SCHEMA = "OMEGA_RESULT_v1"
R221_RCWA_RECEIPT_SCHEMA = "OMEGA_SOVEREIGN_RCWA_RECEIPT_R175"
R221_ACTIVE_STATES = {"QUEUED", "LEASED", "RUNNING"}


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
} | SAI_JOB_KINDS

VALIDATION_SEQUENCE = [
    "convergence_scan",
    "inspect_workspace",
    "inspect_runtime",
    "compute_truth_suite",
    "sai_b059_verify",
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
    candidate into its fixed local validation sequence. R179 additionally requires
    exact OMEGA SAI B059 host verification in the ordinary continuous acceptance
    cycle. R221 makes the operator-approved R179 -> R175 native-RCWA transition a
    controller-owned persisted state transition so an open browser is not required.
    None of these paths grants release promotion by itself.
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

    @staticmethod
    def _canonical_json(value: Any) -> str:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)

    @classmethod
    def _sha256(cls, value: Any) -> str:
        text = value if isinstance(value, str) else cls._canonical_json(value)
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @staticmethod
    def _is_r221_training(job: BuildJob) -> bool:
        payload = job.payload if isinstance(job.payload, dict) else {}
        return bool(
            job.kind == R221_TRAINING_KIND
            and payload.get("requested_by") == "R221_TRAIN_LOCALLY"
            and payload.get("pipeline_schema") == R221_PIPELINE_SCHEMA
            and isinstance(payload.get("r221_pipeline_id"), str)
        )

    @staticmethod
    def _is_r221_rcwa(job: BuildJob, pipeline_id: str | None = None) -> bool:
        payload = job.payload if isinstance(job.payload, dict) else {}
        return bool(
            job.kind == R221_RCWA_KIND
            and payload.get("schema") == R221_RCWA_CHALLENGE_SCHEMA
            and payload.get("pipeline_schema") == R221_PIPELINE_SCHEMA
            and payload.get("r221_stage") == "RCWA_NATIVE_CALIBRATION"
            and isinstance(payload.get("r221_pipeline_id"), str)
            and (pipeline_id is None or payload.get("r221_pipeline_id") == pipeline_id)
        )

    @staticmethod
    def _r221_resume_mode(job: BuildJob) -> BuildMode:
        raw = str((job.payload or {}).get("r221_resume_mode") or BuildMode.DEVELOPMENT_LOOP.value)
        try:
            mode = BuildMode(raw)
        except ValueError:
            return BuildMode.DEVELOPMENT_LOOP
        return BuildMode.DEVELOPMENT_LOOP if mode == BuildMode.MANUAL else mode

    @classmethod
    def _valid_r221_training_evidence(cls, job: BuildJob) -> bool:
        evidence = job.evidence if isinstance(job.evidence, dict) else {}
        receipt = evidence.get("repository_index") if isinstance(evidence.get("repository_index"), dict) else {}
        return bool(
            cls._is_r221_training(job)
            and evidence.get("kind") == R221_TRAINING_KIND
            and evidence.get("native_execution") is True
            and evidence.get("canonical_mutation") is False
            and receipt.get("schema") == R221_TRAINING_RECEIPT_SCHEMA
            and (receipt.get("evaluation") or {}).get("passed") is True
            and receipt.get("neuralWeightsTrained") is False
            and receipt.get("fullyTrainedClaim") is False
            and isinstance(receipt.get("receiptSha256"), str)
            and len(receipt.get("receiptSha256")) == 64
            and isinstance((receipt.get("artifacts") or {}).get("retrievalModel"), str)
            and bool((receipt.get("artifacts") or {}).get("retrievalModel"))
        )

    @classmethod
    def _valid_r221_rcwa_evidence(cls, job: BuildJob) -> bool:
        evidence = job.evidence if isinstance(job.evidence, dict) else {}
        result = evidence.get("native_result") if isinstance(evidence.get("native_result"), dict) else {}
        receipt = evidence.get("native_receipt") if isinstance(evidence.get("native_receipt"), dict) else (result.get("receipt") or {})
        return bool(
            cls._is_r221_rcwa(job)
            and evidence.get("schema") == R221_RCWA_RESULT_SCHEMA
            and evidence.get("blocked") is False
            and evidence.get("native_execution") is True
            and evidence.get("independent_solver_family_claim") is True
            and evidence.get("canonical_mutation") is False
            and result.get("schema") == R221_RCWA_NATIVE_RESULT_SCHEMA
            and result.get("solver") == "rcwa"
            and result.get("solver_family") == "MAXWELL_RCWA"
            and isinstance(result.get("solver_version"), str)
            and result.get("solver_version", "").startswith("grcwa:")
            and result.get("converged") is True
            and result.get("native_execution") is True
            and result.get("canonical_mutation") is False
            and receipt.get("schema") == R221_RCWA_RECEIPT_SCHEMA
            and receipt.get("solver") == "rcwa"
            and receipt.get("solver_family") == "MAXWELL_RCWA"
            and receipt.get("converged") is True
            and receipt.get("native_execution") is True
            and receipt.get("canonical_mutation") is False
            and all(isinstance(receipt.get(key), str) and len(receipt.get(key)) == 64 for key in ("input_sha256", "result_sha256", "receipt_sha256"))
        )

    @staticmethod
    def _r221_calibration_queue(pipeline_id: str, training_job_id: str) -> Dict[str, Any]:
        return {
            "schema": "OMEGA_FULLWAVE_QUEUE_v1",
            "revision": "R221",
            "job_id": f"r221_rcwa_calibration_{pipeline_id}",
            "source_packet_id": f"r221_training_{training_job_id}",
            "solver": "rcwa",
            "geometry": {"pitch_nm": 900, "width_nm": 900, "length_nm": 900, "height_nm": 300, "theta_deg": 0},
            "wavelength_nm": 1550,
            "polarization": "s",
            "material_model": {"n_incident": 1.0, "n_feature": 2.0, "n_background": 2.0, "n_substrate": 1.45},
            "numerics": {
                "nx": 32,
                "ny": 32,
                "harmonics_low": 9,
                "harmonics_high": 17,
                "convergence_tolerance": 0.02,
                "energy_tolerance": 0.02,
                "incidence_theta_deg": 0,
                "incidence_phi_deg": 0,
            },
            "proof": {"gate": "STAY", "mode188_score": 1.05, "scope": "R221_NATIVE_RCWA_PIPELINE_CALIBRATION_FIXTURE"},
            "lineage": [
                f"r221:{pipeline_id}:training:{training_job_id}",
                "r221:hash-bound-calibration-fixture",
                "r175:sovereign-native-grcwa",
            ],
            "calibration_fixture": True,
            "external_measurement_claim": False,
            "fabrication_validation_claim": False,
            "physical_dimension_claim": False,
            "canonical_mutation": False,
        }

    @classmethod
    def _r221_rcwa_payload(cls, training_job: BuildJob) -> Dict[str, Any]:
        pipeline_id = str(training_job.payload.get("r221_pipeline_id"))
        queue = cls._r221_calibration_queue(pipeline_id, training_job.id)
        queue_json = cls._canonical_json(queue)
        queue_sha = cls._sha256(queue_json)
        core = {
            "schema": R221_RCWA_CHALLENGE_SCHEMA,
            "revision": "R175",
            "queue_job_canonical_json": queue_json,
            "queue_job_sha256": queue_sha,
            "source_packet_id": queue["source_packet_id"],
            "requested_solver": "rcwa",
            "solver_family": "MAXWELL_RCWA",
            "authority": "INDEPENDENT_SOLVER_CHALLENGE_NOT_VALIDATION",
            "canonical_mutation": False,
            "external_measurement_claim": False,
            "physical_dimension_claim": False,
        }
        challenge_sha = cls._sha256(core)
        return {
            **core,
            "challenge_id": f"r175_{challenge_sha[:20]}",
            "challenge_sha256": challenge_sha,
            "queue_job": queue,
            "pipeline_schema": R221_PIPELINE_SCHEMA,
            "r221_pipeline_id": pipeline_id,
            "r221_training_job_id": training_job.id,
            "r221_stage": "RCWA_NATIVE_CALIBRATION",
            "r221_rcwa_retry": False,
            "r221_resume_mode": cls._r221_resume_mode(training_job).value,
            "calibration_fixture": True,
            "deployment_authorized": False,
            "promotion_authorized": False,
        }

    def _existing_r221_rcwa(self, pipeline_id: str) -> Optional[BuildJob]:
        rows = [job for job in self.jobs if self._is_r221_rcwa(job, pipeline_id)]
        return rows[-1] if rows else None

    def _enqueue_r221_rcwa(self, training_job: BuildJob) -> BuildJob:
        pipeline_id = str(training_job.payload.get("r221_pipeline_id"))
        existing = self._existing_r221_rcwa(pipeline_id)
        if existing is not None:
            return existing
        return self.enqueue(
            R221_RCWA_KIND,
            "R221 controller-owned post-training native RCWA calibration: execute the exact hash-bound R175 full-wave fixture with grcwa on the authenticated sovereign host. No browser, fallback, Canon, deployment, or promotion dependency is permitted.",
            self._r221_rcwa_payload(training_job),
        )

    def _resume_r221(self, job: BuildJob) -> None:
        self.mode = self._r221_resume_mode(job)
        self._save()
        self.ensure_next_job()

    def _validate_candidate_job_payload(self, kind: str, payload: Dict[str, Any]) -> None:
        if payload.get("schema") != WARP_BUILD_IMPORT_SCHEMA_R178:
            return
        candidate = payload.get("candidate")
        if not isinstance(candidate, dict):
            raise ValueError("R178 candidate job requires an embedded candidate capsule")
        try:
            valid = validate_candidate_capsule(candidate)
        except WarpCandidateError as exc:
            raise ValueError(str(exc)) from exc
        try:
            sequence_index = int(payload.get("sequence_index", -1))
        except (TypeError, ValueError) as exc:
            raise ValueError("R178 candidate sequence index is invalid") from exc
        sequence = list(SAFE_CANDIDATE_JOB_KINDS)
        if sequence_index < 0 or sequence_index >= len(sequence):
            raise ValueError("R178 candidate sequence index is outside the allow-listed sequence")
        if kind != sequence[sequence_index]:
            raise ValueError(f"R178 candidate stage mismatch: kind={kind} expected={sequence[sequence_index]}")
        if payload.get("candidate_sha256") != valid.get("capsuleSha256"):
            raise ValueError("R178 candidate job capsule hash mismatch")
        if payload.get("candidate_id") != valid.get("candidateId"):
            raise ValueError("R178 candidate job id mismatch")
        if payload.get("source_warp_id") != (valid.get("source") or {}).get("warpId"):
            raise ValueError("R178 candidate source warp id mismatch")
        if payload.get("source_receipt_sha256") != (valid.get("source") or {}).get("receiptSha256"):
            raise ValueError("R178 candidate source receipt id mismatch")
        if payload.get("canonical_mutation") is not False or payload.get("deployment_authorized") is not False or payload.get("promotion_authorized") is not False:
            raise ValueError("R178 candidate job cannot authorize canonical mutation, deployment, or promotion")

    def enqueue(self, kind: str, reason: str, payload: Optional[Dict[str, Any]] = None) -> BuildJob:
        if kind not in SAFE_JOB_KINDS:
            raise ValueError(f"unsupported governed build job: {kind}")
        normalized_payload = payload or {}
        self._validate_candidate_job_payload(kind, normalized_payload)

        pipeline_id = normalized_payload.get("r221_pipeline_id")
        pipeline_stage = normalized_payload.get("r221_stage")
        if normalized_payload.get("pipeline_schema") == R221_PIPELINE_SCHEMA and isinstance(pipeline_id, str) and isinstance(pipeline_stage, str):
            for existing in reversed(self.jobs):
                if (
                    existing.kind == kind
                    and existing.state in R221_ACTIVE_STATES
                    and (existing.payload or {}).get("pipeline_schema") == R221_PIPELINE_SCHEMA
                    and (existing.payload or {}).get("r221_pipeline_id") == pipeline_id
                    and (existing.payload or {}).get("r221_stage") == pipeline_stage
                ):
                    return existing

        now = self._now()
        job = BuildJob(
            id=str(uuid.uuid4()),
            kind=kind,
            state=JobState.QUEUED.value,
            created_at=now,
            updated_at=now,
            reason=reason,
            approved_root=str(self.approved_root),
            payload=normalized_payload,
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
                "sequence": list(SAFE_CANDIDATE_JOB_KINDS[1:]),
                "canonical_mutation": False,
                "promotion_authorized": False,
            }
        first_index = 1
        payload = candidate_job_payload(valid, first_index)
        job = self.enqueue(
            SAFE_CANDIDATE_JOB_KINDS[first_index],
            "R178 validate the strict R177 warp-derived candidate lineage with the full sovereign Python regression suite before any source change is considered.",
            payload,
        )
        return {
            "accepted": True,
            "deduplicated": False,
            "candidate_id": valid["candidateId"],
            "candidate_sha256": candidate_sha,
            "job": asdict(job),
            "sequence": list(SAFE_CANDIDATE_JOB_KINDS[first_index:]),
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
            "verify_candidate": "R178 verify computation truth, tests and workspace state for the immutable warp-candidate lineage and return it for release review.",
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
            "sai_b059_verify": "R179 verify the exact 15-authority OMEGA SAI B059 trained release on the authenticated Sovereign host, including compiled DB identity and grounded runtime selftest. Never substitute a bootstrap index or model animation.",
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
            "sai_r179": {
                "required": True,
                "release": "OMEGA SAI B059",
                "training_scope": "DETERMINISTIC_SOURCE_GROUNDED_CORPUS_COMPILED_INDEXED_CALIBRATED",
                "source_authorities": 15,
                "foundation_model_weights_trained": False,
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

        if self._is_r221_training(job) and state == JobState.VERIFIED and not self._valid_r221_training_evidence(job):
            job.state = JobState.BLOCKED.value
            job.error = "R221_TRAINING_RECEIPT_INVALID"
            state = JobState.BLOCKED
        if self._is_r221_rcwa(job) and state == JobState.VERIFIED and not self._valid_r221_rcwa_evidence(job):
            job.state = JobState.BLOCKED.value
            job.error = "R221_NATIVE_RCWA_RECEIPT_INVALID"
            state = JobState.BLOCKED

        self._save()

        if self._is_r221_training(job):
            if state == JobState.VERIFIED:
                self._enqueue_r221_rcwa(job)
            elif state in {JobState.FAILED, JobState.BLOCKED, JobState.CANCELLED}:
                self._resume_r221(job)
            return job

        if self._is_r221_rcwa(job):
            if state in {JobState.VERIFIED, JobState.FAILED, JobState.BLOCKED, JobState.CANCELLED}:
                self._resume_r221(job)
            return job

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
            "r221_train_rcwa": {
                "controller_owned_transitions": True,
                "browser_required_for_progress": False,
                "training_receipt_schema": R221_TRAINING_RECEIPT_SCHEMA,
                "rcwa_challenge_schema": R221_RCWA_CHALLENGE_SCHEMA,
                "rcwa_receipt_schema": R221_RCWA_RECEIPT_SCHEMA,
                "terminal_failure_restores_prior_non_manual_mode": True,
                "active_stage_deduplication": True,
                "no_fallback": True,
                "canonical_mutation": False,
                "deployment_authorized": False,
                "promotion_authorized": False,
            },
            "sai_r179": {
                "required_in_continuous_acceptance": True,
                "release": "OMEGA SAI B059",
                "training_scope": "DETERMINISTIC_SOURCE_GROUNDED_CORPUS_COMPILED_INDEXED_CALIBRATED",
                "source_authorities": 15,
                "documents": 541526,
                "edges": 82082,
                "boundary": "FULLY_TRAINED_WITHIN_B059_SCOPE requires exact host hash + runtime selftest proof; external provider-model weights are separately pretrained and never relabeled OMEGA-trained.",
            },
            "warp_candidate_r178": {
                "enabled": True,
                "schema": WARP_BUILD_IMPORT_SCHEMA_R178,
                "fixed_executable_sequence": list(SAFE_CANDIDATE_JOB_KINDS[1:]),
                "capsule_persistence": "embedded immutably in each governed job payload; optional local artifact helper remains available",
                "workflows": self._candidate_workflows(),
                "boundary": "strict R177 receipts may enqueue bounded candidate validation; they never grant source mutation, GitHub mutation, deployment or promotion authority",
            },
            "recursive_convergence": {
                "enabled": self.mode != BuildMode.MANUAL,
                "canonical_ref": "omega-v6-full-convergence",
                "genesis_ref": "omega-genesis-v1-full",
                "rule": "discover -> prune -> prove -> compute-truth -> verify SAI -> build -> verify; never silently mutate production",
            },
            "promotion_boundary": "controller may converge/inspect/compute/verify SAI/materialize/build/test candidates; release promotion requires separate proof and deployment authority",
        }
