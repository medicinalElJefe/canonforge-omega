from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
required=[
 "README.md","pyproject.toml","START_OMEGA.py","omega.manifest.json",
 "omega_genesis/schema.py","omega_genesis/calculus.py","omega_genesis/modes.py",
 "omega_genesis/runtime.py","omega_genesis/proof.py","omega_genesis/projection.py",
 "omega_genesis/corpus.py","omega_genesis/plugins.py","omega_genesis/server.py",
 "omega_genesis/adapters/earth.py","omega_genesis/adapters/hybrid.py",
 "web/index.html","web/styles.css","web/app.js","tests/test_genesis.py",
 "config/corpus_authorities.json","config/dewey_bal_contract.json","config/source_classes.json"
]
missing=[p for p in required if not (ROOT/p).is_file()]
manifest=json.loads((ROOT/"omega.manifest.json").read_text(encoding="utf-8"))
errors=list(missing)
if manifest.get("authority")!="ONE_CANONICAL_PACKET_ONE_PROOF_CHAIN": errors.append("manifest authority mismatch")
if manifest.get("atlas_states")!=20736: errors.append("atlas state count mismatch")
if manifest.get("mode_count",0)<35: errors.append("mode registry incomplete")
print(json.dumps({"status":"PASS" if not errors else "FAIL","required_files":len(required),"errors":errors},indent=2))
if errors: raise SystemExit(1)
