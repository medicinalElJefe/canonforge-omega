from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT.parent / ".github" / "workflows"
RELEASE = WORKFLOWS / "omega-v6-release-forward-production.yml"
VERIFY = WORKFLOWS / "omega-v6-verify.yml"
R185 = WORKFLOWS / "omega-v6-r185-live-172-cloud-proof.yml"
VERIFIER = ROOT / "scripts" / "verify_r185_live_federation.py"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def is_v6_workflow(path: Path, text: str) -> bool:
    lowered = text.lower()
    return path.name.startswith("omega-v6") or "omega-v6-worker" in lowered or "omegav6.jeffdeweyeljefe.workers.dev" in lowered


def workflow_mutation_lines():
    publishers = []
    rollbacks = []
    for path in sorted(WORKFLOWS.glob("*.y*ml")):
        text = read(path)
        if not is_v6_workflow(path, text):
            continue
        for lineno, raw in enumerate(text.splitlines(), 1):
            line = raw.split("#", 1)[0].strip().lower()
            if not line:
                continue
            # Source-audit workflows may grep for forbidden deployment strings. Those
            # observations are not executable publication commands.
            if "grep" in line:
                continue
            publishes = (
                ("wrangler deploy" in line and "--dry-run" not in line)
                or "wrangler publish" in line
                or "npm run deploy" in line
            )
            if publishes:
                publishers.append((path.name, lineno, raw.strip()))
            if "wrangler rollback" in line:
                rollbacks.append((path.name, lineno, raw.strip()))
    return publishers, rollbacks


def test_r213_release_forward_owns_exhaustive_r185_gate_and_rollback():
    text = read(RELEASE)
    assert "MIN_CANONICAL_SHA: 878f331a38ac01ace480858f9f135e441ad3a1f6" in text
    assert "Prove live exact identity, cumulative truth, and all 172 R185 nodes" in text
    assert "python canonforge-omega/scripts/verify_r185_live_federation.py" in text
    assert '--expected-sha "$GITHUB_SHA"' in text
    assert '--workers 12' in text
    assert "assert s.get('ok') is True, s" in text
    assert "R211 aggregate status.ok: TRUE" in text
    assert "if: steps.liveproof.outcome != 'success'" in text
    assert "npx wrangler rollback" in text
    assert "R185 172 advertised public routes: LIVE VERIFIED" in text
    assert "R185 172 machine routes and Durable Object runtimes: LIVE VERIFIED" in text
    assert "R185 manifest + deployment identity stable across complete sweep: VERIFIED" in text


def test_r213_release_forward_is_the_only_v6_production_mutation_authority_repository_wide():
    publishers, rollbacks = workflow_mutation_lines()
    assert publishers, "R213 must retain one exact-head production publisher"
    assert {item[0] for item in publishers} == {RELEASE.name}, publishers
    assert {item[0] for item in rollbacks} == {RELEASE.name}, rollbacks
    release_text = read(RELEASE)
    assert "CLOUDFLARE_API_TOKEN" in release_text
    assert "CLOUDFLARE_ACCOUNT_ID" in release_text
    verify_text = read(VERIFY)
    assert "CLOUDFLARE_API_TOKEN" not in verify_text
    assert "CLOUDFLARE_ACCOUNT_ID" not in verify_text
    assert "OMEGA_V6_VERIFY_PROOF_ONLY_R213" in verify_text


def test_r213_general_verify_remains_full_strength_but_non_mutating():
    text = read(VERIFY)
    assert "python scripts/check_cloudflare_contract.py --strict" in text
    assert "python -m pytest -q" in text
    assert "npm run typecheck" in text
    assert "npx wrangler deploy --dry-run --outdir .verify-dry-run" in text
    assert "federated-machine-services:" in text
    assert "OMEGA_V6_VERIFY_PROOF_ONLY_R213" in text
    assert "CLOUDFLARE_API_TOKEN" not in text
    assert "CLOUDFLARE_ACCOUNT_ID" not in text


def test_r213_legacy_publishers_are_diagnostic_only():
    retired = [
        "omega-v6-cloudflare.yml",
        "omega-v6-r198-production-deploy.yml",
        "omega-v6-r204-production-promotion.yml",
        "omega-v6-r205-ai-policy-production-closure.yml",
        "omega-v6-r205-production-promotion.yml",
    ]
    for name in retired:
        text = read(WORKFLOWS / name)
        assert "workflow_dispatch" in text, name
        assert "production mutation belongs exclusively" in text.lower(), name
        assert "CLOUDFLARE_API_TOKEN" not in text, name
        assert "CLOUDFLARE_ACCOUNT_ID" not in text, name


def test_r213_r185_audit_runs_after_release_forward_not_in_parallel_with_push_deploy():
    text = read(R185)
    assert 'workflows: ["OMEGA V6 release-forward exact-head production"]' in text
    assert "github.event.workflow_run.conclusion == 'success'" in text
    assert "github.event.workflow_run.head_branch == 'omega-v6-full-convergence'" in text
    assert "push:" not in text
    assert 'workflows: ["OMEGA V6 verify"]' not in text
    assert "verify_r185_live_federation.py" in text
    assert 'ref: ${{ env.EXPECTED_SHA }}' in text


def test_r213_verifier_checks_advertised_links_not_reconstructed_number_guesses():
    text = read(VERIFIER)
    assert "NODE_COUNT = 172" in text
    assert "WAVE_COUNT = 15" in text
    assert 'links = node.get("links") or {}' in text
    assert 'public = str(links.get("public") or "")' in text
    assert 'machine = str(links.get("machine") or "")' in text
    assert "ThreadPoolExecutor(max_workers=args.workers)" in text
    assert "runtime.get(\"reachable\") is True" in text
    assert "R185 manifest changed during the exhaustive federation sweep" in text
    assert "prove_identity(base, expected_sha)" in text
    assert '"deploymentIdentityStableAcrossSweep": True' in text
    assert '"manifestStableAcrossSweep": True' in text
    assert '"canonicalMutation": False' in text
    assert '"promotionAuthorizedByReceipt": False' in text
