import { OmegaRuntime as OmegaRuntimeR33 } from "./omegaRuntime";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
const now = () => Date.now();
const text = (value: unknown) => String(value ?? "").trim();
const safeId = (value: unknown, fallback = "") => {
  const source = text(value).slice(0, 160);
  return /^[A-Za-z0-9._:-]+$/.test(source) ? source : fallback;
};
const relativePath = (value: unknown): string | null => {
  const source = text(value || ".").replace(/\\/g, "/");
  if (!source || source === ".") return ".";
  if (source.startsWith("/") || /^[A-Za-z]:/.test(source) || source.split("/").includes("..") || source.includes("\0")) return null;
  return source.split("/").filter(Boolean).join("/") || ".";
};

const R199_OPS = Object.freeze([
  "DISCOVER_PROJECT", "PROJECT_PREFLIGHT", "PC_HEALTH", "TRAIN_LOCAL", "INDEX", "READ_TEXT",
  "SEARCH_TEXT", "HASH_TREE", "SAFE_IMPORT", "WORKBOOK_AUDIT", "BUILD", "TEST", "PACKAGE",
  "SUPPORT_BUNDLE", "APPLY_PATCH", "WRITE_TEXT", "RESTORE_BACKUP", "OPEN_URL", "WAIT", "LIST_WINDOWS",
  "FOCUS_WINDOW", "SCREEN_CAPTURE", "MOUSE_MOVE", "CLICK", "KEY", "TYPE_TEXT", "SCROLL", "ASSERT_WINDOW",
  "READ_VISIBLE_TEXT", "RECORD_MACRO", "REPLAY_MACRO",
]);
const R199_PROFILES = Object.freeze([
  "AUTO_BUILD", "NODE_BUILD", "PYTHON_TEST", "DOTNET_BUILD", "WINDOWS_AUTOMATION", "BROWSER_AUTOMATION",
]);
const WINDOW_OPS = new Set([
  "FOCUS_WINDOW", "SCREEN_CAPTURE", "MOUSE_MOVE", "CLICK", "KEY", "TYPE_TEXT", "SCROLL", "ASSERT_WINDOW",
  "READ_VISIBLE_TEXT", "RECORD_MACRO", "REPLAY_MACRO",
]);
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING", "RETURNED_SUCCESS", "RETURNED_FAILURE"]);
const RECEIPT_LIMIT = 128 * 1024;
const LEASE_MS = 20 * 60 * 1000;

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 4): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map(x => x.toString(16).padStart(2, "0")).join("");
}

function appendLifecycle(job: any, state: string, data: Record<string, unknown> = {}) {
  return [...(Array.isArray(job?.lifecycle) ? job.lifecycle : []), { state, at: now(), ...data }].slice(-40);
}

function validateR199Job(raw: any) {
  const errors: string[] = [];
  const steps = Array.isArray(raw?.steps) ? raw.steps : [];
  if (!raw?.confirmed) errors.push("explicit confirmation required");
  if (steps.length < 1 || steps.length > 24) errors.push("1-24 steps required");
  for (const [index, row] of steps.entries()) {
    const op = text(row?.op).toUpperCase();
    if (!R199_OPS.includes(op)) errors.push(`step ${index + 1}: unsupported op`);
    if (row?.profile && !R199_PROFILES.includes(row.profile)) errors.push(`step ${index + 1}: unsupported profile`);
    if (row?.path && !relativePath(row.path)) errors.push(`step ${index + 1}: unsafe path`);
    if (row?.url && !String(row.url).startsWith("https://")) errors.push(`step ${index + 1}: HTTPS required`);
    if (WINDOW_OPS.has(op) && !text(row?.windowTitle)) errors.push(`step ${index + 1}: window title lock required`);
    if (op === "APPLY_PATCH" && (!/^[0-9a-f]{64}$/i.test(text(row?.expectedSha256)) || !Array.isArray(row?.replacements) || row.replacements.length < 1 || row.replacements.length > 24)) {
      errors.push(`step ${index + 1}: hash-bound replacements required`);
    }
    if (op === "WRITE_TEXT" && !row?.createOnly && !/^[0-9a-f]{64}$/i.test(text(row?.expectedSha256))) {
      errors.push(`step ${index + 1}: existing write requires preimage hash`);
    }
    if (op === "RESTORE_BACKUP" && (!text(row?.backupPath).startsWith(".omega_hybrid/backups/") || (row?.path && !relativePath(row.path)))) {
      errors.push(`step ${index + 1}: OMEGA-managed backup and safe target path required`);
    }
  }
  return { valid: errors.length === 0, errors, steps };
}

function boundedProjectDiscovery(value: any) {
  if (!value || typeof value !== "object") return null;
  const candidates = Array.isArray(value.candidates) ? value.candidates.slice(0, 24) : [];
  return {
    schema: text(value.schema).slice(0, 80),
    selected: value.selected && typeof value.selected === "object" ? value.selected : null,
    candidates,
    candidateCount: Number(value.candidateCount || 0),
    directoriesVisited: Number(value.directoriesVisited || 0),
    truncated: Boolean(value.truncated),
    elapsedSeconds: Number(value.elapsedSeconds || 0),
    confidence: text(value.confidence).slice(0, 20),
  };
}

function boundedResourceGuard(value: any) {
  if (!value || typeof value !== "object") return null;
  return {
    schema: text(value.schema).slice(0, 80),
    platform: text(value.platform).slice(0, 180),
    python: text(value.python).slice(0, 40),
    disk: value.disk || null,
    memory: value.memory || null,
    readyForHeavyWork: Boolean(value.readyForHeavyWork),
    heavyOpsSequential: value.heavyOpsSequential !== false,
    implicitDependencyInstall: Boolean(value.implicitDependencyInstall),
    systemOptimizationMutation: Boolean(value.systemOptimizationMutation),
    rootConfinedWrites: value.rootConfinedWrites !== false,
  };
}

function compareStepReceipt(receipt: any, proof: any): boolean {
  return text(receipt?.id) === text(proof?.id) &&
    text(receipt?.op).toUpperCase() === text(proof?.op).toUpperCase() &&
    Boolean(receipt?.ok) === Boolean(proof?.ok) &&
    /^[0-9a-f]{64}$/i.test(text(receipt?.proofSha256));
}

export class OmegaRuntime extends OmegaRuntimeR33 {
  async state() {
    const base: any = await super.state();
    const jobs = await this.get<any[]>("jobs", []);
    const verified = jobs.filter(row => row?.returnVerification?.verified).at(-1) || null;
    return {
      ...base,
      schema: "OMEGA_LIVING_RUNTIME_R199",
      serverRevision: "R199_SOVEREIGN_PC_FULL_RUNTIME",
      returnVerificationRequiredForR199: true,
      activeJobs: jobs.filter(row => ACTIVE_STATES.has(row.status)).length,
      latestVerifiedReturn: verified ? {
        jobId: verified.id,
        deviceId: verified.targetDeviceId,
        status: verified.status,
        completedAt: verified.completedAt,
        resultFingerprint: verified.returnVerification?.resultFingerprint || null,
        serverReceiptSha256: verified.returnVerification?.serverReceiptSha256 || null,
      } : null,
      safetyPolicy: {
        rootConfinedWrites: true,
        reversibleSourceMutation: true,
        heavyOperationsSequential: true,
        implicitDependencyInstall: false,
        uncontrolledSystemOptimization: false,
        arbitraryShell: false,
      },
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/agent/register" && request.method === "POST") {
      const copy = request.clone();
      const body = await copy.json().catch(() => ({})) as any;
      const response = await super.fetch(request);
      if (!response.ok) return response;
      const id = safeId(body.deviceId, "");
      let devices = await this.get<any[]>("devices", []);
      devices = devices.map(row => row.id === id ? {
        ...row,
        capabilityRevision: text(body.capabilityRevision || row.capabilityRevision || "LEGACY").slice(0, 40),
        sovereignClosureRevision: text(body.sovereignClosureRevision || "LEGACY").slice(0, 40),
        capabilities: Array.isArray(body.capabilities) ? body.capabilities.map((x: unknown) => text(x).toUpperCase()).filter((x: string) => R199_OPS.includes(x)).slice(0, 64) : row.capabilities,
        executionPolicy: body.executionPolicy && typeof body.executionPolicy === "object" ? body.executionPolicy : null,
        projectDiscovery: boundedProjectDiscovery(body.projectDiscovery),
        resourceGuard: boundedResourceGuard(body.resourceGuard),
      } : row);
      await this.put("devices", devices);
      await this.event("R199_DEVICE_CAPABILITIES_BOUND", `Device ${id} registered the sovereign workstation execution contract.`, { deviceId: id, closureRevision: text(body.sovereignClosureRevision) });
      return json({ ok: true, device: devices.find(row => row.id === id), serverRevision: "R199" });
    }

    if (path === "/agent/heartbeat" && request.method === "POST") {
      const copy = request.clone();
      const body = await copy.json().catch(() => ({})) as any;
      const response = await super.fetch(request);
      if (!response.ok) return response;
      const id = safeId(body.deviceId, "");
      let devices = await this.get<any[]>("devices", []);
      devices = devices.map(row => row.id === id ? {
        ...row,
        sovereignClosureRevision: text(body.sovereignClosureRevision || row.sovereignClosureRevision || "LEGACY").slice(0, 40),
        projectDiscovery: boundedProjectDiscovery(body.projectDiscovery) || row.projectDiscovery || null,
        resourceGuard: boundedResourceGuard(body.resourceGuard) || row.resourceGuard || null,
      } : row);
      await this.put("devices", devices);
      return json({ ok: true, at: now(), device: devices.find(row => row.id === id), serverRevision: "R199" });
    }

    if (path === "/agent/poll" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const deviceId = safeId(body.deviceId, "");
      const devices = await this.devices();
      const device = devices.find(row => row.id === deviceId && row.online && !row.revoked);
      if (!device) return json({ ok: false, code: "DEVICE_NOT_REGISTERED_OR_STALE" }, 404);
      let jobs = await this.get<any[]>("jobs", []);
      let changed = false;
      jobs = jobs.map(row => {
        if (["LEASED", "RUNNING"].includes(row.status) && Number(row.leaseExpiresAt || 0) > 0 && Number(row.leaseExpiresAt) < now()) {
          changed = true;
          return { ...row, status: "HOLD_LEASE_EXPIRED", heldAt: now(), needsReview: true, lifecycle: appendLifecycle(row, "HOLD_LEASE_EXPIRED") };
        }
        return row;
      });
      let job = jobs.find(row => row.status === "QUEUED" && row.targetDeviceId === deviceId);
      if (job) {
        const leaseExpiresAt = now() + LEASE_MS;
        jobs = jobs.map(row => row.id === job.id ? {
          ...row,
          status: "LEASED",
          leasedAt: now(),
          leaseExpiresAt,
          lifecycle: appendLifecycle(row, "LEASED", { deviceId, leaseExpiresAt }),
        } : row);
        job = jobs.find(row => row.id === job.id);
        changed = true;
        await this.event("JOB_LEASED", `Job ${job.id} leased to authenticated host.`, { jobId: job.id, deviceId, leaseExpiresAt });
      }
      if (changed) await this.put("jobs", jobs);
      return json({ ok: true, job: job || null, leasePolicy: { milliseconds: LEASE_MS, blindRetry: false } });
    }

    if (path === "/agent/progress" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const jobId = safeId(body.jobId, "");
      const deviceId = safeId(body.deviceId, "");
      let jobs = await this.get<any[]>("jobs", []);
      const target = jobs.find(row => row.id === jobId && row.targetDeviceId === deviceId);
      if (!target) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);
      if (!["LEASED", "RUNNING"].includes(target.status)) return json({ ok: false, code: "JOB_NOT_LEASED", status: target.status }, 409);
      const leaseExpiresAt = now() + LEASE_MS;
      jobs = jobs.map(row => row.id === jobId ? {
        ...row,
        status: "RUNNING",
        startedAt: row.startedAt || now(),
        leaseExpiresAt,
        liveProjectDiscovery: boundedProjectDiscovery(body.projectDiscovery) || row.liveProjectDiscovery || null,
        liveResourceGuard: boundedResourceGuard(body.resourceGuard) || row.liveResourceGuard || null,
        lifecycle: appendLifecycle(row, "RUNNING", { deviceId, leaseExpiresAt }),
      } : row);
      await this.put("jobs", jobs);
      await this.event("JOB_RUNNING", `Job ${jobId} entered host execution.`, { jobId, deviceId });
      return json({ ok: true, job: jobs.find(row => row.id === jobId) });
    }

    if (path === "/agent/result" && request.method === "POST") {
      const legacyRequest = request.clone();
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const jobId = safeId(body.jobId, "");
      const deviceId = safeId(body.deviceId, "");
      const closureRevision = text(body.sovereignClosureRevision || "LEGACY");
      if (closureRevision !== "R199") {
        const legacy = await super.fetch(legacyRequest);
        if (!legacy.ok) return legacy;
        const data = await legacy.json().catch(() => ({})) as any;
        return json({ ...data, returnVerification: { verified: false, state: "LEGACY_COMPATIBILITY", reason: "R199 canonical receipt not supplied" } }, legacy.status);
      }

      let jobs = await this.get<any[]>("jobs", []);
      const target = jobs.find(row => row.id === jobId && row.targetDeviceId === deviceId);
      if (!target) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);
      const fingerprint = text(body.resultFingerprint).toLowerCase();
      if (target.returnVerification?.verified) {
        if (target.returnVerification.resultFingerprint === fingerprint) {
          return json({ ok: true, idempotent: true, job: target, returnVerification: target.returnVerification });
        }
        return json({ ok: false, code: "RESULT_CONFLICT", existingFingerprint: target.returnVerification.resultFingerprint }, 409);
      }
      const canonical = typeof body.receiptCanonicalJson === "string" ? body.receiptCanonicalJson : "";
      const proofs = Array.isArray(body.stepProofs) ? body.stepProofs.slice(0, 24) : [];
      const outputs = Array.isArray(body.outputPaths) ? body.outputPaths.slice(0, 40).map((x: unknown) => text(x)) : [];
      const errors: string[] = [];
      if (!/^[0-9a-f]{64}$/.test(fingerprint)) errors.push("resultFingerprint must be sha256 hex");
      if (!canonical || new TextEncoder().encode(canonical).byteLength > RECEIPT_LIMIT) errors.push("canonical receipt missing or too large");
      let receipt: any = null;
      if (canonical) {
        try { receipt = JSON.parse(canonical); } catch { errors.push("canonical receipt is not valid JSON"); }
      }
      const observedHash = canonical ? await sha256(canonical) : "";
      if (fingerprint && observedHash !== fingerprint) errors.push("canonical receipt SHA-256 mismatch");
      if (receipt) {
        if (receipt.schema !== "OMEGA_HYBRID_RECEIPT_CORE_R199") errors.push("receipt schema mismatch");
        if (safeId(receipt.jobId, "") !== jobId) errors.push("receipt jobId mismatch");
        if (safeId(receipt.deviceId, "") !== deviceId) errors.push("receipt deviceId mismatch");
        if (text(receipt.sovereignClosureRevision) !== "R199") errors.push("receipt closure revision mismatch");
        if (Boolean(receipt.ok) !== Boolean(body.ok)) errors.push("receipt outcome mismatch");
        if (text(receipt.returnedState) !== text(body.returnedState)) errors.push("receipt returnedState mismatch");
        if (Number(receipt.stepCount) !== proofs.length) errors.push("receipt step count mismatch");
        const stepReceipts = Array.isArray(receipt.stepReceipts) ? receipt.stepReceipts : [];
        if (stepReceipts.length !== proofs.length || !stepReceipts.every((row: any, index: number) => compareStepReceipt(row, proofs[index]))) errors.push("receipt step lineage mismatch");
        const receiptOutputs = Array.isArray(receipt.outputPaths) ? receipt.outputPaths.map((x: unknown) => text(x)) : [];
        if (JSON.stringify(receiptOutputs) !== JSON.stringify(outputs)) errors.push("receipt output path mismatch");
      }
      if (!errors.length && !["RETURNED_SUCCESS", "RETURNED_FAILURE"].includes(text(body.returnedState))) errors.push("unsupported returned state");
      if (!errors.length && Boolean(body.ok) !== (text(body.returnedState) === "RETURNED_SUCCESS")) errors.push("returned state does not match ok flag");

      if (errors.length) {
        jobs = jobs.map(row => row.id === jobId ? {
          ...row,
          status: "RETURN_REJECTED",
          heldAt: now(),
          needsReview: true,
          returnVerification: { verified: false, state: "RETURN_REJECTED", errors, resultFingerprint: fingerprint || null, observedHash: observedHash || null },
          lifecycle: appendLifecycle(row, "RETURN_REJECTED", { deviceId, resultFingerprint: fingerprint || null }),
        } : row);
        await this.put("jobs", jobs);
        await this.event("JOB_RETURN_REJECTED", `Job ${jobId} returned a receipt that failed R199 verification.`, { jobId, deviceId, errors });
        return json({ ok: false, code: "RETURN_VERIFICATION_FAILED", errors, job: jobs.find(row => row.id === jobId) }, 400);
      }

      const returnedState = text(body.returnedState);
      const serverReceiptSha256 = await sha256(JSON.stringify({
        schema: body.schema,
        jobId,
        deviceId,
        executionId: text(body.executionId),
        returnedState,
        stepProofs: proofs,
        outputPaths: outputs,
        log: text(body.log).slice(-12000),
        evaluation: body.evaluation || null,
        promotion: body.promotion || null,
        projectDiscovery: boundedProjectDiscovery(body.projectDiscovery),
        resourceGuard: boundedResourceGuard(body.resourceGuard),
        resultFingerprint: fingerprint,
      }));
      const finalStatus = returnedState === "RETURNED_SUCCESS" ? "COMPLETE" : "FAILED";
      const verification = {
        verified: true,
        state: returnedState === "RETURNED_SUCCESS" ? "RETURN_VERIFIED_SUCCESS" : "RETURN_VERIFIED_FAILURE",
        verifiedAt: now(),
        resultFingerprint: fingerprint,
        serverReceiptSha256,
        schema: "OMEGA_RETURN_VERIFICATION_R199",
      };
      const packet = {
        schema: "OMEGA_HYBRID_RETURN_PACKET_R199",
        receivedAt: now(),
        deviceId,
        executionId: text(body.executionId).slice(0, 120),
        returnedState,
        capabilityRevision: text(body.capabilityRevision).slice(0, 40),
        sovereignClosureRevision: closureRevision,
        stepProofs: proofs,
        outputPaths: outputs,
        log: text(body.log).slice(-12000),
        evaluation: body.evaluation || null,
        promotion: body.promotion || null,
        projectDiscovery: boundedProjectDiscovery(body.projectDiscovery),
        resourceGuard: boundedResourceGuard(body.resourceGuard),
        resultFingerprint: fingerprint,
        verification,
      };
      jobs = jobs.map(row => row.id === jobId ? {
        ...row,
        status: finalStatus,
        completedAt: now(),
        returnPacket: packet,
        returnVerification: verification,
        outputPaths: outputs,
        log: packet.log,
        lifecycle: [
          ...appendLifecycle(row, returnedState, { deviceId, resultFingerprint: fingerprint }),
          { state: verification.state, at: verification.verifiedAt, deviceId, resultFingerprint: fingerprint, serverReceiptSha256 },
        ].slice(-40),
      } : row);
      await this.put("jobs", jobs);
      await this.event("JOB_RETURN_VERIFIED", `Job ${jobId} returned ${verification.state} with an exact R199 receipt digest.`, { jobId, deviceId, status: finalStatus, resultFingerprint: fingerprint, serverReceiptSha256 });

      let missions = await this.get<any[]>("missions", []);
      let missionChanged = false;
      missions = missions.map(mission => {
        if (mission.currentJobId !== jobId) return mission;
        missionChanged = true;
        const history = [...(mission.cycles || []), {
          cycle: mission.cycle,
          jobId,
          status: finalStatus,
          returnVerification: verification.state,
          resultFingerprint: fingerprint,
          completedAt: now(),
        }].slice(-8);
        const complete = finalStatus === "COMPLETE";
        return {
          ...mission,
          currentJob: jobs.find(row => row.id === jobId),
          cycles: history,
          status: complete ? "COMPLETE" : "HOLD_REPAIR_REQUIRED",
          completedAt: complete ? now() : undefined,
          heldAt: complete ? undefined : now(),
          needsReview: !complete,
          lastProof: packet,
        };
      });
      if (missionChanged) {
        await this.put("missions", missions);
        const mission = missions.find(row => row.currentJobId === jobId);
        await this.event(mission?.status === "COMPLETE" ? "MISSION_COMPLETE" : "MISSION_HELD", mission?.status === "COMPLETE" ? `Mission ${mission.id} completed only after R199 return verification.` : `Mission ${mission?.id} held on a verified failed host return.`, { missionId: mission?.id, jobId, resultFingerprint: fingerprint });
      }
      return json({ ok: true, job: jobs.find(row => row.id === jobId), mission: missionChanged ? missions.find(row => row.currentJobId === jobId) : undefined, returnVerification: verification });
    }

    if (path === "/jobs" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED", reply: "Pair this browser to the local OMEGA agent before native work can queue." }, 503);
      const body = await request.json().catch(() => ({})) as any;
      const validation = validateR199Job(body);
      if (!validation.valid) return json({ ok: false, code: "PLAN_REJECTED", errors: validation.errors }, 400);
      const devices = await this.devices();
      const target = devices.find(row => row.id === body.targetDeviceId && row.online && !row.revoked);
      if (!target) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED", reply: "The selected paired host is not currently proving an online heartbeat." }, 503);
      const missing = [...new Set(validation.steps.map((row: any) => text(row.op).toUpperCase()).filter((op: string) => !target.capabilities?.includes(op)))];
      if (missing.length) return json({ ok: false, code: "DEVICE_CAPABILITY_REQUIRED", missingCapabilities: missing, capabilityRevision: target.capabilityRevision || "LEGACY", sovereignClosureRevision: target.sovereignClosureRevision || "LEGACY" }, 409);
      let jobs = await this.get<any[]>("jobs", []);
      const inputMaterial = JSON.stringify({ steps: validation.steps, targetDeviceId: target.id, projectPath: body.projectPath || ".", closureRevision: target.sovereignClosureRevision || "LEGACY" });
      const inputFingerprint = await sha256(inputMaterial);
      const duplicate = jobs.find(row => row.inputFingerprint === inputFingerprint && ACTIVE_STATES.has(row.status));
      if (duplicate) return json({ ok: true, deduplicated: true, job: duplicate });
      const job = {
        id: "job_" + now().toString(36) + "_" + randomToken(),
        schema: body.schema || "OMEGA_HYBRID_JOB_R199",
        action: body.action || "PLAN",
        profile: body.profile || "AUTO_BUILD",
        projectPath: relativePath(body.projectPath) || ".",
        instructions: text(body.instructions || "").slice(0, 12000),
        allowedDomains: Array.isArray(body.allowedDomains) ? body.allowedDomains.slice(0, 12) : [],
        steps: validation.steps,
        targetDeviceId: target.id,
        targetCapabilityRevision: target.capabilityRevision || "LEGACY",
        targetSovereignClosureRevision: target.sovereignClosureRevision || "LEGACY",
        status: "QUEUED",
        confirmed: true,
        queuedAt: now(),
        inputFingerprint,
        lifecycle: [{ state: "QUEUED", at: now(), deviceId: target.id }],
      };
      jobs.push(job);
      await this.put("jobs", jobs.slice(-120));
      await this.event("JOB_QUEUED", `Approved R199 job ${job.id} queued for ${target.name}.`, { jobId: job.id, deviceId: target.id, inputFingerprint });
      return json({ ok: true, job });
    }

    if (path.startsWith("/jobs/") && path.endsWith("/receipt") && request.method === "GET") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const id = safeId(path.split("/")[2], "");
      const jobs = await this.get<any[]>("jobs", []);
      const job = jobs.find(row => row.id === id);
      if (!job) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);
      return json({ ok: true, jobId: id, status: job.status, lifecycle: job.lifecycle || [], returnPacket: job.returnPacket || null, returnVerification: job.returnVerification || null });
    }

    return super.fetch(request);
  }
}
