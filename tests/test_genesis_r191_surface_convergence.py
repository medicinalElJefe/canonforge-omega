from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES

ROOT = Path(__file__).resolve().parents[1]
CONVERGENCE = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "convergence.js"
CATALOG = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "catalog.js"
WRANGLER = ROOT / "cloudflare" / "omega-genesis-worker" / "wrangler.toml"


def test_genesis_r191_preserves_role_separation_and_routes_screen_to_machine_organ():
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'role:"GENESIS_DISCOVERY_EVOLUTION_AUTHORITY"' in source
    assert 'federation_verb:"PROPOSE"' in source
    assert 'canonical_authority:"OMEGA_V6_ONLY"' in source
    assert 'may_mutate_global_canon_state:false' in source
    assert 'may_promote_v6:false' in source
    assert 'may_claim_vercel_same_url_promotion:false' in source
    assert 'OPTICAL_MACHINE_URL="https://omega-optical-machine-r115.jeffdeweyeljefe.workers.dev"' in source
    assert 'OPTICAL_HUMAN_URL="https://omega-living-light-etching-private-woven2.vercel.app"' in source
    assert '"omega-optical":{verb:"SCREEN",url:OPTICAL_MACHINE_URL+"/",human_surface:OPTICAL_HUMAN_URL+"/",scope:"WORKER_RETURN_PACKET_ONLY"}' in source
    assert 'global_canonical_authority:"omega-v6"' in source
    assert 'genesis_may_deploy_v6:false' in source


def test_genesis_observes_canonical_r191_without_copying_authority():
    source = CONVERGENCE.read_text(encoding="utf-8")
    for marker in (
        'R191_FABRIC_URL=V6_URL+"/api/fabric/r191/status"',
        'R191_CANON_URL=V6_URL+"/api/canon/r191/manifest"',
        'schema:"OMEGA_GENESIS_SURFACE_FABRIC_OBSERVER_R191"',
        '"/api/fabric/r191"',
        '"/_omega/fabric/r191"',
        'canonical_git_sha:canonicalSha',
        'canonical_capability_groups:canonicalGroups',
        'canonical_fabric_ready:fabric.body?.canonicalFabricReady===true',
        'everywhere_promotion_proved:fabric.body?.everywherePromotionProved===true',
        'x-omega-authority":"genesis-r191-observer-only"',
    ):
        assert marker in source
    assert 'Reachability does not imply write authority, execution proof, or Canon admission.' in source


def test_genesis_r191_surface_bar_is_additive_responsive_and_non_authoritative():
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'id="omega-r191-genesis-bar"' in source
    assert 'GENESIS · PROPOSE' in source
    assert 'R191 surface-aware · Canon remains OMEGA V6' in source
    assert 'href="${V6_URL}/fabric"' in source
    assert 'href="${V6_URL}/instrument"' in source
    assert 'href="${V6_URL}/truth"' in source
    assert '@media(max-width:620px)' in source
    assert 'if(!html.includes("live-phase-visual.js"))' in source
    assert 'if(!html.includes("omega-r191-genesis-bar"))' in source


def test_genesis_r191_keeps_existing_durable_object_and_build_identity():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'name = "omega-genesis-v1"' in wrangler
    assert 'main = "src/convergence.js"' in wrangler
    assert 'name = "OMEGA_STATE"' in wrangler
    assert 'class_name = "OmegaGenesisState"' in wrangler
    assert 'BUILD_ID = "omega-genesis-v1-convergence-g2"' in wrangler
    assert 'GENESIS_SURFACE_FABRIC_R191_ID = "r191-genesis-surface-observer"' in wrangler


def test_genesis_r191_is_registered_as_measurable_live_core_capability():
    cap = next(item for item in CAPABILITIES if item["id"] == "CAP-033")
    assert cap == {
        "id": "CAP-033",
        "name": "R191 universal surface observer and machine-screen authority alignment",
        "menu": "02 Proof & Governance",
        "gate": "Canonical R191 observation + Optical SCREEN machine routing + no cross-runtime promotion",
        "status": "LIVE_CORE",
    }
    catalog = CATALOG.read_text(encoding="utf-8")
    assert 'id:"CAP-033"' in catalog
    assert 'name:"R191 universal surface observer and machine-screen authority alignment"' in catalog
    assert 'status:"LIVE_CORE"' in catalog
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'surfaceFabricSnapshot' in source
    assert 'optical_machine_authority:opticalAuthority' in source
    assert 'may_promote_v6:false' in source
