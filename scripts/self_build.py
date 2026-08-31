from __future__ import annotations

import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Sequence

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.selfbuild import (
    BuildGate,
    assert_automatic_write,
    build_report,
    load_policy,
    sha256_file,
)


def run(command: Sequence[str], *, cwd: Path = ROOT) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(command), flush=True)
    return subprocess.run(
        list(command),
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def require(command: Sequence[str], *, cwd: Path = ROOT) -> str:
    result = run(command, cwd=cwd)
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.returncode:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(command)}")
    return result.stdout


def gate(name: str, fn) -> BuildGate:
    try:
        detail, digest = fn()
        return BuildGate(name=name, status="PASS", detail=detail, digest=digest)
    except Exception as exc:
        return BuildGate(name=name, status="FAIL", detail=f"{type(exc).__name__}: {exc}")


def release_path() -> Path:
    manifest = json.loads((ROOT / "omega.manifest.json").read_text(encoding="utf-8"))
    version = str(manifest["version"]).replace(".", "_")
    return ROOT / "release" / f"OMEGA_Genesis_v{version}_Full_Repository.zip"


def main() -> int:
    parser = argparse.ArgumentParser(description="Governed OMEGA deterministic self-builder")
    parser.add_argument("--repair-ledger", action="store_true",
                        help="allow regeneration of omega.manifest.json and SHA256SUMS.txt")
    parser.add_argument("--skip-worker", action="store_true")
    parser.add_argument("--skip-container", action="store_true")
    parser.add_argument("--report", default="release/self-build-report.json")
    args = parser.parse_args()

    policy = load_policy(ROOT)
    gates: list[BuildGate] = []
    before_manifest = (ROOT / "omega.manifest.json").read_bytes()
    before_sums = (ROOT / "SHA256SUMS.txt").read_bytes()

    def compile_gate():
        require([sys.executable, "-m", "compileall", "-q", "omega_genesis"])
        return ("Python package compiled", None)
    gates.append(gate("python_compile", compile_gate))

    def tests_gate():
        require([sys.executable, "-m", "pytest", "-q"])
        return ("pytest passed", None)
    gates.append(gate("python_tests", tests_gate))

    def manifest_rebuild_gate():
        assert_automatic_write("omega.manifest.json", policy)
        assert_automatic_write("SHA256SUMS.txt", policy)
        require([sys.executable, "scripts/build_manifest.py"])
        after_manifest = (ROOT / "omega.manifest.json").read_bytes()
        after_sums = (ROOT / "SHA256SUMS.txt").read_bytes()
        changed = before_manifest != after_manifest or before_sums != after_sums
        if changed and not args.repair_ledger:
            raise RuntimeError("canonical build ledger drift detected; rerun with --repair-ledger")
        status = "REPAIRED" if changed else "PASS"
        detail = "canonical build ledger regenerated" if changed else "canonical build ledger already reproducible"
        return (f"{status}: {detail}", sha256(after_manifest).hexdigest())
    rebuilt = gate("manifest_rebuild", manifest_rebuild_gate)
    if rebuilt.detail.startswith("REPAIRED:"):
        rebuilt = BuildGate(rebuilt.name, "REPAIRED", rebuilt.detail, rebuilt.digest)
    gates.append(rebuilt)

    def verify_gate():
        require([sys.executable, "scripts/verify_release.py"])
        return ("manifest and capability contract verified", sha256_file(ROOT / "omega.manifest.json"))
    gates.append(gate("manifest_verify", verify_gate))

    first_release_digest: str | None = None

    def release_build_gate():
        nonlocal first_release_digest
        require([sys.executable, "scripts/build_release.py"])
        out = release_path()
        if not out.is_file():
            raise RuntimeError("release builder did not produce expected archive")
        first_release_digest = sha256_file(out)
        return (f"deterministic release built: {out.name}", first_release_digest)
    gates.append(gate("release_build", release_build_gate))

    def reproducibility_gate():
        if first_release_digest is None:
            raise RuntimeError("first release build unavailable")
        require([sys.executable, "scripts/build_release.py"])
        second = sha256_file(release_path())
        if second != first_release_digest:
            raise RuntimeError(f"release digest changed: {first_release_digest} != {second}")
        return ("second release is byte-identical", second)
    gates.append(gate("release_reproducibility", reproducibility_gate))

    worker_dir = ROOT / "cloudflare" / "omega-genesis-worker"
    if args.skip_worker:
        gates.append(BuildGate("worker_check", "FAIL", "worker gate may not be skipped for promotion"))
    else:
        def worker_gate():
            npm = shutil.which("npm")
            if not npm:
                raise RuntimeError("npm not available")
            require([npm, "install", "--package-lock=false"], cwd=worker_dir)
            require([npm, "run", "check"], cwd=worker_dir)
            return ("Cloudflare edge Worker syntax verified", None)
        gates.append(gate("worker_check", worker_gate))

    if args.skip_container:
        gates.append(BuildGate("cloud_container_build", "FAIL", "container gate may not be skipped for promotion"))
    else:
        def container_gate():
            docker = shutil.which("docker")
            if not docker:
                raise RuntimeError("docker not available")
            tag = f"omega-cloud:selfbuild-{os.environ.get('GITHUB_SHA', 'local')[:12]}"
            require([
                docker, "build",
                "--file", "cloud/omega-cloud/Dockerfile",
                "--tag", tag,
                ".",
            ])
            return (f"canonical cloud image built: {tag}", None)
        gates.append(gate("cloud_container_build", container_gate))

    manifest_sha = sha256_file(ROOT / "omega.manifest.json")
    report = build_report(
        source_sha=os.environ.get("GITHUB_SHA", "local"),
        manifest_sha256=manifest_sha,
        release_sha256=first_release_digest,
        gates=gates,
        policy=policy,
    )
    report_path = ROOT / args.report
    assert_automatic_write(report_path.relative_to(ROOT).as_posix(), policy)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write("## OMEGA Self-Build\n\n")
            fh.write(f"- Decision: **{report['decision']}**\n")
            fh.write(f"- Source: {report['source_sha']}\n")
            fh.write(f"- Manifest: {report['manifest_sha256']}\n")
            fh.write(f"- Release: {report['release_sha256']}\n")
            for item in report["gates"]:
                fh.write(f"- {item['name']}: **{item['status']}** — {item['detail']}\n")

    return 0 if report["decision"] == "PROMOTE" else 1


if __name__ == "__main__":
    raise SystemExit(main())
