from pathlib import Path

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

    assert '@app.post("/api/development/enqueue")' in api
    assert 'if req.kind not in SAFE_JOB_KINDS' in api
    assert 'from omega_runtime.agent_sai_r179 import SAI_JOB_KINDS, execute_sai_job' in agent
    assert 'if kind in SAI_JOB_KINDS:' in agent
    assert '"sai_repository_index"' in sai_agent
    assert 'train_repository_index(root, output)' in sai_agent
    assert 'OMEGA_SAI_TRAINING_RECEIPT_R179' in sai_training
    assert '"neuralWeightsTrained": False' in sai_training
    assert '"fullyTrainedClaim": False' in sai_training


def test_r221_isolates_pipeline_so_generic_layer_builds_cannot_jump_between_training_and_rcwa():
    source = R221.read_text(encoding="utf-8")
    api = API.read_text(encoding="utf-8")

    manual = source.index('body: JSON.stringify({ mode: "MANUAL" })')
    training = source.index('kind: TRAINING_KIND', manual)
    rcwa_prepare = source.index('"/api/validate/independent/prepare"')
    rcwa_enqueue = source.index('kind: RCWA_KIND', rcwa_prepare)
    restore = source.index('body: JSON.stringify({ mode: "DEVELOPMENT_LOOP" })', rcwa_enqueue)
    assert manual < training < rcwa_prepare < rcwa_enqueue < restore

    assert '@app.post("/api/development/mode")' in api
    assert 'return _builder.set_mode(BuildMode(req.mode))' in api
    assert 'DRAINING_EXISTING_GOVERNED_STAGE' in source
    assert 'no new generic stage can jump ahead of training' in source
    assert 'NEXT_GOVERNED_STAGE' in source
    assert 'nextStageWired' in source


def test_r221_connected_training_and_rcwa_each_require_their_own_execution_receipt():
    source = R221.read_text(encoding="utf-8")
    assert 'connectedDoesNotMeanRunning: true' in source
    assert 'heartbeatIsLinkProofOnly: true' in source
    assert 'heartbeatRcwaCapabilityIsNotRcwaExecutionProof: true' in source
    assert 'trainingRunningRequiresLeasedSaiRepositoryIndexJob: true' in source
    assert 'trainingVerifiedRequiresR179TrainingReceipt: true' in source
    assert 'rcwaRunningRequiresLeasedR175CrossRuntimeJob: true' in source
    assert 'rcwaVerifiedRequiresNativeGrcwaReceipt: true' in source
    assert 'noReducedOrderOrScalarFallbackPromotedAsRcwa: true' in source

    assert 'function verifiedTrainingReceipt(job: any): boolean' in source
    assert 'receipt?.schema === TRAINING_RECEIPT_SCHEMA' in source
    assert 'receipt?.evaluation?.passed === true' in source
    assert 'receipt?.neuralWeightsTrained === false' in source
    assert 'receipt?.fullyTrainedClaim === false' in source

    assert 'function verifiedRcwaReceipt(job: any): boolean' in source
    assert 'evidence?.schema === RCWA_RESULT_SCHEMA' in source
    assert 'result?.schema === RCWA_NATIVE_RESULT_SCHEMA' in source
    assert 'result?.solver_family === "MAXWELL_RCWA"' in source
    assert 'result.solver_version.startsWith("grcwa:")' in source
    assert 'receipt?.schema === RCWA_RECEIPT_SCHEMA' in source
    assert 'receipt?.converged === true' in source
    assert 'receipt?.native_execution === true' in source
    assert 'receipt?.canonical_mutation === false' in source


def test_r221_reuses_existing_r175_no_fallback_solver_instead_of_adding_a_second_solver_layer():
    source = R221.read_text(encoding="utf-8")
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

    assert 'INDEPENDENT_SOLVER_CHALLENGE_SCHEMA_R175 = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"' in r175
    assert 'job.kind === "cross_runtime_validate"' in r175
    assert 'requiredImplementation: "grcwa"' in r175
    assert 'R175 RCWA dependencies are unavailable on the authenticated Sovereign host; no fallback is permitted' in agent
    assert 'dependencies = rcwa_dependency_status(root)' in agent
    assert '"-m", "omega_runtime.rcwa_solver"' in agent
    assert 'SOLVER_FAMILY = "MAXWELL_RCWA"' in solver
    assert 'import grcwa' in solver
    assert 'no fallback result is permitted' in solver
    assert '"fallback": False' in solver


def test_r221_calibration_fixture_is_bounded_and_hash_bound_before_host_execution():
    source = R221.read_text(encoding="utf-8")
    assert 'schema: "OMEGA_FULLWAVE_QUEUE_v1"' in source
    assert 'solver: "rcwa"' in source
    assert 'pitch_nm: 900' in source
    assert 'width_nm: 900' in source
    assert 'length_nm: 900' in source
    assert 'height_nm: 300' in source
    assert 'wavelength_nm: 1550' in source
    assert 'harmonics_low: 9' in source
    assert 'harmonics_high: 17' in source
    assert 'gate: "STAY"' in source
    assert 'mode188_score: 1.05' in source
    assert 'scope: "R221_NATIVE_RCWA_PIPELINE_CALIBRATION_FIXTURE"' in source
    assert 'fabrication_validation_claim: false' in source
    assert 'external_measurement_claim: false' in source
    assert 'physical_dimension_claim: false' in source


def test_r221_ui_drives_only_post_status_pipeline_advancement_after_explicit_start():
    source = R221.read_text(encoding="utf-8")
    assert 'omegaR221TrainLocal' in source
    assert 'Train locally + prove RCWA' in source
    assert "panel.querySelectorAll('button,a')" in source
    assert "locally/i.test" in source
    assert "data-r221-superseded" in source
    assert "'/api/system/r221/train-local'" in source
    assert "'/api/system/r221/status'" in source
    assert "'/api/system/r221/advance'" in source
    assert 'pipelineNeedsAdvance===true' in source
    assert 'pipeline_id:d.pipelineId' in source
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
    assert "Queueing is not execution proof" in source
    assert "no scalar fallback" in source


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
    assert 'foundationModelWeightsTrainedClaim: false' in source
    assert 'fullyTrainedClaim: false' in source
    assert 'arbitraryShell: false' in source
    assert 'arbitraryJobKind: false' in source
    assert 'canonicalMutation: false' in source
    assert 'githubMutation: false' in source
    assert 'deploymentAuthorized: false' in source
    assert 'promotionAuthorized: false' in source


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
