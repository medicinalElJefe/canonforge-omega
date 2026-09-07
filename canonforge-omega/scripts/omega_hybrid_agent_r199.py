#!/usr/bin/env python3
"""OMEGA Hybrid Link R199 sovereign workstation agent.

Keeps the proven R34.1/R132 authenticated transport while adding a project-aware,
resource-governed execution plane. Work is allow-listed, root-confined, sequential for
heavy operations, reversible for source mutations, and never performs implicit dependency
installation or uncontrolled Windows/registry/service optimization.
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

VERSION = "R34.1"
CAPABILITY_REVISION = "R132"
SOVEREIGN_CLOSURE_REVISION = "R199"
DEFAULT_SERVER = "https://omegav6.jeffdeweyeljefe.workers.dev"

TEXT_EXT = {
    ".txt", ".md", ".json", ".jsonc", ".js", ".jsx", ".ts", ".tsx", ".py", ".pyw",
    ".css", ".html", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".csv", ".bat",
    ".cmd", ".ps1", ".cs", ".csproj", ".sln", ".xml", ".rs", ".go", ".java",
}
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", ".venv", "venv", "__pycache__", ".wrangler",
    ".omega_hybrid", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".next", ".cache",
    "coverage", ".coverage", "$recycle.bin", "system volume information",
}
PROJECT_MARKERS = {
    "package.json": (18, "NODE"),
    "pyproject.toml": (20, "PYTHON"),
    "requirements.txt": (8, "PYTHON"),
    "wrangler.toml": (22, "CLOUDFLARE_WORKER"),
    "cargo.toml": (20, "RUST"),
    "go.mod": (20, "GO"),
    "pom.xml": (18, "MAVEN"),
    "build.gradle": (18, "GRADLE"),
    "build.gradle.kts": (18, "GRADLE"),
}
MAX_FILES = 25000
MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_PATCH_BYTES = 512 * 1024
MAX_PATCH_REPLACEMENTS = 24
MAX_WRITE_BYTES = 512 * 1024
MAX_MACRO_EVENTS = 5000
MAX_DISCOVERY_DIRS = 6000
MAX_DISCOVERY_DEPTH = 7
DISCOVERY_TIME_BUDGET = 12.0
MIN_FREE_DISK_BYTES = 3 * 1024**3
MIN_AVAILABLE_MEMORY_BYTES = int(1.5 * 1024**3)
HEAVY_OPS = {"BUILD", "TEST", "PACKAGE"}


class AgentError(RuntimeError):
    pass


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha_json(value) -> str:
    return sha_bytes(canonical_json(value).encode("utf-8"))


def request_json(server, path, payload, bridge_id, secret, timeout=30):
    req = urllib.request.Request(
        server.rstrip("/") + path,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
            "content-type": "application/json",
            "x-omega-bridge-id": bridge_id,
            "x-omega-bridge-secret": secret,
            "user-agent": "OMEGA-Hybrid-Agent/" + VERSION,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            data = json.loads(raw)
        except Exception:
            data = {"message": raw}
        raise AgentError(f"HTTP {exc.code}: {data.get('reply') or data.get('message') or data.get('code') or raw[:400]}")


def probe_server(server, timeout=15):
    req = urllib.request.Request(
        server.rstrip("/") + "/api/health",
        method="GET",
        headers={"user-agent": "OMEGA-Hybrid-Agent/" + VERSION},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if int(getattr(response, "status", 200)) != 200:
                raise AgentError("Canonical health returned non-200 status.")
            return True
    except Exception as exc:
        raise AgentError(f"Canonical unreachable: {exc}")


def parse_pair(value):
    if "." not in value:
        raise AgentError("Pairing code must contain bridge ID and secret.")
    bridge_id, secret = value.split(".", 1)
    if not re.fullmatch(r"[A-Za-z0-9._:-]{8,128}", bridge_id) or len(secret) < 24:
        raise AgentError("Invalid pairing code.")
    return bridge_id, secret


def normalize_root_arg(value):
    source = str(value or ".").strip().strip('"').rstrip('"').strip()
    if os.name == "nt" and re.fullmatch(r"[A-Za-z]:\\", source):
        return source + "."
    return source or "."


def secure_path(root: Path, rel=".") -> Path:
    rel = str(rel or ".").replace("\\", "/").strip()
    if rel.startswith("/") or re.match(r"^[A-Za-z]:", rel) or ".." in Path(rel).parts:
        raise AgentError("Path escapes approved root.")
    out = (root / rel).resolve()
    try:
        out.relative_to(root.resolve())
    except ValueError:
        raise AgentError("Path escapes approved root.")
    return out


def rel_to_root(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix() or "."
    except ValueError:
        raise AgentError("Resolved project escaped approved root.")


def iter_files(root: Path):
    count = 0
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d.lower() not in SKIP_DIRS]
        for name in files:
            path = Path(base) / name
            try:
                if path.is_symlink() or path.stat().st_size > MAX_FILE_BYTES:
                    continue
            except OSError:
                continue
            yield path
            count += 1
            if count >= MAX_FILES:
                return


def marker_score(path: Path, names: set[str]):
    low = {name.lower() for name in names}
    score = 0
    markers = []
    project_types = set()
    for name, (weight, kind) in PROJECT_MARKERS.items():
        if name in low:
            score += weight
            markers.append(name)
            project_types.add(kind)
    if any(name.endswith(".sln") for name in low):
        score += 20
        markers.append("*.sln")
        project_types.add("DOTNET")
    if any(name.endswith(".csproj") for name in low):
        score += 16
        markers.append("*.csproj")
        project_types.add("DOTNET")
    if any(name.startswith("vite.config.") for name in low):
        score += 12
        markers.append("vite.config.*")
        project_types.add("VITE")
    if "gradlew" in low or "gradlew.bat" in low:
        score += 10
        markers.append("gradle-wrapper")
        project_types.add("GRADLE")
    if "mvnw" in low or "mvnw.cmd" in low:
        score += 10
        markers.append("maven-wrapper")
        project_types.add("MAVEN")
    if ".git" in low:
        score += 8
        markers.append(".git")
    if "omega_runtime" in low:
        score += 18
        markers.append("omega_runtime/")
    if "cloudflare" in low:
        score += 6
        markers.append("cloudflare/")
    label = path.as_posix().lower()
    if "canonforge-omega" in label:
        score += 28
    if "omega" in path.name.lower():
        score += 12
    return score, sorted(set(markers)), sorted(project_types)


def discover_projects(root: Path, max_depth=MAX_DISCOVERY_DEPTH, max_dirs=MAX_DISCOVERY_DIRS, time_budget=DISCOVERY_TIME_BUDGET):
    root = root.resolve()
    started = time.monotonic()
    queue = [(root, 0)]
    visited = 0
    candidates = []
    truncated = False
    while queue:
        if visited >= max_dirs or time.monotonic() - started >= time_budget:
            truncated = True
            break
        path, depth = queue.pop(0)
        visited += 1
        try:
            entries = list(os.scandir(path))
        except OSError:
            continue
        names = {entry.name for entry in entries}
        score, markers, project_types = marker_score(path, names)
        if score >= 16:
            candidates.append({
                "relativePath": rel_to_root(path, root),
                "score": score,
                "markers": markers,
                "projectTypes": project_types,
                "depth": depth,
            })
        if depth >= max_depth:
            continue
        children = []
        for entry in entries:
            try:
                if not entry.is_dir(follow_symlinks=False):
                    continue
            except OSError:
                continue
            if entry.name.lower() in SKIP_DIRS:
                continue
            children.append(Path(entry.path))
        for child in sorted(children, key=lambda item: item.name.lower()):
            queue.append((child, depth + 1))
    candidates.sort(key=lambda row: (-row["score"], row["depth"], row["relativePath"].lower()))
    selected = candidates[0] if candidates else None
    confidence = "NONE"
    if selected:
        lead = selected["score"] - (candidates[1]["score"] if len(candidates) > 1 else 0)
        confidence = "HIGH" if selected["score"] >= 38 and lead >= 6 else "MEDIUM" if selected["score"] >= 24 else "LOW"
    return {
        "schema": "OMEGA_PROJECT_DISCOVERY_R199",
        "selected": selected,
        "candidates": candidates[:24],
        "candidateCount": len(candidates),
        "directoriesVisited": visited,
        "truncated": truncated,
        "elapsedSeconds": round(time.monotonic() - started, 3),
        "bounds": {"maxDepth": max_depth, "maxDirectories": max_dirs, "timeBudgetSeconds": time_budget},
        "confidence": confidence,
        "approvedRoot": str(root),
    }


def memory_status():
    if os.name != "nt":
        return {"availableBytes": None, "totalBytes": None, "source": "UNAVAILABLE_STDLIB"}
    class MemoryStatus(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]
    status = MemoryStatus()
    status.dwLength = ctypes.sizeof(MemoryStatus)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
        return {"availableBytes": None, "totalBytes": None, "source": "WIN32_FAILED"}
    return {
        "availableBytes": int(status.ullAvailPhys),
        "totalBytes": int(status.ullTotalPhys),
        "memoryLoadPercent": int(status.dwMemoryLoad),
        "source": "WIN32_GLOBAL_MEMORY_STATUS",
    }


def host_health(root: Path, discovery=None):
    disk = shutil.disk_usage(root)
    memory = memory_status()
    available = memory.get("availableBytes")
    disk_ok = disk.free >= MIN_FREE_DISK_BYTES
    memory_ok = available is None or available >= MIN_AVAILABLE_MEMORY_BYTES
    return {
        "schema": "OMEGA_PC_RESOURCE_GUARD_R199",
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "approvedRoot": str(root),
        "disk": {"freeBytes": disk.free, "totalBytes": disk.total, "minimumFreeBytes": MIN_FREE_DISK_BYTES, "ok": disk_ok},
        "memory": {**memory, "minimumAvailableBytes": MIN_AVAILABLE_MEMORY_BYTES, "ok": memory_ok},
        "heavyOpsSequential": True,
        "subprocessPriority": "BELOW_NORMAL_ON_WINDOWS",
        "implicitDependencyInstall": False,
        "systemOptimizationMutation": False,
        "rootConfinedWrites": True,
        "projectDiscovery": {"candidateCount": (discovery or {}).get("candidateCount"), "selected": (discovery or {}).get("selected")},
        "readyForHeavyWork": bool(disk_ok and memory_ok),
    }


def assert_resource_budget(root: Path, discovery=None):
    health = host_health(root, discovery)
    if not health["readyForHeavyWork"]:
        raise AgentError("RESOURCE_GUARD_BLOCKED: insufficient free disk or available memory for a bounded heavy operation. " + canonical_json(health))
    return health


def tool_exists(executable: str, cwd: Path) -> bool:
    if os.path.isabs(executable):
        return Path(executable).exists()
    if executable.startswith("./") or executable.startswith(".\\"):
        return (cwd / executable[2:]).exists()
    return shutil.which(executable) is not None


def package_scripts(path: Path):
    try:
        data = json.loads((path / "package.json").read_text("utf-8"))
        return data.get("scripts", {}) if isinstance(data.get("scripts", {}), dict) else {}
    except Exception:
        return {}


def command_for(path: Path, op: str, profile: str):
    profile = (profile or "AUTO_BUILD").upper()
    if (path / "package.json").exists():
        scripts = package_scripts(path)
        if op == "BUILD" and "build" in scripts:
            return ["npm", "run", "build"]
        if op == "TEST":
            for script in ("test", "check", "typecheck", "verify"):
                if script in scripts:
                    return ["npm", "run", script]
    if (path / "pyproject.toml").exists() or (path / "requirements.txt").exists():
        if op == "TEST":
            return [sys.executable, "-m", "pytest", "-q"]
        if op == "BUILD" and (path / "pyproject.toml").exists():
            return [sys.executable, "-m", "compileall", "-q", "."]
    sln = next(path.glob("*.sln"), None)
    csproj = next(path.glob("*.csproj"), None)
    if sln or csproj:
        return ["dotnet", "test" if op == "TEST" else "build", str((sln or csproj).name)]
    if (path / "Cargo.toml").exists():
        return ["cargo", "test" if op == "TEST" else "build", "--locked"] if (path / "Cargo.lock").exists() else ["cargo", "test" if op == "TEST" else "build"]
    if (path / "go.mod").exists():
        return ["go", "test", "./..."] if op == "TEST" else ["go", "build", "./..."]
    if (path / "pom.xml").exists():
        wrapper = ".\\mvnw.cmd" if os.name == "nt" and (path / "mvnw.cmd").exists() else "./mvnw" if (path / "mvnw").exists() else "mvn"
        return [wrapper, "test"] if op == "TEST" else [wrapper, "package", "-DskipTests"]
    if (path / "build.gradle").exists() or (path / "build.gradle.kts").exists():
        wrapper = ".\\gradlew.bat" if os.name == "nt" and (path / "gradlew.bat").exists() else "./gradlew" if (path / "gradlew").exists() else "gradle"
        return [wrapper, "test" if op == "TEST" else "build", "--no-daemon"]
    if profile == "NODE_BUILD":
        return ["npm", "run", "build" if op == "BUILD" else "test"]
    if profile == "PYTHON_TEST" and op == "TEST":
        return [sys.executable, "-m", "pytest", "-q"]
    if profile == "DOTNET_BUILD":
        return ["dotnet", "test" if op == "TEST" else "build"]
    return None


def project_for_operation(root: Path, discovery: dict, op: str, profile: str):
    candidates = discovery.get("candidates") or []
    if not candidates:
        raise AgentError("PROJECT_NOT_FOUND: bounded discovery found no buildable project inside the approved root.")
    if op in {"BUILD", "TEST"}:
        for candidate in candidates:
            path = secure_path(root, candidate["relativePath"])
            if command_for(path, op, profile):
                return path, candidate
        raise AgentError(f"PROJECT_COMMAND_NOT_FOUND: projects were discovered but none expose a declared {op.lower()} path.")
    candidate = discovery.get("selected") or candidates[0]
    return secure_path(root, candidate["relativePath"]), candidate


def resolve_step_path(step: dict, root: Path, discovery: dict):
    op = str(step.get("op", "")).upper()
    raw = str(step.get("path", ".") or ".").strip()
    auto = bool(step.get("autoProject", True))
    if op in HEAVY_OPS and auto and raw in {"", ".", "AUTO", "@project"}:
        path, candidate = project_for_operation(root, discovery, op, str(step.get("profile", "AUTO_BUILD")))
        return path, {"mode": "PROJECT_AUTO_RESOLVE_R199", "relativePath": rel_to_root(path, root), "candidate": candidate}
    path = secure_path(root, raw)
    return path, {"mode": "EXPLICIT_ROOT_CONFINED_PATH", "relativePath": rel_to_root(path, root)}


def project_preflight(path: Path, root: Path, discovery: dict, profile="AUTO_BUILD"):
    checks = []
    for op in ("BUILD", "TEST"):
        cmd = command_for(path, op, profile)
        executable = cmd[0] if cmd else None
        available = bool(cmd and tool_exists(executable, path))
        checks.append({"op": op, "command": cmd, "toolAvailable": available})
    return {
        "schema": "OMEGA_PROJECT_PREFLIGHT_R199",
        "projectPath": rel_to_root(path, root),
        "candidate": next((row for row in discovery.get("candidates", []) if row.get("relativePath") == rel_to_root(path, root)), None),
        "commands": checks,
        "resourceGuard": host_health(root, discovery),
        "ready": all(row["command"] is None or row["toolAvailable"] for row in checks),
        "implicitDependencyInstall": False,
    }


def run_declared(path: Path, op: str, profile: str):
    cmd = command_for(path, op, profile)
    if not cmd:
        raise AgentError(f"No declared {op.lower()} command discovered for {profile}.")
    if not tool_exists(cmd[0], path):
        raise AgentError(f"DEPENDENCY_MISSING_NO_INSTALL: required executable {cmd[0]!r} is not available. OMEGA will not install it implicitly.")
    flags = getattr(subprocess, "BELOW_NORMAL_PRIORITY_CLASS", 0) if os.name == "nt" else 0
    env = os.environ.copy()
    env.setdefault("CI", "1")
    env.setdefault("npm_config_audit", "false")
    env.setdefault("npm_config_fund", "false")
    started = time.monotonic()
    proc = subprocess.run(cmd, cwd=path, text=True, capture_output=True, timeout=900, shell=False, creationflags=flags, env=env)
    result = {
        "command": cmd,
        "exitCode": proc.returncode,
        "stdout": proc.stdout[-18000:],
        "stderr": proc.stderr[-12000:],
        "elapsedSeconds": round(time.monotonic() - started, 3),
        "priority": "BELOW_NORMAL" if flags else "NORMAL",
        "implicitDependencyInstall": False,
    }
    if proc.returncode:
        raise AgentError(canonical_json(result))
    return result


def index_tree(path: Path):
    rows = [{"path": p.relative_to(path).as_posix(), "bytes": p.stat().st_size, "ext": p.suffix.lower()} for p in iter_files(path)]
    return {"files": len(rows), "sample": rows[:160]}


def hash_tree(path: Path):
    digest = hashlib.sha256()
    rows = []
    for p in sorted(iter_files(path), key=lambda item: item.as_posix().lower()):
        rel = p.relative_to(path).as_posix()
        file_digest = sha_bytes(p.read_bytes())
        digest.update(rel.encode("utf-8"))
        digest.update(file_digest.encode("ascii"))
        rows.append({"path": rel, "sha256": file_digest, "bytes": p.stat().st_size})
    return {"treeSha256": digest.hexdigest(), "files": len(rows), "sample": rows[:160]}


def read_text(path: Path):
    if not path.is_file():
        raise AgentError("READ_TEXT requires a file.")
    raw = path.read_bytes()
    if len(raw) > MAX_FILE_BYTES:
        raise AgentError("File exceeds bounded text-read size.")
    return {"path": path.name, "sha256": sha_bytes(raw), "bytes": len(raw), "text": raw.decode("utf-8", "replace")[:120000]}


def search_text(path: Path, query: str, max_results=120):
    terms = [item.lower() for item in re.findall(r"[A-Za-z0-9_.-]{2,}", query or "")][:12]
    if not terms:
        raise AgentError("SEARCH_TEXT requires literal terms.")
    out = []
    for p in iter_files(path):
        if p.suffix.lower() not in TEXT_EXT:
            continue
        try:
            lines = p.read_text("utf-8", "replace").splitlines()
        except Exception:
            continue
        for line_no, line in enumerate(lines, 1):
            if any(term in line.lower() for term in terms):
                out.append({"path": p.relative_to(path).as_posix(), "line": line_no, "text": line[:500]})
                if len(out) >= int(max_results or 120):
                    return {"query": query, "matches": out}
    return {"query": query, "matches": out}


def package_path(path: Path, root: Path):
    out_dir = root / ".omega_hybrid" / "packages"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / (path.name + "_" + time.strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6] + ".zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        for p in iter_files(path):
            archive.write(p, p.relative_to(path).as_posix())
    return {"path": out.relative_to(root).as_posix(), "sha256": sha_bytes(out.read_bytes()), "bytes": out.stat().st_size}


def backup(path: Path, root: Path):
    stamp = time.strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:8]
    out = root / ".omega_hybrid" / "backups" / stamp / path.relative_to(root)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(path.read_bytes())
    return out


def apply_patch(path: Path, root: Path, step: dict):
    if not path.is_file() or path.is_symlink():
        raise AgentError("APPLY_PATCH requires a regular text file inside the approved root.")
    raw = path.read_bytes()
    expected = str(step.get("expectedSha256", "")).lower()
    if len(raw) > MAX_PATCH_BYTES or not re.fullmatch(r"[0-9a-f]{64}", expected):
        raise AgentError("APPLY_PATCH requires expectedSha256 from a prior READ_TEXT/HASH proof.")
    before = sha_bytes(raw)
    if before != expected:
        raise AgentError("APPLY_PATCH preimage mismatch.")
    changed = raw.decode("utf-8")
    replacements = step.get("replacements")
    if not isinstance(replacements, list) or not 1 <= len(replacements) <= MAX_PATCH_REPLACEMENTS:
        raise AgentError("APPLY_PATCH requires 1-24 exact replacements.")
    for row in replacements:
        find = row.get("find")
        replace = row.get("replace")
        occurrences = int(row.get("occurrences", 1))
        observed = changed.count(find or "")
        if not find or not isinstance(replace, str) or observed != occurrences:
            raise AgentError("APPLY_PATCH exact replacement proof failed.")
        changed = changed.replace(find, replace, occurrences)
    out = changed.encode("utf-8")
    saved = backup(path, root)
    tmp = path.with_name(path.name + ".omega_" + uuid.uuid4().hex + ".tmp")
    tmp.write_bytes(out)
    os.replace(tmp, path)
    return {"path": path.relative_to(root).as_posix(), "beforeSha256": before, "afterSha256": sha_bytes(out), "backupPath": saved.relative_to(root).as_posix(), "atomic": True}


def write_text(path: Path, root: Path, step: dict):
    data = str(step.get("content", "")).encode("utf-8")
    if not data or len(data) > MAX_WRITE_BYTES:
        raise AgentError("WRITE_TEXT requires bounded UTF-8 content.")
    before = None
    saved = None
    if path.exists():
        if step.get("createOnly"):
            raise AgentError("WRITE_TEXT createOnly target already exists.")
        before = sha_bytes(path.read_bytes())
        expected = str(step.get("expectedSha256", "")).lower()
        if before != expected:
            raise AgentError("WRITE_TEXT replacement requires expectedSha256 from prior host proof.")
        saved = backup(path, root)
    elif not step.get("createOnly"):
        raise AgentError("WRITE_TEXT new-file creation requires createOnly=true.")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".omega_" + uuid.uuid4().hex + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)
    result = {"path": path.relative_to(root).as_posix(), "beforeSha256": before, "afterSha256": sha_bytes(data), "atomic": True, "created": before is None}
    if saved:
        result["backupPath"] = saved.relative_to(root).as_posix()
    return result


def restore_backup(path: Path, root: Path, step: dict):
    backup_rel = str(step.get("backupPath", "")).replace("\\", "/")
    if not backup_rel.startswith(".omega_hybrid/backups/"):
        raise AgentError("RESTORE_BACKUP requires an OMEGA-managed backup path.")
    source = secure_path(root, backup_rel)
    if not source.is_file():
        raise AgentError("RESTORE_BACKUP source does not exist.")
    if path.exists():
        expected = str(step.get("expectedSha256", "")).lower()
        if not re.fullmatch(r"[0-9a-f]{64}", expected) or sha_bytes(path.read_bytes()) != expected:
            raise AgentError("RESTORE_BACKUP target preimage mismatch.")
        backup(path, root)
    data = source.read_bytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".omega_restore_" + uuid.uuid4().hex + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)
    return {"path": path.relative_to(root).as_posix(), "restoredFrom": backup_rel, "afterSha256": sha_bytes(data), "atomic": True}


def workbook_audit(path: Path, root: Path):
    if not path.is_file() or path.suffix.lower() not in {".xlsx", ".xlsm"}:
        raise AgentError("WORKBOOK_AUDIT requires an .xlsx or .xlsm file.")
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        sheets = []
        if "xl/workbook.xml" in names:
            tree = ET.fromstring(archive.read("xl/workbook.xml"))
            ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            sheets = [node.attrib.get("name", "") for node in tree.findall(".//m:sheet", ns)][:200]
        formulas = sum(archive.read(name).count(b"<f") for name in names if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"))
    return {"path": path.relative_to(root).as_posix(), "sha256": sha_bytes(path.read_bytes()), "sheets": sheets, "formulaCount": formulas, "hasVbaProject": "xl/vbaProject.bin" in names, "executedMacros": False}


def train_local(path: Path, root: Path):
    docs, chunks, freq, duplicates = [], [], {}, {}
    for p in iter_files(path):
        if p.suffix.lower() not in TEXT_EXT:
            continue
        try:
            source = p.read_text("utf-8", "replace")[:600000]
        except Exception:
            continue
        words = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", source.lower())
        if not words:
            continue
        rel = p.relative_to(path).as_posix()
        digest = sha_bytes(source.encode("utf-8"))
        docs.append({"path": rel, "sha256": digest, "tokens": len(words)})
        duplicates.setdefault(digest, []).append(rel)
        for word in set(words):
            freq[word] = freq.get(word, 0) + 1
        lines = source.splitlines()
        for start in range(0, len(lines), 80):
            block = "\n".join(lines[start:start + 80]).strip()
            if block:
                chunks.append({"path": rel, "startLine": start + 1, "sha256": sha_bytes(block.encode("utf-8")), "preview": block[:800]})
            if len(chunks) >= 50000:
                break
    payload = {
        "schema": "OMEGA_SAI_LOCAL_RETRIEVAL_INDEX_R199",
        "documents": docs[:25000],
        "chunks": chunks,
        "termDocumentFrequency": sorted(freq.items(), key=lambda item: (-item[1], item[0]))[:6000],
        "duplicateGroups": [{"sha256": digest, "paths": paths} for digest, paths in duplicates.items() if len(paths) > 1][:1000],
        "foundationWeightsChanged": False,
        "learningType": "LOCAL_RETRIEVAL_AND_PROOF_PRIOR_INDEX",
        "createdAt": int(time.time()),
    }
    payload["indexSha256"] = sha_json(payload)
    out_dir = root / ".omega_hybrid"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "sai_index_r199.json"
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    status = "PASS" if docs else "HOLD_NO_DOCUMENTS"
    return {"indexPath": out.relative_to(root).as_posix(), "indexSha256": payload["indexSha256"], "documents": len(docs), "chunks": len(chunks), "evaluation": {"status": status}, "promotion": {"status": "ACTIVE_LOCAL_RETRIEVAL_INDEX" if status == "PASS" else "HELD"}, "foundationWeightsChanged": False, "learningType": payload["learningType"]}


# Windows desktop adapter. It remains title-locked and never exposes arbitrary shell execution.
def require_windows():
    if os.name != "nt":
        raise AgentError("This desktop automation operation requires Windows.")


def user32():
    require_windows()
    return ctypes.windll.user32


def list_windows():
    u = user32()
    rows = []
    proc_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    @proc_type
    def callback(handle, _):
        if u.IsWindowVisible(handle):
            length = u.GetWindowTextLengthW(handle)
            buffer = ctypes.create_unicode_buffer(length + 1)
            u.GetWindowTextW(handle, buffer, length + 1)
            if buffer.value.strip():
                rows.append({"hwnd": int(handle), "title": buffer.value[:240]})
        return len(rows) < 160
    u.EnumWindows(callback, 0)
    return {"windows": rows, "count": len(rows)}


def foreground_window():
    u = user32()
    handle = u.GetForegroundWindow()
    length = u.GetWindowTextLengthW(handle)
    buffer = ctypes.create_unicode_buffer(length + 1)
    u.GetWindowTextW(handle, buffer, length + 1)
    return {"hwnd": int(handle), "title": buffer.value}


def assert_window(title):
    row = foreground_window()
    needle = str(title or "").lower()
    if not needle or needle not in row["title"].lower():
        raise AgentError(f"Foreground window mismatch: required {title!r}, observed {row['title']!r}.")
    return {"matched": True, **row}


def find_window(title):
    needle = str(title or "").lower()
    matches = [row for row in list_windows()["windows"] if needle in row["title"].lower()]
    if not matches:
        raise AgentError("No visible window matched title lock.")
    return matches[0]


def focus_window(title):
    row = find_window(title)
    u = user32()
    u.ShowWindow(row["hwnd"], 5)
    u.SetForegroundWindow(row["hwnd"])
    time.sleep(0.2)
    return assert_window(title)


def screen_capture(root: Path, title):
    row = assert_window(title)
    out_dir = root / ".omega_hybrid" / "screens"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / (time.strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:8] + ".png")
    script = "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing;$h=[intptr]::new([int64]$args[0]);Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class R{[DllImport(\"user32.dll\")]public static extern bool GetWindowRect(IntPtr h,out RECT r);public struct RECT{public int L,T,R,B;}}';$q=New-Object R+RECT;[R]::GetWindowRect($h,[ref]$q)|Out-Null;$w=$q.R-$q.L;$hh=$q.B-$q.T;$b=New-Object Drawing.Bitmap $w,$hh;$g=[Drawing.Graphics]::FromImage($b);$g.CopyFromScreen($q.L,$q.T,0,0,$b.Size);$b.Save($args[1],[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$b.Dispose()"
    proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, str(row["hwnd"]), str(out)], text=True, capture_output=True, timeout=30, shell=False)
    if proc.returncode or not out.exists():
        raise AgentError("SCREEN_CAPTURE failed: " + proc.stderr[-1000:])
    return {"path": out.relative_to(root).as_posix(), "sha256": sha_bytes(out.read_bytes()), "bytes": out.stat().st_size, "windowTitle": row["title"], "localOnly": True}


def mouse_move(x, y, title):
    assert_window(title)
    return {"moved": bool(user32().SetCursorPos(int(x), int(y))), "x": int(x), "y": int(y)}


def click_mouse(x, y, button, title):
    assert_window(title)
    u = user32()
    u.SetCursorPos(int(x), int(y))
    right = str(button).upper() == "RIGHT"
    u.mouse_event(8 if right else 2, 0, 0, 0, 0)
    u.mouse_event(16 if right else 4, 0, 0, 0, 0)
    return {"clicked": True, "x": int(x), "y": int(y), "button": "RIGHT" if right else "LEFT"}


VK = {"ENTER": 13, "TAB": 9, "ESC": 27, "ESCAPE": 27, "BACKSPACE": 8, "DELETE": 46, "HOME": 36, "END": 35, "PAGEUP": 33, "PAGEDOWN": 34, "UP": 38, "DOWN": 40, "LEFT": 37, "RIGHT": 39, "SPACE": 32, "CTRL": 17, "ALT": 18, "SHIFT": 16}
for _idx in range(1, 13):
    VK["F" + str(_idx)] = 111 + _idx
for _char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
    VK[_char] = ord(_char)


def key_event(value, down=True):
    user32().keybd_event(int(value), 0, 0 if down else 2, 0)


def send_key(name, title):
    assert_window(title)
    parts = str(name).upper().split("+")
    modifiers = []
    for part in parts[:-1]:
        if part not in VK:
            raise AgentError("Unsupported key chord.")
        modifiers.append(VK[part])
        key_event(VK[part])
    if parts[-1] not in VK:
        raise AgentError("Unsupported key.")
    key_event(VK[parts[-1]])
    key_event(VK[parts[-1]], False)
    for value in reversed(modifiers):
        key_event(value, False)
    return {"key": name, "sent": True}


def type_text(value, title):
    assert_window(title)
    u = user32()
    count = 0
    for char in str(value):
        code = u.VkKeyScanW(ord(char))
        vk = code & 255
        shift = (code >> 8) & 255
        if code == -1:
            raise AgentError("TYPE_TEXT cannot map character.")
        if shift & 1:
            key_event(16)
        key_event(vk)
        key_event(vk, False)
        if shift & 1:
            key_event(16, False)
        count += 1
    return {"typedCharacters": count, "textSha256": sha_bytes(str(value).encode("utf-8")), "plaintextReturned": False}


def scroll_mouse(delta, title):
    assert_window(title)
    user32().mouse_event(0x0800, 0, 0, int(delta), 0)
    return {"scrolled": int(delta)}


def read_visible_text(title, max_results=400):
    row = assert_window(title)
    script = "$ErrorActionPreference='Stop';Add-Type -AssemblyName UIAutomationClient;Add-Type -AssemblyName UIAutomationTypes;$x=[Windows.Automation.AutomationElement]::FromHandle([intptr]::new([int64]$args[0]));$a=$x.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition);$o=@();for($i=0;$i -lt $a.Count -and $o.Count -lt [int]$args[1];$i++){try{$n=$a.Item($i).Current.Name;if($n){$o+=[pscustomobject]@{name=$n;control=$a.Item($i).Current.ControlType.ProgrammaticName}}}catch{}};$o|ConvertTo-Json -Compress"
    proc = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, str(row["hwnd"]), str(max(1, min(1000, int(max_results or 400))))], text=True, capture_output=True, timeout=30, shell=False)
    if proc.returncode:
        raise AgentError("READ_VISIBLE_TEXT UI Automation failed.")
    try:
        data = json.loads(proc.stdout) if proc.stdout.strip() else []
    except Exception:
        data = []
    if isinstance(data, dict):
        data = [data]
    return {"windowTitle": row["title"], "items": data, "count": len(data), "method": "WINDOWS_UI_AUTOMATION"}


def macro_path(root: Path, name):
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", str(name or ""))[:64]
    directory = root / ".omega_hybrid" / "macros"
    directory.mkdir(parents=True, exist_ok=True)
    return directory / (safe + ".json")


def record_macro(root: Path, name, title, duration):
    require_windows()
    assert_window(title)
    u = user32()
    start = time.time()
    events = []
    last = (None, None)
    buttons = {1: False, 2: False}
    keys = {key: False for key in range(8, 256)}
    class Point(ctypes.Structure):
        _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
    while time.time() - start < max(5, min(300, int(duration or 30))) and len(events) < MAX_MACRO_EVENTS:
        assert_window(title)
        point = Point()
        u.GetCursorPos(ctypes.byref(point))
        pos = (point.x, point.y)
        elapsed = round(time.time() - start, 3)
        if last == (None, None) or abs(pos[0] - last[0]) + abs(pos[1] - last[1]) >= 4:
            events.append({"t": elapsed, "type": "MOVE", "x": pos[0], "y": pos[1]})
            last = pos
        for vk, button in ((1, "LEFT"), (2, "RIGHT")):
            down = bool(u.GetAsyncKeyState(vk) & 0x8000)
            if buttons[vk] and not down:
                events.append({"t": elapsed, "type": "CLICK", "x": pos[0], "y": pos[1], "button": button})
            buttons[vk] = down
        for vk in range(8, 256):
            if vk in (1, 2):
                continue
            down = bool(u.GetAsyncKeyState(vk) & 0x8000)
            if down and not keys[vk]:
                events.append({"t": elapsed, "type": "KEY_RAW", "vk": vk})
            keys[vk] = down
        time.sleep(0.025)
    payload = {"schema": "OMEGA_LOCAL_MACRO_R199", "windowTitleLock": title, "events": events, "eventCount": len(events), "recordedAt": int(time.time())}
    payload["macroSha256"] = sha_json(payload)
    out = macro_path(root, name)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"path": out.relative_to(root).as_posix(), "sha256": sha_bytes(out.read_bytes()), "events": len(events), "contentsReturned": False}


def replay_macro(root: Path, name, title, loops, max_runtime):
    require_windows()
    path = macro_path(root, name)
    if not path.is_file():
        raise AgentError("Macro file not found.")
    events = json.loads(path.read_text(encoding="utf-8")).get("events", [])
    start = time.time()
    count = 0
    for _ in range(max(1, min(20, int(loops or 1)))):
        prior = 0
        for event in events:
            if time.time() - start > max(30, min(1800, int(max_runtime or 300))):
                raise AgentError("Macro replay exceeded approved runtime budget.")
            assert_window(title)
            event_time = float(event.get("t", 0))
            time.sleep(min(2, max(0, event_time - prior)))
            prior = event_time
            if event.get("type") == "MOVE":
                user32().SetCursorPos(int(event["x"]), int(event["y"]))
            elif event.get("type") == "CLICK":
                click_mouse(event["x"], event["y"], event.get("button", "LEFT"), title)
            elif event.get("type") == "KEY_RAW":
                key_event(event["vk"])
                key_event(event["vk"], False)
            count += 1
    return {"macroPath": path.relative_to(root).as_posix(), "macroSha256": sha_bytes(path.read_bytes()), "eventsExecuted": count, "runtimeSeconds": round(time.time() - start, 3)}


def execute_step(step, root: Path, discovery: dict):
    op = str(step.get("op", "")).upper()
    if op == "DISCOVER_PROJECT":
        return discovery
    if op == "PC_HEALTH":
        return host_health(root, discovery)
    if op == "PROJECT_PREFLIGHT":
        path, resolution = resolve_step_path({**step, "op": "PACKAGE"}, root, discovery)
        result = project_preflight(path, root, discovery, step.get("profile", "AUTO_BUILD"))
        result["pathResolution"] = resolution
        return result
    path, resolution = resolve_step_path(step, root, discovery)
    guard = assert_resource_budget(root, discovery) if op in HEAVY_OPS else None
    if op == "INDEX":
        result = index_tree(path)
    elif op == "HASH_TREE":
        result = hash_tree(path)
    elif op == "READ_TEXT":
        result = read_text(path)
    elif op == "SEARCH_TEXT":
        result = search_text(path, str(step.get("query", "")), step.get("maxResults", 120))
    elif op == "APPLY_PATCH":
        result = apply_patch(path, root, step)
    elif op == "WRITE_TEXT":
        result = write_text(path, root, step)
    elif op == "RESTORE_BACKUP":
        result = restore_backup(path, root, step)
    elif op in {"BUILD", "TEST"}:
        result = run_declared(path, op, step.get("profile", "AUTO_BUILD"))
    elif op == "PACKAGE":
        result = package_path(path, root)
    elif op == "TRAIN_LOCAL":
        result = train_local(path, root)
    elif op == "SAFE_IMPORT":
        result = {"classification": "DONOR_QUARANTINED", "fingerprint": hash_tree(path), "executed": False}
    elif op == "WORKBOOK_AUDIT":
        result = workbook_audit(path, root)
    elif op == "SUPPORT_BUNDLE":
        result = package_path(path, root)
    elif op == "WAIT":
        waited = max(0.1, min(30, float(step.get("milliseconds", 1000)) / 1000))
        time.sleep(waited)
        result = {"waitedMs": int(waited * 1000)}
    elif op == "OPEN_URL":
        import webbrowser
        url = str(step.get("url", ""))
        if not url.startswith("https://"):
            raise AgentError("Only HTTPS URLs are allowed.")
        result = {"opened": bool(webbrowser.open(url)), "url": url}
    elif op == "LIST_WINDOWS":
        result = list_windows()
    elif op == "FOCUS_WINDOW":
        result = focus_window(step.get("windowTitle"))
    elif op == "SCREEN_CAPTURE":
        result = screen_capture(root, step.get("windowTitle"))
    elif op == "MOUSE_MOVE":
        result = mouse_move(step.get("x", 0), step.get("y", 0), step.get("windowTitle"))
    elif op == "CLICK":
        result = click_mouse(step.get("x", 0), step.get("y", 0), step.get("button", "LEFT"), step.get("windowTitle"))
    elif op == "KEY":
        result = send_key(step.get("key"), step.get("windowTitle"))
    elif op == "TYPE_TEXT":
        result = type_text(step.get("text", ""), step.get("windowTitle"))
    elif op == "SCROLL":
        result = scroll_mouse(step.get("delta", -480), step.get("windowTitle"))
    elif op == "ASSERT_WINDOW":
        result = assert_window(step.get("windowTitle"))
    elif op == "READ_VISIBLE_TEXT":
        result = read_visible_text(step.get("windowTitle"), step.get("maxResults", 400))
    elif op == "RECORD_MACRO":
        result = record_macro(root, step.get("macroName"), step.get("windowTitle"), step.get("durationSeconds", 30))
    elif op == "REPLAY_MACRO":
        result = replay_macro(root, step.get("macroName"), step.get("windowTitle"), step.get("loopCount", 1), step.get("maxRuntimeSeconds", 300))
    else:
        raise AgentError("Unsupported operation " + op)
    if isinstance(result, dict):
        result.setdefault("executionPath", resolution["relativePath"])
        result["pathResolution"] = resolution
        if guard:
            result["resourceGuard"] = {
                "readyForHeavyWork": guard["readyForHeavyWork"],
                "diskFreeBytes": guard["disk"]["freeBytes"],
                "memoryAvailableBytes": guard["memory"].get("availableBytes"),
                "heavyOpsSequential": True,
            }
    return result


def receipt_core(job_id, device_id, ok, proofs, outputs):
    summaries = []
    for proof in proofs:
        summaries.append({
            "id": proof.get("id"),
            "op": proof.get("op"),
            "ok": bool(proof.get("ok")),
            "proofSha256": sha_json(proof),
        })
    return {
        "schema": "OMEGA_HYBRID_RECEIPT_CORE_R199",
        "jobId": str(job_id or ""),
        "deviceId": str(device_id or ""),
        "ok": bool(ok),
        "returnedState": "RETURNED_SUCCESS" if ok else "RETURNED_FAILURE",
        "capabilityRevision": CAPABILITY_REVISION,
        "sovereignClosureRevision": SOVEREIGN_CLOSURE_REVISION,
        "stepCount": len(proofs),
        "stepReceipts": summaries,
        "outputPaths": [str(item) for item in outputs if item][:40],
    }


def execute_job(job, root: Path, device_id: str):
    started = time.monotonic()
    proofs, outputs, logs = [], [], []
    ok = True
    evaluation = None
    promotion = None
    discovery = discover_projects(root)
    health = host_health(root, discovery)
    steps = (job.get("steps") or [])[:24]
    heavy_count = sum(1 for step in steps if str(step.get("op", "")).upper() in HEAVY_OPS)
    selected = (discovery.get("selected") or {}).get("relativePath", "NONE")
    print(f"  project discovery: {discovery.get('candidateCount', 0)} candidate(s), selected={selected}, confidence={discovery.get('confidence')}")
    memory_available = health["memory"].get("availableBytes")
    memory_label = str(memory_available // (1024**2)) + "MiB" if memory_available is not None else "unknown"
    print(f"  resource guard: disk={health['disk']['freeBytes'] // (1024**3)}GiB free, memory={memory_label}, heavy steps={heavy_count} sequential")
    for index, step in enumerate(steps, 1):
        op = str(step.get("op", "")).upper()
        proof = {"id": step.get("id"), "op": op, "startedAt": int(time.time() * 1000)}
        try:
            print(f"  [{index}/{len(steps)}] {op} ...", flush=True)
            result = execute_step(step, root, discovery)
            proof.update({"ok": True, "result": result, "completedAt": int(time.time() * 1000)})
            print(f"      PASS · {result.get('executionPath', 'root') if isinstance(result, dict) else 'complete'}", flush=True)
            for key in ("path", "backupPath", "macroPath"):
                if isinstance(result, dict) and result.get(key):
                    outputs.append(result[key])
            if op == "TRAIN_LOCAL":
                evaluation = result.get("evaluation")
                promotion = result.get("promotion")
                outputs.append(result.get("indexPath"))
        except Exception as exc:
            ok = False
            proof.update({"ok": False, "error": str(exc)[:12000], "completedAt": int(time.time() * 1000)})
            logs.append(str(exc))
            proofs.append(proof)
            print("      FAIL · " + str(exc)[:600], file=sys.stderr, flush=True)
            break
        proofs.append(proof)
    core = receipt_core(job.get("id"), device_id, ok, proofs, outputs)
    canonical = canonical_json(core)
    packet = {
        "schema": "OMEGA_HYBRID_RETURN_R199",
        "jobId": job.get("id"),
        "deviceId": device_id,
        "executionId": "exec_" + uuid.uuid4().hex,
        "ok": ok,
        "returnedState": core["returnedState"],
        "stepProofs": proofs,
        "outputPaths": [item for item in outputs if item][:40],
        "log": "\n".join(logs)[-12000:],
        "evaluation": evaluation,
        "promotion": promotion,
        "capabilityRevision": CAPABILITY_REVISION,
        "sovereignClosureRevision": SOVEREIGN_CLOSURE_REVISION,
        "agentVersion": VERSION,
        "projectDiscovery": discovery,
        "resourceGuard": health,
        "heavyOperationsSequential": True,
        "implicitDependencyInstall": False,
        "systemOptimizationMutation": False,
        "receiptCanonicalJson": canonical,
        "resultFingerprint": sha_bytes(canonical.encode("utf-8")),
        "elapsedSeconds": round(time.monotonic() - started, 3),
    }
    return packet


def capabilities():
    caps = [
        "DISCOVER_PROJECT", "PROJECT_PREFLIGHT", "PC_HEALTH", "TRAIN_LOCAL", "INDEX", "READ_TEXT",
        "SEARCH_TEXT", "HASH_TREE", "SAFE_IMPORT", "WORKBOOK_AUDIT", "BUILD", "TEST", "PACKAGE",
        "SUPPORT_BUNDLE", "APPLY_PATCH", "WRITE_TEXT", "RESTORE_BACKUP", "OPEN_URL", "WAIT",
    ]
    if os.name == "nt":
        caps += ["LIST_WINDOWS", "FOCUS_WINDOW", "SCREEN_CAPTURE", "MOUSE_MOVE", "CLICK", "KEY", "TYPE_TEXT", "SCROLL", "ASSERT_WINDOW", "READ_VISIBLE_TEXT", "RECORD_MACRO", "REPLAY_MACRO"]
    return caps


def main():
    parser = argparse.ArgumentParser(description="OMEGA R34.1 Hybrid Link · R199 sovereign workstation runtime")
    parser.add_argument("--server", default=DEFAULT_SERVER)
    parser.add_argument("--pair", required=True)
    parser.add_argument("--root", default=".")
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    server = args.server.rstrip("/")
    bridge_id, secret = parse_pair(args.pair)
    root = Path(normalize_root_arg(args.root)).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    runtime_dir = root / ".omega_hybrid"
    runtime_dir.mkdir(exist_ok=True)
    id_file = runtime_dir / "device_id.txt"
    device_id = id_file.read_text(encoding="utf-8").strip() if id_file.exists() else "device_" + uuid.uuid4().hex
    id_file.write_text(device_id, encoding="utf-8")
    caps = capabilities()
    discovery = discover_projects(root)
    health = host_health(root, discovery)
    registration = {
        "bridgeId": bridge_id,
        "deviceId": device_id,
        "name": socket.gethostname(),
        "platform": platform.platform(),
        "version": VERSION,
        "capabilityRevision": CAPABILITY_REVISION,
        "sovereignClosureRevision": SOVEREIGN_CLOSURE_REVISION,
        "capabilities": caps,
        "rootLabel": root.name or root.anchor,
        "projectDiscovery": discovery,
        "resourceGuard": health,
        "executionPolicy": {
            "rootConfined": True,
            "heavyOpsSequential": True,
            "resourceGuard": True,
            "reversibleWrites": True,
            "implicitDependencyInstall": False,
            "systemOptimizationMutation": False,
            "arbitraryShell": False,
        },
    }
    print("OMEGA Hybrid Link", VERSION, "execution", CAPABILITY_REVISION, "· sovereign closure", SOVEREIGN_CLOSURE_REVISION)
    print("Approved root:", root)
    print("Safety: project-aware · root-confined reversible writes · sequential low-priority heavy work · no implicit dependency installs")
    print("[1/4] CANONICAL REACHABILITY:", server)
    try:
        probe_server(server)
        print("      PASS — /api/health reachable")
    except Exception as exc:
        print("      FAIL —", exc, file=sys.stderr)
        raise SystemExit(21)
    print("[2/4] AUTHENTICATING / REGISTERING DEVICE")
    try:
        request_json(server, "/api/hybrid/agent/register", registration, bridge_id, secret)
        print("      PASS — browser credential accepted and R199 workstation capabilities registered")
    except Exception as exc:
        print("      FAIL —", exc, file=sys.stderr)
        raise SystemExit(22)
    print("[3/4] ESTABLISHING AUTHENTICATED HEARTBEAT")
    failures = 0
    announced = False
    last_inventory = 0.0
    while True:
        try:
            if time.monotonic() - last_inventory >= 60:
                discovery = discover_projects(root)
                health = host_health(root, discovery)
                last_inventory = time.monotonic()
            request_json(server, "/api/hybrid/agent/heartbeat", {
                "bridgeId": bridge_id,
                "deviceId": device_id,
                "version": VERSION,
                "capabilityRevision": CAPABILITY_REVISION,
                "sovereignClosureRevision": SOVEREIGN_CLOSURE_REVISION,
                "projectDiscovery": discovery,
                "resourceGuard": health,
            }, bridge_id, secret, 15)
            if not announced:
                print("      PASS — authenticated heartbeat returned. Browser may now truthfully show PC ONLINE.")
                print("[4/4] GOVERNED JOB POLL ACTIVE — discover → preflight → build → test → package → verified return")
                announced = True
            failures = 0
            poll = request_json(server, "/api/hybrid/agent/poll", {"bridgeId": bridge_id, "deviceId": device_id}, bridge_id, secret, 30)
            job = poll.get("job")
            if job:
                print("Running approved job", job.get("id"))
                try:
                    request_json(server, "/api/hybrid/agent/progress", {"bridgeId": bridge_id, "deviceId": device_id, "jobId": job.get("id"), "state": "RUNNING", "projectDiscovery": discovery, "resourceGuard": health}, bridge_id, secret, 20)
                except Exception as exc:
                    print("  progress receipt degraded:", exc, file=sys.stderr)
                packet = execute_job(job, root, device_id)
                reply = request_json(server, "/api/hybrid/agent/result", packet, bridge_id, secret, 60)
                verification = reply.get("returnVerification") or reply.get("verification") or {}
                print("Returned proof:", packet["resultFingerprint"], "·", packet["returnedState"], "· server:", verification.get("state") or reply.get("state") or reply.get("status") or "accepted")
            if args.once:
                return
        except KeyboardInterrupt:
            print("Hybrid Link stopped by user. PC ONLINE will age to HEARTBEAT STALE.")
            return
        except Exception as exc:
            failures += 1
            print(f"[AUTH/HTTP/TRANSPORT ERROR] attempt {failures}: {exc}", file=sys.stderr)
        time.sleep(min(15, 5 + max(0, failures - 1) * 2))


if __name__ == "__main__":
    main()
