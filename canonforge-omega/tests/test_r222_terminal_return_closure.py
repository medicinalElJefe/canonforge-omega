from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
R222 = SRC / "system" / "terminalReturnClosureR222.ts"
R169 = SRC / "runtimeEntryR169.ts"
R203 = SRC / "system" / "hybridMissionRouteR203.ts"
R204 = SRC / "omegaRuntimeR204.ts"
R220 = SRC / "system" / "postHybridDevelopmentContinuityR220.ts"
R221 = SRC / "system" / "governedLocalTrainingR221.ts"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r222_treats_execution_completion_and_return_states_as_terminal_not_active():
    s = read(R222)
    assert 'const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING", "INVOKED", "DISPATCHED", "EXECUTING"])' in s
    for terminal in (
        '"COMPLETE"',
        '"COMPLETED"',
        '"VERIFIED"',
        '"FAILED"',
        '"BLOCKED"',
        '"CANCELLED"',
        '"HOLD_REPAIR_REQUIRED"',
        '"RETURNED_SUCCESS"',
        '"RETURNED_FAILURE"',
        '"RETURN_REJECTED"',
    ):
        assert terminal in s
    assert 'reconciledState = "RETURN_EVIDENCE_MISSING"' in s
    assert 'blocker = "RETURN_EVIDENCE_MISSING"' in s


def test_r222_understands_actual_r204_job_scoped_return_packet_and_verification_schema():
    s = read(R222)
    r204 = read(R204)
    assert 'const R204_VERIFICATION_SCHEMA = "OMEGA_HYBRID_RETURN_VERIFICATION_R204"' in s
    assert 'const R204_PACKET_SCHEMA = "OMEGA_HYBRID_RETURN_PACKET_R204"' in s
    assert 'j.returnPacket ?? j.return_packet' in s
    assert 'j.returnVerification ?? j.return_verification' in s
    assert 'row?.schema !== R204_VERIFICATION_SCHEMA' in s
    assert 'row?.verified !== true' in s
    assert 'serverReceiptSha256' in s
    assert 'const packet = { schema: "OMEGA_HYBRID_RETURN_PACKET_R204"' in r204
    assert 'returnPacket: packet, returnVerification: verification' in r204
    assert 'schema: HYBRID_RETURN_VERIFICATION_SCHEMA_R204' in r204


def test_r222_container_proof_requires_exact_current_job_identity():
    s = read(R222)
    assert 'function currentJobIdentity(container?: any): string | null' in s
    assert 'function exactCurrentJobBinding(job: any, container?: any): boolean' in s
    assert 'return Boolean(jid && current && jid === current);' in s
    assert 'if (exactCurrentJobBinding(job, container)) {' in s
    assert 'containerVerificationRequiresExactJobIdentity: true' in s
    assert 'R204_EXACT_JOB_BOUND_MISSION_LAST_PROOF' in s
    assert 'return !jid || !current || jid === current' not in s
    assert 'c.verified === true' not in s
    assert 'j.verified === true' not in s
    assert 'c.verification?.verified === true' not in s
    assert 'c.lastProof?.verified === true' not in s


def test_r222_complete_is_not_verified_but_valid_r204_admission_is_recognized():
    s = read(R222)
    assert 'completeIsNotVerified: true' in s
    assert 'completedIsNotVerified: true' in s
    assert 'verification.authority === "R204_AUTHENTICATED_RETURN_ADMISSION"' in s
    assert 'reconciledState = "HOST_RETURN_VERIFIED"' in s
    assert 'reconciledState = "HOST_RETURNED_VERIFICATION_PENDING"' in s
    assert 'requiresVerification' in s
    assert 'replayEligible' in s
    assert 'RUN_VERIFIED_REPLAY_THEN_R159' in s


def test_r222_verified_failure_remains_failure_and_cannot_be_presented_as_success():
    s = read(R222)
    r204 = read(R204)
    assert 'reconciledState = "HOST_RETURN_VERIFIED_FAILURE"' in s
    assert 'blocker = "HOST_EXECUTION_FAILED_VERIFIED_RETURN"' in s
    assert 'nextAction = "REPAIR_OR_RETRY_GOVERNED_STAGE"' in s
    assert 'const finalStatus = success ? "COMPLETE" : "FAILED";' in r204
    assert 'success ? "RETURN_VERIFIED_SUCCESS_R204" : "RETURN_VERIFIED_FAILURE_R204"' in r204


def test_r222_removes_terminal_job_from_active_development_projection_without_erasing_history():
    s = read(R222)
    assert 'if (!job || !reconciliation.terminal) return next;' in s
    assert 'next.active_job = null;' in s
    assert 'next.activeJob = null;' in s
    assert 'next.terminal_job = job;' in s
    assert 'recent.unshift(job)' in s
    assert 'active_job: null' in s
    assert 'terminal_job: job' in s


def test_r222_bypass_prevents_recursive_status_wrapping_and_preserves_transport_headers():
    s = read(R222)
    assert 'const BYPASS_HEADER = "x-omega-r222-bypass"' in s
    assert 'headers.set(BYPASS_HEADER, "1")' in s
    assert 'if (request.headers.get(BYPASS_HEADER) === "1") return null;' in s
    assert 'next(withBypass(request)' in s
    assert 'new Headers(sourceHeaders)' in s
    assert 'headers.delete("content-length")' in s
    assert 'headers.delete("content-encoding")' in s
    assert 'headers.delete("etag")' in s
    assert 'headers.delete("last-modified")' in s
    assert 'json(normalizeHybrid(body), response.status, response.headers)' in s
    assert 'json(normalizeDevelopment(body), response.status, response.headers)' in s


def test_r222_same_job_newer_terminal_beats_stale_inflight_projection():
    s = read(R222)
    assert 'const sameIdentity = Boolean(development.jobId && hybrid.jobId && development.jobId === hybrid.jobId);' in s
    assert 'if (sameIdentity) {' in s
    same_block = s.index('if (sameIdentity) {')
    newer_time = s.index('if (dTime !== hTime)', same_block)
    activity = s.index('if (development.jobInFlight !== hybrid.jobInFlight)', same_block)
    assert newer_time < activity
    assert 'if (development.terminal !== hybrid.terminal)' in s
    assert 'sameJobNewerTerminalBeatsStaleInflightProjection: true' in s


def test_r222_primary_status_still_prefers_distinct_current_activity_then_newer_evidence():
    s = read(R222)
    assert 'function primaryReconciliation(' in s
    assert 'development.jobInFlight !== hybrid.jobInFlight' in s
    assert 'const dTime = development.eventTime || 0;' in s
    assert 'const hTime = hybrid.eventTime || 0;' in s
    assert 'primarySurface: primary.surface' in s
    assert 'verificationAuthority: chosen.verificationAuthority' in s
    assert 'nextAction: chosen.nextAction' in s


def test_r222_ui_polling_is_single_flight_bounded_and_does_not_become_heartbeat_authority():
    s = read(R222)
    assert 'busy=false' in s
    assert 'if(busy){schedule();return}' in s
    assert 'new AbortController()' in s
    assert 'setTimeout(()=>controller.abort(),2200)' in s
    assert 'document.hidden?8000:3000' in s
    assert "document.addEventListener('visibilitychange'" in s
    assert 'r222PollingIsNotHeartbeatAuthority: true' in s
    assert "box.setAttribute('aria-live','polite')" in s
    assert '.innerHTML' not in s


def test_r222_preserves_existing_execution_and_return_authorities():
    r222 = read(R222)
    r203 = read(R203)
    r204 = read(R204)
    assert 'r204VerifiedReturnAuthorityPreserved: true' in r222
    assert 'r141r142ExactPayloadAuthorityPreserved: true' in r222
    assert 'r159ConvergenceRequiresVerifiedReplay: true' in r222
    assert 'RETURNED_HOST_PROOF_HASHED' in r203
    assert 'hostProofLaw:' in r203
    assert 'not physical correctness, CanonState admission or promotion authority' in r203
    assert 'verification.verified === true' in r204


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


def test_r222_integration_retains_latest_r221_native_rcwa_and_controller_owned_continuity():
    r221 = read(R221)
    assert 'rcwaRetryEligible' in r221
    assert 'retryRcwa = false' in r221
    assert 'rcwaRetryDoesNotRepeatTraining: true' in r221
    assert 'rcwaRetryFreshlyReprobesHostDependencies: true' in r221
    assert 'controllerOwnsTrainingToRcwaTransition: true' in r221
    assert 'browserTabIsNotRequiredForPipelineProgress: true' in r221
    assert 'liveActiveJobOverridesStaleRecentJobSnapshot: true' in r221
    assert 'R175_NATIVE_RCWA_CALIBRATION' in r221
    assert 'noReducedOrderOrScalarFallbackPromotedAsRcwa: true' in r221


def test_r222_does_not_mutate_canon_or_authorize_promotion():
    s = read(R222)
    assert 'canonicalMutation: false' in s
    assert 'promotionAuthorized: false' in s
    assert 'TERMINAL_STATE_RECONCILIATION_NOT_RETURN_PROOF_NOT_CANON' in s
    assert 'wrangler deploy' not in s.lower()


def test_r220_stale_projection_is_specifically_closed_by_r222_without_replacing_r220():
    r220 = read(R220)
    r222 = read(R222)
    assert 'const active = development?.active_job || null;' in r220
    assert 'if (provenLink && (activeState === "LEASED" || activeState === "RUNNING")) state = "HOST_EXECUTING";' in r220
    assert 'if (provenLink && !active && latestTerminal?.state === "VERIFIED") state = "HOST_RETURNED";' in r220
    assert '"COMPLETE"' in r222 and '"COMPLETED"' in r222
    assert 'next.active_job = null;' in r222
    assert 'HOST COMPLETED · RETURN EVIDENCE MISSING' in r222
