from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

from omega_fusion_core.core.model import OmegaPacket, Domain, StateKind, RoleKind, Channel
from omega_fusion_core.core.universal_moment import UniversalMomentCalculator
from omega_fusion_core.core.tic import TICCalculator
from omega_fusion_core.storage.sequence_store import SequenceStore
from omega_fusion_core.pattern_hub.macro_playback import MacroPlayer
from omega_fusion_core.host.muscles import HostMuscles
from omega_fusion_core.host.executor import MacroExecutor


app = FastAPI(title="Omega OS Desktop UI (TIC + Electron)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory="../ui", html=True), name="ui")

_calc = UniversalMomentCalculator()
_tic_calc = TICCalculator()

EVENT_LOG: List[Dict[str, Any]] = []  # rolling window of latest events


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


@app.get("/api/status")
def get_status():
    snap = _calc.compute_from_packets([])
    tic = _tic_calc.from_moment(snap)
    return {
        "timestamp": snap.timestamp.isoformat(),
        "uai": snap.uai,
        "life_coherence": snap.life_coherence,
        "system_coherence": snap.system_coherence,
        "truth": tic.truth,
        "integrity": tic.integrity,
        "courage": tic.courage,
        "omega_effective": tic.omega_effective,
    }


@app.get("/api/patterns", response_model=List[PatternInfo])
def list_patterns():
    store = SequenceStore()
    ids = store.list_ids()
    out: List[PatternInfo] = []
    for seq_id in ids:
        seq = store.get_sequence(seq_id)
        if not seq:
            continue
        out.append(
            PatternInfo(
                seq_id=seq.seq_id,
                label=seq.label,
                date=seq.date,
                tags=seq.context_tags,
                duration_sec=seq.duration_sec,
                uai_before=seq.uai_before,
                uai_after=seq.uai_after,
            )
        )
    return out


@app.get("/api/events")
def get_events():
    """Return the latest Omega events with TIC annotations."""
    # return last 50 for UI
    return EVENT_LOG[-50:]


def fusion_log(packet: OmegaPacket) -> None:
    snap = _calc.compute_from_packets([packet])
    tic = _tic_calc.from_moment(snap)
    event = {
        "timestamp": snap.timestamp.isoformat(),
        "domain": packet.domain.name,
        "state": packet.state.name,
        "role": packet.role.name,
        "tags": packet.tags,
        "truth": tic.truth,
        "integrity": tic.integrity,
        "courage": tic.courage,
        "omega_effective": tic.omega_effective,
    }
    EVENT_LOG.append(event)
    if len(EVENT_LOG) > 200:
        del EVENT_LOG[0]


@app.post("/api/run-pattern")
def run_pattern(req: RunPatternRequest):
    store = SequenceStore()
    seq = store.get_sequence(req.id)
    if not seq:
        raise HTTPException(status_code=404, detail=f"No sequence with id '{req.id}'")

    muscles = HostMuscles()
    executor = MacroExecutor(muscles=muscles)
    player = MacroPlayer(fusion_ingest_fn=fusion_log, executor=executor)
    player.play(seq, speed=req.speed, loop_repeats=req.loop_repeats)
    return {"status": "ok", "message": f"Pattern '{req.id}' executed."}
