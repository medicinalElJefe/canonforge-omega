from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
WORKER=ROOT/"cloudflare"/"omega-v6-worker"
SRC=WORKER/"src"
SYSTEM=SRC/"system"
ENTRY=SRC/"runtimeEntryR169.ts"
WRANGLER=WORKER/"wrangler.toml"
ROUTER=SYSTEM/"driveCorpusSystemR194.ts"
SNAPSHOT=SYSTEM/"driveCorpusSnapshotR194.ts"
R194=SRC/"acceptance"/"cumulativeCapabilityR194.ts"
R193=SRC/"workspaceManifestR193.ts"
NAV194=SYSTEM/"oneSystemNavigationR194.ts"
EXPECTED="d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746"

def text(path:Path)->str:return path.read_text(encoding="utf-8")
def nk(v:str)->str:return re.sub(r"[^a-z0-9]","",v.lower())

def snapshot():
    encoded=""
    for i in range(5):
        source=text(SYSTEM/f"r194SnapshotChunk{i}.ts")
        m=re.fullmatch(r'export default "([A-Za-z0-9+/=]+)";\n?',source)
        assert m,f"invalid immutable chunk {i}"
        encoded+=m.group(1)
    raw=gzip.decompress(base64.b64decode(encoded,validate=True))
    assert hashlib.sha256(raw).hexdigest()==EXPECTED
    return raw,json.loads(raw)

def table(data:dict,*aliases:str):
    wanted={nk(x) for x in aliases}
    for key,value in data.items():
        if nk(str(key)) in wanted and isinstance(value,list): return value
    raise AssertionError(f"missing {aliases}; keys={list(data)}")

def value(row:dict,*aliases:str):
    wanted={nk(x) for x in aliases}
    for key,val in row.items():
        if nk(str(key)) in wanted:return val
    return None

def test_snapshot_lossless_and_contract_complete():
    raw,data=snapshot();assert len(raw)>100_000
    assert len(table(data,"registry","softwareRegistry","software"))==100
    assert len(table(data,"menus","menuOptions","menu"))>=36
    assert len(table(data,"capabilities","capabilityRows","capability"))>=18
    assert len(table(data,"runtimeWiring","wiring","runtime"))>=16
    assert len(table(data,"acceptanceGates","gates","proofGates"))>=12
    assert len(table(data,"capacityAddressIndex","addressIndex","capacity"))>=144
    assert len(table(data,"implementationSequence","implementation","milestones"))>=16

def test_registry_preserves_keep_merge_donor_exactly():
    _,data=snapshot();rows=table(data,"registry","softwareRegistry","software");counts={}
    for row in rows:
        key=str(value(row,"Disposition") or "").strip().upper();counts[key]=counts.get(key,0)+1
    assert counts=={"KEEP":63,"MERGE":26,"DONOR":11}

def test_calculus_and_truth_boundaries_are_not_display_claims():
    router=text(ROUTER)
    assert 'MODE188_FORMULA_R194 = "S188=CΩ/(Λ+q+0.35Λq+0.05)"' in router
    assert "continuity / denominator" in router
    assert "No STAY/TURN/ESCALATE threshold is invented" in router
    for marker in ("chartedIsNotExecuted:true","visualIsNotExecutionProof:true","modelOutputIsNotCanonState:true","reducedOrderTmmIsNotFullWaveValidation:true","pcOnlineRequiresAuthenticatedHeartbeat:true","externalReachabilityIsNotWriteAuthority:true","donorRequiresAdmission:true"):
        assert marker in router
    assert "[37,73]" in router
    assert "not literal physical dimensions" in router

def test_one_system_routes_real_specialists_and_returns_receipts():
    router=text(ROUTER)
    for marker in ('"/system"','"/api/system/r194/manifest"','"/api/system/r194/status"','"/api/system/r194/execute"','"/api/system/r194/analyze"','"/api/compute/relativity/event"','"/api/compute/optics/tmm"','"/api/compute/continuity/transfer"','"/api/compute/wave/fdtd1d"','"/api/sai/query"','"/api/intelligence/r179/cloud"','"/api/intelligence/r179/fuse"','OMEGA_ONE_SYSTEM_EXECUTION_RECEIPT_R194','EXECUTE + RETURN RECEIPT','RECOVERED DRIVE CORPUS'):
        assert marker in router
    assert "R194 routes to existing specialist authority; it does not replace it" in router
    assert "canonicalMutation:true" not in router

def test_r194_preserves_r192_navigation_r193_workspace_and_all_inherited_dispatch():
    entry=text(ENTRY);workspace=text(R193);nav=text(NAV194)
    assert 'release: "r193-full-restoration-workspace"' in workspace
    assert 'ONE_SYSTEM_NAVIGATION_RELEASE_R194 = "r194-drive-corpus-one-system"' in nav
    assert 'data-r194-one-system="true"' in nav
    for marker in ("handleDriveCorpusSystemR194","handleCumulativeCapabilityR194","handleWorkspaceManifestR193","handleUniversalSurfaceFabricR191","handleWholeInstrumentR189","handleWholeSystemAcceptanceR190","handleSaiAiFusionR179","handleComputeRequest","handleValidationRequest","handleFederatedOrganRequest","handleSwarmRequest","enhanceUniversalNavigationR192","enhanceUniversalWorkspaceR193","enhanceOneSystemNavigationR194","return canonical.fetch(request, env, ctx)"):
        assert marker in entry
    assert "const r192 = await enhanceUniversalNavigationR192" in entry
    assert "const r193 = await enhanceUniversalWorkspaceR193" in entry

def test_r194_cumulative_truth_extends_r191_63_to_64_and_records_r193_predecessor():
    r=text(R194)
    assert 'CUMULATIVE_SCHEMA_R194 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R194"' in r
    assert 'cumulativeCapabilityManifestR191' in r
    assert 'WORKSPACE_MANIFEST_R193' in r
    assert 'predecessor.totalCapabilityGroups===63' in r
    assert 'predecessor.predecessorCapabilityGroups===62' in r
    assert 'predecessor.totalCapabilityGroups+R194_CURRENT_ORGANS.length' in r
    assert 'canonicalMutation:false' in r and 'promotionAuthorized:false' in r

def test_release_identity_and_namespaces_are_additive_only():
    w=text(WRANGLER)
    for marker in ('BUILD_ID = "r87-semantic-edge-settle-proof"','UNIVERSAL_SURFACE_FABRIC_R191_ID = "r191-universal-surface-fabric"','UNIVERSAL_NAVIGATION_R192_ID = "r192-navigation-home-repair"','UNIVERSAL_WORKSPACE_R193_ID = "r193-full-restoration-workspace"','DRIVE_CORPUS_ONE_SYSTEM_R194_ID = "r194-drive-corpus-one-system"',f'DRIVE_CORPUS_SHA256_R194 = "{EXPECTED}"'):
        assert marker in w
    for binding in ('name = "OMEGA_RUNTIME"','name = "OMEGA_SWARM_CELL"','name = "OMEGA_SWARM_COORDINATOR"','name = "OMEGA_SWARM_BRANCH"','name = "OMEGA_SWARM_ORGAN"','name = "OMEGA_SWARM_ORGANISM"','name = "OMEGA_SWARM_AUTONOMIC"','binding = "GENESIS"','binding = "OMEGA_GENESIS_MACHINE"','binding = "OMEGA_OPTICAL_MACHINE"'):
        assert binding in w

def test_decoder_verifies_uncompressed_corpus_before_json_admission():
    d=text(SNAPSHOT)
    assert "crypto.subtle.digest" in d
    assert "R194_DRIVE_CORPUS_HASH_MISMATCH" in d
    assert 'DecompressionStream("gzip")' in d
    assert EXPECTED in d
