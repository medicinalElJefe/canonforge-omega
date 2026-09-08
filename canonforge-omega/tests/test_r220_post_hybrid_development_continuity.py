from pathlib import Path

from omega_runtime.self_build import JobState, SovereignBuildController

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
R220 = SRC / "system" / "postHybridDevelopmentContinuityR220.ts"
ENTRY = SRC / "runtimeEntryR169.ts"
AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"


def test_r220_requires_real_authenticated_hybrid_link_before_resume():
    source = R220.read_text(encoding="utf-8")
    for required in (
        "/api/hybrid/status",
        "/api/development/status",
        "/api/development/mode",
        "/api/system/r220/status",
        "/api/system/r220/resume",
        "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED",
        "hybrid.heartbeatCurrent === true",
        "hybrid.authenticated === true || hybrid.agentAuthenticated === true",
        "hybrid.pcOnline === true",
        "body.confirmed !== true",
        'JSON.stringify({ mode: "DEVELOPMENT_LOOP" })',
    ):
        assert required in source, required


def test_r220_does_not_turn_heartbeat_into_execution_or_promotion_truth():
    source = R220.read_text(encoding="utf-8")
    for required in (
        "heartbeatIsNotExecution: true",
        "hostExecutionRequiresReturnedVerifiedJobEvidence: true",
        "continuityRequiresVerifiedReturnPlusDifferentNextActiveJob: true",
        "typedAllowListedJobsOnly: true",
        "arbitraryShell: false",
        "canonicalMutation: false",
        "githubMutation: false",
        "deploymentAuthorized: false",
        "promotionAuthorized: false",
        "automaticProductionMutation: false",
    ):
        assert required in source, required
    assert 'state = "HOST_EXECUTING"' in source
    assert 'state = "DEVELOPMENT_ADVANCING"' in source
    assert 'job?.state === "VERIFIED" && job?.evidence' in source


def test_existing_sovereign_agent_really_continues_after_heartbeat():
    source = AGENT.read_text(encoding="utf-8")
    heartbeat = source.index("/api/device/heartbeat")
    lease = source.index("/api/development/lease", heartbeat)
    result = source.index("/api/development/jobs/", lease)
    assert heartbeat < lease < result
    assert "while True:" in source
    assert "execute_job" in source
    assert "VERIFIED" in source


def test_build_controller_advances_to_a_different_job_after_verified_host_return(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "self_build.json", tmp_path)
    first_status = controller.status()
    first = first_status["active_job"]
    assert first is not None
    assert first["state"] == "QUEUED"

    leased = controller.lease_next("r220-test-agent")
    assert leased is not None
    assert leased.id == first["id"]
    assert leased.state == "LEASED"

    controller.update_job(leased.id, JobState.RUNNING, {"started": True})
    returned = controller.update_job(
        leased.id,
        JobState.VERIFIED,
        {"ok": True, "host": "r220-test-agent", "receipt": "verified-host-return"},
    )
    assert returned.state == "VERIFIED"
    assert returned.evidence["ok"] is True

    after = controller.status()
    next_job = after["active_job"]
    assert next_job is not None
    assert next_job["id"] != leased.id
    assert next_job["state"] == "QUEUED"
    assert after["recursive_convergence"]["enabled"] is True
    assert "never silently mutate production" in after["recursive_convergence"]["rule"]
    assert "release promotion requires separate proof" in after["promotion_boundary"]


def test_r220_is_additive_under_r219_provenance_r169_and_r216_remains_last_gate():
    entry = ENTRY.read_text(encoding="utf-8")
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text(encoding="utf-8")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'handleReleaseProvenanceR217' in entry
    assert 'handlePostHybridDevelopmentR220, enhancePostHybridDevelopmentR220' in entry
    assert "handlePostHybridDevelopmentR220(request, env, ctx, runtimeFetch)" in entry
    assert "const r220 = await enhancePostHybridDevelopmentR220(r205)" in entry
    assert "enhanceSurfaceBindingIntegrityR216(r220" in entry
    assert entry.index("handleReleaseProvenanceR217(request, env)") < entry.index("handlePostHybridDevelopmentR220(request, env, ctx, runtimeFetch)")
    assert entry.index("enhancePostHybridDevelopmentR220(r205)") < entry.index("enhanceSurfaceBindingIntegrityR216(r220")
    # Preserve the historical/non-HTML R216 compatibility path as well.
    assert "return enhanceSurfaceBindingIntegrityR216(r205, env?.CANONICAL_GIT_SHA ?? null)" in entry


def test_r220_surface_exposes_recovery_without_fake_success_state():
    source = R220.read_text(encoding="utf-8")
    for required in (
        "Resume governed development",
        "Proving link → execution → return → next development stage",
        "Authenticated link proven. Development can resume",
        "The authenticated host has leased or is running",
        "Verified host evidence returned and a different next development stage is active",
        "Heartbeat is stale; execution and development claims are withheld",
    ):
        assert required in source, required
    assert "button.disabled=!(d&&d.eligibleToResume===true)" in source
