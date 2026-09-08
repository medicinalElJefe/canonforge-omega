from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOWS = REPO / ".github" / "workflows"
RELEASE = WORKFLOWS / "omega-v6-release-forward-production.yml"
ENTRY = SRC / "runtimeEntryR169.ts"
PROVENANCE = SRC / "system" / "releaseProvenanceR217.ts"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def executable_workflow_text(path: Path) -> str:
    lines = []
    for raw in read(path).splitlines():
        line = raw.split("#", 1)[0]
        if "grep" in line.lower():
            continue
        lines.append(line)
    return "\n".join(lines).lower()


def mutation_capable_script_names() -> set[str]:
    hits: set[str] = set()
    roots = [ROOT / "scripts", ROOT / "cloudflare"]
    strong = (
        "wrangler publish",
        "wrangler rollback",
        "wrangler versions upload",
        "wrangler deployments create",
    )
    for base in roots:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".py", ".sh", ".ps1", ".js", ".ts", ".mjs", ".cjs"}:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore").lower()
            deploy = "wrangler deploy" in text and "--dry-run" not in text
            cloudflare_write = (
                "api.cloudflare.com/client/v4" in text
                and "/workers/scripts/" in text
                and any(method in text for method in ("-x post", "-x put", "-x patch", "-x delete", "--request post", "--request put", "--request patch", "--request delete"))
            )
            if deploy or cloudflare_write or any(token in text for token in strong):
                hits.add(path.name.lower())
    return hits


def test_r217_keeps_r169_as_entrypoint_and_adds_read_only_provenance_surface():
    wrangler = read(ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml")
    entry = read(ENTRY)
    provenance = read(PROVENANCE)
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'handleReleaseProvenanceR217' in entry
    assert 'const releaseProvenanceR217 = handleReleaseProvenanceR217(request, env)' in entry
    assert 'if (releaseProvenanceR217) return releaseProvenanceR217' in entry
    for required in (
        '/api/system/r217/release-lease',
        'OMEGA_RELEASE_PROVENANCE_R217',
        'DEPLOYMENT_PROVENANCE_BOUND',
        'DEPLOYMENT_PROVENANCE_UNBOUND',
        'DEPLOYMENT_PROVENANCE_ONLY_NOT_AUTHORIZATION',
        'releaseLeaseIsNotCanonAuthority',
        'releaseLeaseIsNotPromotionAuthority',
        'releaseLeaseIsNotExecutionAuthority',
        'releaseLeaseIsNotPhysicalPcProof',
        'unexpectedLeaseOrVersionBlocksAdmission',
        'canonicalMutation: false',
        'promotionAuthorized: false',
    ):
        assert required in provenance, required


def test_r217_release_controller_binds_sha_version_and_run_lease_as_one_identity():
    text = read(RELEASE)
    for required in (
        'OMEGA_RELEASE_LEASE',
        'OMEGA_RELEASE_RUN_ID',
        'OMEGA_RELEASE_RUN_ATTEMPT',
        'expected-release-lease.txt',
        '/api/system/r217/release-lease',
        'OMEGA_RELEASE_PROVENANCE_R217',
        'DEPLOYMENT_PROVENANCE_BOUND',
        'RELEASE_LEASE_MISMATCH',
        'UNEXPECTED_RELEASE_PROVENANCE',
        'Exact release provenance lease: LIVE VERIFIED',
    ):
        assert required in text, required
    assert 'expected-version-id.txt' in text
    assert 'PRODUCTION_WRITER_RACE' in text
    assert 'RESTORE_WITHHELD_PRODUCTION_WRITER_RACE' in text
    assert 'origin/$CANONICAL_BRANCH' in text


def test_r217_repository_workflows_have_one_production_mutation_authority_and_no_indirect_writer():
    mutation_capable = mutation_capable_script_names()
    offenders = []
    mutation_patterns = (
        "wrangler publish",
        "wrangler rollback",
        "wrangler versions upload",
        "wrangler deployments create",
        "npm run deploy",
    )
    for path in sorted(WORKFLOWS.glob("*.y*ml")):
        text = executable_workflow_text(path)
        if path == RELEASE:
            continue
        deploy = "wrangler deploy" in text and "--dry-run" not in text
        cloudflare_write = (
            "api.cloudflare.com/client/v4" in text
            and "/workers/scripts/" in text
            and any(method in text for method in ("-x post", "-x put", "-x patch", "-x delete", "--request post", "--request put", "--request patch", "--request delete"))
        )
        marketplace_writer = bool(re.search(r"uses:\s*[^\n]*(?:cloudflare/wrangler-action|wrangler-action)", text))
        indirect = sorted(name for name in mutation_capable if name in text)
        if deploy or cloudflare_write or marketplace_writer or any(p in text for p in mutation_patterns) or indirect:
            offenders.append((path.name, deploy, cloudflare_write, marketplace_writer, indirect))
    assert offenders == [], offenders

    release = executable_workflow_text(RELEASE)
    assert "wrangler deploy --config wrangler.release-forward.toml" in release
    assert "$deployments_url?force=true" in release
    assert "cloudflare_api_token" in release
    assert "cloudflare_account_id" in release


def test_r217_unattributed_writer_is_not_falsely_assigned_to_a_known_workflow():
    text = read(RELEASE)
    assert "EXTERNAL_OR_UNATTRIBUTED_PRODUCTION_MUTATION" in text
    assert "unexpected-release-provenance.json" in text
    assert "another deployment owns production; exact restore withheld" in text.lower()
