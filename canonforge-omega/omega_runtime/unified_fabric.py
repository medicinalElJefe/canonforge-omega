"""OMEGA R227 unified computational fabric.

This module binds the five causal substrates without granting Canon mutation:
Address Field x Woven Packet x Closure Address x Evolution Operator x Proof Ledger.
Subsystems consume one deterministic packet/receipt protocol rather than inventing
independent state semantics.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
import json
from typing import Any, Mapping, Sequence

SCHEMA = "OMEGA_UNIFIED_COMPUTATIONAL_FABRIC_R227"
CONSUMERS = ("GENESIS", "FORECAST", "SAR", "OPTICAL", "RENDER", "SOVEREIGN", "AI_SAI", "INTERFACE")


def _digest(value: Any) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


@dataclass(frozen=True)
class WovenPacket:
    address_key: str
    closure_address: str
    field_receipt: str
    state: tuple[float, ...]
    motion: tuple[float, ...] = ()
    continuity: float = 0.0
    future_plasticity: float = 0.0
    contradiction: float = 0.0
    burden: float = 0.0
    scar: float = 0.0
    history: tuple[str, ...] = ()
    provenance: tuple[str, ...] = ()

    @property
    def packet_sha256(self) -> str:
        return _digest(self.__dict__)


@dataclass(frozen=True)
class OperatorDescriptor:
    """Stable operator identity. Never hashes a Python callable."""
    namespace: str
    name: str
    version: str
    law: str
    input_schema: str = SCHEMA
    output_schema: str = SCHEMA

    @property
    def operator_id(self) -> str:
        return _digest(self.__dict__)


@dataclass(frozen=True)
class ProofLedgerEntry:
    packet_sha256: str
    closure_address: str
    operator_id: str
    before_digest: str
    after_digest: str
    residual: float
    decision: str
    evidence: tuple[str, ...] = ()
    candidate_only: bool = True
    canonical_mutation: bool = False

    @property
    def receipt_sha256(self) -> str:
        return _digest(self.__dict__)


@dataclass(frozen=True)
class FabricReceipt:
    consumer: str
    packet_sha256: str
    operator_id: str
    proof_receipt: str
    output_digest: str
    next_closure_address: str
    status: str
    canonical_mutation: bool = False

    @property
    def receipt_sha256(self) -> str:
        return _digest(self.__dict__)


class UnifiedComputationalFabric:
    """Fail-closed protocol boundary shared by OMEGA subsystems.

    R227 deliberately does not promote or mutate Canon. It makes subsystem work
    address/closure/operator/proof-carrying so later adapters cannot silently
    bypass the common computational substrate.
    """

    def __init__(self, consumers: Sequence[str] = CONSUMERS) -> None:
        normalized = tuple(dict.fromkeys(str(x).upper() for x in consumers))
        if not normalized:
            raise ValueError("at least one consumer is required")
        self.consumers = normalized

    def bind(
        self,
        *,
        consumer: str,
        packet: WovenPacket,
        operator: OperatorDescriptor,
        output: Any,
        residual: float,
        decision: str,
        next_closure_address: str,
        evidence: Sequence[str] = (),
    ) -> tuple[ProofLedgerEntry, FabricReceipt]:
        consumer = consumer.upper()
        if consumer not in self.consumers:
            raise ValueError(f"unregistered fabric consumer: {consumer}")
        if residual < 0:
            raise ValueError("residual must be nonnegative")
        if not packet.address_key or not packet.closure_address or not packet.field_receipt:
            raise ValueError("address, closure, and field proof are mandatory")
        if not next_closure_address:
            raise ValueError("next closure address is mandatory")

        before = _digest({"state": packet.state, "motion": packet.motion, "history": packet.history})
        after = _digest(output)
        proof = ProofLedgerEntry(
            packet_sha256=packet.packet_sha256,
            closure_address=packet.closure_address,
            operator_id=operator.operator_id,
            before_digest=before,
            after_digest=after,
            residual=float(residual),
            decision=str(decision),
            evidence=tuple(evidence),
        )
        receipt = FabricReceipt(
            consumer=consumer,
            packet_sha256=packet.packet_sha256,
            operator_id=operator.operator_id,
            proof_receipt=proof.receipt_sha256,
            output_digest=after,
            next_closure_address=next_closure_address,
            status="CANDIDATE_PROVENANCE_BOUND",
        )
        return proof, receipt

    def manifest(self) -> Mapping[str, Any]:
        body = {
            "schema": SCHEMA,
            "equation": "ADDRESS_FIELD x WOVEN_PACKET x CLOSURE_ADDRESS x EVOLUTION_OPERATOR x PROOF_LEDGER",
            "consumers": self.consumers,
            "loop": "ADDRESS->FIELD->PACKET->CLOSURE->OPERATOR->TRANSFORM->RETURN->RESIDUAL->PROOF->NEXT_CLOSURE",
            "candidate_only": True,
            "canonical_mutation": False,
            "physical_dimension_claim": False,
        }
        return {**body, "receipt_sha256": _digest(body)}
