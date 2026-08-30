from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class FamilyStatus(str, Enum):
    LIVE_CORE = "LIVE_CORE"
    LIVE_ADAPTER = "LIVE_ADAPTER"
    DONOR_BOUND = "DONOR_BOUND"
    PLANNED_WITH_BOUNDARY = "PLANNED_WITH_BOUNDARY"
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
    SoftwareFamily("F00", "Omega Atlas Desktop / Runtime OS", "SOVEREIGN_DESKTOP_FIELD_OS", "Immersive atlas-native desktop/runtime with operator cockpit, proof HUD, live field renderer, traversal menu, and one-click launch path.", FamilyStatus.LIVE_CORE, "omega_runtime.OmegaRuntime", ("runtime.py", "api/app.py", "web/index.html", "scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1"), "Canonical state is software/runtime state; UI is a view/controller."),
    SoftwareFamily("F01", "Omega Reality Compiler", "STATE_TO_FIELD_COMPILER", "Compiles state packets into traversal, geometry, cinematic still/video-ready scene outputs from one continuity substrate.", FamilyStatus.LIVE_CORE, "ScenePacket", ("render.py",), "Scene geometry is derived from state fields and is not empirical reality unless a source packet is observed/imported."),
    SoftwareFamily("F02", "Persistent Packet Substrate", "ONE_PACKET_TYPE", "Shared packet matter: continuity, burden, contradiction, memory, scar, phase, neighbor links, child seed, and velocity.", FamilyStatus.LIVE_CORE, "StateEnvelope", ("state.py", "state_store.py", "memory.py"), "EvidenceClass is mandatory; persistence cannot promote evidence class."),
    SoftwareFamily("F03", "Hybrid Link Software", "BRIDGE_VERIFY_RETURN", "Safe connective tissue for donor packages, adapters, authority resolution, recovery boards, return packets, and patch chains.", FamilyStatus.LIVE_ADAPTER, "BridgePlan", ("bridge.py",), "No arbitrary shell. PC execution requires a paired host and returned proof."),
    SoftwareFamily("F04", "CanonForge / Genesis Engine", "GEOMETRY_LAW_RUNTIME", "Executable geometry-law and recursion framework with geometry alphabet, law faces, E0/Omega extensions, and interpreter.", FamilyStatus.DONOR_BOUND, "omega_144d_core + omega_fusion_core compatibility", ("omega_144d_core/", "omega_fusion_core/"), "Legacy symbolic/behavioral constructs remain compatibility/donor material unless explicitly bound into StateEnvelope."),
    SoftwareFamily("F05", "VGCL / Verified Geometric Civilization Logic", "PROOF_GEOMETRY_KERNEL", "Executable proof-geometry kernel with 20,736-node lattice, auto-ping, Dewey decisions, and reports.", FamilyStatus.LIVE_CORE, "Address20736 + ProofLedger", ("atlas.py", "mode188.py", "proof.py"), "20,736 is a software lattice, not a physical-dimensional claim."),
    SoftwareFamily("F06", "Executable Atlas Generator", "ATLAS_LATTICE_COMPILER", "Generates 1728 / 20,736 state lattices, shell relations, topology structures, maps, and workbook-ready outputs.", FamilyStatus.LIVE_CORE, "Address codecs", ("scales.py", "atlas.py"), "Generated coordinates/topology are derived unless backed by imported measurement data."),
    SoftwareFamily("F07", "Shell / Mandala Engine", "LOCAL_1_PLUS_6_SHELL", "Recursive local shell detector, simplex weights, opposite-pair contrasts, phase burden, and shell transitions.", FamilyStatus.LIVE_CORE, "Mode188 geometry", ("mode188.py",), "Shell outputs are derived from supplied amplitudes; no unsupported causal interpretation."),
    SoftwareFamily("F08", "Field Render Engine", "CONTINUITY_VISUALIZER", "Volumetric/field-oriented packet visualization, temporal accumulation hooks, and immersive rendering.", FamilyStatus.LIVE_CORE, "ScenePacket", ("render.py", "web/index.html"), "Render does not become truth authority; every data primitive must trace to a source field."),
    SoftwareFamily("F09", "Earth Traversal Engine", "EARTH_TO_CITY_TO_ROOM", "WGS84/GIS/terrain/evidence-gated Earth-to-local traversal using the same packet substrate.", FamilyStatus.PLANNED_WITH_BOUNDARY, "Earth adapter", (), "Requires timestamped geospatial source/provenance; no synthetic Earth state may be presented as live."),
    SoftwareFamily("F10", "Biological Traversal Engine", "BODY_TO_ATOM", "Organism-to-atom traversal using the shared packet substrate and explicit biological evidence boundaries.", FamilyStatus.PLANNED_WITH_BOUNDARY, "Bio adapter", (), "Requires explicit source, units, and evidence class; no medical/biological claim may be inferred from symbolic geometry alone."),
    SoftwareFamily("F11", "Omega Patch System", "SAFE_DELTA_UPGRADE", "Delta patching, rollback, checksum verification, repair, chained upgrades, and backup safety.", FamilyStatus.LIVE_ADAPTER, "Patch/recovery rail", ("bridge.py", "donor.py"), "Patches remain bounded and proof-returning; direct arbitrary shell mutation is prohibited."),
    SoftwareFamily("F12", "Omega Micro Build / Recovery Seed", "COMPRESSED_RUNTIME_SEED", "Small portable archive-aware recovery package retained only as a recovery mechanism.", FamilyStatus.RECOVERY_ONLY, "Recovery rail", (), "Not a release target and must not replace the full runtime."),
    SoftwareFamily("F13", "Living Coherence Membrane", "PERSISTENT_COHERENCE_FIELD", "20,736-cell persistent field substrate with local coupling, burden routing, attractors, memory curvature, and replay hooks.", FamilyStatus.LIVE_CORE, "StateEnvelope + RelationalState", ("relations.py", "memory.py", "dynamics.py"), "All coherence/field metrics remain derived formula outputs with declared inputs."),
    SoftwareFamily("F14", "Dewey Calculus Engine", "STAY_TURN_ESCALATE", "Operator system for Stay, Turn, Escalate, Prune, Construct, Ledger, scar accounting, and admissibility decisions.", FamilyStatus.LIVE_CORE, "Mode188/Dewey", ("mode188.py", "translation.py", "dynamics.py"), "Mode188 gate, Mode188 lens, and other formula hooks remain distinct and versioned."),
    SoftwareFamily("F15", "Proof / Forensic / Closure Ledger", "TRUTH_AUDIT_SPINE", "Drift detection, shadow-state purge, closure ledgers, replay validation, file hashes, proof packets, and forensic reports.", FamilyStatus.LIVE_CORE, "ProofLedger", ("proof.py", "corpus.py", "donor.py"), "Rejected alternatives remain retained; proof cannot be substituted with a UI PASS label."),
    SoftwareFamily("F16", "Workbook / Excel Atlas Runtime", "SPREADSHEET_CONTROL_PLANE", "Spreadsheet-based atlas editor, state ledger, charting, dashboards, build matrices, and large address charts.", FamilyStatus.LIVE_ADAPTER, "Corpus/source adapter", ("corpus.py",), "Original workbooks stay source artifacts; normalized/runtime derivatives are versioned separately."),
    SoftwareFamily("F17", "Echo-Chamber / SOMA Audio Engine", "PHASE_COHERENT_AUDIO", "Phase-coherent sonification/audio mapping from packet/state values.", FamilyStatus.PLANNED_WITH_BOUNDARY, "Audio adapter", (), "Audio output is derived sonification. No unsupported healing/medical efficacy claim."),
    SoftwareFamily("F18", "Universal Language System", "PACKET_LANGUAGE_INTERPRETER", "Packet language, geometry-language mapping, domain simulation, and semantic state translation.", FamilyStatus.LIVE_CORE, "TranslationOperator + KnowledgeIndex", ("translation.py", "knowledge.py"), "Natural language and symbolic translation remain advisory until typed/admitted into canonical state."),
    SoftwareFamily("F19", "Observer / Now-Frame System", "RELATIVE_ANCHOR_ENGINE", "Moving observer origin, observer-relative coordinates, phase displacement, and temporal route locking.", FamilyStatus.LIVE_CORE, "ObserverFrame", ("relativity.py",), "Observer transforms cannot mutate source evidence or claim representation time equals measured time."),
    SoftwareFamily("F20", "Recovery Board / Artifact Governance", "KEEP_DONOR_QUARANTINE", "Classifies artifacts KEEP, DONOR, QUARANTINE, EXPAND NEXT and resolves donors into canon modules.", FamilyStatus.LIVE_CORE, "DonorManifest", ("donor.py", "docs/SOURCE_CONVERGENCE.md"), "Unknown archives are never executed during intake; admission requires source/test review."),
    SoftwareFamily("F21", "AI Orchestrator / Operator Cockpit", "HUMAN_IN_LOOP_AUTOMATION", "Operator dashboard, topology maps, runtime controls, evidence-aware retrieval, and human-governed automation.", FamilyStatus.LIVE_ADAPTER, "KnowledgeIndex + web instrument", ("knowledge.py", "web/index.html", "bridge.py"), "Retrieval/indexing is not called model-weight training. Mutating actions remain explicitly governed."),
    SoftwareFamily("F22", "Renderer Authority / Cinematic Image Engine", "FIELD_SNAPSHOT_EXPORTER", "Immersive/cinematic render views from the same packet field and proof/host state.", FamilyStatus.LIVE_ADAPTER, "ScenePacket renderer", ("render.py",), "Cinematic treatment must preserve underlying evidence/data binding and may not invent measured values."),
    SoftwareFamily("F23", "Full System Packaging / Installer Suite", "ONE_CLICK_RELEASE_SYSTEM", "Windows launcher, health check, dependency verification/repair, shortcut, support bundle, and proof-embedded release path.", FamilyStatus.LIVE_ADAPTER, "Release tooling", ("INSTALL_OMEGA_V6_WINDOWS.bat", "scripts/INSTALL_OMEGA_V6_WINDOWS.ps1", "scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1", ".github/workflows/omega-v6-verify.yml"), "Target-Windows validation remains required before calling a release PC-verified."),
)


def manifest() -> tuple[SoftwareFamily, ...]:
    return FAMILIES


def summary() -> dict[str, object]:
    counts = {status.value: 0 for status in FamilyStatus}
    for family in FAMILIES:
        counts[family.status.value] += 1
    return {
        "family_count": len(FAMILIES),
        "mode188_refocus": "ONE FIELD / ONE PACKET / ONE TRAVERSAL / MANY OUTPUTS",
        "counts": counts,
        "complete_manifest": len(FAMILIES) == 24 and {f.family_id for f in FAMILIES} == {f"F{i:02d}" for i in range(24)},
    }
