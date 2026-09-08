import { OmegaRuntime as R204OmegaRuntime } from "./omegaRuntimeR204";

export const HYBRID_OUTBOUND_R222 = "r222-outbound-single-instance-hybrid-runtime";
export const HYBRID_ENROLLMENT_SCHEMA_R222 = "OMEGA_HYBRID_OUTBOUND_ENROLLMENT_R222";
export const HYBRID_AUTHORITY_SCHEMA_R222 = "OMEGA_LOCAL_EXECUTION_AUTHORITY_R222";
export const DEVELOPMENT_SCHEMA_R222 = "OMEGA_DURABLE_DEVELOPMENT_LOOP_R222";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
const text = (value: unknown) => String(value ?? "").trim();
const now = () => Date.now();
const nowSeconds = () => Math.floor(Date.now() / 1000);
const AUTHORITY_KEY = "executionAuthorityR222";
const ENROLLMENT_KEY = "outboundEnrollmentR222";
const ENROLLMENT_NONCES_KEY = "outboundEnrollmentNoncesR222";
const DEV_MODE_KEY = "developmentModeR222";
const DEV_JOBS_KEY = "developmentJobsR222";
const DEV_CURSOR_KEY = "developmentCursorR222";
const MAX_AUTHORITY_SECONDS = 12 * 60 * 60;
const DEFAULT_AUTHORITY_SECONDS = 4 * 60 * 60;

const SAFE_DEVELOPMENT_KINDS = Object.freeze([
  "convergence_scan",
  "inspect_workspace",
  "inspect_runtime",
  "compute_truth_suite",
  "cross_runtime_validate",
  "run_tests",
  "build_vite",
  "wrangler_dry_run",
  "capture_screenshot",
  "prepare_candidate",
  "verify_candidate",
  "cleanup_candidate",
  "sai_probe",
  "sai_repository_index",
  "sai_b059_install",
  "sai_b059_verify",
  "sai_b059_query",
]);

const LOOP_SEQUENCE = Object.freeze([
  "inspect_workspace",
  "compute_truth_suite",
  "build_vite",
  "wrangler_dry_run",
  "verify_candidate",
]);

const TERMINAL_STATES = new Set(["VERIFIED", "BLOCKED", "FAILED", "CANCELLED"]);
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING"]);

type AuthorityLease = {
  schema: string;
  state: "GRANTED" | "REVOKED";
  deviceId: string;
  approvedRoot: string;
  allowedKinds: string[];
  grantedAt: number;
  expiresAt: number;
  localApproval: true;
  approvalMethod: string;
  revokedAt?: number;
};

type Enrollment = {
  schema: string;
  deviceId: string;
  approvedRoot: string;
  tokenSha256: string;
  issuedAt: number;
  expiresAt: number;
  enrolledAt: number;
  nonce: string;
};

function safeId(value: unknown): string {
  const source = text(value).slice(0, 160);
  return /^[A-Za-z0-9._:-]+$/.test(source) ? source : "";
}

function safeRoot(value: unknown): string {
  return text(value).slice(0, 2000);
}

function randomId(prefix: string): string {
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  const suffix = [...values].map(value => value.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${now().toString(36)}_${suffix}`;
}

async function sha256Text(source: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index++) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function enrollmentMessage(body: any): string {
  return [
    HYBRID_ENROLLMENT_SCHEMA_R222,
    String(Number(body.issuedAt)),
    String(Number(body.expiresAt)),
    text(body.nonce),
    safeId(body.deviceId),
    safeRoot(body.approvedRoot),
    text(body.tokenSha256).toLowerCase(),
  ].join("\n");
}

export class OmegaRuntime extends R204OmegaRuntime {
  async authorityR222(): Promise<any> {
    const lease = await this.get<AuthorityLease | null>(AUTHORITY_KEY, null);
    const devices = await this.devices();
    if (!lease) {
      return {
        schema: HYBRID_AUTHORITY_SCHEMA_R222,
        state: "LOCAL_APPROVAL_REQUIRED",
        active: false,
        localApprovalRequired: true,
        remoteBrowserMayGrant: false,
        boundary: "Authenticated link proof is not execution authority. Native development requires a separate local consent lease on the enrolled PC.",
      };
    }
    const device = devices.find((row: any) => row.id === lease.deviceId && row.online && !row.revoked);
    const timeActive = lease.state === "GRANTED" && Number(lease.expiresAt) > now();
    const active = Boolean(timeActive && device);
    return {
      schema: HYBRID_AUTHORITY_SCHEMA_R222,
      state: active
        ? "LOCAL_EXECUTION_AUTHORITY_ACTIVE"
        : lease.state === "REVOKED"
          ? "LOCAL_EXECUTION_AUTHORITY_REVOKED"
          : !timeActive
            ? "LOCAL_EXECUTION_AUTHORITY_EXPIRED"
            : "AUTHORIZED_DEVICE_HEARTBEAT_REQUIRED",
      active,
      localApprovalRequired: true,
      remoteBrowserMayGrant: false,
      deviceId: lease.deviceId,
      approvedRoot: lease.approvedRoot,
      allowedKinds: lease.allowedKinds,
      grantedAt: lease.grantedAt,
      expiresAt: lease.expiresAt,
      secondsRemaining: active ? Math.max(0, Math.floor((lease.expiresAt - now()) / 1000)) : 0,
      approvalMethod: lease.approvalMethod,
      heartbeatCurrent: Boolean(device),
      boundary: "The lease is time bounded, device bound and root bound. It grants only the allow-listed development job kinds and no Canon, GitHub, deployment or promotion authority.",
    };
  }

  async developmentStatusR222(): Promise<any> {
    const mode = await this.get<string>(DEV_MODE_KEY, "MANUAL");
    const jobs = await this.get<any[]>(DEV_JOBS_KEY, []);
    const active = [...jobs].reverse().find(row => ACTIVE_STATES.has(String(row?.state || ""))) || null;
    const enrollment = await this.get<Enrollment | null>(ENROLLMENT_KEY, null);
    return {
      ok: true,
      schema: DEVELOPMENT_SCHEMA_R222,
      release: HYBRID_OUTBOUND_R222,
      mode,
      active_job: active,
      recent_jobs: jobs.slice(-30),
      validation_sequence: [...LOOP_SEQUENCE],
      approved_root: enrollment?.approvedRoot || null,
      executionAuthority: await this.authorityR222(),
      transport: "CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL",
      inboundSovereignGatewayRequired: false,
      badGatewayFallbackUsed: false,
      boundary: "Development state is durable cloud control state. A job is execution proof only after the authenticated physical agent returns evidence and the terminal state is recorded.",
    };
  }

  async ensureNextDevelopmentJobR222(reason = "Continue the bounded R222 development loop."): Promise<any | null> {
    const mode = await this.get<string>(DEV_MODE_KEY, "MANUAL");
    if (mode !== "DEVELOPMENT_LOOP" && mode !== "CONTINUOUS_SOVEREIGN_BUILD") return null;
    let jobs = await this.get<any[]>(DEV_JOBS_KEY, []);
    const existing = jobs.find(row => ACTIVE_STATES.has(String(row?.state || "")));
    if (existing) return existing;
    let cursor = await this.get<number>(DEV_CURSOR_KEY, 0);
    if (!Number.isFinite(cursor) || cursor < 0) cursor = 0;
    const kind = LOOP_SEQUENCE[cursor % LOOP_SEQUENCE.length];
    const job = {
      id: randomId("dev"),
      schema: DEVELOPMENT_SCHEMA_R222,
      kind,
      reason,
      payload: {},
      state: "QUEUED",
      queuedAt: now(),
      evidence: null,
      error: null,
      authority: "BOUNDED_HOST_EXECUTION_NOT_CANON",
      canonicalMutation: false,
      githubMutation: false,
      deploymentAuthorized: false,
      promotionAuthorized: false,
    };
    jobs = [...jobs, job].slice(-120);
    await this.put(DEV_JOBS_KEY, jobs);
    await this.put(DEV_CURSOR_KEY, (cursor + 1) % LOOP_SEQUENCE.length);
    await this.event("R222_DEVELOPMENT_QUEUED", `Queued bounded development stage ${kind}.`, { jobId: job.id, kind });
    return job;
  }

  async state() {
    const base: any = await super.state();
    const enrollment = await this.get<Enrollment | null>(ENROLLMENT_KEY, null);
    return {
      ...base,
      serverRevision: HYBRID_OUTBOUND_R222,
      outboundEnrollmentR222: enrollment ? {
        schema: enrollment.schema,
        deviceId: enrollment.deviceId,
        approvedRoot: enrollment.approvedRoot,
        enrolledAt: enrollment.enrolledAt,
        tokenSha256: enrollment.tokenSha256,
      } : null,
      executionAuthority: await this.authorityR222(),
      developmentR222: await this.developmentStatusR222(),
      transportR222: {
        controlPlane: "CLOUDFLARE_DURABLE_OBJECT",
        hostDirection: "PC_OUTBOUND_TO_CLOUD",
        inboundCloudToPcRequired: false,
        badGatewayFallbackUsed: false,
        durableBinding: "OMEGA_RUNTIME",
        durableSingleton: "OMEGA_RUNTIME",
      },
    };
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, "");

    if (path === "/r222/enroll-signed" && request.method === "POST") {
      const expectedKey = text(this.env?.SOVEREIGN_GATEWAY_TOKEN);
      if (!expectedKey) return json({ ok: false, code: "CLOUD_ENROLLMENT_KEY_NOT_CONFIGURED" }, 503);
      const body = await request.json().catch(() => ({})) as any;
      const issuedAt = Number(body.issuedAt);
      const expiresAt = Number(body.expiresAt);
      const nonce = text(body.nonce);
      const deviceId = safeId(body.deviceId);
      const approvedRoot = safeRoot(body.approvedRoot);
      const token = text(body.token);
      const tokenSha256 = text(body.tokenSha256).toLowerCase();
      const signature = text(body.signature).toLowerCase();
      if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || !nonce || !deviceId || !approvedRoot || !token || !/^[0-9a-f]{64}$/.test(tokenSha256) || !/^[0-9a-f]{64}$/.test(signature)) {
        return json({ ok: false, code: "ENROLLMENT_PACKET_INVALID" }, 400);
      }
      const current = nowSeconds();
      if (issuedAt > current + 30 || expiresAt < current || expiresAt - issuedAt > 180) {
        return json({ ok: false, code: "ENROLLMENT_PACKET_EXPIRED_OR_OUT_OF_WINDOW", now: current }, 401);
      }
      if (!constantTimeHexEqual(await sha256Text(token), tokenSha256)) {
        return json({ ok: false, code: "ENROLLMENT_TOKEN_HASH_MISMATCH" }, 401);
      }
      const observedSignature = await hmacSha256Hex(expectedKey, enrollmentMessage(body));
      if (!constantTimeHexEqual(observedSignature, signature)) {
        return json({ ok: false, code: "ENROLLMENT_SIGNATURE_INVALID" }, 401);
      }
      const nonces = (await this.get<any[]>(ENROLLMENT_NONCES_KEY, [])).filter(row => Number(row.expiresAt || 0) >= current);
      if (nonces.some(row => row.nonce === nonce)) return json({ ok: false, code: "ENROLLMENT_REPLAY_REJECTED" }, 409);
      nonces.push({ nonce, expiresAt });
      await this.put(ENROLLMENT_NONCES_KEY, nonces.slice(-100));
      const enrollment: Enrollment = {
        schema: HYBRID_ENROLLMENT_SCHEMA_R222,
        deviceId,
        approvedRoot,
        tokenSha256,
        issuedAt,
        expiresAt,
        enrolledAt: now(),
        nonce,
      };
      await this.put("bridgeSecretHash", tokenSha256);
      await this.put("bridgeCreatedAt", now());
      await this.put(ENROLLMENT_KEY, enrollment);
      await this.put("devices", []);
      await this.put(AUTHORITY_KEY, null);
      await this.event("R222_OUTBOUND_ENROLLED", "Accepted a localhost-signed outbound Hybrid enrollment without an inbound PC callback.", { deviceId, approvedRoot, tokenSha256 });
      return json({
        ok: true,
        state: "OUTBOUND_BRIDGE_ENROLLED_HEARTBEAT_REQUIRED",
        deviceId,
        approvedRoot,
        tokenSha256,
        executionAuthorityGranted: false,
        inboundCloudToPcRequired: false,
      });
    }

    if (path === "/r222/device-heartbeat" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const enrollment = await this.get<Enrollment | null>(ENROLLMENT_KEY, null);
      const deviceId = safeId(body.agent_id || body.deviceId);
      const approvedRoot = safeRoot(body.approved_root || body.approvedRoot);
      if (!enrollment || deviceId !== enrollment.deviceId) return json({ ok: false, code: "ENROLLED_DEVICE_MISMATCH" }, 403);
      if (!approvedRoot || approvedRoot !== enrollment.approvedRoot) {
        return json({ ok: false, code: "APPROVED_ROOT_MISMATCH", expected: enrollment.approvedRoot, received: approvedRoot || null }, 403);
      }
      const sequence = (await this.get<number>("heartbeatSequenceR222", 0)) + 1;
      await this.put("heartbeatSequenceR222", sequence);
      const capabilities = Array.isArray(body.capabilities) ? body.capabilities.map((value: unknown) => text(value)).filter(Boolean).slice(0, 80) : [];
      const row = {
        id: deviceId,
        name: "OMEGA Sovereign PC",
        platform: text(body.platform || "Windows").slice(0, 120),
        version: text(body.runtime_version || body.version || HYBRID_OUTBOUND_R222).slice(0, 120),
        capabilities,
        rootLabel: approvedRoot,
        lastSeen: now(),
        revoked: false,
        heartbeatSequence: sequence,
        lastJobId: safeId(body.last_job_id || body.lastJobId) || null,
      };
      let devices = await this.get<any[]>("devices", []);
      devices = [...devices.filter(existing => existing.id !== deviceId), row].slice(-20);
      await this.put("devices", devices);
      const authority = await this.authorityR222();
      return json({
        ok: true,
        state: "VERIFIED_DEVICE_ONLINE",
        authenticated_heartbeat: true,
        pc_online: true,
        heartbeat_age_seconds: 0,
        proof: {
          sequence,
          agent_id: deviceId,
          approved_root: approvedRoot,
          capabilities,
          runtime_version: row.version,
          last_job_id: row.lastJobId,
          recorded_at: new Date().toISOString(),
        },
        executionAuthority: authority,
      });
    }

    if (path === "/r222/authority/status" && request.method === "GET") {
      return json({ ok: true, ...(await this.authorityR222()) });
    }

    if (path === "/r222/authority/grant" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      if (body.localApproval !== true) return json({ ok: false, code: "LOCAL_APPROVAL_REQUIRED", remoteBrowserMayGrant: false }, 403);
      const enrollment = await this.get<Enrollment | null>(ENROLLMENT_KEY, null);
      const deviceId = safeId(body.deviceId);
      const approvedRoot = safeRoot(body.approvedRoot);
      if (!enrollment || deviceId !== enrollment.deviceId || approvedRoot !== enrollment.approvedRoot) {
        return json({ ok: false, code: "ENROLLMENT_BINDING_MISMATCH" }, 403);
      }
      const devices = await this.devices();
      const device = devices.find((row: any) => row.id === deviceId && row.online && !row.revoked);
      if (!device) return json({ ok: false, code: "CURRENT_AUTHENTICATED_HEARTBEAT_REQUIRED" }, 409);
      const requested = Array.isArray(body.allowedKinds) ? body.allowedKinds.map((value: unknown) => text(value)) : [];
      const allowedKinds = (requested.length ? requested : SAFE_DEVELOPMENT_KINDS).filter(kind => SAFE_DEVELOPMENT_KINDS.includes(kind));
      const seconds = Math.max(300, Math.min(MAX_AUTHORITY_SECONDS, Number(body.expiresSeconds) || DEFAULT_AUTHORITY_SECONDS));
      const lease: AuthorityLease = {
        schema: HYBRID_AUTHORITY_SCHEMA_R222,
        state: "GRANTED",
        deviceId,
        approvedRoot,
        allowedKinds,
        grantedAt: now(),
        expiresAt: now() + seconds * 1000,
        localApproval: true,
        approvalMethod: text(body.approvalMethod || "LOCAL_CONSOLE_EXPLICIT_YES").slice(0, 160),
      };
      await this.put(AUTHORITY_KEY, lease);
      await this.event("R222_LOCAL_AUTHORITY_GRANTED", "Local operator granted bounded native development authority.", { deviceId, approvedRoot, allowedKinds, expiresAt: lease.expiresAt });
      return json({ ok: true, ...(await this.authorityR222()) });
    }

    if (path === "/r222/authority/revoke" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const lease = await this.get<AuthorityLease | null>(AUTHORITY_KEY, null);
      if (lease) await this.put(AUTHORITY_KEY, { ...lease, state: "REVOKED", revokedAt: now(), expiresAt: Math.min(lease.expiresAt, now()) });
      await this.event("R222_LOCAL_AUTHORITY_REVOKED", "Local native-development authority revoked.", {});
      return json({ ok: true, ...(await this.authorityR222()) });
    }

    if (path === "/r222/development/status" && request.method === "GET") {
      return json(await this.developmentStatusR222());
    }

    if (path === "/r222/development/mode" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const authority = await this.authorityR222();
      if (!authority.active) return json({ ok: false, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", executionAuthority: authority }, 403);
      const body = await request.json().catch(() => ({})) as any;
      const mode = text(body.mode);
      if (!["MANUAL", "DEVELOPMENT_LOOP", "CONTINUOUS_SOVEREIGN_BUILD"].includes(mode)) return json({ ok: false, code: "INVALID_DEVELOPMENT_MODE" }, 422);
      await this.put(DEV_MODE_KEY, mode);
      const next = await this.ensureNextDevelopmentJobR222("Development mode was explicitly resumed by the locally authorized R222 session.");
      return json({ ...(await this.developmentStatusR222()), resumed: mode !== "MANUAL", nextQueued: next });
    }

    if (path === "/r222/development/enqueue" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const authority = await this.authorityR222();
      if (!authority.active) return json({ ok: false, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", executionAuthority: authority }, 403);
      const body = await request.json().catch(() => ({})) as any;
      const kind = text(body.kind);
      if (!SAFE_DEVELOPMENT_KINDS.includes(kind) || !authority.allowedKinds.includes(kind)) return json({ ok: false, code: "UNSUPPORTED_OR_UNAUTHORIZED_JOB_KIND", kind }, 403);
      let jobs = await this.get<any[]>(DEV_JOBS_KEY, []);
      const existing = [...jobs].reverse().find(row => row.kind === kind && ACTIVE_STATES.has(String(row.state || "")));
      if (existing) return json({ ok: true, deduplicated: true, job: existing });
      const job = {
        id: randomId("dev"), schema: DEVELOPMENT_SCHEMA_R222, kind,
        reason: text(body.reason || "Explicit bounded R222 development job").slice(0, 1000),
        payload: body.payload && typeof body.payload === "object" ? body.payload : {},
        state: "QUEUED", queuedAt: now(), evidence: null, error: null,
        authority: "BOUNDED_HOST_EXECUTION_NOT_CANON",
        canonicalMutation: false, githubMutation: false, deploymentAuthorized: false, promotionAuthorized: false,
      };
      jobs = [...jobs, job].slice(-120);
      await this.put(DEV_JOBS_KEY, jobs);
      await this.event("R222_DEVELOPMENT_QUEUED", `Queued explicit bounded development job ${kind}.`, { jobId: job.id, kind });
      return json({ ok: true, job });
    }

    if (path === "/r222/development/lease" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const agentId = safeId(body.agent_id || body.deviceId);
      const authority = await this.authorityR222();
      if (!authority.active || authority.deviceId !== agentId) return json({ ok: true, job: null, blocked: true, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", executionAuthority: authority });
      const devices = await this.devices();
      if (!devices.some((row: any) => row.id === agentId && row.online && !row.revoked)) return json({ ok: true, job: null, blocked: true, code: "CURRENT_AUTHENTICATED_HEARTBEAT_REQUIRED" });
      await this.ensureNextDevelopmentJobR222();
      let jobs = await this.get<any[]>(DEV_JOBS_KEY, []);
      let job = jobs.find(row => row.state === "QUEUED" && authority.allowedKinds.includes(row.kind));
      if (!job) return json({ ok: true, job: null, executionAuthority: authority });
      jobs = jobs.map(row => row.id === job.id ? { ...row, state: "LEASED", leasedAt: now(), agent_id: agentId } : row);
      job = jobs.find(row => row.id === job.id);
      await this.put(DEV_JOBS_KEY, jobs);
      await this.event("R222_DEVELOPMENT_LEASED", `Development job ${job.id} leased to authenticated host.`, { jobId: job.id, kind: job.kind, agentId });
      return json({ ok: true, job });
    }

    const resultMatch = path.match(/^\/r222\/development\/jobs\/([A-Za-z0-9._:-]+)\/result$/);
    if (resultMatch && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const state = text(body.state).toUpperCase();
      if (!["RUNNING", "BLOCKED", "FAILED", "VERIFIED", "CANCELLED"].includes(state)) return json({ ok: false, code: "INVALID_RESULT_STATE" }, 422);
      const jobId = resultMatch[1];
      let jobs = await this.get<any[]>(DEV_JOBS_KEY, []);
      const target = jobs.find(row => row.id === jobId);
      if (!target) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);
      if (state === "RUNNING") {
        jobs = jobs.map(row => row.id === jobId ? { ...row, state, startedAt: row.startedAt || now() } : row);
        await this.put(DEV_JOBS_KEY, jobs);
        return json({ ok: true, job: jobs.find(row => row.id === jobId) });
      }
      if (!TERMINAL_STATES.has(state)) return json({ ok: false, code: "INVALID_TERMINAL_STATE" }, 422);
      const evidence = body.evidence && typeof body.evidence === "object" ? body.evidence : {};
      jobs = jobs.map(row => row.id === jobId ? {
        ...row,
        state,
        completedAt: now(),
        evidence,
        error: body.error == null ? null : text(body.error).slice(0, 4000),
        returnedEvidenceSha256Pending: false,
      } : row);
      await this.put(DEV_JOBS_KEY, jobs);
      await this.event("R222_DEVELOPMENT_RETURNED", `Development job ${jobId} returned ${state}.`, { jobId, kind: target.kind, state, evidencePresent: Object.keys(evidence).length > 0 });
      const next = state === "VERIFIED" ? await this.ensureNextDevelopmentJobR222("Previous authenticated host stage returned VERIFIED evidence; advance to the next bounded stage.") : null;
      return json({ ok: true, job: (await this.get<any[]>(DEV_JOBS_KEY, [])).find(row => row.id === jobId), nextActiveJob: next });
    }

    return super.fetch(request);
  }
}
