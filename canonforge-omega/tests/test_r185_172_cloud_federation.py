from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CLOUD = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "swarm" / "cloudSwarmR185.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-r185-live-172-cloud-proof.yml"
VERIFIER = ROOT / "scripts" / "verify_r185_live_federation.py"


def test_r185_declares_exactly_172_addressable_cloud_nodes():
    source = CLOUD.read_text(encoding="utf-8")
    assert 'CLOUD_SWARM_NODE_COUNT_R185 = 172' in source
    assert 'CLOUD_SWARM_WAVE_SIZE_R185 = 12' in source
    assert 'OMEGA_172_CLOUD_FEDERATION_R185' in source
    assert '172 independently named OmegaSwarmCell Durable Object instances' in source
    assert 'separateCloudProviderInstanceClaim: false' in source
    assert 'canonicalMutation: false' in source


def test_r185_cloud_nodes_have_distinct_human_machine_and_task_links():
    source = CLOUD.read_text(encoding="utf-8")
    assert 'public: `${origin}/cloud/${rid}`' in source
    assert 'machine: `${origin}/api/clouds/r185/node/${rid}`' in source
    assert 'task: `${origin}/api/clouds/r185/node/${rid}/task`' in source
    assert 'omega-cloud-r185-${String(n).padStart(3, "0")}' in source
    assert 'binary parent/child command spine' in source
    assert '172-node continuity ring' in source
    assert 'same-column four-stratum peer mesh' in source


def test_r185_full_swarm_executes_in_bounded_waves_and_carries_receipts():
    source = CLOUD.read_text(encoding="utf-8")
    assert 'OMEGA_CLOUD_WAVE_RECEIPT_R185' in source
    assert 'CONTINUE_NEXT_WAVE' in source
    assert 'R183 successor comparison -> R184 exact design discovery' in source
    assert 'R185_DISTRIBUTED_EXECUTION_RECEIPT_NOT_CANON' in source
    assert 'full172Complete' in source


def test_r185_routes_are_first_class_in_the_canonical_worker():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'handleCloudSwarmR185' in entry
    assert 'url.pathname === "/cloud"' in entry
    assert 'url.pathname.startsWith("/cloud/")' in entry
    assert 'url.pathname.startsWith("/api/clouds/r185/")' in entry


def test_r185_live_proof_checks_every_advertised_node_after_release_forward():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    verifier = VERIFIER.read_text(encoding="utf-8")
    assert 'OMEGA V6 R185 live 172-cloud proof' in workflow
    assert 'workflows: ["OMEGA V6 release-forward exact-head production"]' in workflow
    assert 'github.event.workflow_run.conclusion == \'success\'' in workflow
    assert 'verify_r185_live_federation.py' in workflow
    assert '/api/clouds/r185/manifest' in verifier
    assert 'NODE_COUNT = 172' in verifier
    assert 'links = node.get("links") or {}' in verifier
    assert 'runtime.get("reachable") is True' in verifier
    assert 'manifest_after.get("manifestSha256") == manifest_sha' in verifier
    assert 'prove_identity(base, expected_sha)' in verifier


def test_r185_wrangler_identity_is_explicit():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'CLOUD_SWARM_R185_ID = "r185-172-addressable-durable-cloud-federation"' in wrangler
