/**
 * OmegaRuntime Durable Object compatibility recovery.
 *
 * Behavior source: the public OMEGAv6 R32/R33 enacted/living runtime lineage.
 * R32 introduced the SQLite Durable Object; R33 extended durable thread memory
 * and proof-governed mission completion. This module preserves that state
 * contract without reintroducing the obsolete public Worker wrapper.
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const HYBRID_OPS = Object.freeze([
  "TRAIN_LOCAL","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","SAFE_IMPORT",
  "WORKBOOK_AUDIT","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH",
  "OPEN_URL","WAIT","CLICK","KEY","TYPE_TEXT","SCROLL","ASSERT_WINDOW",
  "READ_VISIBLE_TEXT","RECORD_MACRO","REPLAY_MACRO",
]);
const HYBRID_PROFILES = Object.freeze([
  "AUTO_BUILD","NODE_BUILD","PYTHON_TEST","DOTNET_BUILD",
  "WINDOWS_AUTOMATION","BROWSER_AUTOMATION",
]);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
const text = (value: unknown) => String(value ?? "").trim();
const now = () => Date.now();
const clamp = (n: unknown, a: number, b: number) =>
  Math.max(a, Math.min(b, Number.isFinite(Number(n)) ? Number(n) : a));

function safeId(value: unknown, fallback = "anonymous"): string {
  const v = text(value).slice(0, 128);
  return /^[A-Za-z0-9._:-]+$/.test(v) ? v : fallback;
}

function relativePath(value: unknown): string | null {
  const v = text(value || ".").replace(/\\/g, "/");
  if (!v || v === ".") return ".";
  if (v.startsWith("/") || /^[A-Za-z]:/.test(v) || v.split("/").includes("..") || v.includes("\0")) return null;
  return v.split("/").filter(Boolean).join("/") || ".";
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 24): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map(x => x.toString(16).padStart(2, "0")).join("");
}

function validateJob(raw: any) {
  const errors: string[] = [];
  const steps = Array.isArray(raw?.steps) ? raw.steps : [];
  if (!raw?.confirmed) errors.push("explicit confirmation required");
  if (steps.length < 1 || steps.length > 24) errors.push("1-24 steps required");
  for (const [idx, row] of steps.entries()) {
    if (!HYBRID_OPS.includes(row?.op)) errors.push(`step ${idx + 1}: unsupported op`);
    if (row?.profile && !HYBRID_PROFILES.includes(row.profile)) errors.push(`step ${idx + 1}: unsupported profile`);
    if (row?.path && !relativePath(row.path)) errors.push(`step ${idx + 1}: unsafe path`);
    if (row?.url && !String(row.url).startsWith("https://")) errors.push(`step ${idx + 1}: HTTPS required`);
  }
  return { valid: errors.length === 0, errors, steps };
}

/**
 * Durable storage schema compatibility:
 * bridgeSecretHash, bridgeCreatedAt, devices, jobs, missions, events, thread.
 */
export class OmegaRuntime {
  ctx: any;
  env: any;

  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const value = await this.ctx.storage.get(key);
    return value === undefined ? fallback : value as T;
  }

  async put(key: string, value: unknown): Promise<void> {
    await this.ctx.storage.put(key, value);
  }

  async event(type: string, message: string, data: Record<string, unknown> = {}) {
    const events = await this.get<any[]>("events", []);
    const row = {
      id: "evt_" + now().toString(36) + "_" + randomToken(3),
      at: now(), type, message, data,
    };
    events.push(row);
    await this.put("events", events.slice(-300));
    return row;
  }

  async devices() {
    const rows = await this.get<any[]>("devices", []);
    const t = now();
    return rows.map(row => ({ ...row, online: t - Number(row.lastSeen || 0) < 30000 }));
  }

  async authorized(request: Request): Promise<boolean> {
    const secret = text(request.headers.get("x-omega-bridge-secret"));
    const hash = await this.get("bridgeSecretHash", "");
    return Boolean(secret && hash && await sha256(secret) === hash);
  }

  async state() {
    const devices = await this.devices();
    const jobs = await this.get<any[]>("jobs", []);
    const missions = await this.get<any[]>("missions", []);
    const events = await this.get<any[]>("events", []);
    const paired = Boolean(await this.get("bridgeSecretHash", ""));
    const online = devices.filter(row => row.online && !row.revoked);
    const thread = await this.get<any>("thread", null);
    return {
      schema: "OMEGA_LIVING_RUNTIME_R33",
      state: online.length ? "VERIFIED_DEVICE_ONLINE" : paired ? "DEVICE_PROOF_REQUIRED" : "PAIRING_REQUIRED",
      paired,
      devices,
      jobs: jobs.slice(-80),
      missions: missions.slice(-40),
      activeJobs: jobs.filter(row => ["QUEUED", "RUNNING"].includes(row.status)).length,
      events: events.slice(-30),
      nativeExecutionClaimed: online.length > 0,
      lastEvent: events.at(-1) || null,
      thread: thread ? {
        id: thread.id,
        turnCount: thread.turnCount || 0,
        memoryTurns: (thread.messages || []).length,
        updatedAt: thread.updatedAt,
      } : null,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/snapshot" && request.method === "GET") return json(await this.state());

    if (path === "/events" && request.method === "GET") {
      const events = await this.get<any[]>("events", []);
      return json({ ok: true, events: events.slice(-100) });
    }

    if (path === "/pair" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as any;
      const existing = await this.get("bridgeSecretHash", "");
      if (existing && !body.rotate) return json({ ok: true, state: "PAIRING_EXISTS", secretReturned: false });
      const secret = randomToken(24);
      await this.put("bridgeSecretHash", await sha256(secret));
      await this.put("bridgeCreatedAt", now());
      await this.event(existing ? "PAIR_ROTATED" : "PAIR_CREATED", "A new Hybrid Link pairing credential was issued.");
      return json({ ok: true, state: "PAIRING_READY", secretReturned: true, secret });
    }

    if (path === "/agent/register" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const id = safeId(body.deviceId, "");
      if (!id) return json({ ok: false, code: "DEVICE_ID_REQUIRED" }, 400);
      let rows = await this.get<any[]>("devices", []);
      const row = {
        id,
        name: text(body.name || "OMEGA PC").slice(0, 120),
        platform: text(body.platform || "unknown").slice(0, 120),
        version: text(body.version || "R33-agent").slice(0, 80),
        capabilities: Array.isArray(body.capabilities) ? body.capabilities.filter((x: string) => HYBRID_OPS.includes(x)).slice(0, 40) : [],
        rootLabel: text(body.rootLabel || "approved root").slice(0, 160),
        lastSeen: now(),
        revoked: false,
      };
      rows = [...rows.filter(x => x.id !== id), row].slice(-20);
      await this.put("devices", rows);
      await this.event("DEVICE_REGISTERED", `${row.name} registered with authenticated bridge proof.`, { deviceId: id });
      return json({ ok: true, device: row });
    }

    if (path === "/agent/heartbeat" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const id = safeId(body.deviceId, "");
      let rows = await this.get<any[]>("devices", []);
      let found = false;
      rows = rows.map(row => row.id === id ? (found = true, { ...row, lastSeen: now(), version: text(body.version || row.version) }) : row);
      if (!found) return json({ ok: false, code: "DEVICE_NOT_REGISTERED" }, 404);
      await this.put("devices", rows);
      return json({ ok: true, at: now() });
    }

    if (path === "/agent/poll" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const id = safeId(body.deviceId, "");
      let jobs = await this.get<any[]>("jobs", []);
      let job = jobs.find(row => row.status === "QUEUED" && row.targetDeviceId === id);
      if (job) {
        jobs = jobs.map(row => row.id === job.id ? { ...row, status: "RUNNING", startedAt: now() } : row);
        job = jobs.find(row => row.id === job.id);
        await this.put("jobs", jobs);
        await this.event("JOB_CLAIMED", `Job ${job.id} claimed by paired host.`, { jobId: job.id, deviceId: id });
      }
      return json({ ok: true, job: job || null });
    }

    if (path === "/agent/result" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const jobId = safeId(body.jobId, "");
      const deviceId = safeId(body.deviceId, "");
      let jobs = await this.get<any[]>("jobs", []);
      const target = jobs.find(row => row.id === jobId && row.targetDeviceId === deviceId);
      if (!target) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);

      const packet = {
        schema: "OMEGA_HYBRID_RETURN_PACKET_R32",
        receivedAt: now(),
        deviceId,
        stepProofs: Array.isArray(body.stepProofs) ? body.stepProofs.slice(0, 24) : [],
        outputPaths: Array.isArray(body.outputPaths) ? body.outputPaths.slice(0, 40) : [],
        log: text(body.log).slice(-12000),
        evaluation: body.evaluation || null,
        promotion: body.promotion || null,
        resultFingerprint: text(body.resultFingerprint) || await sha256({ jobId, deviceId, stepProofs: body.stepProofs || [], at: now() }),
      };
      const status = body.ok === false ? "FAILED" : "COMPLETE";
      jobs = jobs.map(row => row.id === jobId ? {
        ...row, status, completedAt: now(), returnPacket: packet,
        outputPaths: packet.outputPaths, log: packet.log,
      } : row);
      await this.put("jobs", jobs);
      await this.event("JOB_RETURNED", `Job ${jobId} returned ${status} with host proof.`, { jobId, deviceId, status });

      // R33 mission completion law: host proof resolves a mission; failed proof
      // holds it for review rather than blindly retrying.
      let missions = await this.get<any[]>("missions", []);
      let changed = false;
      missions = missions.map(mission => {
        if (mission.currentJobId !== jobId) return mission;
        changed = true;
        const history = [...(mission.cycles || []), {
          cycle: mission.cycle, jobId, status,
          resultFingerprint: packet.resultFingerprint,
          completedAt: now(),
        }].slice(-8);
        const complete = status === "COMPLETE";
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
      if (changed) {
        await this.put("missions", missions);
        const mission = missions.find(m => m.currentJobId === jobId);
        await this.event(
          mission?.status === "COMPLETE" ? "MISSION_COMPLETE" : "MISSION_HELD",
          mission?.status === "COMPLETE"
            ? `Mission ${mission.id} completed from returned host proof.`
            : `Mission ${mission?.id} held on failed host proof; no blind retry was queued.`,
          { missionId: mission?.id, jobId, status: mission?.status, resultFingerprint: packet.resultFingerprint },
        );
      }
      return json({ ok: true, job: jobs.find(row => row.id === jobId), mission: changed ? missions.find(m => m.currentJobId === jobId) : undefined });
    }

    if (path === "/status" && request.method === "GET") return json({ ok: true, ...await this.state() });

    if (path === "/jobs" && request.method === "POST") {
      if (!await this.authorized(request)) {
        return json({ ok: false, code: "DEVICE_PROOF_REQUIRED", reply: "Pair this browser to the local OMEGA agent before native work can queue." }, 503);
      }
      const body = await request.json().catch(() => ({})) as any;
      const validation = validateJob(body);
      if (!validation.valid) return json({ ok: false, code: "PLAN_REJECTED", errors: validation.errors }, 400);
      const devices = await this.devices();
      const target = devices.find(row => row.id === body.targetDeviceId && row.online && !row.revoked);
      if (!target) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED", reply: "The selected paired host is not currently proving an online heartbeat." }, 503);
      let jobs = await this.get<any[]>("jobs", []);
      const job = {
        id: "job_" + now().toString(36) + "_" + randomToken(4),
        schema: body.schema || "OMEGA_HYBRID_JOB_R32",
        action: body.action || "PLAN",
        profile: body.profile || "AUTO_BUILD",
        projectPath: relativePath(body.projectPath) || ".",
        instructions: text(body.instructions || ""),
        allowedDomains: Array.isArray(body.allowedDomains) ? body.allowedDomains.slice(0, 12) : [],
        steps: validation.steps,
        targetDeviceId: target.id,
        status: "QUEUED",
        confirmed: true,
        queuedAt: now(),
        inputFingerprint: await sha256({ steps: validation.steps, targetDeviceId: target.id, projectPath: body.projectPath || "." }),
      };
      jobs.push(job);
      await this.put("jobs", jobs.slice(-120));
      await this.event("JOB_QUEUED", `Approved job ${job.id} queued for ${target.name}.`, { jobId: job.id, deviceId: target.id });
      return json({ ok: true, job });
    }

    if (path.startsWith("/jobs/") && path.endsWith("/analyze") && request.method === "POST") {
      const id = safeId(path.split("/")[2], "");
      const jobs = await this.get<any[]>("jobs", []);
      const job = jobs.find(row => row.id === id);
      if (!job?.returnPacket) return json({ ok: false, code: "HOST_PROOF_REQUIRED" }, 409);
      return json({
        ok: true,
        draft: {
          schema: "OMEGA_HOST_PROOF_REPAIR_DRAFT_R32",
          projectPath: job.projectPath,
          allowedDomains: job.allowedDomains || [],
          steps: [
            { id: "S01", op: "HASH_TREE", label: "Re-check the approved tree after returned host proof", path: job.projectPath, maxResults: 5000 },
            { id: "S02", op: "TEST", label: "Verify the smallest next delta against the same project", path: job.projectPath, profile: job.profile || "AUTO_BUILD" },
          ],
          diagnosis: `Host proof for ${job.id} returned ${job.status}. Continue from the returned evidence rather than inventing state.`,
        },
      });
    }

    if (path === "/missions" && request.method === "GET") {
      return json({ ok: true, missions: (await this.get<any[]>("missions", [])).slice(-40), state: (await this.state()).state });
    }

    if (path === "/missions" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED" }, 503);
      const body = await request.json().catch(() => ({})) as any;
      const validation = validateJob({ ...body.draft, confirmed: body.confirmedMission });
      if (!validation.valid) return json({ ok: false, code: "MISSION_REJECTED", errors: validation.errors }, 400);
      const devices = await this.devices();
      const target = devices.find(row => row.id === body.targetDeviceId && row.online && !row.revoked);
      if (!target) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED" }, 503);

      let jobs = await this.get<any[]>("jobs", []);
      let missions = await this.get<any[]>("missions", []);
      const missionId = "mission_" + now().toString(36) + "_" + randomToken(3);
      const job = {
        id: "job_" + now().toString(36) + "_" + randomToken(4),
        schema: "OMEGA_MISSION_JOB_R32",
        action: "MISSION_CYCLE",
        profile: "AUTO_BUILD",
        projectPath: relativePath(body.draft?.projectPath) || ".",
        allowedDomains: body.draft?.allowedDomains || [],
        steps: validation.steps,
        targetDeviceId: target.id,
        status: "QUEUED",
        confirmed: true,
        queuedAt: now(),
        inputFingerprint: await sha256({ missionId, steps: validation.steps }),
      };
      jobs.push(job);
      const mission = {
        id: missionId,
        objective: text(body.objective).slice(0, 3000),
        threadId: text(body.threadId),
        status: "ACTIVE",
        targetDeviceId: target.id,
        allowedOps: Array.isArray(body.allowedOps) ? body.allowedOps.filter((x: string) => HYBRID_OPS.includes(x)) : [],
        maxCycles: clamp(body.maxCycles, 2, 8),
        cycle: 1,
        currentJobId: job.id,
        currentJob: job,
        createdAt: now(),
      };
      missions.push(mission);
      await Promise.all([
        this.put("jobs", jobs.slice(-120)),
        this.put("missions", missions.slice(-40)),
      ]);
      await this.event("MISSION_STARTED", `Governed mission ${missionId} started from an approved envelope.`, { missionId, jobId: job.id });
      return json({ ok: true, mission });
    }

    if (path.startsWith("/missions/") && request.method === "POST") {
      const parts = path.split("/");
      const id = safeId(parts[2], "");
      const action = parts[3];
      let missions = await this.get<any[]>("missions", []);
      let mission = missions.find(row => row.id === id);
      if (!mission) return json({ ok: false, code: "MISSION_NOT_FOUND" }, 404);
      if (action === "pause") mission = { ...mission, status: "PAUSED" };
      else if (action === "resume") mission = { ...mission, status: "ACTIVE" };
      else return json({ ok: false, code: "UNKNOWN_MISSION_ACTION" }, 404);
      missions = missions.map(row => row.id === id ? mission : row);
      await this.put("missions", missions);
      await this.event("MISSION_CONTROL", `Mission ${id} ${mission.status.toLowerCase()}.`, { missionId: id, status: mission.status });
      return json({ ok: true, mission });
    }

    if (path === "/thread" && request.method === "GET") {
      const thread = await this.get<any>("thread", null);
      return json({
        ok: true, thread,
        persistence: "DURABLE_MESSAGE_MEMORY",
        routeBeforeGeneration: true,
        memoryTurns: thread?.messages?.length || 0,
      });
    }

    if (path === "/turn" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as any;
      const prompt = text(body.prompt).slice(0, 16000);
      const assistantMessage = text(body.assistantMessage).slice(0, 24000);
      const execution = Boolean(body.execution);
      const plan = body.plan && typeof body.plan === "object" ? body.plan : null;
      const old = await this.get<any>("thread", null);
      const messages = Array.isArray(old?.messages) ? old.messages : [];
      const row = {
        id: "turn_" + now().toString(36),
        at: now(),
        kind: execution ? "ACTION" : "CONVERSATION",
        prompt,
        assistantMessage,
        requiresExecution: execution,
        plan: execution && plan ? {
          projectPath: relativePath(plan.projectPath) || ".",
          allowedDomains: Array.isArray(plan.allowedDomains) ? plan.allowedDomains.slice(0, 12) : [],
          steps: Array.isArray(plan.steps) ? plan.steps.slice(0, 24) : [],
        } : null,
      };
      messages.push(row);
      const trimmed = messages.slice(-48);
      const thread = {
        id: old?.id || ("thr_" + now().toString(36)),
        turnCount: Number(old?.turnCount || 0) + 1,
        updatedAt: now(),
        createdAt: old?.createdAt || now(),
        messages: trimmed,
        retention: {
          policy: "LAST_48_DURABLE_TURNS",
          dropped: Math.max(0, Number(old?.retention?.dropped || 0) + messages.length - trimmed.length),
        },
      };
      await this.put("thread", thread);
      await this.event(
        execution ? "AI_ACTION_PREPARED" : "AI_CONVERSATION",
        execution ? "SAI stored a governed action turn in durable project memory." : "SAI stored a conversational turn in durable project memory.",
        { threadId: thread.id, memoryTurns: trimmed.length },
      );
      return json({
        ok: true,
        thread,
        turn: { ...row, nextPromptHint: execution ? "Review the visible action sequence, then approve it against a proved paired host." : "Continue the same durable project thread." },
        draft: execution && row.plan ? { schema: "OMEGA_GOVERNED_ACTION_DRAFT_R33", state: "DRAFT_NOT_QUEUED", ...row.plan } : null,
      });
    }

    return json({ ok: false, code: "DO_ROUTE_NOT_FOUND" }, 404);
  }
}
