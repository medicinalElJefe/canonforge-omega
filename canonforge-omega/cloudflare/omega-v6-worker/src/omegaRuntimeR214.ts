import { OmegaRuntime as R204OmegaRuntime } from "./omegaRuntimeR204";

export const HYBRID_LOCAL_AUTHORITY_R214 = "r214-explicit-local-execution-authority";
export const HYBRID_AUTHORITY_SCHEMA_R214 = "OMEGA_LOCAL_EXECUTION_AUTHORITY_R214";

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
const now = () => Date.now();
const text = (value: unknown) => String(value ?? "").trim();
const MAX_LEASE_SECONDS = 12 * 60 * 60;
const DEFAULT_LEASE_SECONDS = 4 * 60 * 60;
const AUTHORITY_KEY = "executionAuthorityR214";
const APPROVED_OPS = new Set([
  "TRAIN_LOCAL","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","SAFE_IMPORT","WORKBOOK_AUDIT",
  "BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH","OPEN_URL","WAIT","CLICK","KEY","TYPE_TEXT",
  "SCROLL","ASSERT_WINDOW","READ_VISIBLE_TEXT","RECORD_MACRO","REPLAY_MACRO",
]);

type AuthorityLease = {
  schema: string;
  state: "GRANTED" | "REVOKED";
  deviceId: string;
  approvedRoot: string;
  allowedOps: string[];
  grantedAt: number;
  expiresAt: number;
  localApproval: true;
  approvalMethod: string;
  grantNonce: string;
  revokedAt?: number;
};

function safeId(value: unknown): string {
  const source = text(value).slice(0, 160);
  return /^[A-Za-z0-9._:-]+$/.test(source) ? source : "";
}

function safeRoot(value: unknown): string {
  return text(value).slice(0, 2000);
}

function randomNonce(bytes = 12): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map(v => v.toString(16).padStart(2, "0")).join("");
}

export class OmegaRuntime extends R204OmegaRuntime {
  async authority(): Promise<any> {
    const lease = await this.get<AuthorityLease | null>(AUTHORITY_KEY, null);
    const devices = await this.devices();
    if (!lease) {
      return {
        schema: HYBRID_AUTHORITY_SCHEMA_R214,
        state: "LOCAL_APPROVAL_REQUIRED",
        active: false,
        localApprovalRequired: true,
        remoteBrowserMayGrant: false,
        boundary: "A paired or heartbeat-current PC is not executable authority. Native work requires an explicit local grant on that PC, bound to one device/root and an expiring operation envelope.",
      };
    }
    const device = devices.find((row: any) => row.id === lease.deviceId && row.online && !row.revoked);
    const notExpired = lease.state === "GRANTED" && Number(lease.expiresAt) > now();
    const active = Boolean(notExpired && device);
    return {
      schema: HYBRID_AUTHORITY_SCHEMA_R214,
      state: active ? "LOCAL_EXECUTION_AUTHORITY_ACTIVE" : lease.state === "REVOKED" ? "LOCAL_EXECUTION_AUTHORITY_REVOKED" : !notExpired ? "LOCAL_EXECUTION_AUTHORITY_EXPIRED" : "AUTHORIZED_DEVICE_HEARTBEAT_REQUIRED",
      active,
      localApprovalRequired: true,
      remoteBrowserMayGrant: false,
      deviceId: lease.deviceId,
      approvedRoot: lease.approvedRoot,
      allowedOps: lease.allowedOps,
      grantedAt: lease.grantedAt,
      expiresAt: lease.expiresAt,
      secondsRemaining: active ? Math.max(0, Math.floor((lease.expiresAt - now()) / 1000)) : 0,
      approvalMethod: lease.approvalMethod,
      grantNonce: lease.grantNonce,
      heartbeatCurrent: Boolean(device),
      boundary: "Authority is a bounded local consent lease, not ownership of the host and not permission to escape the approved root or allowed operation set.",
    };
  }

  async authorityAllows(deviceId: string, root: string | null, steps: any[] = []): Promise<{ ok: boolean; authority: any; errors: string[] }> {
    const authority = await this.authority();
    const errors: string[] = [];
    if (!authority.active) errors.push("explicit local execution authority is not active");
    if (deviceId && authority.deviceId !== deviceId) errors.push("target device is outside the local authority lease");
    if (root && authority.approvedRoot && root !== authority.approvedRoot && root !== ".") errors.push("requested root is outside the local authority lease");
    for (const [index, step] of steps.entries()) {
      const op = text(step?.op).toUpperCase();
      if (!op || !authority.allowedOps?.includes(op)) errors.push(`step ${index + 1}: ${op || "UNKNOWN"} is outside the local authority lease`);
    }
    return { ok: errors.length === 0, authority, errors };
  }

  async state() {
    const base: any = await super.state();
    return {
      ...base,
      serverRevision: HYBRID_LOCAL_AUTHORITY_R214,
      executionAuthority: await this.authority(),
      badGatewayEliminationR214: {
        cloudControlPlane: "CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL",
        inboundPcGatewayRequiredForJobs: false,
        sovereignOriginIsExecutionAuthority: false,
        localApprovalRequired: true,
      },
    };
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, "");

    if (path === "/authority/status" && request.method === "GET") return json({ ok: true, ...(await this.authority()) });

    if (path === "/enroll-existing" && request.method === "POST") {
      const expected = text(this.env?.SOVEREIGN_GATEWAY_TOKEN);
      const presented = text(request.headers.get("x-omega-enrollment-key"));
      if (!expected || !presented || expected !== presented) return json({ ok: false, code: "ENROLLMENT_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const secret = text(body.secret);
      const deviceId = safeId(body.deviceId);
      if (!secret || !deviceId) return json({ ok: false, code: "SECRET_AND_DEVICE_REQUIRED" }, 400);
      await this.put("bridgeSecretHash", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)).then((d: ArrayBuffer) => [...new Uint8Array(d)].map(v => v.toString(16).padStart(2, "0")).join("")));
      await this.put("bridgeCreatedAt", now());
      let rows = await this.get<any[]>("devices", []);
      const row = {
        id: deviceId,
        name: text(body.name || "OMEGA PC").slice(0, 120),
        platform: text(body.platform || "Windows").slice(0, 120),
        version: text(body.version || HYBRID_LOCAL_AUTHORITY_R214).slice(0, 100),
        capabilities: Array.isArray(body.capabilities) ? body.capabilities.map((x: unknown) => text(x).toUpperCase()).filter((x: string) => APPROVED_OPS.has(x)).slice(0, 40) : [],
        rootLabel: safeRoot(body.approvedRoot || body.rootLabel || "approved root"),
        lastSeen: now(), revoked: false,
      };
      rows = [...rows.filter((x: any) => x.id !== deviceId), row].slice(-20);
      await this.put("devices", rows);
      await this.event("R214_BRIDGE_MIGRATED", "Verified legacy Hybrid credential migrated into the Durable Object broker without granting execution authority.", { deviceId, approvedRoot: row.rootLabel });
      return json({ ok: true, state: "BRIDGE_MIGRATED_AUTHORITY_NOT_GRANTED", device: row, executionAuthority: await this.authority() });
    }

    if (path === "/authority/grant" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      if (body.localApproval !== true) return json({ ok: false, code: "LOCAL_APPROVAL_REQUIRED", remoteBrowserMayGrant: false }, 403);
      const deviceId = safeId(body.deviceId);
      const approvedRoot = safeRoot(body.approvedRoot);
      const devices = await this.devices();
      const device = devices.find((row: any) => row.id === deviceId && row.online && !row.revoked);
      if (!device) return json({ ok: false, code: "CURRENT_AUTHENTICATED_HEARTBEAT_REQUIRED" }, 409);
      if (!approvedRoot || (device.rootLabel && approvedRoot !== device.rootLabel)) return json({ ok: false, code: "APPROVED_ROOT_MISMATCH", expected: device.rootLabel || null, received: approvedRoot || null }, 403);
      const requestedOps = Array.isArray(body.allowedOps) ? body.allowedOps.map((x: unknown) => text(x).toUpperCase()) : [];
      const allowedOps = (requestedOps.length ? requestedOps : device.capabilities || []).filter((op: string) => APPROVED_OPS.has(op));
      if (!allowedOps.length) return json({ ok: false, code: "NO_EXECUTION_OPS_GRANTED" }, 400);
      const seconds = Math.max(300, Math.min(MAX_LEASE_SECONDS, Number(body.expiresSeconds) || DEFAULT_LEASE_SECONDS));
      const lease: AuthorityLease = {
        schema: HYBRID_AUTHORITY_SCHEMA_R214,
        state: "GRANTED",
        deviceId,
        approvedRoot,
        allowedOps,
        grantedAt: now(),
        expiresAt: now() + seconds * 1000,
        localApproval: true,
        approvalMethod: text(body.approvalMethod || "LOCAL_CONSOLE_EXPLICIT_YES").slice(0, 120),
        grantNonce: randomNonce(),
      };
      await this.put(AUTHORITY_KEY, lease);
      await this.event("R214_LOCAL_AUTHORITY_GRANTED", "Local user granted a bounded OMEGA execution lease.", { deviceId, approvedRoot, allowedOps, expiresAt: lease.expiresAt, grantNonce: lease.grantNonce });
      return json({ ok: true, ...(await this.authority()) });
    }

    if (path === "/authority/revoke" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const lease = await this.get<AuthorityLease | null>(AUTHORITY_KEY, null);
      if (lease) await this.put(AUTHORITY_KEY, { ...lease, state: "REVOKED", revokedAt: now(), expiresAt: Math.min(lease.expiresAt, now()) });
      await this.event("R214_LOCAL_AUTHORITY_REVOKED", "Local execution authority was revoked; queued work may not be claimed.", {});
      return json({ ok: true, ...(await this.authority()) });
    }

    if (path === "/agent/poll" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const clone = request.clone();
      const body = await clone.json().catch(() => ({})) as any;
      const deviceId = safeId(body.deviceId);
      const allowed = await this.authorityAllows(deviceId, null, []);
      if (!allowed.ok) return json({ ok: true, job: null, authority: allowed.authority, blocked: true, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", errors: allowed.errors });
      return super.fetch(request);
    }

    if (path === "/jobs" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED" }, 503);
      const clone = request.clone();
      const body = await clone.json().catch(() => ({})) as any;
      const allowed = await this.authorityAllows(safeId(body.targetDeviceId), text(body.projectPath || "."), Array.isArray(body.steps) ? body.steps : []);
      if (!allowed.ok) return json({ ok: false, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", authority: allowed.authority, errors: allowed.errors }, 403);
      return super.fetch(request);
    }

    if (path === "/missions" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED" }, 503);
      const clone = request.clone();
      const body = await clone.json().catch(() => ({})) as any;
      const draft = body.draft || {};
      const allowed = await this.authorityAllows(safeId(body.targetDeviceId), text(draft.projectPath || "."), Array.isArray(draft.steps) ? draft.steps : []);
      if (!allowed.ok) return json({ ok: false, code: "LOCAL_EXECUTION_AUTHORITY_REQUIRED", authority: allowed.authority, errors: allowed.errors }, 403);
      return super.fetch(request);
    }

    return super.fetch(request);
  }
}
