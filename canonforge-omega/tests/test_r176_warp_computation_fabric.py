from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
WARP = WORKER / "src" / "swarm" / "warpComputationR176.ts"
LAB = WORKER / "src" / "swarm" / "warpComputationLabR176.ts"
ENTRY = WORKER / "src" / "runtimeEntryR169.ts"
WRANGLER = WORKER / "wrangler.toml"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r176_profiles_scale_to_exact_existing_swarm_capacity():
    source = text(WARP)
    assert 'PULSE: { cells: 12' in source
    assert 'FLOCK: { cells: 24' in source
    assert 'ORGAN: { cells: 144' in source
    assert 'WARP: { cells: 576' in source
    assert 'FULL: { cells: 1728' in source
    assert 'maximumCoordinatorShards: 12' in source
    assert 'inheritedBatchSizePerCoordinator: 24' in source
    assert 'dispatchFanoutCeilingFromCodePath: 288' in source
    assert 'observedThroughputClaim: false' in source


def test_r176_twelve_modulo_shards_form_a_disjoint_1728_cell_partition():
    universe = set(range(1728))
    shards = [{i for i in universe if i % 12 == residue} for residue in range(12)]
    assert all(len(shard) == 144 for shard in shards)
    assert set().union(*shards) == universe
    for a in range(12):
        for b in range(a + 1, 12):
            assert shards[a].isdisjoint(shards[b])


def test_r176_uses_existing_durable_coordinators_and_cells_instead_of_fake_visual_state():
    source = text(WARP)
    assert 'env.OMEGA_SWARM_COORDINATOR' in source
    assert 'binding.get(binding.idFromName(name))' in source
    assert '"https://warp-coordinator.internal/missions"' in source
    assert '"/tick"' in source
    assert 'Promise.all(refs.map(ref => fetchChild(env, ref, tick)))' in source
    assert 'resultMerkleRoot' in source
    assert 'WARP_EXECUTION_RECEIPT_NOT_CANON' in source
    assert 'performanceGuaranteeClaim: false' in source
    assert 'physicalDimensionClaim: false' in source
    assert 'faster-than-light' in source


def test_r176_build_warp_uses_expand_prune_audit_recover_preference():
    source = text(WARP)
    assert 'if (purpose === "BUILD") return [0, 1, 10, 11' in source
    assert 'SWARM_REGULATION_ROLES[residue]' in source
    assert 'seedLabelForResidue' in source
    assert 'stableSeed(`${intent}|${label}`) % 12 === residue' in source


def test_r176_is_additively_mounted_before_generic_swarm_router():
    entry = text(ENTRY)
    warp_route = entry.index('url.pathname.startsWith("/api/swarm/warp/")')
    generic_route = entry.index('url.pathname.startsWith("/api/swarm/")')
    assert warp_route < generic_route
    assert 'url.pathname === "/warp"' in entry
    assert 'handleWarpComputationRequest' in entry
    assert 'warpComputationLabResponse' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r176_operator_surface_exposes_real_launch_tick_status_cycle():
    lab = text(LAB)
    assert 'OMEGA · R176 · WARP COMPUTATION FABRIC' in lab
    assert 'FULL · 1728' in lab
    assert '/api/swarm/warp/manifest' in lab
    assert '/api/swarm/warp/launch' in lab
    assert '/api/swarm/warp/tick' in lab
    assert '/api/swarm/warp/status' in lab
    assert 'AUTO-ADVANCE' in lab
    assert 'RETURNED_NOT_ADMITTED' in lab


def test_r176_release_identity_is_registered_without_new_durable_object_migration():
    wrangler = text(WRANGLER)
    assert 'WARP_COMPUTATION_ID = "r176-sharded-warp-computation"' in wrangler
    assert 'name = "OMEGA_SWARM_COORDINATOR"' in wrangler
    assert 'class_name = "OmegaSwarmCoordinator"' in wrangler
    assert '[[migrations]]' not in wrangler
