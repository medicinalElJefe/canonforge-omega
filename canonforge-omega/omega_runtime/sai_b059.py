from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from typing import Any, Iterable

REVISION = "R179"
RELEASE = "OMEGA SAI B059"
VERIFY_SCHEMA = "OMEGA_SAI_B059_VERIFICATION_R179"
QUERY_SCHEMA = "OMEGA_SAI_B059_QUERY_RECEIPT_R179"
TRAVERSAL_SCHEMA = "OMEGA_SAI_B059_TRAVERSAL_RECEIPT_R179"
INSTALL_SCHEMA = "OMEGA_SAI_B059_INSTALL_RECEIPT_R179"
TRAINING_SCOPE = "DETERMINISTIC_SOURCE_GROUNDED_CORPUS_COMPILED_INDEXED_CALIBRATED"
FOUNDATION_MODEL_SCOPE = "SEPARATE_EXTERNAL_OR_OPTIONAL_NEURAL_MODEL_NOT_B059_WEIGHT_TRAINING"

EXPECTED_FILE_COUNT = 42
EXPECTED_TOTAL_BYTES = 1_514_283_298
EXPECTED_DATABASE_SHA256 = "ee163c27c08f034989f42596e04c4b0344e62c7335d7377f27d648b1e5fdcb12"
EXPECTED_DATABASE_BYTES = 747_786_240
EXPECTED_DOCUMENTS = 541_526
EXPECTED_EDGES = 82_082
EXPECTED_SOURCE_AUTHORITIES = 15

DRIVE_ARCHIVES = (
    {"part": 1, "drive_id": "1E7vk-RPG7NHsjaLMhKaCGMFmZPUIdtN-", "name": "OMEGA_SAI_B059_PART_01_CORE_COMPILED.zip", "size": 45_217_663, "sha256": "8faf6e017ffae69b65c36eb826429358a1a4ec241184afb0fd5965ca8f3ab3f8"},
    {"part": 2, "drive_id": "1PlV5ec1Z4Hqyw_zpKY_17Izoug7ordS5", "name": "OMEGA_SAI_B059_PART_02_PSC_ATLAS.zip", "size": 7_909_490, "sha256": "8fc9996b281f379a9a8c4ba49e634e2362223bb97fabb94938194f0a398101cb"},
    {"part": 3, "drive_id": "1lGKUUOnfXpKswoEAXaGZcSAlHlalUj15", "name": "OMEGA_SAI_B059_PART_03_PSC_OPERATOR_QR.zip", "size": 6_705_431, "sha256": "a54126fdcfad0d4966df056dbe796f9ac7e09d43dbed9c3e1adb5ae86e5246f6"},
    {"part": 4, "drive_id": "18v--hP9TVwjVdxNds7ByuodoY8HxWXy3", "name": "OMEGA_SAI_B059_PART_04_CALCULUS_GRAPH_PROOF.zip", "size": 32_237_536, "sha256": "6566c00c6f39ef4bd0395c7b20304223c33e03f238eef623a5980c16000d5ff1"},
    {"part": 5, "drive_id": "1LTA8m8vatFKCw6a7Grtw7fv15PwF_QWm", "name": "OMEGA_SAI_B059_PART_05_WORKBOOKS.zip", "size": 44_921_128, "sha256": "89fc510b09b6b74ab233421266d1b44f986ddcab71be9ee468a0b5f8876a6dc9"},
)

SOURCE_AUTHORITIES = (
    ("PSC_20736D_QUESTION_RESPONSE_BUILD_103680.csv", "b2f170456840cb46c00231dbf2323c8f348350f1b9ae183692b36cdd90dc8e61"),
    ("PSC_20736D_QR_build_questions_LONG.csv", "6235f322ba89c13bcdaaf2ac1d6d5dc7ce68ef63280e909867f691bb9b8dae33"),
    ("PSC_20736D_FULL_MASTER_OPERATOR_CHART.csv", "041e3dfdba261ce266a2de4ea04ef30f3239b181ad8f17398fa287efab6f10bd"),
    ("PSC_20736D_REVIEW_CONTINUATION_FULL_OPERATOR_TESTS.csv", "7a6d64015e1e87bb2bd76c96b7c3d8bdd354485f39d81961771f511305068738"),
    ("PSC_20736D_FINISHED_FULL_ATLAS_QR_ALL_DATA_ONLY(1).csv", "4ed2e058f015eb4deaf13c4ac9005dfa88ddcce835fed535f8fef86776f1e8a9"),
    ("dewey_relational_calculus_20736D_CONTINUED_FULL.csv", "d42a1c4f58ac7816f9f0f39818cbc86a5dfd8d464194a123e71f3cc097a284fe"),
    ("Dewey_20736D_Relativity_Calculus_Tree_FULL.csv", "05d16936054a21951d6ad7b4ef45c95ef6ab2750167d7f8bed5bed1a238482d4"),
    ("Dewey_20736D_Relativity_Calculus_Tree_EDGES.csv", "b6f840f70be0df3db0f2e2fb2b262340c53a3a1c52028278517208eaf7cb18e9"),
    ("PSC_NEXT_CARRY_REALIZATION_INDEX_FULL.csv", "940b90ee479a2d9f2a74bb79af0f5777d4e8ce0785c8707b781f92bd41b6a0d1"),
    ("LensMatrix_20736D_FULL_ALL_SKINS.csv", "43cb90d8b51c88eb7ba3a04256cb7fd94aa51d2582567da4bdde66a3d88aeb48"),
    ("Violet_Transfiguration_20736D_Full_Proof_Ledger.csv", "c7a6bdb032fd4e4a9cc03285f8c64043638484fa4746b8fdb9fe6910d602c87d"),
    ("PSC_20736D_all_domains_parent_accumulation_autoping.csv", "4ed2e058f015eb4deaf13c4ac9005dfa88ddcce835fed535f8fef86776f1e8a9"),
    ("full_atlas_20736D_exact_filled_data.xlsx", "6d5baf882d38a343ad2677146db47dec71b8bf9ebf89a4e15f49217c2a70cb64"),
    ("water_geometry_dewey_mode188_20736D_state_space.xlsx", "96af94e4816dc355ecc90a9e8898caa7fc45aa5495c1219d58f6d0ccc3106d1b"),
    ("full_overall_canon_12pow5_teal_water_atlas_CORRECTED.xlsx", "e1ccb57cdfbc78955dd6e86be110cdb91cb15a0cc78a869b74dca7e4ffa55af3"),
)

REQUIRED_MODES = (
    "Full Overall Canon", "Dewey Calculus", "Relational Skin Calculus", "Unified Coherence",
    "Woven Continuity", "Mode 188", "Parent Routing", "Scar Carry", "Forecast Gate",
    "Heavy Prune", "Recoverability", "Admissibility", "Host/Context Relativity", "Closure",
)


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _sha_text(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def release_candidates(approved_root: Path | None = None) -> Iterable[Path]:
    env = os.environ.get("OMEGA_SAI_B059_ROOT")
    if env:
        yield Path(env).expanduser()
    if approved_root is not None:
        root = Path(approved_root).expanduser()
        yield root / "OMEGA_SAI_B059"
        yield root / "SAI" / "OMEGA_SAI_B059"
        yield root / ".omega" / "sai" / "OMEGA_SAI_B059"
    yield Path.home() / ".omega" / "sai" / "OMEGA_SAI_B059"
    if os.name == "nt":
        yield Path("J:/OMEGA_SAI_B059")
        yield Path("J:/OMEGA/SAI/OMEGA_SAI_B059")


def locate_release(approved_root: Path | None = None) -> Path | None:
    seen: set[str] = set()
    for candidate in release_candidates(approved_root):
        key = str(candidate)
        if key in seen:
            continue
        seen.add(key)
        if (candidate / "BUILD_MANIFEST.json").is_file() and (candidate / "compiled" / "omega_sai.db").is_file():
            return candidate.resolve()
    return None


def archive_candidates(approved_root: Path) -> list[Path]:
    root = Path(approved_root).expanduser().resolve()
    places = [root, root / "SAI", root / "OMEGA_SAI_B059", root / "downloads", root / "Downloads"]
    out: list[Path] = []
    for spec in DRIVE_ARCHIVES:
        found = None
        for place in places:
            candidate = place / spec["name"]
            if candidate.is_file():
                found = candidate
                break
        if found is None:
            try:
                found = next(root.rglob(spec["name"]), None)
            except OSError:
                found = None
        if found is not None:
            out.append(found.resolve())
    return out


def verify_archives(approved_root: Path) -> dict[str, Any]:
    found = {path.name: path for path in archive_candidates(approved_root)}
    rows = []
    for spec in DRIVE_ARCHIVES:
        path = found.get(spec["name"])
        exists = path is not None
        size_ok = bool(exists and path.stat().st_size == spec["size"])
        digest = sha256_file(path) if exists and size_ok else None
        sha_ok = digest == spec["sha256"]
        rows.append({**spec, "path": str(path) if path else None, "exists": exists, "size_ok": size_ok, "sha256_actual": digest, "sha256_ok": sha_ok})
    passed = all(row["sha256_ok"] for row in rows)
    core = {"schema": "OMEGA_SAI_B059_ARCHIVE_SET_R179", "release": RELEASE, "parts": rows, "passed": passed, "approved_root": str(Path(approved_root).resolve())}
    return {**core, "receipt_sha256": _sha_text(core)}


def _safe_extract(archive: Path, target: Path) -> None:
    target = target.resolve()
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            name = info.filename.replace("\\", "/")
            if name.startswith("/") or ".." in Path(name).parts:
                raise RuntimeError(f"unsafe archive entry: {info.filename}")
            destination = (target / name).resolve()
            if destination != target and target not in destination.parents:
                raise RuntimeError(f"archive entry escapes target: {info.filename}")
        zf.extractall(target)


def install_from_archives(approved_root: Path, target: Path | None = None) -> dict[str, Any]:
    archive_receipt = verify_archives(approved_root)
    if not archive_receipt["passed"]:
        return {"schema": INSTALL_SCHEMA, "release": RELEASE, "installed": False, "blocked": True, "reason": "exact five-part Drive B059 archive set is missing or hash-invalid", "archive_receipt": archive_receipt}
    target = (target or (Path.home() / ".omega" / "sai" / "OMEGA_SAI_B059")).expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    backup = None
    with tempfile.TemporaryDirectory(prefix="omega-b059-stage-", dir=str(target.parent)) as tmp:
        stage = Path(tmp)
        by_name = {Path(row["path"]).name: Path(row["path"]) for row in archive_receipt["parts"]}
        for spec in DRIVE_ARCHIVES:
            _safe_extract(by_name[spec["name"]], stage)
        staged_root = stage / "OMEGA_SAI_B059"
        verification = verify_release(staged_root, run_selftest=True, deep=True)
        if not verification["passed"]:
            return {"schema": INSTALL_SCHEMA, "release": RELEASE, "installed": False, "blocked": True, "reason": "staged B059 release failed exact verification", "archive_receipt": archive_receipt, "verification": verification}
        if target.exists():
            backup = target.with_name(target.name + ".previous-" + str(int(time.time())))
            target.replace(backup)
        shutil.move(str(staged_root), str(target))
    core = {"schema": INSTALL_SCHEMA, "release": RELEASE, "installed": True, "target": str(target), "archive_receipt_sha256": archive_receipt["receipt_sha256"], "verification_receipt_sha256": verification["receipt_sha256"], "previous_release": str(backup) if backup else None, "canonical_mutation": False}
    return {**core, "receipt_sha256": _sha_text(core)}


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _run_cli(root: Path, args: list[str], timeout: int = 180) -> dict[str, Any]:
    proc = subprocess.run([sys.executable, "-m", "sai", "--root", str(root), *args], cwd=str(root), capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or f"sai exited {proc.returncode}")[-8000:])
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("B059 CLI did not return JSON") from exc


def verify_release(root: Path, run_selftest: bool = True, deep: bool = False) -> dict[str, Any]:
    root = Path(root).expanduser().resolve()
    checks: dict[str, Any] = {}
    manifest_path = root / "BUILD_MANIFEST.json"
    acceptance_path = root / "reports" / "ACCEPTANCE_REPORT.json"
    db_path = root / "compiled" / "omega_sai.db"
    checks["manifest_present"] = manifest_path.is_file()
    checks["acceptance_present"] = acceptance_path.is_file()
    checks["database_present"] = db_path.is_file()
    manifest = _load_json(manifest_path) if checks["manifest_present"] else {}
    acceptance = _load_json(acceptance_path) if checks["acceptance_present"] else {}
    checks["release_identity"] = manifest.get("release") == RELEASE
    checks["manifest_file_count"] = manifest.get("file_count") == EXPECTED_FILE_COUNT
    checks["manifest_total_bytes"] = manifest.get("total_bytes") == EXPECTED_TOTAL_BYTES
    db_spec = next((row for row in manifest.get("files", []) if row.get("path") == "compiled/omega_sai.db"), {})
    checks["database_manifest_identity"] = db_spec.get("sha256") == EXPECTED_DATABASE_SHA256 and db_spec.get("size_bytes") == EXPECTED_DATABASE_BYTES
    checks["database_size"] = bool(db_path.is_file() and db_path.stat().st_size == EXPECTED_DATABASE_BYTES)
    db_sha = sha256_file(db_path) if checks["database_size"] else None
    checks["database_sha256"] = db_sha == EXPECTED_DATABASE_SHA256
    manifest_sources = {Path(row.get("path", "")).name: row.get("sha256") for row in manifest.get("files", []) if str(row.get("path", "")).startswith("corpus/")}
    checks["authority_manifest"] = all(manifest_sources.get(name) == digest for name, digest in SOURCE_AUTHORITIES)
    acceptance_checks = {row.get("name"): row for row in acceptance.get("checks", [])}
    runtime_detail = (acceptance_checks.get("runtime_selftest") or {}).get("detail") or {}
    runtime_checks = {row.get("name"): row for row in runtime_detail.get("checks", [])}
    checks["acceptance_passed"] = bool(acceptance.get("passed") is True or all(row.get("passed") is True for row in acceptance.get("checks", [])))
    checks["acceptance_sources"] = (runtime_checks.get("all_sources") or {}).get("detail") == EXPECTED_SOURCE_AUTHORITIES
    checks["acceptance_documents"] = (runtime_checks.get("documents") or {}).get("detail") == EXPECTED_DOCUMENTS
    checks["acceptance_edges"] = (runtime_checks.get("edges") or {}).get("detail") == EXPECTED_EDGES
    deep_rows = []
    if deep and manifest:
        for row in manifest.get("files", []):
            path = root / row["path"]
            actual = sha256_file(path) if path.is_file() and path.stat().st_size == row.get("size_bytes") else None
            deep_rows.append({"path": row["path"], "ok": actual == row.get("sha256"), "sha256": actual})
        checks["deep_manifest_files"] = len(deep_rows) == EXPECTED_FILE_COUNT and all(row["ok"] for row in deep_rows)
    selftest = None
    if run_selftest and all(checks.get(k) for k in ("database_sha256", "authority_manifest")):
        try:
            selftest = _run_cli(root, ["selftest"], timeout=300)
            selftest_by_name = {row.get("name"): row for row in selftest.get("checks", [])}
            checks["runtime_selftest"] = bool(
                selftest.get("passed") is True
                and (selftest_by_name.get("all_sources") or {}).get("detail") == EXPECTED_SOURCE_AUTHORITIES
                and (selftest_by_name.get("documents") or {}).get("detail") >= EXPECTED_DOCUMENTS
                and (selftest_by_name.get("edges") or {}).get("detail") == EXPECTED_EDGES
                and (selftest_by_name.get("ledger_chain") or {}).get("passed") is True
            )
        except Exception as exc:
            checks["runtime_selftest"] = False
            selftest = {"passed": False, "error": str(exc)}
    required = ["manifest_present", "acceptance_present", "database_present", "release_identity", "manifest_file_count", "manifest_total_bytes", "database_manifest_identity", "database_size", "database_sha256", "authority_manifest", "acceptance_passed", "acceptance_sources", "acceptance_documents", "acceptance_edges"]
    if run_selftest:
        required.append("runtime_selftest")
    if deep:
        required.append("deep_manifest_files")
    passed = all(checks.get(name) is True for name in required)
    core = {
        "schema": VERIFY_SCHEMA,
        "revision": REVISION,
        "release": RELEASE,
        "root": str(root),
        "passed": passed,
        "checks": checks,
        "database_sha256": db_sha,
        "source_authority_count": EXPECTED_SOURCE_AUTHORITIES,
        "documents": EXPECTED_DOCUMENTS if passed else None,
        "edges": EXPECTED_EDGES if passed else None,
        "modes": list(REQUIRED_MODES),
        "training": {
            "scope": TRAINING_SCOPE,
            "fully_trained_within_declared_scope": passed,
            "complete_supplied_corpus_compiled": passed,
            "indexed": passed,
            "calibrated": passed,
            "grounded_inference_selftest": bool(checks.get("runtime_selftest")) if run_selftest else None,
            "foundation_model_weights_trained": False,
            "foundation_model_scope": FOUNDATION_MODEL_SCOPE,
            "meaning": "B059 'trained' means the complete supplied corpus is compiled, indexed, calibrated and queryable by deterministic governed inference. It does not claim foundation-model weight training.",
        },
        "selftest": selftest,
        "deep_file_checks": deep_rows if deep else None,
        "canonical_mutation": False,
        "authority": "VERIFIED_LOCAL_SAI_RUNTIME_NOT_CANON",
    }
    return {**core, "receipt_sha256": _sha_text(core)}


def probe(approved_root: Path | None = None) -> dict[str, Any]:
    root = locate_release(approved_root)
    if root is None:
        return {"schema": VERIFY_SCHEMA, "revision": REVISION, "release": RELEASE, "passed": False, "state": "B059_NOT_INSTALLED", "fully_trained_within_declared_scope": False, "root": None}
    manifest = root / "BUILD_MANIFEST.json"
    db = root / "compiled" / "omega_sai.db"
    quick = bool(manifest.is_file() and db.is_file() and db.stat().st_size == EXPECTED_DATABASE_BYTES)
    return {"schema": VERIFY_SCHEMA, "revision": REVISION, "release": RELEASE, "passed": quick, "state": "B059_PRESENT_VERIFICATION_REQUIRED" if quick else "B059_INCOMPLETE", "fully_trained_within_declared_scope": False, "root": str(root), "database_bytes": db.stat().st_size if db.exists() else None}


def query(root: Path, prompt: str, limit: int = 8, require_verification: bool = True) -> dict[str, Any]:
    if not prompt.strip():
        raise ValueError("SAI query cannot be empty")
    verification = verify_release(root, run_selftest=False, deep=False) if require_verification else None
    if verification is not None and not verification["passed"]:
        return {"schema": QUERY_SCHEMA, "release": RELEASE, "blocked": True, "reason": "B059 release verification failed", "verification": verification}
    result = _run_cli(Path(root), ["ask", prompt, "--limit", str(max(1, min(24, int(limit))))], timeout=180)
    evidence = result.get("evidence") or []
    grounded = bool(evidence) and bool(result.get("ledger_hash"))
    core = {
        "schema": QUERY_SCHEMA,
        "revision": REVISION,
        "release": RELEASE,
        "query_sha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
        "result": result,
        "grounded": grounded,
        "evidence_count": len(evidence),
        "verification_receipt_sha256": verification.get("receipt_sha256") if verification else None,
        "training_scope": TRAINING_SCOPE,
        "fully_trained_within_declared_scope": bool(verification and verification["passed"]),
        "foundation_model_weights_trained": False,
        "canonical_mutation": False,
        "authority": "SOURCE_GROUNDED_SAI_RESULT_NOT_CANON",
    }
    return {**core, "receipt_sha256": _sha_text(core)}


def traverse(root: Path, seed: str = "") -> dict[str, Any]:
    verification = verify_release(root, run_selftest=False, deep=False)
    if not verification["passed"]:
        return {"schema": TRAVERSAL_SCHEMA, "release": RELEASE, "blocked": True, "reason": "B059 release verification failed", "verification": verification}
    result = _run_cli(Path(root), ["traverse", "--seed", seed], timeout=60)
    address = int(result.get("address", -1))
    coords = result.get("coords")
    valid = 0 <= address < 20736 and isinstance(coords, list) and len(coords) == 4 and all(isinstance(v, int) and 0 <= v < 12 for v in coords)
    core = {"schema": TRAVERSAL_SCHEMA, "revision": REVISION, "release": RELEASE, "valid": valid, "result": result, "verification_receipt_sha256": verification["receipt_sha256"], "canonical_mutation": False, "authority": "SAI_TRAVERSAL_STATE_NOT_CANON"}
    return {**core, "receipt_sha256": _sha_text(core)}


__all__ = [
    "REVISION", "RELEASE", "DRIVE_ARCHIVES", "SOURCE_AUTHORITIES", "REQUIRED_MODES",
    "locate_release", "probe", "verify_archives", "install_from_archives", "verify_release", "query", "traverse",
]
