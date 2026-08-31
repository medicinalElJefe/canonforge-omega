from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
import urllib.request
from typing import Any

from .deployment import atomic_json
from .evolution import load_policy

ROOT = Path(__file__).resolve().parents[1]
API_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = "gpt-5.6-terra"
DEFAULT_ALLOWED_PREFIXES = ("web/", "tests/", "omega_genesis/", "scripts/")
HARD_BLOCKED_PREFIXES = (".github/", "config/", "release/", "cloudflare/")
MAX_PATCH_BYTES = 60_000
MAX_FILES = 4
MAX_CONTEXT_CHARS = 90_000


def extract_output_text(payload: dict[str, Any]) -> str:
    direct = payload.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct.strip()
    chunks: list[str] = []
    for item in payload.get("output") or []:
        if not isinstance(item, dict):
            continue
        for part in item.get("content") or []:
            if isinstance(part, dict) and part.get("type") == "output_text" and isinstance(part.get("text"), str):
                chunks.append(part["text"])
    return "\n".join(chunks).strip()


def normalize_patch(text: str) -> str:
    value = text.strip()
    fenced = re.fullmatch(r"```(?:diff|patch)?\s*\n(.*)\n```", value, flags=re.S | re.I)
    if fenced:
        value = fenced.group(1).strip()
    return value + ("\n" if value and not value.endswith("\n") else "")


def patch_paths(patch: str) -> list[str]:
    paths: list[str] = []
    for line in patch.splitlines():
        if line.startswith("+++ "):
            raw = line[4:].split("\t", 1)[0].strip()
            if raw == "/dev/null":
                continue
            if raw.startswith("b/"):
                raw = raw[2:]
            paths.append(raw)
    return sorted(set(paths))


def validate_patch(patch: str, protected_paths: list[str]) -> list[str]:
    errors: list[str] = []
    encoded = patch.encode("utf-8")
    if not patch.strip() or "diff --git " not in patch:
        errors.append("not_unified_git_diff")
    if len(encoded) > MAX_PATCH_BYTES:
        errors.append("patch_too_large")
    if "GIT binary patch" in patch or "Binary files " in patch:
        errors.append("binary_patch_forbidden")
    paths = patch_paths(patch)
    if not paths:
        errors.append("no_changed_paths")
    if len(paths) > MAX_FILES:
        errors.append("too_many_files")
    protected = {p.replace("\\", "/") for p in protected_paths}
    for path in paths:
        clean = path.replace("\\", "/")
        parts = Path(clean).parts
        if clean.startswith("/") or ".." in parts:
            errors.append(f"unsafe_path:{clean}")
            continue
        if clean in protected:
            errors.append(f"protected_path:{clean}")
        if clean.startswith(HARD_BLOCKED_PREFIXES):
            errors.append(f"hard_blocked_path:{clean}")
        if not clean.startswith(DEFAULT_ALLOWED_PREFIXES):
            errors.append(f"outside_candidate_surface:{clean}")
    return sorted(set(errors))


def _read_limited(path: Path, limit: int = 18_000) -> str:
    try:
        data = path.read_text(encoding="utf-8")
    except Exception:
        return ""
    return data[:limit]


def build_context(snapshot: dict[str, Any]) -> str:
    policy = load_policy(ROOT)
    selected: list[str] = ["web/index.html", "web/styles.css", "web/app.js"]
    for row in (snapshot.get("backlog") or [])[:3]:
        for check in row.get("checks") or []:
            if check.get("type") == "file" and isinstance(check.get("path"), str):
                selected.append(check["path"])
    protected = set(policy.protected_paths)
    pieces: list[str] = []
    seen: set[str] = set()
    used = 0
    for rel in selected:
        rel = rel.replace("\\", "/")
        if rel in seen or rel in protected or rel.startswith(HARD_BLOCKED_PREFIXES):
            continue
        seen.add(rel)
        path = (ROOT / rel).resolve()
        if ROOT not in path.parents or not path.is_file():
            continue
        body = _read_limited(path)
        block = f"\n--- FILE {rel} ---\n{body}\n"
        if used + len(block) > MAX_CONTEXT_CHARS:
            break
        pieces.append(block)
        used += len(block)
    return "".join(pieces)


def build_prompt(snapshot: dict[str, Any], context: str) -> str:
    policy = load_policy(ROOT)
    backlog = (snapshot.get("backlog") or [])[:5]
    return f"""You are the bounded OMEGA autonomous engineering candidate author.

Goal: make ONE small, high-value, reversible source improvement that measurably advances the current OMEGA Genesis backlog without regressing verified behavior. Prefer the highest-priority actionable gap. Visual/mobile quality is a priority when it is represented in the backlog.

Hard rules:
- Return ONLY a unified git diff beginning with 'diff --git'. No markdown and no prose.
- Change at most {MAX_FILES} files and keep the patch under {MAX_PATCH_BYTES} bytes.
- Allowed surfaces: {', '.join(DEFAULT_ALLOWED_PREFIXES)}.
- Never modify .github/, config/, release/, cloudflare/, or any protected judge path.
- Never weaken tests, proof, state/history contracts, evidence classes, security boundaries, deterministic release behavior, or cloud-first authority.
- Never invent deployment/device/GPU/sensor/credential/remote-desktop evidence.
- Prefer adding or strengthening tests when application logic changes.
- Do not add dependencies unless essential.
- Do not directly mutate canonical state contracts.

Protected paths:
{json.dumps(policy.protected_paths, indent=2)}

Current governed evolution snapshot:
{json.dumps({'quality_vector': snapshot.get('quality_vector'), 'backlog': backlog, 'boundary': snapshot.get('boundary')}, indent=2)}

Relevant source context:
{context}
"""


def call_openai(api_key: str, model: str, prompt: str) -> dict[str, Any]:
    body = json.dumps({
        "model": model,
        "input": prompt,
        "max_output_tokens": 12000,
        "store": False,
    }).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate one governed OMEGA AI evolution candidate patch")
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--out-patch", required=True)
    parser.add_argument("--out-meta", required=True)
    parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", DEFAULT_MODEL))
    args = parser.parse_args()

    snapshot = json.loads(Path(args.snapshot).read_text(encoding="utf-8"))
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    meta_path = Path(args.out_meta)
    patch_path = Path(args.out_patch)
    if not key:
        atomic_json(meta_path, {"status": "BLOCKED_CREDENTIALS", "model": args.model, "boundary": "OPENAI_API_KEY absent; no candidate was synthesized"})
        return 2

    context = build_context(snapshot)
    prompt = build_prompt(snapshot, context)
    try:
        response = call_openai(key, args.model, prompt)
        text = extract_output_text(response)
        patch = normalize_patch(text)
        policy = load_policy(ROOT)
        errors = validate_patch(patch, policy.protected_paths)
        if errors:
            atomic_json(meta_path, {"status": "QUARANTINE", "model": args.model, "errors": errors, "response_id": response.get("id")})
            return 1
        patch_path.parent.mkdir(parents=True, exist_ok=True)
        patch_path.write_text(patch, encoding="utf-8")
        atomic_json(meta_path, {
            "status": "CANDIDATE_READY",
            "model": args.model,
            "response_id": response.get("id"),
            "changed_paths": patch_paths(patch),
            "patch_bytes": len(patch.encode("utf-8")),
            "boundary": "model authored an untrusted candidate only; trusted baseline gates decide promotion",
        })
        return 0
    except Exception as exc:
        atomic_json(meta_path, {"status": "QUARANTINE", "model": args.model, "error": f"{type(exc).__name__}: {exc}"})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
