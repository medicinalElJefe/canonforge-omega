from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPAIR = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "acceptance" / "r190AcceptanceRepair.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"

SOVEREIGN_IDS = {
    "CANONICAL_STATE",
    "PROOF_LEDGER",
    "RESTORATION_RECOVERY",
    "EARTH_SOURCE_BOUNDARY",
}


def source() -> str:
    return REPAIR.read_text(encoding="utf-8")


def test_repair_is_additive_and_dispatcher_bound_beneath_r191():
    assert REPAIR.exists()
    repair = source()
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'R190_ACCEPTANCE_REPAIR_ID = "r190-sovereign-boundary-classification-repair"' in repair
    assert 'from "./wholeSystemAcceptanceR190"' in repair
    assert 'from "./acceptance/r190AcceptanceRepair"' in entry
    assert "handleWholeSystemAcceptanceR190Repaired(request, env, ctx, runtimeFetch)" in entry
    assert "handleUniversalSurfaceFabricR191(request, env)" in entry
    assert "handleCumulativeCapabilityR191(request)" in entry
    assert entry.index("handleUniversalSurfaceFabricR191(request, env)") < entry.index("handleWholeSystemAcceptanceR190Repaired")


def test_cloud_quick_gate_excludes_only_declared_sovereign_backed_capabilities():
    repair = source()
    for capability in SOVEREIGN_IDS:
        assert f'"{capability}"' in repair
    assert "repaired.requiredQuick = false" in repair
    assert "repaired.requiredFull = true" in repair
    assert "cloudQuickExcludesSovereignBackedCapabilities" in repair
    assert "fullAcceptanceStillRequiresSovereignBackedCapabilities: true" in repair


def test_transient_sovereign_unavailability_is_blocked_not_verified():
    repair = source()
    for status in (0, 502, 503, 504):
        assert str(status) in repair
    assert 'repaired.state = "BLOCKED_SOVEREIGN_AUTHORITY_UNAVAILABLE"' in repair
    assert "repaired.verified = false" in repair
    assert 'state.startsWith("FAILED_RETURN")' in repair
    assert 'state.startsWith("FAILED_INVOCATION")' in repair
    assert "TRANSIENT_EXTERNAL_STATUSES.has" in repair


def test_successful_but_invalid_contract_still_hard_fails():
    repair = source()
    assert "hardFailures = required.filter" in repair
    assert 'String(capability.state || "").startsWith("FAILED")' in repair
    assert "invalidSuccessfulResponsesRemainHardFailures: true" in repair
    assert "const status = repaired.summary?.hardFailures ? 503 : 200" in repair


def test_repair_cannot_claim_external_execution_or_promote():
    repair = source()
    assert "canonicalMutation: false" in repair
    assert "promotionAuthorized: false" in repair
    assert "BLOCKED_SOVEREIGN_AUTHORITY_UNAVAILABLE" in repair
    assert "FULL_SYSTEM_VERIFIED" in repair
    assert "EXTERNAL_PROOF_BLOCKED" in repair


def test_protected_r87_build_identity_remains_unchanged():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
