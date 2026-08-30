from __future__ import annotations

from dataclasses import replace, asdict
from pathlib import Path
import json
import threading

from .schema import Address20736, CanonicalMetrics, CanonicalPacket, EvidenceClass, MotionPacket, SourceRef, evidence_rank
from .calculus import mode188_gate, dewey_balance, shortest_arc_phase, calculus_snapshot
from .forecast import frozen_prior
from .proof import ProofLedger
from .projection import project
from .journal import StateJournal


class OmegaRuntime:
    """Single canonical state authority. No adapter, renderer, mode or UI owns state."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.state_path = self.data_dir / "canonical_state.json"
        self.lock = threading.RLock()
        self.ledger = ProofLedger(self.data_dir / "proof.jsonl")
        self.journal = StateJournal(self.data_dir / "state_history.jsonl")
        self._state = self._load_or_seed()

    def _load_or_seed(self) -> CanonicalPacket:
        journal_check = self.journal.verify()
        if journal_check.get("valid") and journal_check.get("records", 0) > 0:
            last = self.journal.read()[-1]
            packet = self._decode(last["packet"])
            self._persist(packet)
            return packet
        if self.state_path.exists():
            try:
                packet = self._decode(json.loads(self.state_path.read_text(encoding="utf-8")))
                if self.journal.read():
                    raise ValueError("invalid state journal present")
                self.journal.append(packet.canonical_dict(), packet.digest, origin="RECOVERED_BASELINE")
                return packet
            except Exception:
                if self.journal.read():
                    raise
        packet = CanonicalPacket(
            Address20736(1, 1, 7, 12),
            CanonicalMetrics(),
            EvidenceClass.DERIVED,
            MotionPacket(phase=1.0),
            payload={"seed": "OMEGA_GENESIS"},
        )
        self.journal.append(packet.canonical_dict(), packet.digest, origin="SEED")
        self._persist(packet)
        return packet

    def _decode(self, data):
        metrics = CanonicalMetrics(**data["metrics"])
        motion = MotionPacket(**data.get("motion", {}))
        address = Address20736(*data["address"])
        sources = tuple(
            SourceRef(
                row["source_id"],
                row["authority"],
                EvidenceClass(row["evidence_class"]),
                row.get("observed_at"),
                row.get("retrieved_at"),
                row.get("immutable_ref"),
                row.get("checksum"),
                row.get("note", ""),
            )
            for row in data.get("sources", [])
        )
        return CanonicalPacket(
            address,
            metrics,
            EvidenceClass(data["evidence_class"]),
            motion,
            sources,
            data.get("payload", {}),
            data.get("parent_digest"),
            int(data.get("sequence", 0)),
            data.get("observer_id", "canonical"),
            data.get("created_at"),
            data.get("schema_version", "omega-genesis-state-v1"),
        )

    def _persist(self, packet):
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(packet.canonical_dict(), indent=2, allow_nan=False), encoding="utf-8")
        tmp.replace(self.state_path)

    @property
    def state(self):
        return self._state

    def verify_replay(self):
        journal = self.journal.verify(expected_head=self._state.digest)
        if not journal.get("valid"):
            return {"valid": False, "journal": journal, "proof": self.ledger.verify(), "reason": "journal_invalid"}
        proof = self.ledger.verify()
        if not proof.get("valid"):
            return {"valid": False, "journal": journal, "proof": proof, "reason": "proof_invalid"}
        journal_rows = self.journal.read()
        states = {row["digest"] for row in journal_rows}
        proof_commits = set()
        for row in self.ledger.read():
            if row.get("decision") == "COMMIT":
                if row.get("state_before") not in states or row.get("state_after") not in states:
                    return {
                        "valid": False,
                        "journal": journal,
                        "proof": proof,
                        "reason": "proof_state_reference_missing",
                        "receipt_sequence": row.get("sequence"),
                    }
                proof_commits.add(row.get("state_after"))
        for row in journal_rows:
            if row.get("origin") == "COMMIT" and row.get("digest") not in proof_commits:
                return {
                    "valid": False,
                    "journal": journal,
                    "proof": proof,
                    "reason": "journal_commit_missing_proof",
                    "state_digest": row.get("digest"),
                }
        return {"valid": True, "journal": journal, "proof": proof, "current_digest": self._state.digest}

    def authority_report(self) -> dict:
        replay = self.verify_replay()
        return {
            "status": "PASS" if replay.get("valid") else "FAIL",
            "canonical_digest": self._state.digest,
            "state_id": self._state.address.state_id,
            "sequence": self._state.sequence,
            "runtime_authorities": 1,
            "shadow_states": 0,
            "journal_records": replay.get("journal", {}).get("records"),
            "proof_records": replay.get("proof", {}).get("records"),
            "mutation_authority": "OmegaRuntime only",
            "replay": replay,
        }

    def history(self, limit: int = 100) -> list[dict]:
        limit = max(1, min(1000, int(limit)))
        rows = self.journal.read()[-limit:]
        return [
            {
                "sequence": row["packet"].get("sequence"),
                "digest": row["digest"],
                "origin": row.get("origin"),
                "state_id": Address20736(*row["packet"]["address"]).state_id,
                "evidence_class": row["packet"].get("evidence_class"),
                "created_at": row["packet"].get("created_at"),
            }
            for row in rows
        ]

    def snapshot(self):
        packet = self._state
        return {
            "state": packet.public_dict(),
            "calculus": calculus_snapshot(packet.metrics),
            "projection": project(packet),
            "proof": self.ledger.verify(),
            "replay": self.verify_replay(),
        }

    def propose(
        self,
        address: Address20736,
        metrics: CanonicalMetrics,
        evidence_class: EvidenceClass,
        *,
        mode: str = "MODE188",
        payload: dict | None = None,
        allow_conditional: bool = False,
    ) -> dict:
        with self.lock:
            before = self._state
            gate = mode188_gate(metrics.continuity, metrics.burden, metrics.contradiction)
            if evidence_rank(evidence_class) > evidence_rank(before.evidence_class) and evidence_class in {EvidenceClass.OBSERVED, EvidenceClass.IMPORTED}:
                receipt = self.ledger.append(
                    "TRANSITION",
                    "HOLD_EVIDENCE_PROMOTION",
                    before.digest,
                    None,
                    {"requested": evidence_class.value, "current": before.evidence_class.value},
                )
                return {
                    "committed": False,
                    "decision": "HOLD_EVIDENCE_PROMOTION",
                    "gate": asdict(gate),
                    "receipt": asdict(receipt),
                }
            prior = frozen_prior(before, 1)
            commit_allowed = gate.admission == "ACCEPT" or (allow_conditional and gate.admission == "CONDITIONAL")
            if not commit_allowed:
                receipt = self.ledger.append(
                    "TRANSITION",
                    gate.admission,
                    before.digest,
                    None,
                    {
                        "mode": mode,
                        "gate": asdict(gate),
                        "forecast_prior": asdict(prior),
                        "futureObservationUsed": False,
                    },
                )
                return {
                    "committed": False,
                    "decision": gate.admission,
                    "gate": asdict(gate),
                    "forecast_prior": asdict(prior),
                    "receipt": asdict(receipt),
                }

            phase = shortest_arc_phase(before.motion.phase, float(address.phase), 1.0)
            after = CanonicalPacket(
                address,
                metrics,
                evidence_class,
                replace(before.motion, phase=phase, transition_progress=1.0),
                before.sources,
                payload or {},
                before.digest,
                before.sequence + 1,
                before.observer_id,
            )
            self.journal.append(after.canonical_dict(), after.digest, origin="COMMIT")
            self._persist(after)
            self._state = after
            receipt = self.ledger.append(
                "TRANSITION",
                "COMMIT",
                before.digest,
                after.digest,
                {
                    "mode": mode,
                    "gate": asdict(gate),
                    "forecast_prior": asdict(prior),
                    "futureObservationUsed": False,
                    "projection_fingerprint": project(after)["packet_fingerprint"],
                },
            )
            return {
                "committed": True,
                "decision": "COMMIT",
                "gate": asdict(gate),
                "forecast_prior": asdict(prior),
                "state": after.public_dict(),
                "receipt": asdict(receipt),
            }

    def rollback_to_digest(self, target_digest: str, *, reason: str) -> dict:
        """Recover a proven historical state by creating a new child packet.

        History is never rewritten. The recovered packet receives a new sequence,
        current parent digest and proof receipt.
        """
        with self.lock:
            before = self._state
            replay = self.verify_replay()
            if not replay.get("valid"):
                return {"committed": False, "decision": "HOLD", "reason": "replay_invalid", "replay": replay}
            target_row = next((row for row in self.journal.read() if row.get("digest") == target_digest), None)
            if target_row is None:
                return {"committed": False, "decision": "HOLD", "reason": "target_digest_not_in_proven_history"}
            target = self._decode(target_row["packet"])
            if target.digest == before.digest:
                return {"committed": False, "decision": "HOLD", "reason": "target_is_current_state"}

            payload = dict(target.payload)
            payload["recovery"] = {
                "operation": "ROLLBACK",
                "restored_from_digest": target.digest,
                "restored_from_sequence": target.sequence,
                "reason": str(reason).strip() or "operator recovery",
            }
            after = CanonicalPacket(
                target.address,
                target.metrics,
                target.evidence_class,
                replace(target.motion, transition_progress=1.0),
                target.sources,
                payload,
                before.digest,
                before.sequence + 1,
                before.observer_id,
            )
            self.journal.append(after.canonical_dict(), after.digest, origin="COMMIT")
            self._persist(after)
            self._state = after
            receipt = self.ledger.append(
                "ROLLBACK",
                "COMMIT",
                before.digest,
                after.digest,
                {
                    "restored_from_digest": target.digest,
                    "restored_from_sequence": target.sequence,
                    "reason": payload["recovery"]["reason"],
                    "projection_fingerprint": project(after)["packet_fingerprint"],
                },
            )
            return {
                "committed": True,
                "decision": "COMMIT",
                "operation": "ROLLBACK",
                "restored_from_digest": target.digest,
                "state": after.public_dict(),
                "receipt": asdict(receipt),
                "replay": self.verify_replay(),
            }

    def validate_dewey_bal_contract(
        self,
        source_state: int,
        target_state: int,
        source_burden: float,
        target_burden: float,
        edge: str,
    ) -> dict:
        expected = {
            "source_state": 11499,
            "target_state": 11687,
            "source_burden": 0.8000063837447882,
            "target_burden": 0.42901814817581707,
            "edge": "MODE188+",
        }
        score = dewey_balance(source_burden)
        checks = {
            "source_state": source_state == expected["source_state"],
            "target_state": target_state == expected["target_state"],
            "source_burden": abs(source_burden - expected["source_burden"]) < 1e-9,
            "target_burden": abs(target_burden - expected["target_burden"]) < 1e-9,
            "edge": edge == expected["edge"],
            "score": abs(score - 0.19999361625521184) < 1e-12,
        }
        decision = "ACCEPT" if all(checks.values()) else "HOLD"
        self.ledger.append(
            "DEWEY_BAL_CONTRACT",
            decision,
            self._state.digest,
            None,
            {
                "checks": checks,
                "score": score,
                "required_order": ["CHECKPOINT_SOURCE", "FREEZE_FORECAST_PRIOR", "COMMIT_ADMITTED_EDGE"],
            },
        )
        return {
            "decision": decision,
            "checks": checks,
            "score": score,
            "expected": expected,
            "required_order": ["CHECKPOINT_SOURCE", "FREEZE_FORECAST_PRIOR", "COMMIT_ADMITTED_EDGE"],
        }
