# CanonForge Omega — The First Cognitive Operating System

**Tagline:** Intent Engine · 144D Coherence Physics · Executable Behavioral Patterns  
**Author:** Jeffrey Alan Dewey

CanonForge Omega (Ω-OS) is a new class of operating system that fuses:

- A **Fusion Core** that understands human moments, roles, and TIC (Truth · Integrity · Courage)
- A **144D Deep System Symmetry engine** that measures coherence / drift across a 12×12 grid
- An **Executable Pattern OS** that can replay optimized behavioral sequences
- A **Desktop Console** (FastAPI + Electron) for live visualization and control

This repository is the investor-ready, fully wired prototype of CanonForge Omega.

---

## 🔧 Repository Layout

```text
canonforge-omega/
├── pyproject.toml          # Python project metadata (FastAPI backend)
├── README.md               # This file – high-level overview
├── LICENSE                 # MIT license (open-core)
│
├── omega_fusion_core/      # Human-intent & TIC layer
│   ├── core/
│   │   ├── model.py
│   │   ├── tic.py
│   │   └── universal_moment.py
│   ├── storage/
│   │   └── sequence_store.py
│   ├── pattern_hub/
│   │   └── macro_playback.py
│   └── host/
│       ├── muscles.py
│       └── executor.py
│
├── omega_144d_core/        # 12×12 → 144D coherence engine
│   ├── rc144_core.py
│   ├── dss_engine.py
│   ├── event_queue.py
│   ├── core_bus.py
│   └── subverse_core.py
│
├── api/
│   └── app.py              # FastAPI backend (status, patterns, events)
│
├── desktop_ui/
│   └── electron/
│       ├── package.json
│       ├── main.js
│       └── README.md       # Original Desktop UI instructions
│
├── docs/                   # (placeholder for whitepapers)
├── data/                   # (placeholder for SPY proof, etc.)
└── examples/
    └── omega144_example.py
```

---

## 🚀 Quickstart

### 1. Install & run backend

```bash
pip install -e .
uvicorn api.app:app --reload
```

### 2. Run the CanonForge Omega Desktop Console

```bash
cd desktop_ui/electron
npm install
npm start
```

### 3. Test the 144D engine

```bash
python examples/omega144_example.py
```

You should see timesteps, coherence scores, and regime labels (COHERENT / STABILIZING / DRIFT / CHAOTIC).

---

## 🧠 Core Concept

CanonForge Omega is built around three interacting layers:

1. **Fusion Core** — understands *who* you are in the moment (domain, role, channel, TIC).
2. **144D Coherence Core** — understands *how stable* your system is across a 12×12 symmetry grid.
3. **Pattern OS** — understands *what to do next* by executing stored, named behavioral sequences.

Together, these layers form a **Cognitive Operating System** designed for performance, alignment, and long-horizon coherence.

---

## 📜 License

This project is released under the MIT License – see `LICENSE` for details.

## Architecture Diagram

```mermaid
flowchart TD
...

### 1.1 System Architecture (CanonForge Omega Stack)

```mermaid
flowchart TD
    subgraph UI["Desktop UI (Electron)"]
        Console["CanonForge Omega Console<br/>(TIC Panel · 12×12 Grid · Patterns)"]
    end

    subgraph API["FastAPI Backend (api/app.py)"]
        Status["/api/status<br/>Ω-State · TIC · 188 overlay"]
        Patterns["/api/patterns<br/>SequenceStore listing"]
        Events["/api/events<br/>Rolling Ω-events"]
        RunPattern["/api/run-pattern<br/>MacroPlayer trigger"]
    end

    subgraph Fusion["Omega Fusion Core (omega_fusion_core)"]
        Model["OmegaPacket / Domain / State / Role / Channel"]
        TIC["TICCalculator<br/>(Truth · Integrity · Courage · Ω-effective)"]
        UM["UniversalMomentCalculator<br/>(time·context index)"]
        SeqStore["SequenceStore<br/>(~/.omega_fusion/sequences.json)"]
        Macro["MacroPlayer + MacroExecutor<br/>HostMuscles shell"]
    end

    subgraph Core144["Ω144D Core (omega_144d_core)"]
        Bus["CoreBus<br/>merge internal + external"]
        DSS["DSSEngine<br/>12×12 → 144D Deep System Symmetry"]
        EQ["EventQueue<br/>Ω-timesteps + metrics log"]
        Subverse["SubverseCore<br/>188 overlay (domains + axes + globals)"]
    end

    UI -->|HTTP| API
    Status --> Fusion
    Status --> Core144

    Patterns --> SeqStore
    Events --> Fusion

    RunPattern --> SeqStore
    RunPattern --> Macro
    Macro --> Fusion

    Fusion -->|Ω-state vectors / signals| Core144
    Core144 -->|coherence · regime · 188 overlay| Fusion
    Core144 --> Status

graph LR
    subgraph Grid["12×12 Grid (144 nodes)"]
        N1["Node 1,1"] --> N2["..."]
    end

    subgraph Domains["12 Domain Aggregates (rows)"]
        D1["D₁ (Row 1 mean)"]
        D2["D₂"]
        D12["D₁₂"]
    end

    subgraph Axes["12 Axis Aggregates (columns)"]
        A1["A₁ (Col 1 mean)"]
        A2["A₂"]
        A12["A₁₂"]
    end

    subgraph Globals["20 Global Metrics"]
        G1["G₁: Coherence"]
        G2["G₂: Variance"]
        G3["G₃: Max Magnitude"]
        G4["G₄: Drift Index"]
        G5["G₅: TIC-Weighted Coherence"]
        G6["G₆: Domain Spread"]
        G7["G₇: Axis Spread"]
        G8["G₈: Energy Norm"]
        G9["G₉: Stability Score"]
        G10["G₁₀: Regime (encoded)"]
        G11["G₁₁: TIC Truth"]
        G12["G₁₂: TIC Integrity"]
        G13["G₁₃: TIC Courage"]
        G14["G₁₄: Moment Phase"]
        G15["G₁₅: Pattern Alignment"]
        G16["G₁₆: Noise/Signal"]
        G17["G₁₇: Latent Drift Direction"]
        G18["G₁₈: Recovery Potential"]
        G19["G₁₉: Volatility"]
        G20["G₂₀: Ω-Confidence"]
    end

    Grid --> Domains
    Grid --> Axes
    Grid --> Globals
    Domains --> Globals
    Axes --> Globals

sequenceDiagram
    participant User as Human / System
    participant UI as CanonForge Console
    participant API as FastAPI Backend
    participant Fusion as Omega Fusion Core
    participant Core as Ω144D Core

    User->>UI: Perform action / choose pattern
    UI->>API: HTTP request (/api/run-pattern or /api/status)
    API->>Fusion: Build OmegaPacket<br/>Domain · State · Role · Channel
    Fusion->>Fusion: TICCalculator + UniversalMoment<br/>(TIC + Moment ID)
    Fusion->>Core: 144D vector (Ω-state)
    Core->>Core: DSSEngine step + EventQueue<br/>(coherence, regime)
    Core->>Core: SubverseCore builds 188 overlay
    Core-->>Fusion: overlay + metrics (188)
    Fusion-->>API: status payload (Ω-state + TIC + 188)
    API-->>UI: JSON response
    UI-->>User: Updated TIC panel · 12×12 grid · events


