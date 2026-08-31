from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BRANCH = "omega-genesis-v1-full"
STATUS_DIR = ROOT / "release" / "sovereign-host"
STATUS_PATH = STATUS_DIR / "status.json"
LOCK_PATH = STATUS_DIR / "host.lock"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_status(payload: dict) -> None:
    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"observed_at": now_iso(), **payload}
    tmp = STATUS_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(STATUS_PATH)
    print(json.dumps(payload, indent=2, sort_keys=True))


def run(cmd: list[str], cwd: Path, *, check: bool = True, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd, env=merged, text=True, check=check)


def capture(cmd: list[str], cwd: Path) -> str:
    return subprocess.check_output(cmd, cwd=cwd, text=True).strip()


def acquire_lock(force: bool = False) -> None:
    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    if force and LOCK_PATH.exists():
        LOCK_PATH.unlink()
    try:
        fd = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as exc:
        raise RuntimeError(f"sovereign evolution already locked: {LOCK_PATH}") from exc
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        handle.write(f"pid={os.getpid()}\nstarted={now_iso()}\n")


def release_lock() -> None:
    try:
        LOCK_PATH.unlink()
    except FileNotFoundError:
        pass


def verify_tree(work: Path, data_dir: str) -> None:
    run([sys.executable, "-m", "pip", "install", "-e", "."], work)
    run([sys.executable, "-m", "pytest", "-q"], work)
    run([sys.executable, "scripts/build_manifest.py"], work)
    run([sys.executable, "scripts/verify_release.py"], work)
    run([sys.executable, "scripts/evolution_cycle.py", "--once", "--data-dir", data_dir], work)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run one sovereign local OMEGA autonomous evolution cycle")
    parser.add_argument("--once", action="store_true", help="Run one cycle and exit")
    parser.add_argument("--branch", default=DEFAULT_BRANCH)
    parser.add_argument("--local-model-url", default=os.environ.get("OMEGA_LOCAL_MODEL_URL", "http://127.0.0.1:11434"))
    parser.add_argument("--model", default=os.environ.get("OMEGA_LOCAL_MODEL", ""))
    parser.add_argument("--force-unlock", action="store_true")
    args = parser.parse_args()

    acquire_lock(args.force_unlock)
    worktree: Path | None = None
    try:
        if not shutil.which("git"):
            write_status({"status": "BLOCKED_LOCAL_TOOLING", "reason": "git_not_found"})
            return 2

        origin = capture(["git", "remote", "get-url", "origin"], ROOT)
        run(["git", "fetch", "origin", args.branch], ROOT)
        baseline_sha = capture(["git", "rev-parse", f"origin/{args.branch}"], ROOT)

        temp_root = Path(tempfile.mkdtemp(prefix="omega-sovereign-evolution-"))
        worktree = temp_root / "candidate"
        run(["git", "worktree", "add", "--detach", str(worktree), baseline_sha], ROOT)

        verify_tree(worktree, "release/sovereign-baseline")

        author_env = {
            "OMEGA_AI_PROVIDER": "local",
            "OMEGA_LOCAL_MODEL_URL": args.local_model_url,
            "OMEGA_LOCAL_MODEL": args.model,
        }
        author = run(
            [
                sys.executable,
                "-m",
                "omega_genesis.ai_engineer",
                "--snapshot",
                "release/sovereign-baseline/evolution/status.json",
                "--out-patch",
                "release/sovereign-candidate/candidate.patch",
                "--out-meta",
                "release/sovereign-candidate/author.json",
            ],
            worktree,
            check=False,
            env=author_env,
        )
        author_meta = json.loads((worktree / "release/sovereign-candidate/author.json").read_text(encoding="utf-8"))
        if author.returncode != 0:
            write_status({
                "status": author_meta.get("status", "LOCAL_MODEL_UNAVAILABLE"),
                "branch": args.branch,
                "baseline_sha": baseline_sha,
                "provider": author_meta.get("provider", "local-ollama"),
                "model": author_meta.get("model", args.model or "auto-discover"),
                "boundary": "no external paid AI fallback; repository audit remains authoritative",
            })
            return 0

        patch = worktree / "release/sovereign-candidate/candidate.patch"
        run(["git", "apply", "--check", str(patch)], worktree)
        run(["git", "apply", str(patch)], worktree)
        changed = capture(["git", "diff", "--name-only"], worktree).splitlines()
        changed_path = worktree / "release/sovereign-candidate/changed-paths.txt"
        changed_path.write_text("\n".join(changed) + "\n", encoding="utf-8")

        verify_tree(worktree, "release/sovereign-candidate-state")
        decision_path = worktree / "release/sovereign-candidate/decision.json"
        judge = run(
            [
                sys.executable,
                "scripts/evolution_compare.py",
                "--baseline",
                "release/sovereign-baseline/evolution/status.json",
                "--candidate",
                "release/sovereign-candidate-state/evolution/status.json",
                "--changed-paths",
                str(changed_path.relative_to(worktree)),
                "--policy-root",
                ".",
                "--out",
                str(decision_path.relative_to(worktree)),
            ],
            worktree,
            check=False,
        )
        decision = json.loads(decision_path.read_text(encoding="utf-8"))
        if judge.returncode != 0:
            write_status({
                "status": "CANDIDATE_REJECTED",
                "branch": args.branch,
                "baseline_sha": baseline_sha,
                "changed_paths": changed,
                "decision": decision,
            })
            return 0

        promotion_patch = worktree.parent / "promotion.patch"
        with promotion_patch.open("w", encoding="utf-8") as handle:
            subprocess.run(
                ["git", "diff", "--binary", "--", ".", ":!release/"],
                cwd=worktree,
                text=True,
                stdout=handle,
                check=True,
            )
        if not promotion_patch.exists() or promotion_patch.stat().st_size == 0:
            write_status({"status": "CANDIDATE_REJECTED", "reason": "empty_promotion_patch", "baseline_sha": baseline_sha})
            return 0

        run(["git", "fetch", "origin", args.branch], worktree)
        fresh_sha = capture(["git", "rev-parse", "FETCH_HEAD"], worktree)
        if fresh_sha != baseline_sha:
            write_status({
                "status": "SUPERSEDED",
                "branch": args.branch,
                "baseline_sha": baseline_sha,
                "current_sha": fresh_sha,
                "boundary": "newer Genesis source won; stale autonomous candidate was not promoted",
            })
            return 0

        run(["git", "reset", "--hard", baseline_sha], worktree)
        run(["git", "clean", "-fdx"], worktree)
        run(["git", "apply", "--check", str(promotion_patch)], worktree)
        run(["git", "apply", str(promotion_patch)], worktree)
        run([sys.executable, "-m", "pytest", "-q"], worktree)
        run([sys.executable, "scripts/build_manifest.py"], worktree)
        run([sys.executable, "scripts/verify_release.py"], worktree)

        run(["git", "config", "user.name", "OMEGA Sovereign AI Engineer"], worktree)
        run(["git", "config", "user.email", "omega-sovereign-ai@users.noreply.github.com"], worktree)
        run(["git", "add", "-A"], worktree)
        run(["git", "commit", "-m", "OMEGA sovereign evolution: governed local improvement"], worktree)
        promoted_sha = capture(["git", "rev-parse", "HEAD"], worktree)
        push = run(["git", "push", origin, f"HEAD:{args.branch}"], worktree, check=False)
        if push.returncode != 0:
            write_status({
                "status": "PROMOTION_PUSH_BLOCKED",
                "branch": args.branch,
                "baseline_sha": baseline_sha,
                "candidate_sha": promoted_sha,
                "changed_paths": changed,
                "boundary": "candidate passed local proof but was not claimed promoted because git push failed",
            })
            return 1

        write_status({
            "status": "PROMOTED",
            "branch": args.branch,
            "baseline_sha": baseline_sha,
            "promoted_sha": promoted_sha,
            "changed_paths": changed,
            "provider": author_meta.get("provider", "local-ollama"),
            "model": author_meta.get("model", args.model or "auto-discover"),
            "boundary": "local model authored only; trusted proof gate admitted the source change before push",
        })
        return 0
    except subprocess.CalledProcessError as exc:
        write_status({"status": "QUARANTINE", "reason": "subprocess_failed", "command": exc.cmd, "returncode": exc.returncode})
        return 1
    except Exception as exc:
        write_status({"status": "QUARANTINE", "reason": f"{type(exc).__name__}: {exc}"})
        return 1
    finally:
        if worktree is not None:
            try:
                run(["git", "worktree", "remove", "--force", str(worktree)], ROOT, check=False)
            except Exception:
                pass
            try:
                shutil.rmtree(worktree.parent, ignore_errors=True)
            except Exception:
                pass
        release_lock()


if __name__ == "__main__":
    raise SystemExit(main())
