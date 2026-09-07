from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WHOLE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "wholeInstrumentR189.ts"
CUMULATIVE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "cumulativeCapabilityR189.ts"
RELEASE = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"


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


def test_r189_is_preserved_inside_the_current_cumulative_release_chain():
    release = RELEASE.read_text(encoding="utf-8")
    whole = WHOLE.read_text(encoding="utf-8")
    assert "python -m pytest -q" in release
    assert "Re-prove exact canonical suite" in release
    assert "/api/system/r205/manifest" in release
    assert "/api/system/r211/manifest" in release
    assert "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205" in release
    assert "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211" in release
    assert "verify_r185_live_federation.py" in release
    assert "R189_WHOLE_INSTRUMENT_CONVERGENCE" in whole
    assert "cumulativeCapabilityCoverageComplete" in whole
    assert "protectedBaseIdentityPreserved" in whole
    assert "OMEGA_EXECUTION_REGIME_PORTFOLIO_R189" in whole
