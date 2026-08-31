from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from pathlib import Path
from typing import Iterable, Mapping


DEFAULT_POLICY_PATH = Path("config/self_build_policy.json")
MANDATORY_GATES = (
    "python_compile",
    "python_tests",
    "manifest_rebuild",
    "manifest_verify",
    "release_build",
    "release_reproducibility",
    "worker_check",
    "cloud_container_build",
)


def sha256_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


@dataclass(frozen=True)
class BuildGate:
    name: str
    status: str
    detail: str = ""
    digest: str | None = None

    @property
    def passed(self) -> bool:
        return self.status in {"PASS", "REPAIRED"}


@dataclass(frozen=True)
class SelfBuildPolicy:
    schema_version: int
    authority: str
    source_mutation_mode: str
    automatic_write_paths: tuple[str, ...]
    mandatory_gates: tuple[str, ...]
    publish_container: bool
    promote_latest: bool
    cloud_authority_required: bool

    @classmethod
    def from_mapping(cls, raw: Mapping[str, object]) -> "SelfBuildPolicy":
        return cls(
            schema_version=int(raw["schema_version"]),
            authority=str(raw["authority"]),
            source_mutation_mode=str(raw["source_mutation_mode"]),
            automatic_write_paths=tuple(str(x) for x in raw["automatic_write_paths"]),
            mandatory_gates=tuple(str(x) for x in raw["mandatory_gates"]),
            publish_container=bool(raw["publish_container"]),
            promote_latest=bool(raw["promote_latest"]),
            cloud_authority_required=bool(raw["cloud_authority_required"]),
        )


def load_policy(root: Path, path: Path = DEFAULT_POLICY_PATH) -> SelfBuildPolicy:
    policy_path = root / path
    raw = json.loads(policy_path.read_text(encoding="utf-8"))
    policy = SelfBuildPolicy.from_mapping(raw)
    validate_policy(policy)
    return policy


def validate_policy(policy: SelfBuildPolicy) -> None:
    if policy.schema_version != 1:
        raise ValueError(f"unsupported self-build policy schema: {policy.schema_version}")
    if policy.source_mutation_mode != "proposal_only":
        raise ValueError("core source mutation must remain proposal_only")
    if not policy.cloud_authority_required:
        raise ValueError("self-build policy must preserve cloud canonical authority")
    missing = [g for g in MANDATORY_GATES if g not in policy.mandatory_gates]
    if missing:
        raise ValueError(f"mandatory self-build gates missing: {missing}")
    required_writes = {"omega.manifest.json", "SHA256SUMS.txt", "release/**"}
    if not required_writes.issubset(set(policy.automatic_write_paths)):
        raise ValueError("automatic write policy is missing canonical build-ledger paths")


def path_is_automatically_writable(path: str, policy: SelfBuildPolicy) -> bool:
    path = path.replace("\\", "/").lstrip("./")
    for rule in policy.automatic_write_paths:
        normalized = rule.replace("\\", "/").lstrip("./")
        if normalized.endswith("/**"):
            prefix = normalized[:-3].rstrip("/")
            if path == prefix or path.startswith(prefix + "/"):
                return True
        elif path == normalized:
            return True
    return False


def assert_automatic_write(path: str, policy: SelfBuildPolicy) -> None:
    if not path_is_automatically_writable(path, policy):
        raise PermissionError(f"self-builder may not automatically write {path!r}")


def promotion_decision(gates: Iterable[BuildGate], policy: SelfBuildPolicy) -> tuple[str, list[str]]:
    by_name = {gate.name: gate for gate in gates}
    failures: list[str] = []
    for name in policy.mandatory_gates:
        gate = by_name.get(name)
        if gate is None:
            failures.append(f"{name}:MISSING")
        elif not gate.passed:
            failures.append(f"{name}:{gate.status}")
    return ("PROMOTE" if not failures else "QUARANTINE", failures)


def source_fingerprint(manifest: Mapping[str, object]) -> str:
    rows = manifest.get("files", [])
    payload = [
        (str(row["path"]), str(row["sha256"]), int(row["bytes"]))
        for row in rows
    ]
    payload.sort()
    raw = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(raw)


def build_report(
    *,
    source_sha: str,
    manifest_sha256: str,
    release_sha256: str | None,
    gates: Iterable[BuildGate],
    policy: SelfBuildPolicy,
) -> dict[str, object]:
    gate_list = list(gates)
    decision, failures = promotion_decision(gate_list, policy)
    return {
        "schema": "omega.selfbuild.report.v1",
        "authority": policy.authority,
        "source_sha": source_sha,
        "manifest_sha256": manifest_sha256,
        "release_sha256": release_sha256,
        "decision": decision,
        "failures": failures,
        "source_mutation_mode": policy.source_mutation_mode,
        "cloud_authority_required": policy.cloud_authority_required,
        "gates": [asdict(g) for g in gate_list],
    }
