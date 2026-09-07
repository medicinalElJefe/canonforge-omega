from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tomllib

CANONICAL_V6_SERVICE = "omegav6"
CANONICAL_V6_PUBLIC_ORIGIN = "https://omegav6.jeffdeweyeljefe.workers.dev"
ACTIVE_OPTICAL_SERVICE = "omega-optical-machine-r1532"
ACTIVE_OPTICAL_GENERATION = "R153.2"


@dataclass(frozen=True)
class FederationServiceIdentity:
    binding: str
    service: str
    role: str
    authority: str


EXPECTED_SERVICE_IDENTITIES = (
    FederationServiceIdentity("OMEGA_V6", CANONICAL_V6_SERVICE, "ADMIT_PEER_OBSERVATION", "OMEGAV6"),
    FederationServiceIdentity("OMEGA_OPTICAL", ACTIVE_OPTICAL_SERVICE, "SCREEN_PEER", "SCREEN_ONLY"),
)


def read_worker_service_bindings(path: str | Path) -> dict[str, str]:
    data = tomllib.loads(Path(path).read_text(encoding="utf-8"))
    services = data.get("services", [])
    return {
        str(item.get("binding", "")).strip(): str(item.get("service", "")).strip()
        for item in services
        if isinstance(item, dict) and item.get("binding") and item.get("service")
    }


def verify_worker_service_bindings(path: str | Path) -> dict[str, object]:
    bindings = read_worker_service_bindings(path)
    errors: list[str] = []
    for expected in EXPECTED_SERVICE_IDENTITIES:
        actual = bindings.get(expected.binding)
        if actual != expected.service:
            errors.append(f"{expected.binding}: expected {expected.service!r}, got {actual!r}")
    unexpected_v6 = bindings.get("OMEGA_V6")
    if unexpected_v6 == "omega-v6-full-convergence":
        errors.append("OMEGA_V6 references retired/nonexistent service identity 'omega-v6-full-convergence'")
    return {
        "ok": not errors,
        "schema": "OMEGA_FEDERATION_SERVICE_IDENTITY_CONTRACT_V1",
        "canonical_v6_service": CANONICAL_V6_SERVICE,
        "canonical_v6_public_origin": CANONICAL_V6_PUBLIC_ORIGIN,
        "active_optical_service": ACTIVE_OPTICAL_SERVICE,
        "active_optical_generation": ACTIVE_OPTICAL_GENERATION,
        "bindings": bindings,
        "errors": errors,
        "truth_boundary": (
            "A configured Cloudflare service identity proves only deployment routing intent. "
            "It does not prove peer reachability, execution return, PC-online state, solver validity, "
            "Vercel write authority, or CanonState admission."
        ),
    }
