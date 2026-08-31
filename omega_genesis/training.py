from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from math import log
from pathlib import Path
import re
import shutil
from typing import Any, Iterable

MAX_FILES = 25_000
MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024
MAX_GENERATED_BYTES = 512 * 1024 * 1024
MAX_CHANGED_FILES = 80
MAX_FILE_BYTES = 4 * 1024 * 1024
MAX_PROOF_LESSONS = 100
CHUNK_CHARS = 2400
CHUNK_OVERLAP = 320
KEEP_RELEASES = 5
ALLOWED_SUFFIXES = {".txt", ".md", ".csv", ".json", ".jsonl", ".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".ps1", ".bat", ".cmd", ".toml", ".yaml", ".yml", ".xml"}
EXCLUDE_PARTS = {".git", "node_modules", "dist", "build", ".venv", ".omega-venv", "__pycache__", ".pytest_cache", "release", ".omega/sai-training"}
SENSITIVE = re.compile(r"(^|[._-])(password|passwd|secret|token|credential|apikey|api_key|private[-_]?key|ssh|cookie|session)([._-]|$)", re.I)
TOKEN_RE = re.compile(r"[A-Za-z0-9_\-]{3,}")


@dataclass(frozen=True, slots=True)
class SourceFile:
    path: str
    sha256: str
    bytes: int


def _hash_bytes(raw: bytes) -> str:
    return sha256(raw).hexdigest()


def _safe_sources(root: Path, relative: str = ".") -> tuple[list[tuple[SourceFile, str]], dict[str, Any]]:
    root = Path(root).resolve()
    base = (root / relative).resolve()
    if root != base and root not in base.parents:
        raise ValueError("training path escapes approved root")
    if not base.exists():
        raise FileNotFoundError(str(base))
    candidates = [base] if base.is_file() else sorted(p for p in base.rglob("*") if p.is_file())
    seen: set[str] = set()
    out: list[tuple[SourceFile, str]] = []
    total = 0
    skipped = Counter()
    for p in candidates:
        rel = p.relative_to(root).as_posix()
        parts = set(p.relative_to(root).parts)
        if any(x in parts for x in EXCLUDE_PARTS) or ".omega/sai-training" in rel:
            skipped["generated_or_excluded"] += 1
            continue
        if p.suffix.lower() not in ALLOWED_SUFFIXES:
            skipped["unsupported_suffix"] += 1
            continue
        if SENSITIVE.search(p.name) or any(SENSITIVE.search(x) for x in p.parts):
            skipped["sensitive_name"] += 1
            continue
        size = p.stat().st_size
        if size > MAX_FILE_BYTES:
            skipped["file_too_large"] += 1
            continue
        if len(out) >= MAX_FILES or total + size > MAX_SOURCE_BYTES:
            skipped["workspace_limit"] += 1
            continue
        raw = p.read_bytes()
        digest = _hash_bytes(raw)
        if digest in seen:
            skipped["duplicate_sha256"] += 1
            continue
        seen.add(digest)
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("utf-8", errors="ignore")
        if not text.strip():
            skipped["empty_or_unreadable"] += 1
            continue
        total += size
        out.append((SourceFile(rel, digest, size), text))
    return out, {"files": len(out), "bytes": total, "skipped": dict(skipped)}


def _chunks(sources: Iterable[tuple[SourceFile, str]]) -> list[dict[str, Any]]:
    out = []
    step = max(1, CHUNK_CHARS - CHUNK_OVERLAP)
    for src, text in sources:
        for start in range(0, len(text), step):
            chunk = text[start:start + CHUNK_CHARS]
            if not chunk.strip():
                continue
            cid = sha256(f"{src.sha256}:{start}:{len(chunk)}".encode("utf-8")).hexdigest()
            out.append({"id": cid, "path": src.path, "source_sha256": src.sha256, "offset": start, "text": chunk})
            if start + CHUNK_CHARS >= len(text):
                break
    return out


def _terms(text: str) -> list[str]:
    return [m.group(0).lower() for m in TOKEN_RE.finditer(text)]


def _model(chunks: list[dict[str, Any]], lessons: list[dict[str, Any]], parent_fingerprint: str | None) -> dict[str, Any]:
    docs: list[tuple[str, str, str]] = [(c["id"], c["path"], c["text"]) for c in chunks]
    for i, lesson in enumerate(lessons[:MAX_PROOF_LESSONS]):
        raw = json.dumps(lesson, sort_keys=True, ensure_ascii=False)
        lid = sha256(f"proof:{i}:{raw}".encode("utf-8")).hexdigest()
        docs.append((lid, "PROOF_LEDGER", raw))
    df: Counter[str] = Counter()
    tf: dict[str, Counter[str]] = {}
    meta: dict[str, str] = {}
    for doc_id, path, text in docs:
        counts = Counter(_terms(text))
        if not counts:
            continue
        tf[doc_id] = counts
        meta[doc_id] = path
        df.update(counts.keys())
    n = max(1, len(tf))
    vocabulary = {term: log((1 + n) / (1 + freq)) + 1.0 for term, freq in df.items()}
    # keep top 12k terms
    keep_terms = set(sorted(vocabulary, key=lambda t: (-df[t], t))[:12_000])
    vocabulary = {t: vocabulary[t] for t in sorted(keep_terms)}
    postings: dict[str, list[list[Any]]] = defaultdict(list)
    for doc_id in sorted(tf):
        counts = tf[doc_id]
        total = sum(counts.values()) or 1
        for term, count in counts.items():
            if term in keep_terms:
                postings[term].append([doc_id, (count / total) * vocabulary[term]])
    model = {
        "schema": "OMEGA_SAI_RETRIEVAL_MODEL_V1",
        "parent_fingerprint": parent_fingerprint,
        "documents": len(tf),
        "vocabulary": vocabulary,
        "postings": dict(postings),
        "document_paths": meta,
        "foundationWeightsChanged": False,
        "learning_scope": "source-bound sparse retrieval weights + approved proof priors",
    }
    model["fingerprint"] = sha256(json.dumps(model, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()
    return model


def _active(training_root: Path) -> dict[str, Any] | None:
    active = training_root / "active.json"
    if not active.is_file():
        return None
    try:
        return json.loads(active.read_text(encoding="utf-8"))
    except Exception:
        return None


def _rotate(releases: Path) -> None:
    if not releases.is_dir():
        return
    dirs = sorted([p for p in releases.iterdir() if p.is_dir()], key=lambda p: p.name, reverse=True)
    for old in dirs[KEEP_RELEASES:]:
        shutil.rmtree(old, ignore_errors=True)


def train_local(root: Path, relative: str = ".", *, proof_lessons: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    root = Path(root).resolve()
    training_root = root / ".omega" / "sai-training"
    releases = training_root / "releases"
    releases.mkdir(parents=True, exist_ok=True)
    previous = _active(training_root)
    parent = previous.get("model_fingerprint") if previous else None
    sources, scan = _safe_sources(root, relative)
    if not sources:
        return {"status": "HOLD", "reason": "NO_ADMISSIBLE_SOURCE", "scan": scan, "sourceUploaded": False, "foundationWeightsChanged": False}
    chunks = _chunks(sources)
    source_index = [asdict(s) for s, _ in sources]
    corpus_fingerprint = sha256(json.dumps(source_index, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    lessons = list(proof_lessons or [])[:MAX_PROOF_LESSONS]
    model = _model(chunks, lessons, parent)
    release_id = model["fingerprint"][:16]
    release_dir = releases / release_id
    if release_dir.exists():
        shutil.rmtree(release_dir)
    release_dir.mkdir(parents=True)
    corpus = {"schema": "OMEGA_SAI_CORPUS_V1", "root": relative, "fingerprint": corpus_fingerprint, "sources": source_index, "chunks": [{k: c[k] for k in ("id", "path", "source_sha256", "offset")} for c in chunks]}
    receipt = {
        "schema": "OMEGA_SAI_LOCAL_TRAINING_RECEIPT_V1",
        "status": "PASS",
        "parent_model_fingerprint": parent,
        "corpus_fingerprint": corpus_fingerprint,
        "model_fingerprint": model["fingerprint"],
        "source_files": scan["files"],
        "source_bytes": scan["bytes"],
        "chunks": len(chunks),
        "proof_lessons": len(lessons),
        "sourceUploaded": False,
        "hostStateMutation": False,
        "foundationWeightsChanged": False,
        "quarantine_excluded": True,
        "duplicate_exclusion": True,
        "promotion": "ATOMIC_LOCAL_POINTER",
        "truth_boundary": "This changes local retrieval weights and approved proof priors only. It is not foundation-model weight training.",
    }
    receipt["fingerprint"] = sha256(json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    (release_dir / "corpus.json").write_text(json.dumps(corpus, indent=2), encoding="utf-8")
    (release_dir / "model.json").write_text(json.dumps(model, indent=2), encoding="utf-8")
    (release_dir / "receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    generated = sum(p.stat().st_size for p in release_dir.rglob("*") if p.is_file())
    if generated > MAX_GENERATED_BYTES:
        shutil.rmtree(release_dir, ignore_errors=True)
        return {"status": "HOLD", "reason": "GENERATED_ARTIFACT_LIMIT", "generated_bytes": generated, "sourceUploaded": False, "foundationWeightsChanged": False}
    active = {"schema": "OMEGA_SAI_ACTIVE_V1", "release_id": release_id, "model_fingerprint": model["fingerprint"], "corpus_fingerprint": corpus_fingerprint, "receipt_fingerprint": receipt["fingerprint"]}
    tmp = training_root / "active.json.tmp"
    tmp.write_text(json.dumps(active, indent=2), encoding="utf-8")
    tmp.replace(training_root / "active.json")
    _rotate(releases)
    return {**receipt, "release_id": release_id, "release_path": str(release_dir.relative_to(root)), "scan": scan}


def retrieve(root: Path, query: str, *, limit: int = 8) -> dict[str, Any]:
    training_root = Path(root).resolve() / ".omega" / "sai-training"
    active = _active(training_root)
    if not active:
        return {"status": "HOLD", "reason": "NO_ACTIVE_MODEL", "results": []}
    model_path = training_root / "releases" / active["release_id"] / "model.json"
    corpus_path = training_root / "releases" / active["release_id"] / "corpus.json"
    model = json.loads(model_path.read_text(encoding="utf-8"))
    corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
    qterms = Counter(_terms(query))
    scores: Counter[str] = Counter()
    for term, qcount in qterms.items():
        for doc_id, weight in model.get("postings", {}).get(term, []):
            scores[doc_id] += float(weight) * qcount
    chunk_meta = {x["id"]: x for x in corpus.get("chunks", [])}
    results = []
    for doc_id, score in scores.most_common(max(1, min(limit, 50))):
        meta = chunk_meta.get(doc_id, {"id": doc_id, "path": model.get("document_paths", {}).get(doc_id, "PROOF_LEDGER")})
        results.append({**meta, "score": score})
    return {"status": "PASS", "model_fingerprint": active["model_fingerprint"], "query": query, "results": results}
