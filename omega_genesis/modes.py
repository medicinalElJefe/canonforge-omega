from __future__ import annotations

from dataclasses import dataclass, asdict
from math import isfinite
from .calculus import calculus_snapshot, clamp, form_value, quantize_heading, mode188_gate


@dataclass(frozen=True, slots=True)
class ModeSpec:
    id: str
    name: str
    family: str
    purpose: str
    inputs: tuple[str, ...]
    mutation_policy: str
    evidence_boundary: str
    menu: str


MODES: tuple[ModeSpec, ...] = (
    ModeSpec("ALL_MODES", "All Modes Orchestrator", "orchestration", "Evaluate the registered stack under one canonical packet and one mutation authority.", ("canonical_packet","mode_registry"), "READ_ONLY", "Composite orchestration only; child mode policies remain binding.", "06 AI Orchestration"),
    ModeSpec("FULL_OVERALL_CANON", "Full Overall Canon", "governance", "Highest-order synthesis separating canonical, derived, forecast, symbolic and philosophical layers.", ("packet","proof","evidence"), "READ_ONLY", "Never collapses evidence classes or contradictions into a truth claim.", "02 Proof & Governance"),
    ModeSpec("UNIFIED_COHERENCE", "Unified Coherence", "coherence", "Cross-domain coherence synthesis with contradiction-aware integration.", ("CΩ","Φ","Λ","q","S","evidence"), "READ_ONLY", "Derived software score only.", "02 Proof & Governance"),
    ModeSpec("MODE188", "Mode 188", "law", "Prune-before-build admissibility and STAY/TURN/ESCALATE routing.", ("CΩ","Λ","q"), "PROPOSE", "Derived law decision; never creates evidence.", "02 Proof & Governance"),
    ModeSpec("DEWEY_BAL", "DEWEY-BAL", "calculus", "Burden-compression resolver with checkpoint/prior/commit order.", ("Λ","state_id"), "PROPOSE", "Exact resolver contracts are regression constraints, not physical laws.", "03 Traversal"),
    ModeSpec("RSC", "Relational Skin Calculus", "calculus", "Capacity/load/margin relation over continuity, plasticity, burden, contradiction, stability and scar.", ("CΩ","Φ","Λ","q","S","scar"), "READ_ONLY", "Computational lens over declared inputs.", "02 Proof & Governance"),
    ModeSpec("DEEP_MOTHER", "Deep Mother", "lens", "Preservation, recoverability and future-plasticity weighting.", ("CΩ","Φ","S","evidence","Λ","q"), "READ_ONLY", "Weighting lens; does not independently establish truth.", "09 World / Bio / Forecast"),
    ModeSpec("HIGH_FATHER", "High Father", "lens", "Structure, constraint, boundary and evidence-discipline weighting.", ("S","evidence","Λ","q"), "READ_ONLY", "Weighting lens; does not independently establish truth.", "02 Proof & Governance"),
    ModeSpec("DEEP_THOUGHT", "Deep Thought", "lens", "Cross-check coherence through a conservative harmonic lens.", ("CΩ","S","evidence","q"), "READ_ONLY", "Derived score only.", "06 AI Orchestration"),
    ModeSpec("NO_NOTHING_TRUTH", "No-Nothing Truth", "truth", "Conservative truth-floor lens that refuses unsupported promotion.", ("CΩ","S","evidence","Λ","q"), "READ_ONLY", "Truth floor is a software admissibility heuristic, not empirical proof.", "02 Proof & Governance"),
    ModeSpec("GUIDANCE_FIELD", "Guidance Field", "guidance", "Convert admissibility, RSC margin and evidence into a bounded next-action vector.", ("mode188","rsc","evidence"), "PROPOSE", "Guidance proposes; runtime decides and commits.", "03 Traversal"),
    ModeSpec("FULL_SPHERE", "Full Sphere", "projection", "Whole-packet relational view including state, antipode, phase, load and proof channels.", ("packet","address","projection"), "READ_ONLY", "Projection only.", "04 Render Field"),
    ModeSpec("HEAVY_PRUNE", "Heavy Prune", "governance", "Stricter prune-before-build gate for unstable or weakly evidenced branches.", ("CΩ","Λ","q","evidence"), "PROPOSE", "More conservative derived gate; cannot delete evidence or proof history.", "02 Proof & Governance"),
    ModeSpec("ALPHA", "Alpha", "construct", "Constructive growth lens emphasizing continuity, plasticity and evidence.", ("CΩ","Φ","evidence","Λ","q"), "READ_ONLY", "Derived build-readiness lens.", "06 AI Orchestration"),
    ModeSpec("CRIMSON", "Crimson", "stress", "Stress/contradiction lens emphasizing burden, scar and unresolved conflict.", ("Λ","q","scar","S"), "READ_ONLY", "Derived risk lens.", "02 Proof & Governance"),
    ModeSpec("UNIFIED_RECURSION", "Unified Recursion", "recursion", "Recursive continuity across parent/child state, scar carry and future recoverability.", ("parent_digest","sequence","CΩ","S","evidence"), "READ_ONLY", "Recursion describes packet lineage; it does not invent ancestry.", "03 Traversal"),
    ModeSpec("TRUTH_TRAVERSAL", "Truth Traversal", "governance", "Traverse only through evidence-preserving admitted transitions.", ("mode188","evidence","proof"), "PROPOSE", "Cannot skip admission or proof.", "03 Traversal"),
    ModeSpec("CONTINUITY_FIELD", "Continuity Field", "relation", "Field potential from continuity, plasticity, stability and burden pressure.", ("CΩ","Φ","S","Λ","q"), "READ_ONLY", "Derived field potential only.", "04 Render Field"),
    ModeSpec("SCAR_CARRY", "Scar Carry", "memory", "Carry unresolved residual cost forward without rewriting prior packets.", ("scar","q","sequence"), "READ_ONLY", "Historical residual remains explicitly derived.", "02 Proof & Governance"),
    ModeSpec("AUTOPING", "AutoPing", "traversal", "Generate reversible neighboring address candidates for search and comparison.", ("address","atlas"), "READ_ONLY", "Candidates are topology, not evidence.", "03 Traversal"),
    ModeSpec("PRUNE_TRANSLATE_PROVE", "PRUNE → TRANSLATE → PROVE", "pipeline", "Govern proposal intake through pruning, semantic translation and proof receipt.", ("proposal","mode188","proof"), "PROPOSE", "No stage may elevate evidence rank.", "02 Proof & Governance"),
    ModeSpec("MOTION_RELATIVITY", "Motion Relativity", "motion", "Observer-relative phase, heading, derivatives and scale without rewriting source state.", ("phase","velocity","acceleration","jerk"), "READ_ONLY", "Observer transform only.", "03 Traversal"),
    ModeSpec("PHASE_TIME", "Phase Time", "motion", "One shortest-arc phase clock shared by render and state packet.", ("phase","progress"), "READ_ONLY", "UTC may exist only as a labeled sidecar.", "03 Traversal"),
    ModeSpec("LIGHT_MANDALA", "Light Mandala", "render", "State-bound phase/shell projection.", ("phase","CΩ","q","proof"), "READ_ONLY", "Projection cannot mutate source metrics.", "04 Render Field"),
    ModeSpec("WATER_LIQUID", "Water / Liquid", "relation", "Conductance and flow lens over continuity/plasticity/load.", ("CΩ","Φ","Λ","q"), "READ_ONLY", "Derived relation, not a material measurement.", "04 Render Field"),
    ModeSpec("BRAIN_MAP", "Brain Map", "domain", "Network topology projection with explicit source class.", ("graph","evidence"), "READ_ONLY", "No neurodiagnosis or inferred measurement without data.", "09 World / Bio / Forecast"),
    ModeSpec("LIVING_DNA", "Living DNA", "domain", "Multiscale biological relation projection.", ("bio_nodes","relations"), "READ_ONLY", "Structural model only unless biological sources are attached.", "09 World / Bio / Forecast"),
    ModeSpec("BIO_LONG_SCALE", "Billion-Year Biology", "domain", "Long-timescale evolutionary topology lens.", ("time","branching","evidence"), "READ_ONLY", "Historical/model projection; no synthetic observation claims.", "09 World / Bio / Forecast"),
    ModeSpec("EARTH_NOW", "Earth Now", "world", "Immutable-source Earth observation packets.", ("source_frame","timestamp","coordinates"), "EXTERNAL_SIDECAR", "LIVE only when timestamp and immutable frame bind to the same evidence object.", "09 World / Bio / Forecast"),
    ModeSpec("STREET_TRAVERSAL", "Street / Ground Traversal", "world", "Earth→region→city→street→ground traversal with missing-evidence HOLD.", ("WGS84","source_frames"), "EXTERNAL_SIDECAR", "Never generate unseen ground evidence.", "09 World / Bio / Forecast"),
    ModeSpec("MULTISCALE", "Multiscale", "scale", "Nuclear→atomic→chemical→biological→human/material→planetary→stellar→galactic views.", ("scale","state"), "READ_ONLY", "Scale labels do not convert model derivatives into measured SI quantities.", "03 Traversal"),
    ModeSpec("FORECAST", "Forecast", "forecast", "Frozen-prior future topology and branch scoring.", ("history","current_state"), "PROPOSE", "Forecast remains FORECAST and cannot silently become observation.", "09 World / Bio / Forecast"),
    ModeSpec("GRAPH_3D", "Graph 3D", "render", "Address graph and route topology renderer.", ("address","edges"), "READ_ONLY", "Graph geometry is derived from the atlas.", "04 Render Field"),
    ModeSpec("AUDIO", "State Sonification", "signal", "Deterministic audible mapping of state metrics.", ("CΩ","Φ","Λ","q","phase"), "READ_ONLY", "Feedback/sonification only; no therapeutic claim.", "08 Audio / Signal"),
    ModeSpec("LANGUAGE", "Universal Language", "semantic", "Translate typed packets and corpus evidence into operator-readable forms.", ("packet","corpus"), "PROPOSE", "Natural language is advisory until admitted as typed state.", "06 AI Orchestration"),
    ModeSpec("PATCH_RECOVERY", "Patch / Recovery", "governance", "KEEP/MERGE/DONOR/QUARANTINE donor handling and rollback.", ("artifact","manifest","proof"), "GOVERNED_HOST", "Unknown code is never executed during intake.", "11 Archive Merge"),
)

MODE_BY_ID={m.id:m for m in MODES}

def catalog() -> list[dict[str, object]]:
    return [asdict(x) for x in MODES]

def _unified_coherence(m) -> float:
    positive=(0.28*clamp(m.continuity)+0.18*clamp(m.future_plasticity)+0.18*clamp(m.stability)+0.18*clamp(m.evidence_strength)+0.18*clamp(1.0-m.contradiction))
    return clamp(positive-0.20*clamp(m.burden))

def _antipode(packet) -> tuple[int,int,int,int]:
    a=packet.address
    return tuple(((v+5)%12)+1 for v in a.as_tuple())

def evaluate(mode_id: str, packet) -> dict[str, object]:
    snap = calculus_snapshot(packet.metrics)
    m = packet.metrics
    mode_id = mode_id.upper()
    if mode_id == "ALL_MODES":
        return {"registered":len(MODES),"active_ids":[x.id for x in MODES],"canonical_digest":packet.digest,"mutation_authority":"OmegaRuntime only","core":{"mode188":snap["mode188"],"rsc":snap["rsc"],"unified_coherence":_unified_coherence(m)}}
    if mode_id == "FULL_OVERALL_CANON":
        return {"state_id":packet.address.state_id,"state_digest":packet.digest,"evidence_class":packet.evidence_class.value,"mode188":snap["mode188"],"rsc":snap["rsc"],"unified_coherence":_unified_coherence(m),"truth_boundary":"canonical / derived / forecast / symbolic remain distinct"}
    if mode_id == "UNIFIED_COHERENCE": return {"score":_unified_coherence(m),"contradiction_retained":clamp(m.contradiction),"evidence":clamp(m.evidence_strength)}
    if mode_id == "MODE188": return snap["mode188"]
    if mode_id == "DEWEY_BAL": return {"score": snap["dewey_balance"], "burden": m.burden}
    if mode_id == "RSC": return snap["rsc"]
    if mode_id == "DEEP_MOTHER": return {"score": snap["deep_mother"]}
    if mode_id == "HIGH_FATHER": return {"score": snap["high_father"]}
    if mode_id == "DEEP_THOUGHT": return {"score": snap["deep_thought"]}
    if mode_id == "NO_NOTHING_TRUTH":
        floor=min(clamp(m.continuity),clamp(m.stability),clamp(m.evidence_strength),clamp(1-m.contradiction),clamp(1-m.burden))
        return {"truth_floor":floor,"rule":"minimum supported factor; no unsupported promotion"}
    if mode_id == "GUIDANCE_FIELD":
        gate=snap["mode188"]; margin=float(snap["rsc"]["margin"])
        return {"dispatch":gate["dispatch"],"admission":gate["admission"],"rsc_margin":margin,"confidence":clamp(m.evidence_strength),"recommendation":"preserve" if gate["dispatch"]=="STAY" else "redirect" if gate["dispatch"]=="TURN" else "prune_or_escalate"}
    if mode_id == "FULL_SPHERE": return {"state_id":packet.address.state_id,"address":packet.address.as_tuple(),"antipode":_antipode(packet),"phase":packet.motion.phase,"channels":{"continuity":m.continuity,"plasticity":m.future_plasticity,"burden":m.burden,"contradiction":m.contradiction,"scar":m.scar,"evidence":m.evidence_strength}}
    if mode_id == "HEAVY_PRUNE":
        gate=mode188_gate(m.continuity,m.burden,m.contradiction,low=1.05,high=1.25)
        return {**asdict(gate),"evidence_gate":"PASS" if m.evidence_strength>=0.65 else "HOLD","policy":"stricter than MODE188"}
    if mode_id == "ALPHA": return {"construct_readiness":clamp(0.4*m.continuity+0.3*m.future_plasticity+0.3*m.evidence_strength-0.25*m.burden-0.20*m.contradiction)}
    if mode_id == "CRIMSON": return {"stress":clamp(0.42*m.burden+0.38*m.contradiction+0.20*m.scar),"stability_buffer":clamp(m.stability)}
    if mode_id == "UNIFIED_RECURSION": return {"sequence":packet.sequence,"has_parent":bool(packet.parent_digest),"continuity_carry":clamp(0.5*m.continuity+0.3*m.stability+0.2*m.evidence_strength),"parent_digest":packet.parent_digest}
    if mode_id == "TRUTH_TRAVERSAL": return {"next":snap["mode188"]["dispatch"],"admission":snap["mode188"]["admission"],"evidence_class":packet.evidence_class.value,"proof_required":True}
    if mode_id == "CONTINUITY_FIELD": return {"potential":clamp(0.42*m.continuity+0.25*m.future_plasticity+0.20*m.stability+0.13*(1-m.contradiction)-0.20*m.burden)}
    if mode_id == "SCAR_CARRY": return {"scar":clamp(m.scar),"contradiction":clamp(m.contradiction),"carry_pressure":clamp(m.scar*(0.5+0.5*m.contradiction)),"sequence":packet.sequence}
    if mode_id == "AUTOPING":
        a=packet.address
        prev_phase=((a.phase-2)%12)+1; next_phase=(a.phase%12)+1
        cls=type(a)
        prev=cls(a.domain,prev_phase,a.regulation,a.lens); nxt=cls(a.domain,next_phase,a.regulation,a.lens)
        return {"previous":{"state_id":prev.state_id,"address":prev.as_tuple()},"current":{"state_id":a.state_id,"address":a.as_tuple()},"next":{"state_id":nxt.state_id,"address":nxt.as_tuple()},"reversible":True}
    if mode_id == "PRUNE_TRANSLATE_PROVE": return {"prune":snap["mode188"]["admission"],"translate":"READY" if snap["mode188"]["admission"]!="PRUNE" else "HOLD","prove":"REQUIRED","state_digest":packet.digest}
    if mode_id == "WATER_LIQUID": return {"conductance": snap["water"]}
    if mode_id in {"MOTION_RELATIVITY","PHASE_TIME"}:
        return {"phase": packet.motion.phase, "velocity": packet.motion.velocity, "acceleration": packet.motion.acceleration, "jerk": packet.motion.jerk, "heading_rad": quantize_heading(packet.motion.heading_rad)}
    if mode_id == "LIGHT_MANDALA":
        return {"phase": packet.motion.phase, "radius_form": form_value(clamp(m.continuity)), "torsion": clamp(m.contradiction), "proof": clamp(m.evidence_strength)}
    if mode_id == "MULTISCALE":
        return {"contexts": ["Nuclear","Atomic","Chemical","Biological","Human/material","Planetary","Stellar","Galactic"], "state_id": packet.address.state_id}
    if mode_id == "FORECAST":
        return {"readiness": clamp((m.continuity + m.future_plasticity + m.stability - m.burden - m.contradiction + 1.0) / 4.0), "evidence_class": "FORECAST"}
    if mode_id not in MODE_BY_ID:
        return {"mode":mode_id,"status":"UNKNOWN_MODE"}
    return {"mode": mode_id, "state_id": packet.address.state_id, "status": "BOUNDARY_ONLY", "note": "Mode has a declared contract but requires its domain adapter/source payload for deeper evaluation."}
