# OMEGA Shell Arbitration Map

Checkpoint: R159 / BATCH 005
Canonical parent: `781e9077c4ce183cec0a0451e22cce077c87c9c2`

## Goal
Converge current V6 presentation modules behind one deterministic `OmegaEnvironmentShell` without replacing canonical state/runtime authority.

## Current authority layers observed

### Base `index.ts` shell — KEEP / become shell substrate
Owns the original coherent hierarchy:
- `.top` runtime/status header
- `.shell` desktop frame
- `.nav` application navigation
- `.work` primary work region
- `.app` workspace switching
- `.surface` workspace container
- Field canvas/HUD/role toolbar/context controls
- canonical API clients and existing state/route/Earth/Hybrid/proof behaviors

Decision: preserve runtime/API behavior. Refactor presentation mounting behind `OmegaEnvironmentShell`; do not replace state source.

### `launchHdNavigation.ts` — MERGE, DEMOTE global layout authority
Useful recovered capability:
- launch experience
- workspace chooser
- command palette
- rich instrument styles
- workspace dock semantics
- mobile launch composition

Conflicting global writes observed:
- creates fixed global `#omegaDock`
- changes `.work` bottom padding on mobile
- writes global `.top`, `.surface`, `.panel`, `.badge` presentation
- controls `body.omegaLaunchOpen`
- directly hides `.top`, `main.work`, `#omegaDock`, `#nav` during launch

Target mounting:
- launch becomes shell `launch` state before operational regions mount
- command palette becomes shell-owned overlay
- dock semantics feed shell navigation; `#omegaDock` no longer independently owns viewport geometry

### `archiveRecoveredWorkstation.ts` — KEEP instrument, DEMOTE global arbitration
Useful recovered capability:
- coordinated LIVE FIELD / XRAY / ATLAS / SPLIT / REPLAY lenses
- channel controls
- timeline/replay
- state/calculus readouts
- mode participation
- one-packet/multiple-lenses architecture

Conflicting global write observed:
- `#hdInstrument{display:none!important}` suppresses a sibling instrument outside its own mount contract

Target mounting:
- workstation becomes a shell stage instrument/lens
- shell decides whether it or HD instrument is mounted
- module may not hide sibling modules globally

### `coreStudioHdInstrument.ts` — KEEP instrument, DEMOTE global cinema writes
Useful recovered capability:
- temporal calculus field
- finite-difference gradient/Laplacian diagnostics
- state-driven particles/trajectories
- typed relation geometry
- mode/operator/anchor semantics
- shell-dependent resolution
- proof boundary language

Conflicting global writes observed:
- `body.hd-cinema .top/.hero/.studio/#modePreviewStudio` modifies unrelated regions globally
- fullscreen/cinema behavior assumes page-level authority

Target mounting:
- shell provides focus/cinema state and determines which regions dim/collapse
- HD instrument only controls its own stage subtree

### Recovered workstation vs HD instrument
Current direct suppression (`archiveWorkstation` hides `hdInstrument`) is evidence of missing arbitration.
Correct rule: both capabilities remain KEEP. Shell chooses active instrument/lens according to workspace/view state. Neither module hides the other.

## Shell regions
1. STATUS — runtime/heartbeat/evidence truth.
2. NAVIGATION — one authority per viewport.
3. STAGE — one active workspace/instrument.
4. CONTEXT — active workspace controls/readouts.
5. PROOF — progressive evidence/provenance.

## Mobile contract
- reserve `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` before sizing stage
- no fixed element may overlap stage or context without a shell-owned reserved region
- horizontal workspace rail is the only primary navigation authority
- contextual controls use in-flow section or shell drawer, not floating legacy shortcut labels
- one primary stage instrument is visible at a time
- mode strips are contextual instrumentation, not another workspace navigation layer
- browser chrome is external; app bottom reservation must tolerate dynamic viewport height (`dvh`/`svh`)

## Desktop contract
- one persistent app navigation surface
- optional contextual panel beside stage
- no duplicate floating dock if sidebar/navigation is active
- proof remains progressive and may occupy context/proof region, never stage by default

## Mutation boundary
Shell controls layout and instrument lifecycle only. It does not become:
- canonical state authority
- heartbeat authority
- Earth source authority
- route/generation authority
- mode law authority
- deployment authority

## First material slice design
Field/mobile migration order:
1. Shell marks active viewport + workspace.
2. Existing canonical status is mounted in STATUS.
3. One Field renderer is mounted in STAGE.
4. Field mode/role/shell controls mount in CONTEXT.
5. Existing mobile workspace rail mounts in NAVIGATION.
6. Legacy shortcut labels, duplicate dock, archive workstation, HD instrument, and other lenses remain unmounted unless explicitly selected.
7. Proof/readouts open progressively from PROOF.

## Regression requirements
- OmegaRuntime export/Durable Object unchanged
- current API paths unchanged
- heartbeatTruth unchanged
- Genesis binding unchanged
- route-before-generation unchanged
- Earth source/derived/forecast boundary unchanged
- canonical state persists across workspace navigation
- no second renderer/state authority
- no physical-dimension interpretation of representational shells

## Arbitration status
- Base shell: KEEP / substrate
- Launch navigation: MERGE / shell-owned launch + palette + navigation semantics
- Archive workstation: KEEP instrument / remove sibling suppression
- HD instrument: KEEP instrument / remove global cinema ownership
- Duplicate docks/legacy shortcut chrome: DEMOTE behind shell lifecycle

Next: inventory remaining page-level presentation modules and classify every one as shell region, stage instrument, context instrument, proof instrument, or non-visual service before integration.
