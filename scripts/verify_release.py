from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.capacity import CAPACITY_61917364224, CAPACITY_145152
from omega_genesis.modes import catalog
from omega_genesis.release import verify_manifest
from omega_genesis.systems import coverage as system_coverage

required = [
    "README.md",
    "pyproject.toml",
    "START_OMEGA.py",
    "INSTALL_OMEGA_WINDOWS.bat",
    "INSTALL_OMEGA_WINDOWS.ps1",
    "omega.manifest.json",
    "SHA256SUMS.txt",
    "omega_genesis/schema.py",
    "omega_genesis/calculus.py",
    "omega_genesis/modes.py",
    "omega_genesis/runtime.py",
    "omega_genesis/proof.py",
    "omega_genesis/journal.py",
    "omega_genesis/orchestrator.py",
    "omega_genesis/release.py",
    "omega_genesis/projection.py",
    "omega_genesis/corpus.py",
    "omega_genesis/plugins.py",
    "omega_genesis/server.py",
    "omega_genesis/capacity.py",
    "omega_genesis/systems.py",
    "omega_genesis/host.py",
    "omega_genesis/shell.py",
    "omega_genesis/stream.py",
    "omega_genesis/intelligence.py",
    "omega_genesis/language.py",
    "omega_genesis/acceptance.py",
    "omega_genesis/adapters/earth.py",
    "omega_genesis/adapters/hybrid.py",
    "omega_genesis/adapters/workbook.py",
    "omega_genesis/adapters/biology.py",
    "cloudflare/omega-genesis-worker/src/index.js",
    "cloudflare/omega-genesis-worker/src/kernel.js",
    "cloudflare/omega-genesis-worker/src/catalog.js",
    "cloudflare/omega-genesis-worker/src/system.js",
    "cloudflare/omega-genesis-worker/src/api_ext.js",
    "web/index.html",
    "web/styles.css",
    "web/app.js",
    "web/field3d.js",
    "web/advanced.js",
    "tests/test_genesis.py",
    "config/corpus_authorities.json",
    "config/dewey_bal_contract.json",
    "config/source_classes.json",
    "config/software_systems.json",
]

missing = [p for p in required if not (ROOT / p).is_file()]
manifest = json.loads((ROOT / "omega.manifest.json").read_text(encoding="utf-8"))
errors = list(missing)
systems = system_coverage()

if manifest.get("name") != "OMEGA Genesis":
    errors.append("manifest name mismatch")
if manifest.get("version") != "1.1.0":
    errors.append("manifest version mismatch")
if manifest.get("atlas_states") != 20736:
    errors.append("atlas state count mismatch")
if manifest.get("capacity_145152") != CAPACITY_145152:
    errors.append("145152 capacity mismatch")
if manifest.get("design_capacity") != CAPACITY_61917364224:
    errors.append("12^10 design capacity mismatch")
if manifest.get("mode_count") != len(catalog()):
    errors.append(f"mode registry mismatch: manifest={manifest.get('mode_count')} runtime={len(catalog())}")
if manifest.get("software_systems") != systems["systems"] or systems["status"] != "PASS":
    errors.append("software system registry mismatch")
if manifest.get("software_families") != systems["families"]:
    errors.append("software family registry mismatch")
if manifest.get("master_surfaces") != 12:
    errors.append("master surface count mismatch")
if manifest.get("capability_contracts") != 18:
    errors.append("capability contract count mismatch")
if manifest.get("acceptance_gates") != 12:
    errors.append("acceptance gate count mismatch")

integrity = verify_manifest(ROOT)
if integrity.get("status") != "PASS":
    errors.extend(integrity.get("errors", []))

result = {
    "status": "PASS" if not errors else "FAIL",
    "required_files": len(required),
    "mode_count": len(catalog()),
    "software_systems": systems["systems"],
    "software_families": systems["families"],
    "canonical_states": 20_736,
    "capacity_145152": CAPACITY_145152,
    "design_capacity": CAPACITY_61917364224,
    "manifest_integrity": integrity,
    "errors": errors,
}
print(json.dumps(result, indent=2))
if errors:
    raise SystemExit(1)
