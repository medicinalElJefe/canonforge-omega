from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Sequence
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("OMEGA_DATA", "/data"))
STATUS_DIR = DATA / "self-build"
RELEASE_STORE = STATUS_DIR / "releases"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path: Path) -> str:
    h = sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(temp_name, path)
    finally:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass


def append_jsonl(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n")
        fh.flush()
        os.fsync(fh.fileno())


@dataclass
class Gate:
    name: str
    status: str
    detail: str
    duration_ms: int
    digest: str | None = None

    def public(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "detail": self.detail,
            "duration_ms": self.duration_ms,
            "digest": self.digest,
        }


def run_gate(name: str, command: Sequence[str], *, cwd: Path = ROOT) -> Gate:
    started = time.monotonic()
    result = subprocess.run(
        list(command),
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    duration_ms = round((time.monotonic() - started) * 1000)
    output = (result.stdout or "").strip()
    if len(output) > 4000:
        output = output[-4000:]
    status = "PASS" if result.returncode == 0 else "FAIL"
    detail = output or f"exit={result.returncode}"
    return Gate(name, status, detail, duration_ms)


def release_path() -> Path:
    manifest = json.loads((ROOT / "omega.manifest.json").read_text(encoding="utf-8"))
    version = str(manifest["version"]).replace(".", "_")
    return ROOT / "release" / f"OMEGA_Genesis_v{version}_Full_Repository.zip"


def health_gate() -> Gate:
    started = time.monotonic()
    url = os.environ.get("OMEGA_SELF_BUILD_HEALTH_URL", "http://omega:8127/api/health")
    headers = {}
    token = os.environ.get("OMEGA_GATEWAY_TOKEN", "")
    if token:
        headers["X-Omega-Gateway-Token"] = token
    try:
        request = Request(url, headers=headers)
        with urlopen(request, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
            status_code = response.status
        required = (
            status_code == 200
            and body.get("status") == "OK"
            and bool(body.get("proof", {}).get("valid"))
            and bool(body.get("replay", {}).get("valid"))
        )
        if not required:
            raise RuntimeError(f"health proof/replay contract failed: {body}")
        return Gate(
            "cloud_health",
            "PASS",
            f"runtime healthy state_id={body.get('state_id')} digest={body.get('canonical_digest')}",
            round((time.monotonic() - started) * 1000),
            body.get("canonical_digest"),
        )
    except Exception as exc:
        return Gate(
            "cloud_health",
            "FAIL",
            f"{type(exc).__name__}: {exc}",
            round((time.monotonic() - started) * 1000),
        )


def archive_verified_release(source: Path, digest: str) -> Path:
    RELEASE_STORE.mkdir(parents=True, exist_ok=True)
    target = RELEASE_STORE / f"{digest}.zip"
    if not target.exists():
        shutil.copy2(source, target)
    checksum = RELEASE_STORE / f"{digest}.sha256"
    checksum.write_text(f"{digest}  {target.name}\n", encoding="utf-8")
    return target


def run_cycle() -> dict:
    cycle_started = utc_now()
    gates: list[Gate] = []

    gates.append(run_gate("python_compile", [sys.executable, "-m", "compileall", "-q", "omega_genesis"]))
    gates.append(run_gate("python_tests", [sys.executable, "-m", "pytest", "-q"]))
    gates.append(run_gate("manifest_verify", [sys.executable, "scripts/verify_release.py"]))

    first = run_gate("release_build", [sys.executable, "scripts/build_release.py"])
    if first.status == "PASS":
        out = release_path()
        if out.is_file():
            first.digest = sha256_file(out)
            first.detail = f"{out.name} sha256={first.digest}"
        else:
            first.status = "FAIL"
            first.detail = "release archive missing after build"
    gates.append(first)

    second = run_gate("release_reproducibility", [sys.executable, "scripts/build_release.py"])
    if second.status == "PASS" and first.status == "PASS":
        out = release_path()
        second.digest = sha256_file(out) if out.is_file() else None
        if second.digest != first.digest:
            second.status = "FAIL"
            second.detail = f"release digest drift: {first.digest} != {second.digest}"
        else:
            second.detail = f"byte-identical rebuild sha256={second.digest}"
    gates.append(second)

    gates.append(health_gate())

    failures = [g.name for g in gates if g.status != "PASS"]
    decision = "PASS" if not failures else "QUARANTINE"
    archived = None
    if decision == "PASS" and first.digest:
        archived = str(archive_verified_release(release_path(), first.digest))

    report = {
        "schema": "omega.cloud.selfbuild.v1",
        "authority": "OMEGA_CLOUD",
        "started_at": cycle_started,
        "completed_at": utc_now(),
        "decision": decision,
        "failures": failures,
        "release_sha256": first.digest,
        "archived_release": archived,
        "source_manifest_sha256": sha256_file(ROOT / "omega.manifest.json"),
        "gates": [g.public() for g in gates],
        "boundary": "running cloud may rebuild/verify its current generation; core source mutation remains proposal_only",
    }
    atomic_json(STATUS_DIR / "status.json", report)
    append_jsonl(STATUS_DIR / "journal.jsonl", report)
    return report


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="OMEGA cloud-resident self-build supervisor")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument(
        "--interval",
        type=int,
        default=int(os.environ.get("OMEGA_SELF_BUILD_INTERVAL_SECONDS", "600")),
    )
    args = parser.parse_args()
    interval = max(60, args.interval)

    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    if args.once or not args.watch:
        report = run_cycle()
        print(json.dumps(report, indent=2))
        return 0 if report["decision"] == "PASS" else 1

    while True:
        try:
            report = run_cycle()
            print(json.dumps(report, separators=(",", ":")), flush=True)
        except Exception as exc:
            failure = {
                "schema": "omega.cloud.selfbuild.v1",
                "authority": "OMEGA_CLOUD",
                "completed_at": utc_now(),
                "decision": "QUARANTINE",
                "failures": ["supervisor_exception"],
                "detail": f"{type(exc).__name__}: {exc}",
            }
            atomic_json(STATUS_DIR / "status.json", failure)
            append_jsonl(STATUS_DIR / "journal.jsonl", failure)
            print(json.dumps(failure, separators=(",", ":")), flush=True)
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
