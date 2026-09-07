from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WHOLE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "wholeInstrumentR189.ts"
CUMULATIVE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "cumulativeCapabilityR189.ts"
VERIFY = ROOT.parent / ".github" / "workflows" / "omega-v6-verify.yml"


def _extension_ids(source: str) -> set[str]:
    start = source.index("export const EXTENSION_CAPABILITY_IDS_R189")
    end = source.index("] as const;", start)
    block = source[start:end]
    return set(re.findall(r'"(R\d+(?:_R\d+)?_[A-Z0-9_]+)"', block))


def _mapped_ids(source: str) -> set[str]:
    return set(re.findall(r"^\s{2}(R\d+(?:_R\d+)?_[A-Z0-9_]+): \[", source, flags=re.MULTILINE))


def test_r189_whole_instrument_maps_every_admitted_extension_organ():
    cumulative = CUMULATIVE.read_text(encoding="utf-8")
    whole = WHOLE.read_text(encoding="utf-8")
    extensions = _extension_ids(cumulative)
    mapped = _mapped_ids(whole)
    assert len(extensions) == 37
    assert mapped == extensions
    assert "unmappedExtensionOrgans" in whole
    assert "invalidDomainMappings" in whole
    assert "cumulativeCapabilityCoverageComplete: coverage.complete" in whole


def test_r189_whole_instrument_exposes_cumulative_counts_regimes_and_coverage_endpoint():
    whole = WHOLE.read_text(encoding="utf-8")
    assert 'from "./cumulativeCapabilityR189"' in whole
    assert "BASE_FAMILY_IDS_R189" in whole
    assert "EXTENSION_CAPABILITY_IDS_R189" in whole
    assert "EXECUTION_REGIMES_R189" in whole
    assert 'protectedBaseIdentity: "r87-semantic-edge-settle-proof"' in whole
    assert '"/api/instrument/r189/coverage"' in whole
    assert '"/api/canon/r189/manifest"' in whole
    assert '"/api/canon/r189/regimes"' in whole
    assert "totalCapabilityGroups" in whole
    assert "248832" in whole


def test_r189_live_gate_preserves_inherited_identity_and_proves_additive_whole_instrument():
    verify = VERIFY.read_text(encoding="utf-8")
    assert "EXPECTED_BUILD: r87-semantic-edge-settle-proof" in verify
    assert "Edge not settled on expected role-separated V3 identity yet" in verify
    assert "R189_WHOLE_INSTRUMENT_CONVERGENCE" in verify
    assert "api/instrument/r189/manifest" in verify
    assert "cumulativeCapabilityCoverageComplete" in verify
    assert "totalCapabilityGroups" in verify
