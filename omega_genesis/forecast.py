from __future__ import annotations
from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from .calculus import clamp

@dataclass(frozen=True,slots=True)
class ForecastPrior:
    state_digest:str
    horizon:int
    continuity:float
    plasticity:float
    burden:float
    contradiction:float
    probability_stay:float
    probability_turn:float
    probability_escalate:float
    future_observation_used:bool=False

    @property
    def digest(self):
        raw=json.dumps(asdict(self),sort_keys=True,separators=(",",":"))
        return sha256(raw.encode()).hexdigest()

def frozen_prior(packet,horizon:int=1)->ForecastPrior:
    m=packet.metrics; h=max(1,int(horizon))
    raw_stay=clamp((m.continuity+m.stability+1-m.burden+1-m.contradiction)/4)
    raw_turn=clamp(1-abs(m.continuity-(m.burden+m.contradiction)/2))
    raw_esc=clamp((m.burden+m.contradiction)/2)
    z=raw_stay+raw_turn+raw_esc or 1.0
    return ForecastPrior(packet.digest,h,m.continuity,m.future_plasticity,m.burden,m.contradiction,raw_stay/z,raw_turn/z,raw_esc/z,False)
