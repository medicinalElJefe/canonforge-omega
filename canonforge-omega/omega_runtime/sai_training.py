from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

CORPUS_SCHEMA = "OMEGA_SAI_CORPUS_MANIFEST_R179"
TRAINING_SCHEMA = "OMEGA_SAI_TRAINING_RECEIPT_R179"
EVALUATION_SCHEMA = "OMEGA_SAI_EVALUATION_RECEIPT_R179"
MODEL_SCHEMA = "OMEGA_SAI_LOCAL_RETRIEVAL_MODEL_R179"
REVISION = "R179"

TEXT_EXTENSIONS = {".txt", ".md", ".json", ".jsonl", ".csv", ".ts", ".tsx", ".js", ".jsx", ".py", ".ps1", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".html", ".css"}
EXCLUDED_PARTS = {".git", "node_modules", "dist", "build", "out", "coverage", ".venv", "__pycache__", ".omega"}
DEFAULT_CHUNK_CHARS = 3200
DEFAULT_OVERLAP = 320


def canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def iter_sources(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        rel = path.relative_to(root)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        yield path


def chunks(text: str, chunk_chars: int = DEFAULT_CHUNK_CHARS, overlap: int = DEFAULT_OVERLAP):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text:
        return
    step = max(1, chunk_chars - max(0, min(overlap, chunk_chars - 1)))
    for offset in range(0, len(text), step):
        body = text[offset : offset + chunk_chars]
        if body:
            yield offset, body
        if offset + chunk_chars >= len(text):
            break


def compile_corpus(root: Path, output_dir: Path) -> dict:
    root = root.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    corpus_path = output_dir / "corpus.jsonl"
    source_rows = []
    chunk_rows = []
    byte_total = 0
    for path in iter_sources(root):
        relative = path.relative_to(root).as_posix()
        raw = path.read_bytes()
        byte_total += len(raw)
        source_sha = hashlib.sha256(raw).hexdigest()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("utf-8", errors="replace")
        source_chunk_count = 0
        for offset, body in chunks(text):
            chunk_id = sha256_text(f"{source_sha}:{offset}:{body}")
            row = {
                "schema": "OMEGA_SAI_SOURCE_CHUNK_R179",
                "id": chunk_id,
                "sourcePath": relative,
                "sourceSha256": source_sha,
                "offset": offset,
                "text": body,
            }
            chunk_rows.append(row)
            source_chunk_count += 1
        source_rows.append({"path": relative, "sha256": source_sha, "bytes": len(raw), "chunks": source_chunk_count})
    with corpus_path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in chunk_rows:
            handle.write(canonical_json(row) + "\n")
    manifest_core = {
        "schema": CORPUS_SCHEMA,
        "revision": REVISION,
        "root": str(root),
        "sources": source_rows,
        "sourceCount": len(source_rows),
        "chunkCount": len(chunk_rows),
        "sourceBytes": byte_total,
        "corpusSha256": sha256_file(corpus_path),
        "trainingMeaning": "Corpus compilation and retrieval indexing are not neural weight training.",
        "canonicalMutation": False,
    }
    manifest = {**manifest_core, "manifestSha256": sha256_text(canonical_json(manifest_core))}
    (output_dir / "corpus-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return manifest


def tokenize(text: str) -> list[str]:
    out = []
    token = []
    for ch in text.lower():
        if ch.isalnum() or ch in {"_", "-"}:
            token.append(ch)
        elif token:
            value = "".join(token)
            if len(value) > 1:
                out.append(value)
            token = []
    if token:
        value = "".join(token)
        if len(value) > 1:
            out.append(value)
    return out


def build_retrieval_model(output_dir: Path, manifest: dict) -> dict:
    corpus_path = output_dir / "corpus.jsonl"
    inverted: dict[str, list[str]] = {}
    chunk_count = 0
    with corpus_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            row = json.loads(line)
            chunk_count += 1
            chunk_id = row["id"]
            for token in sorted(set(tokenize(row.get("text", "")))):
                postings = inverted.setdefault(token, [])
                if len(postings) < 64:
                    postings.append(chunk_id)
    model_core = {
        "schema": MODEL_SCHEMA,
        "revision": REVISION,
        "kind": "PROOF_GROUNDED_LOCAL_RETRIEVAL_INDEX",
        "corpusSha256": manifest["corpusSha256"],
        "manifestSha256": manifest["manifestSha256"],
        "chunkCount": chunk_count,
        "vocabularySize": len(inverted),
        "invertedIndex": inverted,
        "neuralWeightsTrained": False,
        "modelAdmission": "RETRIEVAL_READY_NEURAL_TRAINING_UNPROVEN",
        "canonicalMutation": False,
    }
    model = {**model_core, "modelSha256": sha256_text(canonical_json(model_core))}
    model_path = output_dir / "sai-local-model.json"
    model_path.write_text(json.dumps(model, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return model


def evaluate(output_dir: Path, manifest: dict, model: dict) -> dict:
    checks = {
        "corpus_nonempty": manifest["sourceCount"] > 0 and manifest["chunkCount"] > 0,
        "corpus_hash_valid": sha256_file(output_dir / "corpus.jsonl") == manifest["corpusSha256"],
        "model_corpus_bound": model["corpusSha256"] == manifest["corpusSha256"],
        "model_manifest_bound": model["manifestSha256"] == manifest["manifestSha256"],
        "retrieval_vocabulary_nonempty": model["vocabularySize"] > 0,
        "truthful_training_boundary": model["neuralWeightsTrained"] is False,
    }
    passed = all(checks.values())
    evaluation_core = {
        "schema": EVALUATION_SCHEMA,
        "revision": REVISION,
        "checks": checks,
        "passed": passed,
        "admission": "RETRIEVAL_ADMITTED" if passed else "REJECTED",
        "neuralModelAdmission": "NOT_EVALUATED",
        "canonicalMutation": False,
    }
    return {**evaluation_core, "evaluationSha256": sha256_text(canonical_json(evaluation_core))}


def train(root: Path, output_dir: Path) -> dict:
    manifest = compile_corpus(root, output_dir)
    model = build_retrieval_model(output_dir, manifest)
    evaluation = evaluate(output_dir, manifest, model)
    receipt_core = {
        "schema": TRAINING_SCHEMA,
        "revision": REVISION,
        "state": "RETRIEVAL_READY_NEURAL_TRAINING_REQUIRED" if evaluation["passed"] else "FAILED",
        "corpus": manifest,
        "model": {k: v for k, v in model.items() if k != "invertedIndex"},
        "evaluation": evaluation,
        "artifacts": {
            "corpus": str(output_dir / "corpus.jsonl"),
            "manifest": str(output_dir / "corpus-manifest.json"),
            "retrievalModel": str(output_dir / "sai-local-model.json"),
        },
        "neuralWeightsTrained": False,
        "fullyTrainedClaim": False,
        "canonicalMutation": False,
        "truthBoundary": "R179 proves local corpus compilation and a deterministic proof-grounded retrieval index. It does not claim neural fine-tuning until a separately identified trainer returns evaluated weight/model receipts.",
    }
    receipt = {**receipt_core, "receiptSha256": sha256_text(canonical_json(receipt_core))}
    (output_dir / "training-receipt.json").write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return receipt


def status(output_dir: Path) -> dict:
    path = output_dir / "training-receipt.json"
    if not path.exists():
        return {"schema": TRAINING_SCHEMA, "revision": REVISION, "state": "NOT_TRAINED", "fullyTrainedClaim": False}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"schema": TRAINING_SCHEMA, "revision": REVISION, "state": "RECEIPT_INVALID", "fullyTrainedClaim": False}
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA R179 proof-governed SAI corpus and retrieval training runtime")
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", default=".omega/sai-training/release")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    result = status(output) if args.status else train(Path(args.root), output)
    print(json.dumps(result, sort_keys=True, ensure_ascii=False))
    return 0 if result.get("state") not in {"FAILED", "RECEIPT_INVALID"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
