from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from omega_fusion_core.core.model import OmegaPacket
from omega_fusion_core.core.universal_moment import UniversalMomentCalculator
from omega_fusion_core.core.tic import TICCalculator
from omega_fusion_core.storage.sequence_store import SequenceStore
from omega_fusion_core.pattern_hub.macro_playback import MacroPlayer
from omega_fusion_core.host.muscles import HostMuscles
from omega_fusion_core.host.executor import MacroExecutor

from omega_runtime import Address20736, EvidenceClass, StateEnvelope, StateMetrics, OmegaRuntime
from omega_runtime.atlas import ping_next, ping_prev, opposite_address, phase_portal
from omega_runtime.forecast import deterministic_local_forecast
from omega_runtime.proof import ProofLedger
from omega_runtime.relativity import ObserverFrame, phase_transform, outverse_inverse, rotate_shell_axes
from omega_runtime.render import living_glyph_scene
from omega_runtime.state_store import StateStore

app = FastAPI(title="OMEGA V6 Sovereign Runtime", version="6.0.0-convergence")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])

_calc = UniversalMomentCalculator()
_tic_calc = TICCalculator()
EVENT_LOG: List[Dict[str, Any]] = []
OMEGA_HOME = Path.home() / ".omega"
LEDGER_PATH = OMEGA_HOME / "ledger" / "proof.jsonl"
STATE_PATH = OMEGA_HOME / "state" / "canonical.json"
_initial = StateEnvelope(
    address=Address20736(1, 1, 1, 1), evidence_class=EvidenceClass.DERIVED,
    metrics=StateMetrics(continuity=1.0, burden=0.20, contradiction=0.10, future_plasticity=0.50),
    source_id="OMEGA_BOOTSTRAP_SCHEMA",
    payload={"boundary": "runtime initialization record; not an empirical observation"},
)
_runtime = OmegaRuntime(_initial, ProofLedger(LEDGER_PATH), StateStore(STATE_PATH))


class PatternInfo(BaseModel):
    seq_id: str
    label: str
    date: str
    tags: List[str]
    duration_sec: float
    uai_before: float
    uai_after: float


class RunPatternRequest(BaseModel):
    id: str
    speed: float = 1.0
    loop_repeats: int = 0


class MetricsInput(BaseModel):
    continuity: float
    burden: float
    contradiction: float
    future_plasticity: float = 0.0
    proof_scar: float = 0.0
    shell_depth: int = 0
    branch_pressure: float = 0.0


class TransitionRequest(BaseModel):
    domain: int = Field(ge=1, le=12)
    phase: int = Field(ge=1, le=12)
    regulation: int = Field(ge=1, le=12)
    layer: int = Field(ge=1, le=12)
    evidence_class: Literal["OBSERVED", "IMPORTED", "DERIVED", "FORECAST", "SYMBOLIC", "USER_ASSERTED"] = "DERIVED"
    metrics: MetricsInput
    payload: Dict[str, Any] = Field(default_factory=dict)
    source_id: str = "api"
    shell_amplitudes: List[float] | None = None


class ObserverRequest(BaseModel):
    phase_offset: int = 0
    scale: float = Field(default=1.0, gt=0)
    rotation_deg: float = 0.0
    shell_axes: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0], min_length=3, max_length=3)


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "runtime": "OMEGA V6 Sovereign Runtime", "state_digest": _runtime.state.digest,
            "proof_records": len(_runtime.ledger.records), "persistent_state": str(STATE_PATH),
            "representation_boundary": "144/1728/20736 are software state-space representations unless independently evidenced otherwise"}


@app.get("/api/status")
def get_status() -> Dict[str, Any]:
    snap = _calc.compute_from_packets([])
    tic = _tic_calc.from_moment(snap)
    return {"timestamp": snap.timestamp.isoformat(), "uai": snap.uai, "life_coherence": snap.life_coherence,
            "system_coherence": snap.system_coherence, "truth": tic.truth, "integrity": tic.integrity,
            "courage": tic.courage, "omega_effective": tic.omega_effective,
            "boundary": "Fusion/TIC status is derived by the existing CanonForge prototype, not an empirical physical measurement."}


@app.get("/api/omega/state")
def omega_state() -> Dict[str, Any]:
    state = _runtime.state
    g, op, simplex = _runtime.evaluate(state)
    return {"state": state.canonical_dict(), "digest": state.digest,
            "mode188": {"ratio": g.ratio, "dispatch": g.dispatch.value, "admission": g.admission.value, "reason": g.reason},
            "operator": {"construct_011": op.construct_011, "prune_01m1": op.prune_01m1,
                         "integrated_omega": op.integrated_omega, "selected": op.selected, "rejected": op.rejected},
            "simplex": simplex}


@app.post("/api/omega/transition")
def omega_transition(req: TransitionRequest) -> Dict[str, Any]:
    current = _runtime.state
    if req.shell_amplitudes is not None and len(req.shell_amplitudes) != 6:
        raise HTTPException(status_code=422, detail="1+6 shell requires exactly six neighbor amplitudes")
    candidate = StateEnvelope(
        address=Address20736(req.domain, req.phase, req.regulation, req.layer),
        evidence_class=EvidenceClass(req.evidence_class), metrics=StateMetrics(**req.metrics.model_dump()),
        payload=req.payload, source_id=req.source_id, parent_digest=current.digest)
    result = _runtime.propose(candidate, shell_amplitudes=req.shell_amplitudes)
    g, op = result.get("gate"), result.get("operator")
    return {"accepted": result["accepted"], "decision": result.get("decision", "PRUNE"), "reason": result.get("reason"),
            "state_digest": _runtime.state.digest, "candidate_digest": candidate.digest,
            "mode188": None if g is None else {"ratio": g.ratio, "dispatch": g.dispatch.value, "admission": g.admission.value},
            "operator": None if op is None else {"construct_011": op.construct_011, "prune_01m1": op.prune_01m1,
                                                "integrated_omega": op.integrated_omega, "selected": op.selected, "rejected": op.rejected},
            "simplex": result.get("simplex")}


@app.get("/api/omega/atlas")
def omega_atlas(index: int | None = None) -> Dict[str, Any]:
    address = _runtime.state.address if index is None else Address20736.from_index(index)
    outverse, inverse = outverse_inverse(address)
    return {"address": address.as_tuple(), "index": address.index, "ping_next": ping_next(address).as_tuple(),
            "ping_prev": ping_prev(address).as_tuple(), "opposite": opposite_address(address).as_tuple(),
            "outverse": outverse.as_tuple(), "inverse": inverse.as_tuple(), "phase_portal_count": len(phase_portal(address))}


@app.post("/api/omega/observer")
def omega_observer(req: ObserverRequest) -> Dict[str, Any]:
    frame = ObserverFrame(observer_id="api", phase_offset=req.phase_offset, scale=req.scale, rotation_deg=req.rotation_deg)
    state = _runtime.state
    axes = tuple(float(x) for x in req.shell_axes)
    return {"native_address": state.address.as_tuple(), "observer_address": phase_transform(state.address, frame).as_tuple(),
            "native_axes": axes, "observer_axes": rotate_shell_axes(axes, frame), "time_basis": frame.time_basis,
            "boundary": "observer transform does not mutate canonical state or evidence class"}


@app.get("/api/omega/forecast")
def omega_forecast(horizon: int = 1) -> Dict[str, Any]:
    p = deterministic_local_forecast(_runtime.state, horizon)
    return {"source_digest": p.source_digest, "horizon_transitions": p.horizon_transitions,
            "evidence_class": p.evidence_class, "calibrated": p.calibrated, "branches": [asdict(b) for b in p.branches]}


@app.get("/api/omega/scene")
def omega_scene() -> Dict[str, Any]:
    state = _runtime.state
    g, _, _ = _runtime.evaluate(state)
    scene = living_glyph_scene(state, g)
    return {"state_digest": scene.state_digest, "evidence_class": scene.evidence_class,
            "primitives": [asdict(p) for p in scene.primitives]}


@app.get("/api/omega/proof")
def omega_proof(limit: int = 50) -> List[Dict[str, Any]]:
    safe_limit = max(1, min(limit, 200))
    return [asdict(r) for r in _runtime.ledger.records[-safe_limit:]]


@app.get("/api/patterns", response_model=List[PatternInfo])
def list_patterns() -> List[PatternInfo]:
    store = SequenceStore()
    out: List[PatternInfo] = []
    for seq_id in store.list_ids():
        seq = store.get_sequence(seq_id)
        if seq:
            out.append(PatternInfo(seq_id=seq.seq_id, label=seq.label, date=seq.date, tags=seq.context_tags,
                                   duration_sec=seq.duration_sec, uai_before=seq.uai_before, uai_after=seq.uai_after))
    return out


@app.get("/api/events")
def get_events() -> List[Dict[str, Any]]:
    return EVENT_LOG[-50:]


def fusion_log(packet: OmegaPacket) -> None:
    snap = _calc.compute_from_packets([packet])
    tic = _tic_calc.from_moment(snap)
    EVENT_LOG.append({"timestamp": snap.timestamp.isoformat(), "domain": packet.domain.name,
                      "state": packet.state.name, "role": packet.role.name, "tags": packet.tags,
                      "truth": tic.truth, "integrity": tic.integrity, "courage": tic.courage,
                      "omega_effective": tic.omega_effective, "evidence_class": "DERIVED"})
    if len(EVENT_LOG) > 200:
        del EVENT_LOG[0]


@app.post("/api/run-pattern")
def run_pattern(req: RunPatternRequest) -> Dict[str, str]:
    store = SequenceStore()
    seq = store.get_sequence(req.id)
    if not seq:
        raise HTTPException(status_code=404, detail=f"No sequence with id '{req.id}'")
    player = MacroPlayer(fusion_ingest_fn=fusion_log, executor=MacroExecutor(muscles=HostMuscles()))
    player.play(seq, speed=req.speed, loop_repeats=req.loop_repeats)
    return {"status": "ok", "message": f"Pattern '{req.id}' executed."}


# Mount static UI last so it cannot shadow /api routes.
for candidate in (Path(__file__).resolve().parents[1] / "ui", Path(__file__).resolve().parents[1] / "web"):
    if candidate.exists() and candidate.is_dir():
        app.mount("/", StaticFiles(directory=str(candidate), html=True), name="ui")
        break
