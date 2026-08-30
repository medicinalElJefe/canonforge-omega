from __future__ import annotations
from hashlib import sha256
import json
from .calculus import calculus_snapshot, clamp

def project(packet,skin:str="DEFAULT")->dict:
    calc=calculus_snapshot(packet.metrics); m=packet.metrics
    scene={
        "state_digest":packet.digest,"state_id":packet.address.state_id,"address":packet.address.as_tuple(),"skin":skin.upper(),
        "phase":packet.motion.phase,"transition_progress":packet.motion.transition_progress,
        "channels":{"continuity":m.continuity,"plasticity":m.future_plasticity,"burden":m.burden,"contradiction":m.contradiction,"scar":m.scar,"evidence":m.evidence_strength,"water":calc["water"],"proof_scar":m.proof_scar,"normalized_mri":m.normalized_mri},
        "derived":{"torsion":clamp(m.contradiction),"pressure":clamp((m.burden+m.contradiction)/2),"route_strength":clamp((m.continuity+m.future_plasticity-m.burden+1)/3)},
        "boundary":"projection only; renderer cannot rewrite canonical state or evidence class"
    }
    scene["packet_fingerprint"]=sha256(json.dumps(scene,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
    return scene
