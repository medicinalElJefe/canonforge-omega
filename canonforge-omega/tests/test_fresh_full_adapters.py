from pathlib import Path

from omega_runtime import Address20736, EvidenceClass, StateEnvelope, StateMetrics, OmegaRuntime
from omega_runtime.audio import state_to_sonification, pcm16
from omega_runtime.bio import BioNode, BioScale, validate_chain
from omega_runtime.earth import GeoPoint, geodetic_to_ecef, local_enu
from omega_runtime.graph import reference_graph_summary
from omega_runtime.proof import ProofLedger
from omega_runtime.quality import quality_snapshot
from omega_runtime.state_store import StateStore
from omega_runtime.system_manifest import FamilyStatus, manifest, summary


def test_full_manifest_has_exact_24_families_and_no_planned_placeholders():
    families = manifest()
    assert len(families) == 24
    assert {f.family_id for f in families} == {f"F{i:02d}" for i in range(24)}
    assert summary()["complete_manifest"] is True
    assert all(f.evidence_boundary for f in families)
    assert all(f.status in set(FamilyStatus) for f in families)


def test_earth_wgs84_transform_is_finite_and_local_zero():
    p = GeoPoint(32.2217, -110.9265, 728.0)
    ecef = geodetic_to_ecef(p)
    assert all(abs(v) > 0 for v in (ecef.x_m, ecef.y_m, ecef.z_m))
    assert local_enu(p, p) == (0.0, 0.0, 0.0)


def test_bio_traversal_requires_contiguous_scale_and_parent_chain():
    nodes = [
        BioNode(BioScale.ORGANISM, "body", "fixture", "IMPORTED"),
        BioNode(BioScale.ORGAN, "heart", "fixture", "IMPORTED", parent_label="body"),
        BioNode(BioScale.TISSUE, "muscle", "fixture", "IMPORTED", parent_label="heart"),
        BioNode(BioScale.CELL, "cell", "fixture", "IMPORTED", parent_label="muscle"),
    ]
    result = validate_chain(nodes)
    assert result["valid"] is True
    bad = validate_chain([nodes[0], nodes[2]])
    assert bad["valid"] is False


def test_audio_is_deterministic_derived_sonification():
    spec1 = state_to_sonification(0.8, 0.2, 4, duration_s=0.02)
    spec2 = state_to_sonification(0.8, 0.2, 4, duration_s=0.02)
    assert spec1 == spec2
    data = pcm16(spec1)
    assert len(data) == int(spec1.duration_s * spec1.sample_rate) * 2
    assert any(data)


def test_reference_graph_contract_remains_exact():
    g = reference_graph_summary()
    assert g.node_count == 20736
    assert g.directed_edge_count == 145152
    assert g.shell_edges_per_node == 6
    assert g.antipode_edges_per_node == 1


def test_quality_snapshot_is_real_invariant_check(tmp_path: Path):
    state_path = tmp_path / "state" / "canonical.json"
    rt = OmegaRuntime(
        StateEnvelope(address=Address20736(1,1,1,1), evidence_class=EvidenceClass.DERIVED,
            metrics=StateMetrics(continuity=1.0, burden=0.2, contradiction=0.1, future_plasticity=0.5)),
        ProofLedger(tmp_path / "ledger" / "proof.jsonl"),
        StateStore(state_path),
    )
    snap = quality_snapshot(rt, state_path)
    assert snap["pass"] is True
    assert all(snap["checks"].values())
