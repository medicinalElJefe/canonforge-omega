from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.capacity import CAPACITY_61917364224, CAPACITY_145152
from omega_genesis.modes import catalog
from omega_genesis.release import verify_manifest
from omega_genesis.selfbuild import load_policy
from omega_genesis.systems import coverage as system_coverage
from omega_genesis.provenance import summary as provenance_summary
from omega_genesis.autodeploy import load_policy as load_autodeploy_policy, validate_promotion

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
    "omega_genesis/cloud_auth.py",
    "omega_genesis/cloud_selfbuild.py",
    "omega_genesis/selfbuild.py",
    "omega_genesis/deployment.py",
    "omega_genesis/provenance.py",
    "omega_genesis/autodeploy.py",
    "omega_genesis/host_bootstrap.py",
    "omega_genesis/adapters/earth.py",
    "omega_genesis/adapters/hybrid.py",
    "omega_genesis/adapters/workbook.py",
    "omega_genesis/adapters/biology.py",
    "cloudflare/omega-genesis-worker/src/index.js",
    "cloudflare/omega-genesis-worker/src/kernel.js",
    "cloudflare/omega-genesis-worker/src/catalog.js",
    "cloudflare/omega-genesis-worker/src/system.js",
    "cloudflare/omega-genesis-worker/src/api_ext.js",
    "cloud/omega-cloud/Dockerfile",
    "cloud/omega-cloud/docker-compose.yml",
    "cloud/omega-cloud/Caddyfile",
    "cloud/omega-cloud/.env.cloud.example",
    "cloud/omega-cloud/promotion.json",
    "cloud/omega-cloud/systemd/omega-cloud-watch.service",
    "web/index.html",
    "web/styles.css",
    "web/app.js",
    "web/field3d.js",
    "web/advanced.js",
    "web/cloud.js",
    "scripts/self_build.py",
    "scripts/cloud_self_loop.py",
    "scripts/cloud_deploy.py",
    "scripts/cloud_watch.py",
    "scripts/cloud_host_bootstrap.py",
    "docs/CLOUD_SELF_BUILD.md",
    "docs/CLOUD_DEPLOYMENT.md",
    "docs/CLOUD_AUTODEPLOY.md",
    "docs/CLOUD_HOST_BOOTSTRAP.md",
    "docs/PROVENANCE.md",
    "tests/test_cloud_self_loop.py",
    "tests/test_deployment.py",
    "tests/test_autodeploy.py",
    "tests/test_host_bootstrap.py",
    "tests/test_provenance.py",
    "config/self_build_policy.json",
    "docs/SELF_BUILD.md",
    ".github/workflows/self-build.yml",
    "tests/test_selfbuild.py",
    "tests/test_genesis.py",
    "config/corpus_authorities.json",
    "config/dewey_bal_contract.json",
    "config/source_classes.json",
    "config/software_systems.json",
    "config/provenance_sources.json",
    "config/cloud_autodeploy_policy.json",
]

missing = [p for p in required if not (ROOT / p).is_file()]
manifest = json.loads((ROOT / "omega.manifest.json").read_text(encoding="utf-8"))
errors = list(missing)
systems = system_coverage()
provenance = provenance_summary(ROOT)
try:
    autodeploy_policy = load_autodeploy_policy(ROOT)
    promotion_payload = json.loads((ROOT / "cloud/omega-cloud/promotion.json").read_text(encoding="utf-8"))
    promotion_validation = validate_promotion(promotion_payload, autodeploy_policy.expected_image_repository)
except Exception as exc:
    autodeploy_policy = None
    promotion_validation = {"status": "FAIL", "errors": [f"{type(exc).__name__}: {exc}"]}

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
if "OMEGA Cloud canonical" not in str(manifest.get("cloud_runtime", "")):
    errors.append("cloud runtime contract mismatch")
if "not required for canonical cloud survival" not in str(manifest.get("local_runtime", "")):
    errors.append("desktop/cloud authority contract mismatch")
if manifest.get("self_build_policy_version") != 1:
    errors.append("self-build policy version mismatch")
if "governed deterministic self-build" not in str(manifest.get("self_build", "")):
    errors.append("self-build contract mismatch")
if manifest.get("provenance_schema_version") != 1:
    errors.append("provenance schema version mismatch")
if provenance.get("status") != "PASS":
    errors.extend(["provenance:" + str(x) for x in provenance.get("errors", [])] or ["provenance validation failed"])
if manifest.get("autodeploy_policy_version") != 1:
    errors.append("autodeploy policy version mismatch")
if promotion_validation.get("status") != "PASS":
    errors.extend(["promotion:" + str(x) for x in promotion_validation.get("errors", [])] or ["promotion validation failed"])

try:
    policy = load_policy(ROOT)
    if policy.authority != "OMEGA Cloud canonical self-build authority":
        errors.append("self-build authority mismatch")
except Exception as exc:
    errors.append(f"self-build policy invalid: {exc}")

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
    "self_build_policy": 1,
    "provenance": provenance,
    "autodeploy_policy": autodeploy_policy.schema_version if autodeploy_policy else None,
    "promotion": promotion_validation,
    "manifest_integrity": integrity,
    "errors": errors,
}
print(json.dumps(result, indent=2))
if errors:
    raise SystemExit(1)
