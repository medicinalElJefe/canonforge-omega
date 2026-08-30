from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

from .graph import reference_graph_summary
from .system_manifest import manifest, summary as manifest_summary


def quality_snapshot(runtime: Any, state_path: Path) -> dict[str, object]:
    families = manifest()
    graph = reference_graph_summary()
    checks = {
        "manifest_24_families": bool(manifest_summary()["complete_manifest"]),
        "canonical_state_digest_present": len(runtime.state.digest) == 64,
        "proof_chain_valid": runtime.ledger.verify(),
        "graph_nodes_20736": graph.node_count == 20736,
        "graph_edges_145152": graph.directed_edge_count == 145152,
        "state_address_roundtrip": runtime.state.address.__class__.from_index(runtime.state.address.index) == runtime.state.address,
        "persistent_state_parent_exists": state_path.parent.exists(),
        "no_family_missing_boundary": all(bool(f.evidence_boundary.strip()) for f in families),
        "no_family_missing_authority": all(bool(f.authority.strip()) for f in families),
    }
    return {
        "pass": all(checks.values()),
        "checks": checks,
        "state_digest": runtime.state.digest,
        "graph": asdict(graph),
        "manifest": manifest_summary(),
        "boundary": "runtime self-audit verifies software invariants only; target Windows/GPU and external source adapters require their own acceptance evidence",
    }
