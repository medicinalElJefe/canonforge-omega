from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from typing import Any

from .schema import EvidenceClass, SourceRef

STRONG_CLASSES = {EvidenceClass.OBSERVED, EvidenceClass.IMPORTED}


@dataclass(frozen=True, slots=True)
class ObservationPacket:
    evidence_class: EvidenceClass
    source: SourceRef
    payload: dict[str, Any]
    payload_sha256: str
    compiled_at: str
    canonical_mutation: bool = False

    def public_dict(self) -> dict[str, Any]:
        source = asdict(self.source)
        source["evidence_class"] = self.source.evidence_class.value
        return {
            "evidence_class": self.evidence_class.value,
            "source": source,
            "payload": self.payload,
            "payload_sha256": self.payload_sha256,
            "compiled_at": self.compiled_at,
            "canonical_mutation": self.canonical_mutation,
            "boundary": "observation compiler only; runtime admission is a separate proof-gated operation",
        }


def compile_observation(
    *,
    evidence_class: EvidenceClass | str,
    source_id: str,
    authority: str,
    payload: dict[str, Any],
    observed_at: str | None = None,
    retrieved_at: str | None = None,
    immutable_ref: str | None = None,
    checksum: str | None = None,
    note: str = "",
) -> ObservationPacket:
    ev = EvidenceClass(evidence_class)
    source_id = str(source_id).strip()
    authority = str(authority).strip()
    if not source_id or not authority:
        raise ValueError("source_id and authority are required")
    if ev in STRONG_CLASSES:
        if not (observed_at or retrieved_at):
            raise ValueError(f"{ev.value} requires observed_at or retrieved_at")
        if not (immutable_ref or checksum):
            raise ValueError(f"{ev.value} requires immutable_ref or checksum")
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str).encode("utf-8")
    payload_digest = sha256(raw).hexdigest()
    if checksum and len(str(checksum).strip()) == 64 and str(checksum).lower() != payload_digest:
        raise ValueError("declared checksum does not match normalized payload")
    source = SourceRef(
        source_id=source_id,
        authority=authority,
        evidence_class=ev,
        observed_at=observed_at,
        retrieved_at=retrieved_at,
        immutable_ref=immutable_ref,
        checksum=checksum or payload_digest,
        note=note,
    )
    return ObservationPacket(
        ev,
        source,
        dict(payload),
        payload_digest,
        datetime.now(timezone.utc).isoformat(),
        False,
    )
