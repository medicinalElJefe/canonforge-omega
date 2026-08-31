from __future__ import annotations

import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.visual_quality import evaluate_visual_quality

POLICY_PATH = ROOT / "config" / "ai_engineering_policy.json"
OUT_DIR = ROOT / "release" / "ai-evolution"


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def choose_objective(policy: dict, backlog: dict) -> dict:
    rows = backlog.get("backlog") or []
    by_id = {str(row.get("id")): row for row in rows if isinstance(row, dict)}
    for objective_id in policy.get("preferred_objectives") or []:
        if objective_id in by_id:
            return by_id[objective_id]
    return rows[0] if rows else {
        "id": "EV-006",
        "name": "Mobile and cockpit visual acceptance",
        "status": "GAP",
        "next_action": "Improve the visual and responsive interface without changing canonical authority.",
        "acceptance": [],
    }


def extract_output_text(response: dict) -> str:
    for item in response.get("output") or []:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for part in item.get("content") or []:
            if isinstance(part, dict) and part.get("type") == "output_text":
                return str(part.get("text") or "")
    return ""


def call_openai(api_key: str, policy: dict, prompt: str) -> dict:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["summary", "rationale", "files", "tests"],
        "properties": {
            "summary": {"type": "string"},
            "rationale": {"type": "string"},
            "tests": {"type": "array", "items": {"type": "string"}},
            "files": {
                "type": "array",
                "minItems": 1,
                "maxItems": int(policy.get("max_files_per_candidate", 2)),
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["path", "content"],
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"},
                    },
                },
            },
        },
    }
    body = {
        "model": os.environ.get("OPENAI_MODEL") or policy.get("model") or "gpt-5.6-terra",
        "reasoning": {"effort": policy.get("reasoning_effort", "medium")},
        "instructions": (
            "You are the bounded OMEGA candidate engineering agent. Author source candidates only. "
            "Never claim tests, browser observations, device observations, deployment, or evidence you did not receive. "
            "Do not alter constitutional/protected paths. Preserve all working functions. Prefer one small, coherent, reversible improvement. "
            "For visual work, improve accessibility, responsive layout, information hierarchy and state-bound motion without decorative false authority. "
            "Return complete replacement file contents only for allowed paths."
        ),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "omega_candidate",
                "strict": True,
                "schema": schema,
            }
        },
        "max_output_tokens": 30000,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:4000]
        raise RuntimeError(f"OpenAI HTTP {exc.code}: {detail}") from exc
    text = extract_output_text(payload)
    if not text:
        raise RuntimeError("OpenAI response contained no output_text")
    return json.loads(text)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    policy = load_json(POLICY_PATH)
    if policy.get("schema") != "omega.ai.engineering.policy.v1":
        raise SystemExit("invalid AI engineering policy")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        status = {
            "schema": "omega.ai.author.status.v1",
            "status": "BLOCKED_CREDENTIALS",
            "detail": "OPENAI_API_KEY is not available to the workflow",
            "candidate_written": False,
        }
        write_json(OUT_DIR / "author-status.json", status)
        print(json.dumps(status, indent=2))
        return 0

    backlog_path = Path(os.environ.get("OMEGA_EVOLUTION_BACKLOG", ROOT / "release" / "evolution-runtime" / "evolution" / "backlog.json"))
    backlog = load_json(backlog_path)
    objective = choose_objective(policy, backlog)
    objective_id = str(objective.get("id") or "EV-006")
    context_paths = list((policy.get("allowed_context") or {}).get(objective_id) or (policy.get("allowed_context") or {}).get("EV-006") or [])
    allowed = {str(path) for path in policy.get("allowed_write_paths") or []}
    forbidden = [str(x) for x in policy.get("forbidden_substrings") or []]

    context: dict[str, str] = {}
    for rel in context_paths:
        if rel not in allowed:
            continue
        path = (ROOT / rel).resolve()
        if ROOT not in path.parents or not path.is_file():
            continue
        content = path.read_text(encoding="utf-8")
        if len(content) <= 50000:
            context[rel] = content

    visual_before = evaluate_visual_quality(ROOT)
    prompt = json.dumps({
        "objective": objective,
        "trusted_static_visual_quality_before": visual_before,
        "allowed_write_paths": sorted(allowed),
        "forbidden_paths_or_prefixes": forbidden,
        "current_files": context,
        "requirements": [
            "Make a measurable improvement while preserving existing behavior.",
            "Do not fabricate evidence or convert DERIVED/FORECAST data into OBSERVED data.",
            "Do not remove working controls, APIs, proof labels, canonical digest binding, or mobile support.",
            "Prefer improving currently failing trusted static visual checks when the objective is EV-006.",
            "Keep the candidate small enough to audit and roll back.",
        ],
    }, ensure_ascii=False)

    proposal = call_openai(api_key, policy, prompt)
    files = proposal.get("files") or []
    if not files:
        raise SystemExit("model returned no candidate files")
    if len(files) > int(policy.get("max_files_per_candidate", 2)):
        raise SystemExit("candidate exceeded max_files_per_candidate")

    total = 0
    changed: list[str] = []
    for row in files:
        rel = str(row.get("path") or "").strip().replace("\\", "/")
        content = row.get("content")
        if rel not in allowed or any(block in rel for block in forbidden):
            raise SystemExit(f"candidate attempted forbidden path: {rel}")
        if not isinstance(content, str):
            raise SystemExit(f"candidate content is not text: {rel}")
        total += len(content.encode("utf-8"))
        if total > int(policy.get("max_total_output_bytes", 90000)):
            raise SystemExit("candidate exceeded max_total_output_bytes")
        path = (ROOT / rel).resolve()
        if ROOT not in path.parents:
            raise SystemExit(f"candidate escaped repository root: {rel}")
        old = path.read_text(encoding="utf-8") if path.exists() else ""
        if old == content:
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        changed.append(rel)

    if not changed:
        status = {
            "schema": "omega.ai.author.status.v1",
            "status": "NO_CHANGE",
            "candidate_written": False,
            "objective": objective_id,
            "model": os.environ.get("OPENAI_MODEL") or policy.get("model"),
        }
        write_json(OUT_DIR / "author-status.json", status)
        write_json(OUT_DIR / "proposal.json", proposal)
        print(json.dumps(status, indent=2))
        return 0

    status = {
        "schema": "omega.ai.author.status.v1",
        "status": "CANDIDATE_WRITTEN",
        "candidate_written": True,
        "objective": objective_id,
        "model": os.environ.get("OPENAI_MODEL") or policy.get("model"),
        "changed_paths": changed,
        "visual_quality_before": visual_before,
        "boundary": policy.get("boundary"),
    }
    write_json(OUT_DIR / "proposal.json", proposal)
    write_json(OUT_DIR / "author-status.json", status)
    print(json.dumps(status, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
