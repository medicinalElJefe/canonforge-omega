from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class FamilyStatus(str, Enum):
    LIVE_CORE = "LIVE_CORE"
    LIVE_ADAPTER = "LIVE_ADAPTER"
    DONOR_BOUND = "DONOR_BOUND"
    RECOVERY_ONLY = "RECOVERY_ONLY"


@dataclass(frozen=True, slots=True)
class SoftwareFamily:
    family_id: str
    name: str
    invariant: str
    purpose: str
    status: FamilyStatus
    authority: str
    implementation: tuple[str, ...]
    evidence_boundary: str


FAMILIES: tuple[SoftwareFamily, ...] = (
    SoftwareFamily("F00", "Omega Atlas Desktop / Runtime OS", "SOVEREIGN_DESKTOP_FIELD_OS", "Atlas-native sovereign runtime, cockpit, proof HUD, traversal and launch authority.", FamilyStatus.LIVE_CORE, "OmegaRuntime", ("runtime.py", "api/app.py", "web/index.html"), "UI is a view/controller; canonical state lives in StateEnvelope."),
    SoftwareFamily("F01", "Omega Reality Compiler", "STATE_TO_FIELD_COMPILER", "Compile state packets into geometry and render scenes from one substrate.", FamilyStatus.LIVE_CORE, "ScenePacket", ("render.py",), "Rendered geometry is derived unless backed by observed/imported packets."),
    SoftwareFamily("F02", "Persistent Packet Substrate", "ONE_PACKET_TYPE", "Canonical packet matter for continuity, burden, contradiction, memory, scar, phase and motion.", FamilyStatus.LIVE_CORE, "StateEnvelope", ("state.py", "state_store.py", "memory.py"), "Persistence never promotes evidence class."),
    SoftwareFamily("F03", "Hybrid Link Software", "BRIDGE_VERIFY_RETURN", "Bounded PC/public bridge, donor adapters, authority resolution and return proof.", FamilyStatus.LIVE_ADAPTER, "BridgePlan", ("bridge.py", "security.py"), "No arbitrary remote shell; host mutation requires explicit governed execution."),
    SoftwareFamily("F04", "CanonForge / Genesis Engine", "GEOMETRY_LAW_RUNTIME", "Geometry-law and recursion compatibility engine.", FamilyStatus.DONOR_BOUND, "omega_144d_core + omega_fusion_core", ("omega_144d_core/", "omega_fusion_core/"), "Legacy symbolic constructs remain donor material until typed into canonical state."),
    SoftwareFamily("F05", "VGCL / Verified Geometric Civilization Logic", "PROOF_GEOMETRY_KERNEL", "20,736-state proof lattice, AutoPing, Mode188 decisions and reports.", FamilyStatus.LIVE_CORE, "Address20736 + ProofLedger", ("atlas.py", "graph.py", "mode188.py", "proof.py"), "20,736 is a software representation lattice, not a physical-dimension claim."),
    SoftwareFamily("F06", "Executable Atlas Generator", "ATLAS_LATTICE_COMPILER", "Generate 144/1728/20,736 addresses, topology and projections.", FamilyStatus.LIVE_CORE, "Address codecs", ("scales.py", "atlas.py", "graph.py"), "Generated topology is derived unless an imported dataset supplies it."),
    SoftwareFamily("F07", "Shell / Mandala Engine", "LOCAL_1_PLUS_6_SHELL", "1+6 shell, opposite-pair axes, simplex and phase transitions.", FamilyStatus.LIVE_CORE, "Mode188 geometry", ("mode188.py",), "Shell meaning is limited to supplied amplitudes and declared formulas."),
    SoftwareFamily("F08", "Field Render Engine", "CONTINUITY_VISUALIZER", "Field-oriented state visualization and living glyph scene generation.", FamilyStatus.LIVE_CORE, "ScenePacket", ("render.py", "web/index.html"), "Render never becomes truth authority."),
    SoftwareFamily("F09", "Earth Traversal Engine", "EARTH_TO_CITY_TO_ROOM", "WGS84 geodetic/ECEF/local-ENU traversal foundation for evidence-gated Earth adapters.", FamilyStatus.LIVE_ADAPTER, "GeoPoint/WGS84", ("earth.py",), "Coordinate transforms are real math on supplied coordinates; terrain, roads, buildings, weather and live motion require timestamped sources."),
    SoftwareFamily("F10", "Biological Traversal Engine", "BODY_TO_ATOM", "Typed organism→organ→tissue→cell→organelle→molecule→atom traversal with units/provenance gates.", FamilyStatus.LIVE_ADAPTER, "BioNode", ("bio.py",), "Structural traversal makes no diagnosis or biological inference from symbolic geometry."),
    SoftwareFamily("F11", "Omega Patch System", "SAFE_DELTA_UPGRADE", "Bounded patching, rollback/checksum hooks, donor inspection and repair rail.", FamilyStatus.LIVE_ADAPTER, "BridgePlan + DonorManifest", ("bridge.py", "donor.py"), "Unknown code is not executed during intake."),
    SoftwareFamily("F12", "Omega Micro Build / Recovery Seed", "COMPRESSED_RUNTIME_SEED", "Recovery-only bootstrap retained for disaster recovery, never as release authority.", FamilyStatus.RECOVERY_ONLY, "Recovery rail", ("donor.py",), "Recovery seed cannot supersede the full runtime."),
    SoftwareFamily("F13", "Living Coherence Membrane", "PERSISTENT_COHERENCE_FIELD", "Persistent relational field with memory, burden routing and motion dynamics.", FamilyStatus.LIVE_CORE, "StateEnvelope + RelationalState", ("relations.py", "memory.py", "dynamics.py"), "Coherence values are derived outputs with explicit inputs."),
    SoftwareFamily("F14", "Dewey Calculus Engine", "STAY_TURN_ESCALATE", "Stay/Turn/Escalate, Construct/Prune, translation and ledger operations.", FamilyStatus.LIVE_CORE, "Mode188/Dewey", ("mode188.py", "translation.py", "dynamics.py"), "Distinct formula hooks remain distinct and versioned."),
    SoftwareFamily("F15", "Proof / Forensic / Closure Ledger", "TRUTH_AUDIT_SPINE", "Hash-chained proof, rejection retention, donor forensics and closure audit.", FamilyStatus.LIVE_CORE, "ProofLedger", ("proof.py", "corpus.py", "donor.py", "quality.py"), "A visual PASS label is never proof."),
    SoftwareFamily("F16", "Workbook / Excel Atlas Runtime", "SPREADSHEET_CONTROL_PLANE", "Workbook/corpus source adapter and structured atlas ingestion rail.", FamilyStatus.LIVE_ADAPTER, "Corpus adapter", ("corpus.py", "knowledge.py"), "Source workbooks remain immutable provenance artifacts; derivatives are separately versioned."),
    SoftwareFamily("F17", "Echo-Chamber / SOMA Audio Engine", "PHASE_COHERENT_AUDIO", "Deterministic state sonification and WAV generation from explicit state metrics.", FamilyStatus.LIVE_ADAPTER, "SonificationSpec", ("audio.py",), "Audio is derived sonification only; no therapeutic or physical-frequency efficacy claim."),
    SoftwareFamily("F18", "Universal Language System", "PACKET_LANGUAGE_INTERPRETER", "Evidence-aware packet language, semantic translation and knowledge retrieval.", FamilyStatus.LIVE_CORE, "TranslationOperator + KnowledgeIndex", ("translation.py", "knowledge.py"), "Natural language remains advisory until admitted as typed state."),
    SoftwareFamily("F19", "Observer / Now-Frame System", "RELATIVE_ANCHOR_ENGINE", "Observer-relative phase, rotation, scale and time-basis transforms.", FamilyStatus.LIVE_CORE, "ObserverFrame", ("relativity.py",), "Observer transforms cannot mutate evidence or canonical source state."),
    SoftwareFamily("F20", "Recovery Board / Artifact Governance", "KEEP_DONOR_QUARANTINE", "KEEP/DONOR/QUARANTINE/EXPAND governance for recovered artifacts.", FamilyStatus.LIVE_CORE, "DonorManifest", ("donor.py", "docs/SOURCE_CONVERGENCE.md"), "Unknown archives are hashed and inspected before admission."),
    SoftwareFamily("F21", "AI Orchestrator / Operator Cockpit", "HUMAN_IN_LOOP_AUTOMATION", "Evidence-aware retrieval, cockpit controls and governed bridge actions.", FamilyStatus.LIVE_ADAPTER, "KnowledgeIndex + cockpit", ("knowledge.py", "web/index.html", "bridge.py"), "Retrieval is not mislabeled as model-weight training; mutations remain governed."),
    SoftwareFamily("F22", "Renderer Authority / Cinematic Image Engine", "FIELD_SNAPSHOT_EXPORTER", "Proof/state-bound scene export authority for immersive/cinematic views.", FamilyStatus.LIVE_ADAPTER, "ScenePacket renderer", ("render.py",), "Styling cannot invent measured values."),
    SoftwareFamily("F23", "Full System Packaging / Installer Suite", "ONE_CLICK_RELEASE_SYSTEM", "Windows install/launch, health gate, CI verification and public Worker package.", FamilyStatus.LIVE_ADAPTER, "Release tooling", ("INSTALL_OMEGA_V6_WINDOWS.bat", "scripts/INSTALL_OMEGA_V6_WINDOWS.ps1", "scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1", ".github/workflows/omega-v6-verify.yml"), "Target Windows/GPU validation is a separate acceptance gate."),
)


def manifest() -> tuple[SoftwareFamily, ...]:
    return FAMILIES


def summary() -> dict[str, object]:
    counts = {status.value: 0 for status in FamilyStatus}
    for family in FAMILIES:
        counts[family.status.value] += 1
    ids = {f.family_id for f in FAMILIES}
    return {
        "family_count": len(FAMILIES),
        "mode188_refocus": "ONE FIELD / ONE PACKET / ONE TRAVERSAL / MANY OUTPUTS",
        "counts": counts,
        "complete_manifest": len(FAMILIES) == 24 and ids == {f"F{i:02d}" for i in range(24)},
        "implemented_or_bound": sum(f.status is not FamilyStatus.RECOVERY_ONLY for f in FAMILIES),
        "release_authority": "full runtime only",
    }
