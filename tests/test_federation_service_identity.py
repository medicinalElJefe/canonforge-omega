from pathlib import Path

from omega_genesis.federation_identity import (
    ACTIVE_OPTICAL_GENERATION,
    ACTIVE_OPTICAL_SERVICE,
    CANONICAL_V6_PUBLIC_ORIGIN,
    CANONICAL_V6_SERVICE,
    verify_worker_service_bindings,
)

ROOT = Path(__file__).resolve().parents[1]
WRANGLER = ROOT / "cloudflare" / "omega-genesis-worker" / "wrangler.toml"


def test_current_genesis_service_bindings_resolve_to_declared_canonical_peers():
    result = verify_worker_service_bindings(WRANGLER)
    assert result["ok"] is True, result
    assert result["canonical_v6_service"] == "omegav6"
    assert result["canonical_v6_public_origin"] == "https://omegav6.jeffdeweyeljefe.workers.dev"
    assert result["active_optical_service"] == "omega-optical-machine-r1532"
    assert result["active_optical_generation"] == "R153.2"
    assert result["bindings"]["OMEGA_V6"] == CANONICAL_V6_SERVICE
    assert result["bindings"]["OMEGA_OPTICAL"] == ACTIVE_OPTICAL_SERVICE
    assert "omega-v6-full-convergence" not in result["bindings"].values()
    assert ACTIVE_OPTICAL_GENERATION == "R153.2"
    assert CANONICAL_V6_PUBLIC_ORIGIN.endswith("omegav6.jeffdeweyeljefe.workers.dev")


def test_service_identity_contract_rejects_the_cloudflare_10143_configuration(tmp_path):
    broken = tmp_path / "wrangler.toml"
    broken.write_text(
        '[[services]]\nbinding = "OMEGA_V6"\nservice = "omega-v6-full-convergence"\n\n'
        '[[services]]\nbinding = "OMEGA_OPTICAL"\nservice = "omega-optical-machine-r1532"\n',
        encoding="utf-8",
    )
    result = verify_worker_service_bindings(broken)
    assert result["ok"] is False
    assert any("OMEGA_V6" in error for error in result["errors"])
    assert any("retired/nonexistent" in error for error in result["errors"])


def test_service_identity_contract_does_not_promote_routing_intent_into_execution_truth():
    result = verify_worker_service_bindings(WRANGLER)
    boundary = result["truth_boundary"]
    assert "does not prove peer reachability" in boundary
    assert "PC-online" in boundary
    assert "solver validity" in boundary
    assert "Vercel write authority" in boundary
    assert "CanonState admission" in boundary
