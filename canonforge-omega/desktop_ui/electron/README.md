# Omega OS Desktop UI · TIC-Calibrated · Electron

This is the **Omega OS Desktop Console** bundle:

- Python backend (FastAPI) serving:
  - `/api/status` — current UAI / Life / System / TIC
  - `/api/patterns` — stored MacroSequences from `~/.omega_fusion/sequences.json`
  - `/api/events` — rolling log of Omega events with TIC annotations
  - `/api/run-pattern` — run a pattern through HostMuscles + MacroPlayer

- Frontend:
  - `ui/index.html` + `styles.css` + `app.js`
  - TIC panel (UAI, Life, System, Truth, Integrity, Courage, Ω-effective)
  - Patterns list with buttons: “Run pattern” + “Run + Loop x3”
  - Live event stream panel + 12 × 12 state/role grid visualization
    (last events light up cells according to State/Role)

- Core library (`omega_fusion_core`):
  - OmegaPacket, UniversalMomentCalculator
  - TICVector + TICCalculator
  - MacroSequence + MacroPlayer (with loop support)
  - HostMuscles (Windows app open/focus/close)
  - SequenceStore (shared with your CLI recorder via `~/.omega_fusion/sequences.json`)

- Electron wrapper (`electron/`):
  - `package.json`
  - `main.js`
  - `README.md`

## Run the backend

```bash
cd omega-os-desktop-ui-tic-electron
pip install -e .
uvicorn api.app:app --reload
```

Then open:

- http://127.0.0.1:8000/

## Run as native desktop window (Electron)

In a second terminal:

```bash
cd omega-os-desktop-ui-tic-electron/electron
npm install
npm start
```

You now have a native desktop window for the Omega OS console while FastAPI
drives the backend logic.

This bundle is designed to sit on top of your existing Omega Fusion OS seed:
as you record patterns (e.g. `S_ECFR`) via the CLI and store them in
`~/.omega_fusion/sequences.json`, they automatically appear in the desktop UI
and can be executed with TIC-calibrated visibility.
