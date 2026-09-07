from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
WRANGLER = WORKER / "wrangler.toml"
ENTRY = SRC / "runtimeEntryR169.ts"
FABRIC = SRC / "federation" / "universalSurfaceFabricR191.ts"
R191 = SRC / "acceptance" / "cumulativeCapabilityR191.ts"
R190 = SRC / "acceptance" / "cumulativeCapabilityR190.ts"
WHOLE = SRC / "wholeInstrumentR189.ts"
VERCEL = ROOT / "vercel" / "omega-r191-universal-surface"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r191_is_additive_and_preserves_protected_runtime_identities():
    wrangler = text(WRANGLER)
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'MOTION_TIME_R188_ID = "r188-synchronous-12-phase-motion-barrier"' in wrangler
    assert 'WHOLE_INSTRUMENT_R189_ID = "r189-whole-instrument-convergence"' in wrangler
    assert 'WHOLE_SYSTEM_ACCEPTANCE_R190_ID = "r190-capability-truth-admission"' in wrangler
    assert 'CAPABILITY_TRUTH_R190_ID = "r190-implemented-route-invoked-returned-verified"' in wrangler
    assert 'UNIVERSAL_SURFACE_FABRIC_R191_ID = "r191-universal-surface-fabric"' in wrangler
    for binding in (
        'name = "OMEGA_RUNTIME"',
        'name = "OMEGA_SWARM_CELL"',
        'name = "OMEGA_SWARM_COORDINATOR"',
        'name = "OMEGA_SWARM_BRANCH"',
        'name = "OMEGA_SWARM_ORGAN"',
        'name = "OMEGA_SWARM_ORGANISM"',
        'name = "OMEGA_SWARM_AUTONOMIC"',
        'binding = "GENESIS"',
        'binding = "OMEGA_GENESIS_MACHINE"',
        'binding = "OMEGA_OPTICAL_MACHINE"',
    ):
        assert binding in wrangler


def test_r191_dispatcher_adds_unique_routes_without_shadowing_inherited_organs():
    entry = text(ENTRY)
    assert 'handleUniversalSurfaceFabricR191' in entry
    assert 'handleCumulativeCapabilityR191' in entry
    assert 'handleWholeInstrumentR189' in entry
    assert 'handleWholeSystemAcceptanceR190' in entry
    assert 'handleComputeRequest' in entry
    assert 'handleValidationRequest' in entry
    assert 'handleFederatedOrganRequest' in entry
    assert 'handleSwarmRequest' in entry
    assert 'handleSaiRequest' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry
    assert 'url.pathname.startsWith("/api/canon/r189/")' in entry
    assert '"/api/canon/r190/manifest"' in entry


def test_r191_surface_fabric_separates_reachability_write_authority_and_proof():
    fabric = text(FABRIC)
    for marker in (
        'UNIVERSAL_SURFACE_FABRIC_RELEASE_R191 = "r191-universal-surface-fabric"',
        'OMEGA_UNIVERSAL_SURFACE_FABRIC_R191',
        'https://omegav6.jeffdeweyeljefe.workers.dev/',
        'https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/',
        'https://omega-genesis-machine-r115.jeffdeweyeljefe.workers.dev/',
        'https://omega-optical-machine-r115.jeffdeweyeljefe.workers.dev/',
        'https://omega-living-light-etching-private-woven2.vercel.app/',
        'https://omega-sovereign-convergence.foundasound.chatgpt.site/',
        '"/fabric"',
        '"/api/fabric/r191/manifest"',
        '"/api/fabric/r191/status"',
        'VERCEL_PROJECT_WRITE_ACCESS_REQUIRED',
        'everywherePromotionProved: false',
        'sameUrlPromotionAuthorized: false',
        'PC ONLINE requires a current authenticated Sovereign heartbeat',
        'screening is not RCWA/FDTD/FEM validation',
        'visual state is not execution proof',
        'model output is not CanonState',
    ):
        assert marker in fabric
    assert 'canonicalMutation: true' not in fabric
    assert 'addressHierarchy: [12, 144, 1728, 20736, 248832]' in fabric
    assert 'not literal physical dimensions' in fabric


def test_r191_extends_r190_62_group_canon_to_exactly_63_without_rewriting_history():
    r190 = text(R190)
    r191 = text(R191)
    assert 'CUMULATIVE_SCHEMA_R190 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R190"' in r190
    assert 'CUMULATIVE_SCHEMA_R191 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R191"' in r191
    assert 'import { cumulativeCapabilityManifestR190 } from "./cumulativeCapabilityR190"' in r191
    assert 'id: "R191_UNIVERSAL_SURFACE_FABRIC"' in r191
    assert 'predecessor.totalCapabilityGroups === 62' in r191
    assert 'predecessor.predecessorCapabilityGroups === 61' in r191
    assert 'predecessor.totalCapabilityGroups + R191_CURRENT_ORGANS.length' in r191
    assert 'currentOrganCount: R191_CURRENT_ORGANS.length' in r191
    assert 'canonicalMutation: false' in r191
    assert 'promotionAuthorized: false' in r191


def test_r191_is_reachable_from_existing_whole_instrument_without_changing_r189_counts():
    whole = text(WHOLE)
    assert '<a class="btn" href="/fabric">Surface Fabric</a>' in whole
    assert 'EXTENSION_CAPABILITY_IDS_R189.length === 37' in whole
    assert 'BASE_FAMILY_IDS_R189.length === 24' in whole
    assert 'protectedBaseIdentity: "r87-semantic-edge-settle-proof"' in whole


def test_r191_vercel_mirror_is_deploy_ready_but_does_not_claim_same_url_promotion():
    index = text(VERCEL / "index.html")
    config = text(VERCEL / "vercel.json")
    assert 'https://omegav6.jeffdeweyeljefe.workers.dev/api/fabric/r191/status' in index
    assert 'CANON REMAINS OMEGA V6' in index
    assert 'does not grant Vercel write authority' in index
    assert 'Vercel same-URL promotion is not proved' in index
    assert '"rewrites"' in config
    assert '"X-Content-Type-Options"' in config
    assert '"X-Frame-Options"' in config
