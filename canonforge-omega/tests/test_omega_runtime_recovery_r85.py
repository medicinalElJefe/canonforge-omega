from pathlib import Path
import json

from scripts.check_cloudflare_contract import evaluate


ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "omegaRuntime.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
CONTRACT = ROOT / "config" / "cloudflare_live_contract.json"


def test_r85_recovers_exact_live_durable_object_identity():
    source = RUNTIME.read_text(encoding="utf-8")
    entry = ENTRY.read_text(encoding="utf-8")
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert "export class OmegaRuntime" in source
    assert 'export { OmegaRuntime } from "./omegaRuntime"' in entry
    assert 'name = "OMEGA_RUNTIME"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert 'tag = "r32-enacted-runtime"' in wrangler
    assert 'new_sqlite_classes = ["OmegaRuntime"]' in wrangler


def test_r85_preserves_recovered_r32_r33_behavior_contract():
    source = RUNTIME.read_text(encoding="utf-8")
    for marker in (
        "OMEGA_LIVING_RUNTIME_R33",
        "PAIR_AUTH_FAILED",
        "DEVICE_NOT_REGISTERED",
        "OMEGA_HYBRID_RETURN_PACKET_R32",
        "HOST_PROOF_REQUIRED",
        "HOLD_REPAIR_REQUIRED",
        "DURABLE_MESSAGE_MEMORY",
        "LAST_48_DURABLE_TURNS",
        "/agent/register",
        "/agent/heartbeat",
        "/agent/poll",
        "/agent/result",
        "/missions",
        "/thread",
        "/turn",
    ):
        assert marker in source, marker


def test_r85_preserves_security_and_truth_boundaries():
    source = RUNTIME.read_text(encoding="utf-8")
    assert 'x-omega-bridge-secret' in source
    assert 'explicit confirmation required' in source
    assert 'HTTPS required' in source
    assert 'DEVICE_PROOF_REQUIRED' in source
    assert 'nativeExecutionClaimed: online.length > 0' in source
    assert 'no blind retry was queued' in source


def test_current_cloudflare_contract_is_behaviorally_satisfied():
    result = evaluate(
        CONTRACT,
        ROOT / "cloudflare" / "omega-v6-worker" / "src",
        WRANGLER,
    )
    assert result["status"] == "PASS", json.dumps(result, indent=2)
    assert result["compatible"] is True
    assert result["missing_exports"] == []
    assert result["missing_behavior_markers"] == []
    assert result["binding_preserved"] is True
    assert result["migration_preserved"] is True


def test_recovery_provenance_is_public_historical_lineage_not_private_corpus():
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    recovery = contract["recovery"]
    assert recovery["status"] == "BEHAVIOR_SOURCE_RECOVERED"
    assert recovery["source_repo"] == "medicinalElJefe/OMEGAv6"
    assert recovery["r32_commit"] == "d7cbbfe166baf04a42dc7a50d13776ac33ef742b"
    assert recovery["r33_commit"] == "ca0660a128f8df88375a9f8e27931c94208c159b"
