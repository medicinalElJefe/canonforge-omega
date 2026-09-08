from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME_ENTRY = WORKER / "runtimeEntryR169.ts"
R221 = WORKER / "system" / "governedLocalTrainingR221.ts"
R195 = WORKER / "system" / "driveCorpusSnapshotR195.ts"
API = ROOT / "api" / "app.py"
AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"
SAI_AGENT = ROOT / "omega_runtime" / "agent_sai_r179.py"
SAI_TRAINING = ROOT / "omega_runtime" / "sai_training.py"


def test_r221_train_locally_is_a_real_allow_listed_development_job():
    source = R221.read_text(encoding="utf-8")
    api = API.read_text(encoding="utf-8")
    agent = AGENT.read_text(encoding="utf-8")
    sai_agent = SAI_AGENT.read_text(encoding="utf-8")
    sai_training = SAI_TRAINING.read_text(encoding="utf-8")

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


def test_r221_connected_is_never_equated_with_running_or_verified_training():
    source = R221.read_text(encoding="utf-8")
    assert 'connectedDoesNotMeanRunning: true' in source
    assert 'heartbeatIsLinkProofOnly: true' in source
    assert 'runningRequiresLeasedSaiRepositoryIndexJob: true' in source
    assert 'verifiedRequiresReturnedEvidence: true' in source
    assert 'verifiedRequiresR179TrainingReceipt: true' in source
    assert 'activeState === "LEASED" || activeState === "RUNNING"' in source
    assert 'function verifiedTrainingReceipt(job: any): boolean' in source
    assert 'evidence?.kind === TRAINING_KIND' in source
    assert 'receipt?.schema === TRAINING_RECEIPT_SCHEMA' in source
    assert 'receipt?.evaluation?.passed === true' in source
    assert 'receipt?.neuralWeightsTrained === false' in source
    assert 'receipt?.fullyTrainedClaim === false' in source
    assert 'foundationModelWeightsTrainedClaim: false' in source
    assert 'fullyTrainedClaim: false' in source
    assert 'arbitraryShell: false' in source
    assert 'canonicalMutation: false' in source
    assert 'deploymentAuthorized: false' in source
    assert 'promotionAuthorized: false' in source


def test_r221_train_local_button_is_bound_to_governed_endpoint_and_truthful_states():
    source = R221.read_text(encoding="utf-8")
    assert 'omegaR221TrainLocal' in source
    assert "Train locally now" in source
    assert "panel.querySelectorAll('button,a')" in source
    assert "locally/i.test" in source
    assert "data-r221-superseded" in source
    assert "'/api/system/r221/train-local'" in source
    assert "'/api/system/r221/status'" in source
    assert "TRAINING_QUEUED" in source
    assert "TRAINING_RUNNING" in source
    assert "TRAINING_VERIFIED" in source
    assert "TRAINING_RECEIPT_INVALID" in source
    assert "TRAINING_BLOCKED" in source
    assert "TRAINING_FAILED" in source
    assert "queued; this is not execution proof" in source
    assert "R179 training receipt" in source


def test_r221_is_wired_after_r220_without_replacing_r169_or_r216_boundaries():
    source = RUNTIME_ENTRY.read_text(encoding="utf-8")
    assert 'from "./system/governedLocalTrainingR221"' in source
    assert "handleGovernedLocalTrainingR221(request, env, ctx, runtimeFetch)" in source
    assert "enhanceGovernedLocalTrainingR221(r220)" in source
    assert 'import canonicalRuntime from "./heartbeatTruth"' in source
    assert "enhanceSurfaceBindingIntegrityR216(r221" in source
    assert "enhanceSurfaceBindingIntegrityR216(r220" in source
    assert "enhanceSurfaceBindingIntegrityR216(r205" in source


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
