from __future__ import annotations

from dataclasses import asdict
import os
from pathlib import Path
from typing import Any, Dict, List, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from omega_runtime.audio import state_to_sonification
from omega_runtime.bio import BioNode, BioScale, validate_chain
from omega_runtime.earth import GeoPoint, traversal_summary
from omega_runtime.forecast import deterministic_local_forecast
from omega_runtime.graph import outgoing_edges, reference_graph_summary
from omega_runtime.proof import ProofLedger
from omega_runtime.quality import quality_snapshot
from omega_runtime.relativity import ObserverFrame, phase_transform, outverse_inverse, rotate_shell_axes
from omega_runtime.render import living_glyph_scene
from omega_runtime.state_store import StateStore
from omega_runtime.security import gateway_authorized
from omega_runtime.system_manifest import manifest as software_manifest, summary as software_summary

app = FastAPI(title="OMEGA V6 Sovereign Runtime", version="6.1.0-fresh-full")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])

GATEWAY_TOKEN = os.environ.get("OMEGA_GATEWAY_TOKEN")


@app.middleware("http")
async def sovereign_ingress(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_host = request.client.host if request.client else None
        presented = request.headers.get("x-omega-gateway-token")
        if not gateway_authorized(client_host=client_host, presented_token=presented, configured_token=GATEWAY_TOKEN):
            return JSONResponse({"error": "unauthorized_sovereign_ingress",
                                 "boundary": "remote API access requires OMEGA_GATEWAY_TOKEN; localhost remains directly usable"}, status_code=401)
    return await call_next(request)


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
    seq_id: str; label: str; date: str; tags: List[str]; duration_sec: float; uai_before: float; uai_after: float


class RunPatternRequest(BaseModel):
    id: str; speed: float = 1.0; loop_repeats: int = 0


class MetricsInput(BaseModel):
    continuity: float
    burden: float
    contradiction: float
    future_plasticity: float = 0.0
    proof_scar: float = 0.0
    shell_depth: int = 0
    branch_pressure: float = 0.0


class TransitionRequest(BaseModel):
    domain: int = Field(ge=1, le=12); phase: int = Field(ge=1, le=12)
    regulation: int = Field(ge=1, le=12); layer: int = Field(ge=1, le=12)
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


class GeoInput(BaseModel):
    lat_deg: float; lon_deg: float; alt_m: float = 0.0
    source_id: str = "api"; observed_at: str | None = None


class EarthTraversalRequest(BaseModel):
    origin: GeoInput; target: GeoInput


class BioNodeInput(BaseModel):
    scale: Literal["organism", "organ", "tissue", "cell", "organelle", "molecule", "atom"]
    label: str; source_id: str; evidence_class: str
    units: str | None = None; value: float | None = None; parent_label: str | None = None


class BioTraversalRequest(BaseModel):
    nodes: List[BioNodeInput]


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "runtime": "OMEGA V6 Sovereign Runtime", "version": app.version,
            "state_digest": _runtime.state.digest, "proof_records": len(_runtime.ledger.records),
            "persistent_state": str(STATE_PATH), "remote_ingress_secured": bool(GATEWAY_TOKEN),
            "software_families": software_summary(),
            "representation_boundary": "144/1728/20736 are software state-space representations unless independently evidenced otherwise"}


@app.get("/api/system/manifest")
def system_manifest() -> Dict[str, Any]:
    return {"summary": software_summary(), "families": [asdict(f) for f in software_manifest()]}


@app.get("/api/system/quality")
def system_quality() -> Dict[str, Any]:
    return quality_snapshot(_runtime, STATE_PATH)


@app.get("/api/status")
def get_status() -> Dict[str, Any]:
    snap = _calc.compute_from_packets([]); tic = _tic_calc.from_moment(snap)
    return {"timestamp": snap.timestamp.isoformat(), "uai": snap.uai, "life_coherence": snap.life_coherence,
            "system_coherence": snap.system_coherence, "evidence_count": snap.evidence_count,
            "truth": tic.truth, "integrity": tic.integrity, "courage": tic.courage,
            "omega_effective": tic.omega_effective,
            "boundary": "Fusion/TIC is a compatibility-derived layer. With no explicit evidence it returns zero; canonical authority is StateEnvelope."}


@app.get("/api/omega/state")
def omega_state() -> Dict[str, Any]:
    state = _runtime.state; g, op, simplex = _runtime.evaluate(state)
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
    candidate = StateEnvelope(address=Address20736(req.domain, req.phase, req.regulation, req.layer),
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
    try: address = _runtime.state.address if index is None else Address20736.from_index(index)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc
    outverse, inverse = outverse_inverse(address)
    return {"address": address.as_tuple(), "index": address.index, "ping_next": ping_next(address).as_tuple(),
            "ping_prev": ping_prev(address).as_tuple(), "opposite": opposite_address(address).as_tuple(),
            "outverse": outverse.as_tuple(), "inverse": inverse.as_tuple(), "phase_portal_count": len(phase_portal(address)),
            "edges": [asdict(e) for e in outgoing_edges(address)]}


@app.get("/api/omega/graph")
def omega_graph_summary() -> Dict[str, Any]:
    return asdict(reference_graph_summary())


@app.post("/api/omega/observer")
def omega_observer(req: ObserverRequest) -> Dict[str, Any]:
    frame = ObserverFrame(observer_id="api", phase_offset=req.phase_offset, scale=req.scale, rotation_deg=req.rotation_deg)
    state = _runtime.state; axes = tuple(float(x) for x in req.shell_axes)
    return {"native_address": state.address.as_tuple(), "observer_address": phase_transform(state.address, frame).as_tuple(),
            "native_axes": axes, "observer_axes": rotate_shell_axes(axes, frame), "time_basis": frame.time_basis,
            "boundary": "observer transform does not mutate canonical state or evidence class"}


@app.get("/api/omega/forecast")
def omega_forecast(horizon: int = 1) -> Dict[str, Any]:
    try: p = deterministic_local_forecast(_runtime.state, horizon)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"source_digest": p.source_digest, "horizon_transitions": p.horizon_transitions,
            "evidence_class": p.evidence_class, "calibrated": p.calibrated, "branches": [asdict(b) for b in p.branches]}


@app.get("/api/omega/scene")
def omega_scene() -> Dict[str, Any]:
    state = _runtime.state; g, _, _ = _runtime.evaluate(state); scene = living_glyph_scene(state, g)
    return {"state_digest": scene.state_digest, "evidence_class": scene.evidence_class, "primitives": [asdict(p) for p in scene.primitives]}


@app.get("/api/omega/proof")
def omega_proof(limit: int = 50) -> List[Dict[str, Any]]:
    safe_limit = max(1, min(limit, 200)); return [asdict(r) for r in _runtime.ledger.records[-safe_limit:]]


@app.post("/api/earth/traverse")
def earth_traverse(req: EarthTraversalRequest) -> Dict[str, Any]:
    o = GeoPoint(**req.origin.model_dump()); t = GeoPoint(**req.target.model_dump())
    result = traversal_summary(o, t)
    return {**result, "origin": asdict(o), "target": asdict(t)}


@app.post("/api/bio/traverse")
def bio_traverse(req: BioTraversalRequest) -> Dict[str, Any]:
    try:
        nodes = [BioNode(scale=BioScale(n.scale), label=n.label, source_id=n.source_id, evidence_class=n.evidence_class,
                         units=n.units, value=n.value, parent_label=n.parent_label) for n in req.nodes]
        return validate_chain(nodes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/audio/sonify")
def audio_sonify() -> Dict[str, Any]:
    s = _runtime.state; spec = state_to_sonification(s.metrics.continuity, s.metrics.contradiction, s.address.phase)
    return {**asdict(spec), "source_digest": s.digest, "evidence_class": "DERIVED",
            "boundary": "deterministic sonification mapping only; not a therapy or physical-frequency claim"}


@app.get("/api/patterns", response_model=List[PatternInfo])
def list_patterns() -> List[PatternInfo]:
    store = SequenceStore(); out: List[PatternInfo] = []
    for seq_id in store.list_ids():
        seq = store.get_sequence(seq_id)
        if seq: out.append(PatternInfo(seq_id=seq.seq_id, label=seq.label, date=seq.date, tags=seq.context_tags,
            duration_sec=seq.duration_sec, uai_before=seq.uai_before, uai_after=seq.uai_after))
    return out


@app.get("/api/events")
def get_events() -> List[Dict[str, Any]]: return EVENT_LOG[-50:]


def fusion_log(packet: OmegaPacket) -> None:
    snap = _calc.compute_from_packets([packet]); tic = _tic_calc.from_moment(snap)
    EVENT_LOG.append({"timestamp": snap.timestamp.isoformat(), "domain": packet.domain.name, "state": packet.state.name,
        "role": packet.role.name, "tags": packet.tags, "truth": tic.truth, "integrity": tic.integrity,
        "courage": tic.courage, "omega_effective": tic.omega_effective, "evidence_class": "DERIVED"})
    if len(EVENT_LOG) > 200: del EVENT_LOG[0]


@app.post("/api/run-pattern")
def run_pattern(req: RunPatternRequest) -> Dict[str, str]:
    store = SequenceStore(); seq = store.get_sequence(req.id)
    if not seq: raise HTTPException(status_code=404, detail=f"No sequence with id '{req.id}'")
    MacroPlayer(fusion_ingest_fn=fusion_log, executor=MacroExecutor(muscles=HostMuscles())).play(seq, speed=req.speed, loop_repeats=req.loop_repeats)
    return {"status": "ok", "message": f"Pattern '{req.id}' executed."}


for candidate in (Path(__file__).resolve().parents[1] / "web", Path(__file__).resolve().parents[1] / "ui"):
    if candidate.exists() and candidate.is_dir():
        app.mount("/", StaticFiles(directory=str(candidate), html=True), name="ui")
        break
