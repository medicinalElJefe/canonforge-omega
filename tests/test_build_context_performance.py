from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_docker_context_excludes_recursive_generated_trees():
    patterns = {
        line.strip()
        for line in (ROOT / ".dockerignore").read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    }
    required = {
        ".git",
        "**/node_modules",
        "**/.pytest_cache",
        "**/__pycache__",
        "**/.venv",
        "**/.omega-venv",
        "**/runtime-data",
        "**/release",
        "**/*.log",
    }
    assert required <= patterns


def test_docker_context_keeps_runtime_source_available():
    ignored = (ROOT / ".dockerignore").read_text(encoding="utf-8")
    for runtime_path in ("omega_genesis", "config", "scripts", "web", "cloudflare"):
        assert runtime_path not in {line.strip() for line in ignored.splitlines()}
