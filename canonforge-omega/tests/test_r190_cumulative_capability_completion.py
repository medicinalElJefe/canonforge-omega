from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R189 = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "cumulativeCapabilityR189.ts"
R190 = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "acceptance" / "cumulativeCapabilityR190.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WHOLE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "wholeInstrumentR189.ts"


def test_r190_extends_r189_cumulative_canon_without_rewriting_it():
    r189 = R189.read_text(encoding="utf-8")
    r190 = R190.read_text(encoding="utf-8")
    assert 'CUMULATIVE_SCHEMA_R189 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R189"' in r189
    assert 'CUMULATIVE_SCHEMA_R190 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R190"' in r190
    assert 'import { cumulativeCapabilityManifestR189 } from "../cumulativeCapabilityR189"' in r190
    assert 'id: "R190_CAPABILITY_TRUTH_ADMISSION"' in r190
    assert "predecessorTotal === 61" in r190
    assert "predecessorTotal + R190_CURRENT_ORGANS.length" in r190
    assert 'currentCanon: "R189_61_PROTECTED_GROUPS_PLUS_R190_CAPABILITY_TRUTH_ORGAN"' in r190
    assert "canonicalMutation: false" in r190
    assert "promotionAuthorized: false" in r190


def test_r190_dispatcher_exposes_read_only_cumulative_manifest_beside_r189():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'from "./acceptance/cumulativeCapabilityR190"' in entry
    assert '"/api/canon/r190/manifest"' in entry
    assert "cumulativeCapabilityManifestR190()" in entry
    assert 'url.pathname.startsWith("/api/canon/r189/")' in entry
    assert "handleCumulativeCapabilityR189(request)" in entry
    assert "METHOD_NOT_ALLOWED" in entry


def test_r189_whole_instrument_remains_complete_predecessor_under_r190():
    whole = WHOLE.read_text(encoding="utf-8")
    assert 'protectedBaseIdentity: "r87-semantic-edge-settle-proof"' in whole
    assert "cumulativeCapabilityCoverageComplete: coverage.complete" in whole
    assert "EXTENSION_CAPABILITY_IDS_R189.length === 37" in whole
    assert 'schema: "OMEGA_R189_CUMULATIVE_SURFACE_COVERAGE_v1"' in whole
    assert '"SYNCHRONIZED_BARRIER_R188"' not in whole or "EXECUTION_REGIMES_R189" in whole
