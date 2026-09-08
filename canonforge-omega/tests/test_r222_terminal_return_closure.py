from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
R222 = SRC / "system" / "terminalReturnClosureR222.ts"
R169 = SRC / "runtimeEntryR169.ts"
R203 = SRC / "system" / "hybridMissionRouteR203.ts"
R204 = SRC / "omegaRuntimeR204.ts"
R220 = SRC / "system" / "postHybridDevelopmentContinuityR220.ts"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r222_treats_complete_and_completed_as_terminal_not_active():
    s = read(R222)
    assert 'const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING", "INVOKED", "DISPATCHED", "EXECUTING"])' in s
    assert '"COMPLETE", "COMPLETED", "VERIFIED", "FAILED", "BLOCKED", "CANCELLED", "HOLD_REPAIR_REQUIRED"' in s
    assert 'observedStatus === "COMPLETE" || observedStatus === "COMPLETED"' in s
    assert 'reconciledState = "RETURN_EVIDENCE_MISSING"' in s
    assert 'blocker = "RETURN_EVIDENCE_MISSING"' in s


def test_r222_never_promotes_completion_to_verification():
    s = read(R222)
    assert 'completeIsNotVerified: true' in s
    assert 'completedIsNotVerified: true' in s
    assert 'state(j) === "VERIFIED"' in s
    assert 'j.verified === true' in s
    assert 'verificationClaimed = explicitVerification(job, container)' in s
    assert 'observedStatus === "COMPLETE" || observedStatus === "COMPLETED"' in s
    assert 'reconciledState = "HOST_RETURNED_VERIFICATION_PENDING"' in s
    assert 'reconciledState = "HOST_RETURN_VERIFIED"' in s


def test_r222_removes_terminal_job_from_active_development_projection_without_erasing_history():
    s = read(R222)
    assert 'if (!reconciliation.terminal) return next;' in s
    assert 'next.active_job = null;' in s
    assert 'next.activeJob = null;' in s
    assert 'next.terminal_job = job;' in s
    assert 'recent.unshift(job)' in s
    assert 'active_job: null' in s
    assert 'terminal_job: job' in s


def test_r222_bypass_prevents_recursive_status_wrapping():
    s = read(R222)
    assert 'const BYPASS_HEADER = "x-omega-r222-bypass"' in s
    assert 'headers.set(BYPASS_HEADER, "1")' in s
    assert 'if (request.headers.get(BYPASS_HEADER) === "1") return null;' in s
    assert 'next(withBypass(request)' in s


def test_r222_preserves_existing_execution_and_return_authorities():
    r222 = read(R222)
    r203 = read(R203)
    r204 = read(R204)
    assert 'r204VerifiedReturnAuthorityPreserved: true' in r222
    assert 'r141r142ExactPayloadAuthorityPreserved: true' in r222
    assert 'r159ConvergenceRequiresVerifiedReplay: true' in r222
    assert 'RUNNING != RETURNED != VERIFIED' in r203
    assert 'finalStatus = resultStatus === "SUCCESS" ? "COMPLETE" : "FAILED"' in r204
    assert 'verification.verified' in r204


def test_r222_is_additive_under_r169_and_r216_remains_final_integrity_binding():
    s = read(R169)
    assert 'handleTerminalReturnClosureR222, enhanceTerminalReturnClosureR222' in s
    assert 'handleTerminalReturnClosureR222(request, env, ctx, runtimeFetch)' in s
    assert s.index('handleTerminalReturnClosureR222(request, env, ctx, runtimeFetch)') < s.index('handleGovernedLocalTrainingR221(request, env, ctx, runtimeFetch)')
    assert 'const r220 = await enhancePostHybridDevelopmentR220(r205);' in s
    assert 'const r221 = await enhanceGovernedLocalTrainingR221(r220);' in s
    assert 'const r222 = await enhanceTerminalReturnClosureR222(r221);' in s
    assert 'return enhanceSurfaceBindingIntegrityR216(r222, env?.CANONICAL_GIT_SHA ?? null)' in s
    assert s.index('const r222 = await enhanceTerminalReturnClosureR222(r221);') < s.index('enhanceSurfaceBindingIntegrityR216(r222')


def test_r222_does_not_mutate_canon_or_authorize_promotion():
    s = read(R222)
    assert 'canonicalMutation: false' in s
    assert 'promotionAuthorized: false' in s
    assert 'TERMINAL_STATE_RECONCILIATION_NOT_RETURN_PROOF_NOT_CANON' in s
    assert 'wrangler deploy' not in s.lower()


def test_r220_stale_projection_is_specifically_closed_by_r222():
    r220 = read(R220)
    r222 = read(R222)
    assert '["QUEUED", "LEASED", "RUNNING"]' in r220
    assert '"COMPLETE", "COMPLETED"' in r222
    assert 'next.active_job = null;' in r222
    assert 'HOST COMPLETED · RETURN EVIDENCE MISSING' in r222
