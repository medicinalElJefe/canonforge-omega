from __future__ import annotations
from dataclasses import replace, asdict
from pathlib import Path
import json, threading
from .schema import Address20736, CanonicalMetrics, CanonicalPacket, EvidenceClass, MotionPacket, evidence_rank
from .calculus import mode188_gate, dewey_balance, shortest_arc_phase, calculus_snapshot
from .forecast import frozen_prior
from .proof import ProofLedger
from .projection import project

class OmegaRuntime:
    """Single canonical state authority. No adapter, renderer, mode or UI owns state."""
    def __init__(self,data_dir:Path):
        self.data_dir=Path(data_dir); self.data_dir.mkdir(parents=True,exist_ok=True)
        self.state_path=self.data_dir/"canonical_state.json"; self.lock=threading.RLock(); self.ledger=ProofLedger(self.data_dir/"proof.jsonl")
        self._state=self._load_or_seed()
    def _load_or_seed(self)->CanonicalPacket:
        if self.state_path.exists():
            try: return self._decode(json.loads(self.state_path.read_text(encoding="utf-8")))
            except Exception: pass
        p=CanonicalPacket(Address20736(1,1,7,12),CanonicalMetrics(),EvidenceClass.DERIVED,MotionPacket(phase=1.0),payload={"seed":"OMEGA_GENESIS"})
        self._persist(p); return p
    def _decode(self,d):
        m=CanonicalMetrics(**d["metrics"]); motion=MotionPacket(**d.get("motion",{})); addr=Address20736(*d["address"])
        return CanonicalPacket(addr,m,EvidenceClass(d["evidence_class"]),motion,(),d.get("payload",{}),d.get("parent_digest"),int(d.get("sequence",0)),d.get("observer_id","canonical"),d.get("created_at"),d.get("schema_version","omega-genesis-state-v1"))
    def _persist(self,p):
        tmp=self.state_path.with_suffix(".tmp"); tmp.write_text(json.dumps(p.canonical_dict(),indent=2),encoding="utf-8"); tmp.replace(self.state_path)
    @property
    def state(self): return self._state
    def snapshot(self):
        p=self._state
        return {"state":p.public_dict(),"calculus":calculus_snapshot(p.metrics),"projection":project(p),"proof":self.ledger.verify()}
    def propose(self,address:Address20736,metrics:CanonicalMetrics,evidence_class:EvidenceClass,*,mode:str="MODE188",payload:dict|None=None,allow_conditional:bool=False)->dict:
        with self.lock:
            before=self._state; gate=mode188_gate(metrics.continuity,metrics.burden,metrics.contradiction)
            if evidence_rank(evidence_class)>evidence_rank(before.evidence_class) and evidence_class in {EvidenceClass.OBSERVED,EvidenceClass.IMPORTED}:
                rec=self.ledger.append("TRANSITION","HOLD_EVIDENCE_PROMOTION",before.digest,None,{"requested":evidence_class.value,"current":before.evidence_class.value})
                return {"committed":False,"decision":"HOLD_EVIDENCE_PROMOTION","gate":asdict(gate),"receipt":asdict(rec)}
            prior=frozen_prior(before,1)
            commit_allowed=gate.admission=="ACCEPT" or (allow_conditional and gate.admission=="CONDITIONAL")
            if not commit_allowed:
                rec=self.ledger.append("TRANSITION",gate.admission,before.digest,None,{"mode":mode,"gate":asdict(gate),"forecast_prior":asdict(prior),"futureObservationUsed":False})
                return {"committed":False,"decision":gate.admission,"gate":asdict(gate),"forecast_prior":asdict(prior),"receipt":asdict(rec)}
            phase=shortest_arc_phase(before.motion.phase,float(address.phase),1.0)
            after=CanonicalPacket(address,metrics,evidence_class,replace(before.motion,phase=phase,transition_progress=1.0),(),payload or {},before.digest,before.sequence+1)
            self._persist(after); self._state=after
            rec=self.ledger.append("TRANSITION","COMMIT",before.digest,after.digest,{"mode":mode,"gate":asdict(gate),"forecast_prior":asdict(prior),"futureObservationUsed":False,"projection_fingerprint":project(after)["packet_fingerprint"]})
            return {"committed":True,"decision":"COMMIT","gate":asdict(gate),"forecast_prior":asdict(prior),"state":after.public_dict(),"receipt":asdict(rec)}
    def validate_dewey_bal_contract(self,source_state:int,target_state:int,source_burden:float,target_burden:float,edge:str)->dict:
        expected={"source_state":11499,"target_state":11687,"source_burden":0.8000063837447882,"target_burden":0.42901814817581707,"edge":"MODE188+"}
        score=dewey_balance(source_burden)
        checks={"source_state":source_state==expected["source_state"],"target_state":target_state==expected["target_state"],"source_burden":abs(source_burden-expected["source_burden"])<1e-9,"target_burden":abs(target_burden-expected["target_burden"])<1e-9,"edge":edge==expected["edge"],"score":abs(score-0.19999361625521184)<1e-12}
        decision="ACCEPT" if all(checks.values()) else "HOLD"
        self.ledger.append("DEWEY_BAL_CONTRACT",decision,self._state.digest,None,{"checks":checks,"score":score,"required_order":["CHECKPOINT_SOURCE","FREEZE_FORECAST_PRIOR","COMMIT_ADMITTED_EDGE"]})
        return {"decision":decision,"checks":checks,"score":score,"expected":expected,"required_order":["CHECKPOINT_SOURCE","FREEZE_FORECAST_PRIOR","COMMIT_ADMITTED_EDGE"]}
