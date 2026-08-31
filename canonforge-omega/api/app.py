from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Any, Dict, List, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
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
from omega_runtime.heartbeat import HeartbeatRegistry
from omega_runtime.pairing import PairingRegistry
from omega_runtime.proof import ProofLedger
from omega_runtime.relativity import ObserverFrame, phase_transform, outverse_inverse, rotate_shell_axes
from omega_runtime.render import living_glyph_scene
from omega_runtime.state_store import StateStore
from omega_runtime.security import gateway_authorized
from omega_runtime.system_manifest import manifest as software_manifest, summary as software_summary
from omega_runtime.self_build import BuildMode, JobState, SovereignBuildController, SAFE_JOB_KINDS

app = FastAPI(title="OMEGA V6 Sovereign Runtime", version="6.2.0-live-heartbeat-self-build")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])

GATEWAY_TOKEN = os.environ.get("OMEGA_GATEWAY_TOKEN")
PUBLIC_URL = os.environ.get("OMEGA_PUBLIC_URL", "https://omegav6.jeffdeweyeljefe.workers.dev").rstrip("/")


@app.middleware("http")
async def sovereign_ingress(request: Request, call_next):
    """Keep localhost frictionless while requiring the Cloudflare sovereign gateway remotely."""
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
BUILD_STATE_PATH = OMEGA_HOME / "development" / "self_build.json"
HEARTBEAT_STATE_PATH = OMEGA_HOME / "hybrid" / "heartbeat.json"
PAIRING_STATE_PATH = OMEGA_HOME / "hybrid" / "pairing.json"
APPROVED_BUILD_ROOT = Path(os.environ.get("OMEGA_APPROVED_ROOT", str(Path.cwd())))
_initial = StateEnvelope(
    address=Address20736(1, 1, 1, 1), evidence_class=EvidenceClass.DERIVED,
    metrics=StateMetrics(continuity=1.0, burden=0.20, contradiction=0.10, future_plasticity=0.50),
    source_id="OMEGA_BOOTSTRAP_SCHEMA",
    payload={"boundary": "runtime initialization record; not an empirical observation"},
)
_runtime = OmegaRuntime(_initial, ProofLedger(LEDGER_PATH), StateStore(STATE_PATH))
_builder = SovereignBuildController(BUILD_STATE_PATH, APPROVED_BUILD_ROOT)
_heartbeat = HeartbeatRegistry(HEARTBEAT_STATE_PATH, ttl_seconds=45)
_pairing = PairingRegistry(PAIRING_STATE_PATH)


def _agent_authorized(request: Request) -> bool:
    return _pairing.validate(request.headers.get("x-omega-agent-token"))


def _require_agent(request: Request) -> None:
    if not _agent_authorized(request):
        raise HTTPException(status_code=401, detail={
            "error": "hybrid_agent_authentication_required",
            "action": "download and run a fresh canonical Windows launcher",
        })


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


class BuildModeRequest(BaseModel):
    mode: Literal["MANUAL", "DEVELOPMENT_LOOP", "CONTINUOUS_SOVEREIGN_BUILD"]


class BuildEnqueueRequest(BaseModel):
    kind: str
    reason: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class BuildLeaseRequest(BaseModel):
    agent_id: str = Field(min_length=1, max_length=120)


class BuildResultRequest(BaseModel):
    state: Literal["RUNNING", "BLOCKED", "FAILED", "VERIFIED", "CANCELLED"]
    evidence: Dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class HeartbeatRequest(BaseModel):
    agent_id: str = Field(min_length=1, max_length=120)
    approved_root: str = Field(min_length=1, max_length=2000)
    capabilities: List[str] = Field(default_factory=list)
    runtime_version: str | None = None
    last_job_id: str | None = None


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "runtime": "OMEGA V6 Sovereign Runtime", "state_digest": _runtime.state.digest,
            "proof_records": len(_runtime.ledger.records), "persistent_state": str(STATE_PATH),
            "remote_ingress_secured": bool(GATEWAY_TOKEN), "software_families": software_summary(),
            "development_mode": _builder.mode.value, "hybrid": _heartbeat.status(),
            "representation_boundary": "144/1728/20736 are software state-space representations unless independently evidenced otherwise"}


@app.get("/api/system/manifest")
def system_manifest() -> Dict[str, Any]:
    return {"summary": software_summary(), "families": [asdict(f) for f in software_manifest()]}


@app.get("/api/status")
def get_status() -> Dict[str, Any]:
    snap = _calc.compute_from_packets([])
    tic = _tic_calc.from_moment(snap)
    return {"timestamp": snap.timestamp.isoformat(), "uai": snap.uai, "life_coherence": snap.life_coherence,
            "system_coherence": snap.system_coherence, "evidence_count": snap.evidence_count,
            "truth": tic.truth, "integrity": tic.integrity, "courage": tic.courage,
            "omega_effective": tic.omega_effective, "development": _builder.status(), "hybrid": _heartbeat.status(),
            "boundary": "Fusion/TIC is a compatibility-derived layer. With no explicit evidence it returns zero; canonical authority is StateEnvelope."}


@app.get("/api/hybrid/status")
def hybrid_status() -> Dict[str, Any]:
    hb = _heartbeat.status()
    proof = hb.get("proof") or {}
    current = bool(hb.get("pc_online"))
    stale = hb.get("state") == "HEARTBEAT_STALE"
    seen = proof != {}
    return {
        "state": hb.get("state"),
        "browserCredentialReady": _pairing.ready,
        "pairingConfigured": _pairing.ready,
        "pairingGeneration": _pairing.generation,
        "agentRunning": seen and (current or stale),
        "agentReachable": current,
        "authenticated": bool(hb.get("authenticated_heartbeat")),
        "agentAuthenticated": bool(hb.get("authenticated_heartbeat")),
        "heartbeatCurrent": current,
        "heartbeatStale": stale,
        "heartbeatAgeSeconds": hb.get("heartbeat_age_seconds"),
        "heartbeatTtlSeconds": hb.get("ttl_seconds", 45),
        "nativeExecutionClaimed": current,
        "pcOnline": current,
        "proof": proof or None,
        "development": _builder.status(),
        "boundary": "browser credential readiness never implies PC ONLINE; current authenticated heartbeat proof is mandatory",
    }


@app.get("/api/hybrid/agent")
def hybrid_agent_download() -> Response:
    path = Path(__file__).resolve().parents[1] / "scripts" / "omega_sovereign_agent.py"
    if not path.exists():
        raise HTTPException(status_code=404, detail="canonical sovereign agent is missing from this runtime")
    return Response(path.read_text(encoding="utf-8"), media_type="text/x-python",
                    headers={"content-disposition": 'attachment; filename="omega_sovereign_agent.py"', "cache-control": "no-store"})


@app.get("/api/hybrid/launcher")
def hybrid_launcher() -> Response:
    token = _pairing.issue(datetime.now(timezone.utc).isoformat())
    cmd = f'''@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "OMEGA_SERVER={PUBLIC_URL}"
set "OMEGA_TOKEN={token}"
set "OMEGA_ROOT=%~dp0"
set "OMEGA_HOME=%LOCALAPPDATA%\\OMEGA"
set "OMEGA_AGENT=%OMEGA_HOME%\\omega_sovereign_agent.py"
if not exist "%OMEGA_HOME%" mkdir "%OMEGA_HOME%"
echo OMEGA Sovereign PC Link
echo Canonical: %OMEGA_SERVER%
echo Approved root: %OMEGA_ROOT%
echo [1/5] Checking canonical runtime...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/health' -TimeoutSec 20 ^| Out-Null" || goto :network_error
echo [2/5] Locating Python 3...
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY goto :python_error
echo [3/5] Downloading canonical sovereign agent...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/hybrid/agent' -OutFile '%OMEGA_AGENT%' -TimeoutSec 30" || goto :download_error
findstr /C:"OMEGA sovereign heartbeat" "%OMEGA_AGENT%" >nul || goto :download_error
echo [4/5] Starting authenticated heartbeat proof...
echo [5/5] Starting governed development loop. Keep this window open.
%PY% "%OMEGA_AGENT%" --server "%OMEGA_SERVER%" --token "%OMEGA_TOKEN%" --root "%OMEGA_ROOT%"
set "RC=%ERRORLEVEL%"
echo.
echo OMEGA agent exited with code %RC%.
echo Download a fresh launcher to rotate pairing if authentication was rejected.
pause
exit /b %RC%
:network_error
echo NETWORK ERROR: canonical OMEGA is unreachable. Check DNS, firewall, VPN, or internet access.
pause
exit /b 20
:python_error
echo PYTHON REQUIRED: Python 3 was not found. Install Python 3 and run this launcher again.
pause
exit /b 21
:download_error
echo AGENT DOWNLOAD ERROR: canonical agent could not be downloaded or validated.
pause
exit /b 22
'''
    return Response(cmd, media_type="application/octet-stream",
                    headers={"content-disposition": 'attachment; filename="START_OMEGA_PC_LINK.cmd"', "cache-control": "no-store"})


@app.post("/api/device/heartbeat")
def device_heartbeat(req: HeartbeatRequest, request: Request) -> Dict[str, Any]:
    _require_agent(request)
    root = Path(req.approved_root).expanduser()
    expected = APPROVED_BUILD_ROOT.expanduser().resolve()
    try:
        resolved = root.resolve()
    except OSError as exc:
        raise HTTPException(status_code=422, detail=f"invalid approved root: {exc}") from exc
    if resolved != expected:
        raise HTTPException(status_code=403, detail={"error": "approved_root_mismatch", "expected": str(expected), "received": str(resolved)})
    return _heartbeat.record(agent_id=req.agent_id, approved_root=str(resolved), capabilities=req.capabilities,
                             runtime_version=req.runtime_version, last_job_id=req.last_job_id, authenticated=True)


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
    try:
        address = _runtime.state.address if index is None else Address20736.from_index(index)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
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
    try:
        p = deterministic_local_forecast(_runtime.state, horizon)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
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


@app.get("/api/development/status")
def development_status() -> Dict[str, Any]:
    return _builder.status()


@app.post("/api/development/mode")
def development_mode(req: BuildModeRequest) -> Dict[str, Any]:
    return _builder.set_mode(BuildMode(req.mode))


@app.post("/api/development/enqueue")
def development_enqueue(req: BuildEnqueueRequest) -> Dict[str, Any]:
    if req.kind not in SAFE_JOB_KINDS:
        raise HTTPException(status_code=422, detail={"unsupported_kind": req.kind, "allowed": sorted(SAFE_JOB_KINDS)})
    try:
        return asdict(_builder.enqueue(req.kind, req.reason, req.payload))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/development/lease")
def development_lease(req: BuildLeaseRequest, request: Request) -> Dict[str, Any]:
    _require_agent(request)
    hb = _heartbeat.status()
    proof = hb.get("proof") or {}
    if not hb.get("pc_online") or proof.get("agent_id") != req.agent_id:
        raise HTTPException(status_code=409, detail={
            "error": "current_authenticated_heartbeat_required",
            "heartbeat_state": hb.get("state"),
            "requested_agent": req.agent_id,
        })
    job = _builder.lease_next(req.agent_id)
    return {"job": None if job is None else asdict(job),
            "heartbeat_sequence": proof.get("sequence"),
            "boundary": "typed allow-listed jobs only; arbitrary shell text is never emitted"}


@app.post("/api/development/jobs/{job_id}/result")
def development_result(job_id: str, req: BuildResultRequest, request: Request) -> Dict[str, Any]:
    _require_agent(request)
    hb = _heartbeat.status()
    if not hb.get("pc_online"):
        raise HTTPException(status_code=409, detail={"error": "current_authenticated_heartbeat_required", "heartbeat_state": hb.get("state")})
    try:
        job = _builder.update_job(job_id, JobState(req.state), req.evidence, req.error)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"unknown build job: {job_id}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"job": asdict(job), "next": _builder.status().get("active_job")}


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
