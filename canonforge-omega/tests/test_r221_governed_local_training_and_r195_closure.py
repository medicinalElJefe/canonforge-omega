import hashlib
import json
from pathlib import Path

from omega_runtime.self_build import BuildMode, JobState, SovereignBuildController

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME_ENTRY = WORKER / "runtimeEntryR169.ts"
R221 = WORKER / "system" / "governedLocalTrainingR221.ts"
R195 = WORKER / "system" / "driveCorpusSnapshotR195.ts"
R175 = WORKER / "validation" / "independentSolverR175.ts"
API = ROOT / "api" / "app.py"
AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"
SAI_AGENT = ROOT / "omega_runtime" / "agent_sai_r179.py"
SAI_TRAINING = ROOT / "omega_runtime" / "sai_training.py"
RCWA_SOLVER = ROOT / "omega_runtime" / "rcwa_solver.py"
SELF_BUILD = ROOT / "omega_runtime" / "self_build.py"

PIPELINE_SCHEMA = "OMEGA_R221_TRAIN_RCWA_PIPELINE"


def _training_payload(resume_mode: str = "DEVELOPMENT_LOOP") -> dict:
    return {
        "requested_by": "R221_TRAIN_LOCALLY",
        "pipeline_schema": PIPELINE_SCHEMA,
        "r221_pipeline_id": "r221_test_pipeline",
        "r221_stage": "R179_LOCAL_REPOSITORY_TRAINING",
        "r221_resume_mode": resume_mode,
        "training_scope": "LOCAL_REPOSITORY_INDEX_ONLY",
        "next_required_stage": "R175_NATIVE_RCWA_CALIBRATION",
        "foundation_model_weights_trained": False,
        "canonical_mutation": False,
        "github_mutation": False,
        "deployment_authorized": False,
        "promotion_authorized": False,
    }


def _training_evidence() -> dict:
    return {
        "kind": "sai_repository_index",
        "native_execution": True,
        "canonical_mutation": False,
        "repository_index": {
            "schema": "OMEGA_SAI_TRAINING_RECEIPT_R179",
            "evaluation": {"passed": True},
            "neuralWeightsTrained": False,
            "fullyTrainedClaim": False,
            "receiptSha256": "a" * 64,
            "artifacts": {"retrievalModel": "retrieval-index.bin"},
        },
    }


def _rcwa_evidence(queue_sha: str) -> dict:
    receipt = {
        "schema": "OMEGA_SOVEREIGN_RCWA_RECEIPT_R175",
        "solver": "rcwa",
        "solver_family": "MAXWELL_RCWA",
        "converged": True,
        "native_execution": True,
        "canonical_mutation": False,
        "input_sha256": queue_sha,
        "result_sha256": "b" * 64,
        "receipt_sha256": "c" * 64,
    }
    result = {
        "schema": "OMEGA_RESULT_v1",
        "solver": "rcwa",
        "solver_family": "MAXWELL_RCWA",
        "solver_version": "grcwa:0.1.2",
        "converged": True,
        "native_execution": True,
        "canonical_mutation": False,
        "receipt": receipt,
    }
    return {
        "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175",
        "blocked": False,
        "native_execution": True,
        "independent_solver_family_claim": True,
        "canonical_mutation": False,
        "native_result": result,
        "native_receipt": receipt,
    }


def _controller(tmp_path: Path, resume_mode: str = "DEVELOPMENT_LOOP") -> tuple[SovereignBuildController, object]:
    root = tmp_path / "root"
    root.mkdir()
    controller = SovereignBuildController(tmp_path / "state.json", root)
    controller.set_mode(BuildMode.MANUAL)
    training = controller.enqueue(
        "sai_repository_index",
        "R221 test training",
        _training_payload(resume_mode),
    )
    leased = controller.lease_next("test-agent")
    assert leased is not None and leased.id == training.id
    controller.update_job(training.id, JobState.RUNNING, {"agent_id": "test-agent"})
    return controller, training


def test_r221_train_locally_is_a_real_allow_listed_development_job():
    source = R221.read_text(encoding="utf-8")
    api = API.read_text(encoding="utf-8")
    agent = AGENT.read_text(encoding="utf-8")
    sai_agent = SAI_AGENT.read_text(encoding="utf-8")
    sai_training = SAI_TRAINING.read_text(encoding="utf-8")

    assert 'const PIPELINE_SCHEMA = "OMEGA_R221_TRAIN_RCWA_PIPELINE"' in source
    assert 'const TRAINING_KIND = "sai_repository_index"' in source
    assert '"/api/development/enqueue"' in source
    assert 'kind: TRAINING_KIND' in source
    assert 'body.confirmed !== true' in source
    assert 'code: "EXPLICIT_CONFIRMATION_REQUIRED"' in source
    assert 'code: "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED"' in source
    assert 'controller_owned_transition: true' in source
    assert 'browser_required_for_progress: false' in source

    assert '@app.post("/api/development/enqueue")' in api
    assert 'if req.kind not in SAFE_JOB_KINDS' in api
    assert 'from omega_runtime.agent_sai_r179 import SAI_JOB_KINDS, execute_sai_job' in agent
    assert 'if kind in SAI_JOB_KINDS:' in agent
    assert '"sai_repository_index"' in sai_agent
    assert 'train_repository_index(root, output)' in sai_agent
    assert 'OMEGA_SAI_TRAINING_RECEIPT_R179' in sai_training
    assert '"neuralWeightsTrained": False' in sai_training
    assert '"fullyTrainedClaim": False' in sai_training


def test_r221_controller_owns_training_to_rcwa_without_browser(tmp_path: Path):
    controller, training = _controller(tmp_path)
    controller.update_job(training.id, JobState.VERIFIED, _training_evidence())

    status = controller.status()
    assert status["mode"] == "MANUAL"
    assert status["r221_train_rcwa"]["controller_owned_transitions"] is True
    assert status["r221_train_rcwa"]["browser_required_for_progress"] is False
    rcwa = status["active_job"]
    assert rcwa is not None
    assert rcwa["kind"] == "cross_runtime_validate"
    assert rcwa["state"] == "QUEUED"
    assert rcwa["payload"]["schema"] == "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"
    assert rcwa["payload"]["pipeline_schema"] == PIPELINE_SCHEMA
    assert rcwa["payload"]["r221_stage"] == "RCWA_NATIVE_CALIBRATION"
    assert rcwa["payload"]["r221_training_job_id"] == training.id
    assert rcwa["payload"]["r221_resume_mode"] == "DEVELOPMENT_LOOP"

    canonical_queue = rcwa["payload"]["queue_job_canonical_json"]
    assert hashlib.sha256(canonical_queue.encode("utf-8")).hexdigest() == rcwa["payload"]["queue_job_sha256"]
    queue = json.loads(canonical_queue)
    assert queue["schema"] == "OMEGA_FULLWAVE_QUEUE_v1"
    assert queue["solver"] == "rcwa"
    assert queue["calibration_fixture"] is True
    assert queue["external_measurement_claim"] is False
    assert queue["fabrication_validation_claim"] is False
    assert queue["canonical_mutation"] is False

    # Re-delivery of the same VERIFIED training result cannot stack another RCWA stage.
    controller.update_job(training.id, JobState.VERIFIED, _training_evidence())
    rcwa_jobs = [j for j in controller.jobs if j.kind == "cross_runtime_validate" and j.payload.get("r221_pipeline_id") == "r221_test_pipeline"]
    assert len(rcwa_jobs) == 1


def test_r221_terminal_rcwa_failure_releases_manual_but_retains_training_for_retry(tmp_path: Path):
    controller, training = _controller(tmp_path)
    controller.update_job(training.id, JobState.VERIFIED, _training_evidence())
    rcwa = controller.status()["active_job"]
    leased = controller.lease_next("test-agent")
    assert leased is not None and leased.id == rcwa["id"]
    controller.update_job(rcwa["id"], JobState.RUNNING, {"agent_id": "test-agent"})
    controller.update_job(
        rcwa["id"],
        JobState.BLOCKED,
        {"schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175", "blocked": True, "reason": "dependency unavailable"},
        "dependency unavailable",
    )

    status = controller.status()
    assert status["mode"] == "DEVELOPMENT_LOOP"
    assert next(j for j in controller.jobs if j.id == training.id).state == "VERIFIED"
    assert next(j for j in controller.jobs if j.id == rcwa["id"]).state == "BLOCKED"
    assert status["active_job"] is not None
    assert status["active_job"]["id"] not in {training.id, rcwa["id"]}

    # A deliberate retry can re-isolate and enqueue one fresh RCWA job without retraining.
    controller.set_mode(BuildMode.MANUAL)
    retry_payload = dict(rcwa["payload"])
    retry_payload["r221_rcwa_retry"] = True
    retry = controller.enqueue("cross_runtime_validate", "R221 retry", retry_payload)
    assert retry.id != rcwa["id"]
    assert retry.state == "QUEUED"
    assert len([j for j in controller.jobs if j.kind == "sai_repository_index" and j.payload.get("r221_pipeline_id") == "r221_test_pipeline"]) == 1


def test_r221_valid_native_rcwa_restores_exact_prior_governed_mode(tmp_path: Path):
    controller, training = _controller(tmp_path, "CONTINUOUS_SOVEREIGN_BUILD")
    controller.update_job(training.id, JobState.VERIFIED, _training_evidence())
    rcwa = controller.status()["active_job"]
    leased = controller.lease_next("test-agent")
    assert leased is not None and leased.id == rcwa["id"]
    controller.update_job(rcwa["id"], JobState.RUNNING, {"agent_id": "test-agent"})
    controller.update_job(rcwa["id"], JobState.VERIFIED, _rcwa_evidence(rcwa["payload"]["queue_job_sha256"]))

    status = controller.status()
    assert status["mode"] == "CONTINUOUS_SOVEREIGN_BUILD"
    assert next(j for j in controller.jobs if j.id == training.id).state == "VERIFIED"
    assert next(j for j in controller.jobs if j.id == rcwa["id"]).state == "VERIFIED"
    assert status["active_job"] is not None
    assert status["active_job"]["id"] not in {training.id, rcwa["id"]}


def test_r221_invalid_verified_rcwa_is_demoted_to_blocked_and_controller_recovers(tmp_path: Path):
    controller, training = _controller(tmp_path)
    controller.update_job(training.id, JobState.VERIFIED, _training_evidence())
    rcwa = controller.status()["active_job"]
    leased = controller.lease_next("test-agent")
    assert leased is not None and leased.id == rcwa["id"]
    controller.update_job(rcwa["id"], JobState.RUNNING, {"agent_id": "test-agent"})
    controller.update_job(rcwa["id"], JobState.VERIFIED, {"native_execution": True, "blocked": False})

    stored = next(j for j in controller.jobs if j.id == rcwa["id"])
    assert stored.state == "BLOCKED"
    assert stored.error == "R221_NATIVE_RCWA_RECEIPT_INVALID"
    assert controller.status()["mode"] == "DEVELOPMENT_LOOP"


def test_r221_active_job_truth_overrides_stale_recent_snapshot_and_retry_reisolates():
    source = R221.read_text(encoding="utf-8")
    assert 'ordered.splice(indexById.get(id)!, 1)' in source
    assert 'ordered.push(active)' in source
    assert source.index('ordered.splice(indexById.get(id)!, 1)') < source.index('ordered.push(active)')
    assert 'const activePipelineJob = activeTraining || activeRcwa' in source
    assert 'activePipelineJob && currentActive && currentActive.id !== activePipelineJob.id' in source
    assert 'code: "PIPELINE_REISOLATION_FAILED"' in source
    assert 'setDevelopmentMode(nextFetch, request, env, ctx, "MANUAL")' in source
    assert 'failureRecoveryRestored: restored.ok' in source
    assert 'r221_resume_mode: facts.resumeDevelopmentMode' in source


def test_r221_connected_training_and_rcwa_each_require_their_own_execution_receipt():
    source = R221.read_text(encoding="utf-8")
    assert 'connectedDoesNotMeanRunning: true' in source
    assert 'heartbeatIsLinkProofOnly: true' in source
    assert 'heartbeatRcwaCapabilityIsNotRcwaExecutionProof: true' in source
    assert 'controllerOwnsTrainingToRcwaTransition: true' in source
    assert 'browserTabIsNotRequiredForPipelineProgress: true' in source
    assert 'terminalPipelineFailureRestoresPriorNonManualMode: true' in source
    assert 'trainingVerifiedRequiresR179TrainingReceipt: true' in source
    assert 'rcwaVerifiedRequiresNativeGrcwaReceipt: true' in source
    assert 'noReducedOrderOrScalarFallbackPromotedAsRcwa: true' in source

    assert 'receipt?.schema === TRAINING_RECEIPT_SCHEMA' in source
    assert 'receipt?.evaluation?.passed === true' in source
    assert 'receipt?.neuralWeightsTrained === false' in source
    assert 'receipt?.fullyTrainedClaim === false' in source
    assert 'evidence?.schema === RCWA_RESULT_SCHEMA' in source
    assert 'result?.solver_family === "MAXWELL_RCWA"' in source
    assert 'result.solver_version.startsWith("grcwa:")' in source
    assert 'receipt?.schema === RCWA_RECEIPT_SCHEMA' in source
    assert 'receipt?.native_execution === true' in source


def test_r221_reuses_existing_r175_no_fallback_solver_and_self_repairs_exact_dependencies():
    source = R221.read_text(encoding="utf-8")
    controller = SELF_BUILD.read_text(encoding="utf-8")
    r175 = R175.read_text(encoding="utf-8")
    agent = AGENT.read_text(encoding="utf-8")
    solver = RCWA_SOLVER.read_text(encoding="utf-8")

    assert 'const RCWA_KIND = "cross_runtime_validate"' in source
    assert 'const RCWA_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"' in source
    assert '"/api/validate/independent/prepare"' in source
    assert 'kind: RCWA_KIND' in source
    assert 'r221_stage: "RCWA_NATIVE_CALIBRATION"' in source
    assert 'calibration_fixture: true' in source
    assert 'rcwaCalibrationIsNumericalPipelineProofNotFabricationOrMeasurement: true' in source
    assert 'R221_RCWA_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"' in controller
    assert 'def _enqueue_r221_rcwa' in controller

    assert 'INDEPENDENT_SOLVER_CHALLENGE_SCHEMA_R175 = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"' in r175
    assert 'job.kind === "cross_runtime_validate"' in r175
    assert 'requiredImplementation: "grcwa"' in r175
    assert 'RCWA_REQUIRED_PACKAGES = ("numpy>=1.24", "grcwa==0.1.2")' in agent
    assert 'def repair_rcwa_dependencies(root: Path) -> dict:' in agent
    assert '"-m", "pip", "install", "--disable-pip-version-check", *RCWA_REQUIRED_PACKAGES' in agent
    assert 'dependency_repair = repair_rcwa_dependencies(root)' in agent
    assert 'dependencies = dependency_repair["after"]' in agent
    assert 'no fallback is permitted' in agent
    assert '"-m", "omega_runtime.rcwa_solver"' in agent
    assert 'SOLVER_FAMILY = "MAXWELL_RCWA"' in solver
    assert 'import grcwa' in solver
    assert 'no fallback result is permitted' in solver
    assert '"fallback": False' in solver


def test_r221_agent_keeps_authenticated_heartbeat_live_during_long_jobs():
    agent = AGENT.read_text(encoding="utf-8")
    assert 'import threading' in agent
    assert 'heartbeat_interval = max(3.0, min(float(args.interval), 12.0))' in agent
    assert 'def keepalive(stop: threading.Event) -> None:' in agent
    assert 'threading.Thread(target=keepalive' in agent
    assert 'keeper.start()' in agent
    assert 'keeper.join(' in agent
    assert 'runtime_version": "r221-train-rcwa-continuity-agent"' in agent
    assert 'PC ONLINE remains heartbeat-backed during long training/RCWA execution' in agent
    assert 'except subprocess.TimeoutExpired as exc:' in agent
    assert '"exit_code": 124' in agent


def test_r221_rcwa_retry_reuses_training_and_forces_a_fresh_host_execution_probe():
    source = R221.read_text(encoding="utf-8")
    agent = AGENT.read_text(encoding="utf-8")
    assert 'rcwaRetryDoesNotRepeatTraining: true' in source
    assert 'rcwaRetryFreshlyReprobesHostDependencies: true' in source
    assert 'rcwaRetryEligible' in source
    assert 'retryRcwa && facts.rcwaRetryEligible' in source
    assert 'R221 RCWA-only retry after retained verified R179 training' in source
    assert 'r221_rcwa_retry: retryRcwa' in source
    assert 'body.retry_rcwa === true || body.retryRcwa === true' in source
    assert 'Retry native RCWA' in source
    assert 'retry_rcwa:true' in source
    assert 'dependencies = rcwa_dependency_status(root)' in agent
    assert 'dependency_repair = repair_rcwa_dependencies(root)' in agent


def test_r221_calibration_fixture_is_bounded_and_hash_bound_before_host_execution():
    source = R221.read_text(encoding="utf-8")
    controller = SELF_BUILD.read_text(encoding="utf-8")
    for text in (source, controller):
        assert '"schema": "OMEGA_FULLWAVE_QUEUE_v1"' in text or 'schema: "OMEGA_FULLWAVE_QUEUE_v1"' in text
        assert '"solver": "rcwa"' in text or 'solver: "rcwa"' in text
        assert '900' in text
        assert '1550' in text
        assert 'harmonics_low' in text
        assert 'harmonics_high' in text
        assert 'R221_NATIVE_RCWA_PIPELINE_CALIBRATION_FIXTURE' in text
        assert 'fabrication_validation_claim' in text
        assert 'external_measurement_claim' in text
        assert 'canonical_mutation' in text


def test_r221_ui_is_observer_and_idempotent_fallback_not_pipeline_dependency():
    source = R221.read_text(encoding="utf-8")
    assert 'omegaR221TrainLocal' in source
    assert 'Train locally + prove RCWA' in source
    assert "panel.querySelectorAll('button,a')" in source
    assert "data-r221-superseded" in source
    assert "'/api/system/r221/train-local'" in source
    assert "'/api/system/r221/status'" in source
    assert "'/api/system/r221/advance'" in source
    assert 'pipelineNeedsAdvance===true' in source
    assert 'pipeline_id:d.pipelineId' in source
    assert 'rcwaRetryEligible===true' in source
    assert 'persistent controller owns later transitions; this tab may close' in source
    assert 'browser polling is fallback only' in source
    for state in (
        "DRAINING_EXISTING_GOVERNED_STAGE",
        "TRAINING_QUEUED",
        "TRAINING_RUNNING",
        "TRAINING_VERIFIED_RCWA_READY",
        "TRAINING_RECEIPT_INVALID",
        "RCWA_QUEUED",
        "RCWA_RUNNING",
        "RCWA_VERIFIED_NEXT_STAGE_READY",
        "RCWA_RECEIPT_INVALID",
        "RCWA_BLOCKED",
        "DEVELOPMENT_ADVANCING",
    ):
        assert state in source


def test_r221_is_wired_after_r220_without_replacing_r169_or_r216_boundaries():
    source = RUNTIME_ENTRY.read_text(encoding="utf-8")
    assert 'from "./system/governedLocalTrainingR221"' in source
    assert "handleGovernedLocalTrainingR221(request, env, ctx, runtimeFetch)" in source
    assert "enhanceGovernedLocalTrainingR221(r220)" in source
    assert 'import canonicalRuntime from "./heartbeatTruth"' in source
    assert "enhanceSurfaceBindingIntegrityR216(r221" in source
    assert "enhanceSurfaceBindingIntegrityR216(r220" in source
    assert "enhanceSurfaceBindingIntegrityR216(r205" in source


def test_r221_authority_boundaries_remain_non_mutating():
    source = R221.read_text(encoding="utf-8")
    controller = SELF_BUILD.read_text(encoding="utf-8")
    assert 'foundationModelWeightsTrainedClaim: false' in source
    assert 'fullyTrainedClaim: false' in source
    assert 'arbitraryShell: false' in source
    assert 'arbitraryJobKind: false' in source
    assert 'canonicalMutation: false' in source
    assert 'githubMutation: false' in source
    assert 'deploymentAuthorized: false' in source
    assert 'promotionAuthorized: false' in source
    assert '"canonical_mutation": False' in controller
    assert '"deployment_authorized": False' in controller
    assert '"promotion_authorized": False' in controller


def test_r221_carries_forward_r195_single_flight_without_weakening_hash_integrity():
    source = R195.read_text(encoding="utf-8")
    assert "let inflating: Promise<string> | null = null" in source
    assert "if (inflating !== null) return inflating" in source
    assert "inflating = (async () =>" in source
    assert 'DecompressionStream("gzip")' in source
    assert "crypto.subtle.digest" in source
    assert "R195_DRIVE_CORPUS_HASH_MISMATCH" in source
    assert 'runtimeInflation: "SINGLE_FLIGHT_PER_WORKER_ISOLATE"' in source
    assert 'DRIVE_CORPUS_SNAPSHOT_SHA256_R195 = "8b66519d36387f3a9ca3f9a10a7dd5da0b806c4fc7b29d9a4353e94e9859e655"' in source
    mismatch = source.index("R195_DRIVE_CORPUS_HASH_MISMATCH")
    cache_text = source.index("cachedText = text")
    cache_digest = source.index("cachedDigest = digest")
    assert mismatch < cache_text < cache_digest
