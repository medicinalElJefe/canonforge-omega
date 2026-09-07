import { OmegaRuntime as BaseOmegaRuntime } from "./omegaRuntime";

export const HYBRID_RETURN_ADMISSION_R203 = "r203-verified-hybrid-return-admission";
export const HYBRID_RETURN_VERIFICATION_SCHEMA_R203 = "OMEGA_HYBRID_RETURN_VERIFICATION_R203";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const MAX_HOST_RECEIPT_BYTES = 128 * 1024;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
const text = (value: unknown) => String(value ?? "").trim();
const now = () => Date.now();

function safeId(value: unknown, fallback = ""): string {
  const source = text(value).slice(0, 160);
  return /^[A-Za-z0-9._:-]+$/.test(source) ? source : fallback;
}

function relativePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const source = value.trim().replace(/\\/g, "/");
  if (!source || source === ".") return ".";
  if (source.startsWith("/") || /^[A-Za-z]:/.test(source) || source.split("/").includes("..") || source.includes("\0")) return null;
  return source.split("/").filter(Boolean).join("/") || ".";
}

function canonicalJson(value: any): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (typeof value === "object") return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  return "null";
}

async function sha256Text(source: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function appendLifecycle(job: any, state: string, data: Record<string, unknown> = {}) {
  return [...(Array.isArray(job?.lifecycle) ? job.lifecycle : []), { state, at: now(), ...data }].slice(-40);
}

function normalizeOutputs(value: unknown): { outputs: string[]; errors: string[] } {
  const outputs: string[] = [];
  const errors: string[] = [];
  const rows = Array.isArray(value) ? value.slice(0, 40) : [];
  for (let index = 0; index < rows.length; index++) {
    const normalized = relativePath(rows[index]);
    if (!normalized) errors.push(`output ${index + 1}: unsafe or non-string relative path`);
    else outputs.push(normalized);
  }
  return { outputs, errors };
}

function sameStringArray(a: unknown, b: string[]): boolean {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  for (let index = 0; index < b.length; index++) if (relativePath(a[index]) !== b[index]) return false;
  return true;
}

export class OmegaRuntime extends BaseOmegaRuntime {
  async state() {
    const base: any = await super.state();
    const jobs = await this.get<any[]>("jobs", []);
    const latestVerified = jobs.filter(row => row?.returnVerification?.verified === true).at(-1) || null;
    return {
      ...base,
      serverRevision: HYBRID_RETURN_ADMISSION_R203,
      returnAdmissionR203: {
        schema: HYBRID_RETURN_VERIFICATION_SCHEMA_R203,
        authenticatedBridgeRequired: true,
        explicitBooleanOutcomeRequired: true,
        fullQueuedStepLineageRequiredForSuccess: true,
        orderedStepIdentityAndOperationChecked: true,
        unsafeOutputPathsRejected: true,
        serverCanonicalReceiptSha256Required: true,
        hostCanonicalReceiptIndependentlyCheckedWhenPresent: true,
        hostFingerprintAloneIsAuthority: false,
        missionCompletionRequiresVerifiedSuccessfulReturn: true,
        hostCryptographicAttestationClaimed: false,
        truthBoundary: "R203 proves authenticated software-return admission and server-side receipt integrity. It does not convert an authenticated software agent into hardware attestation or fabricate execution evidence absent returned step proofs.",
      },
      latestVerifiedReturnR203: latestVerified ? {
        jobId: latestVerified.id,
        deviceId: latestVerified.targetDeviceId,
        status: latestVerified.status,
        completedAt: latestVerified.completedAt,
        verificationTier: latestVerified.returnVerification?.verificationTier || null,
        serverReceiptSha256: latestVerified.returnVerification?.serverReceiptSha256 || null,
      } : null,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    if (path === "/agent/result" && request.method === "POST") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const body = await request.json().catch(() => ({})) as any;
      const jobId = safeId(body.jobId, "");
      const deviceId = safeId(body.deviceId, "");
      let jobs = await this.get<any[]>("jobs", []);
      const target = jobs.find(row => row.id === jobId && row.targetDeviceId === deviceId);
      if (!target) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);

      const errors: string[] = [];
      if (typeof body.ok !== "boolean") errors.push("explicit boolean ok outcome required");
      const success = body.ok === true;
      const returnedState = success ? "RETURNED_SUCCESS" : "RETURNED_FAILURE";
      if (body.returnedState !== undefined && text(body.returnedState) !== returnedState) errors.push("returnedState does not match explicit ok outcome");

      const expectedSteps = Array.isArray(target.steps) ? target.steps.slice(0, 24) : [];
      const proofs = Array.isArray(body.stepProofs) ? body.stepProofs.slice(0, 24) : [];
      if (success && expectedSteps.length === 0) errors.push("successful return cannot complete an empty queued job");
      if (success && proofs.length !== expectedSteps.length) errors.push("successful return requires proof for every queued step");
      if (proofs.length > expectedSteps.length) errors.push("return contains more step proofs than the queued job");

      const stepReceipts: any[] = [];
      for (let index = 0; index < proofs.length; index++) {
        const proof = proofs[index] || {};
        const expected = expectedSteps[index] || {};
        const expectedId = text(expected.id);
        const proofId = text(proof.id);
        const expectedOp = text(expected.op).toUpperCase();
        const proofOp = text(proof.op).toUpperCase();
        if (expectedId && proofId !== expectedId) errors.push(`step ${index + 1}: proof id mismatch`);
        if (!expectedOp || proofOp !== expectedOp) errors.push(`step ${index + 1}: proof operation mismatch`);
        if (typeof proof.ok !== "boolean") errors.push(`step ${index + 1}: explicit proof outcome required`);
        if (success && proof.ok !== true) errors.push(`step ${index + 1}: failed proof cannot support successful return`);
        stepReceipts.push({ index, id: proofId || expectedId || null, op: proofOp || expectedOp || null, ok: proof.ok === true, proofSha256: await sha256Text(canonicalJson(proof)) });
      }

      const normalized = normalizeOutputs(body.outputPaths);
      errors.push(...normalized.errors);
      const hostFingerprint = text(body.resultFingerprint).toLowerCase();
      if (hostFingerprint && !/^[0-9a-f]{64}$/.test(hostFingerprint)) errors.push("host resultFingerprint must be SHA-256 hex when supplied");

      let hostReceiptVerified = false;
      let hostReceiptSchema: string | null = null;
      let hostReceiptObservedSha256: string | null = null;
      const hostCanonical = typeof body.receiptCanonicalJson === "string" ? body.receiptCanonicalJson : "";
      if (hostCanonical) {
        if (new TextEncoder().encode(hostCanonical).byteLength > MAX_HOST_RECEIPT_BYTES) errors.push("host canonical receipt exceeds bounded size");
        else {
          let receipt: any = null;
          try { receipt = JSON.parse(hostCanonical); } catch { errors.push("host canonical receipt is not valid JSON"); }
          if (receipt) {
            hostReceiptSchema = text(receipt.schema) || null;
            hostReceiptObservedSha256 = await sha256Text(hostCanonical);
            if (!hostFingerprint || hostReceiptObservedSha256 !== hostFingerprint) errors.push("host canonical receipt SHA-256 mismatch");
            if (safeId(receipt.jobId, "") !== jobId) errors.push("host receipt jobId mismatch");
            if (safeId(receipt.deviceId, "") !== deviceId) errors.push("host receipt deviceId mismatch");
            if (Boolean(receipt.ok) !== success) errors.push("host receipt outcome mismatch");
            if (text(receipt.returnedState) !== returnedState) errors.push("host receipt returnedState mismatch");
            if (Number(receipt.stepCount) !== proofs.length) errors.push("host receipt step count mismatch");
            const hostSteps = Array.isArray(receipt.stepReceipts) ? receipt.stepReceipts : [];
            if (hostSteps.length !== stepReceipts.length) errors.push("host receipt step lineage length mismatch");
            else for (let index = 0; index < stepReceipts.length; index++) {
              const hostStep = hostSteps[index] || {};
              const serverStep = stepReceipts[index];
              if (text(hostStep.id) !== text(serverStep.id) || text(hostStep.op).toUpperCase() !== text(serverStep.op).toUpperCase() || Boolean(hostStep.ok) !== Boolean(serverStep.ok) || text(hostStep.proofSha256).toLowerCase() !== serverStep.proofSha256) errors.push(`host receipt step ${index + 1} digest mismatch`);
            }
            if (!sameStringArray(receipt.outputPaths, normalized.outputs)) errors.push("host receipt output path mismatch");
            hostReceiptVerified = errors.length === 0;
          }
        }
      }

      const admissionCore = {
        schema: "OMEGA_SERVER_RETURN_ADMISSION_CORE_R203",
        release: HYBRID_RETURN_ADMISSION_R203,
        jobId,
        deviceId,
        inputFingerprint: text(target.inputFingerprint) || null,
        executionId: text(body.executionId).slice(0, 160) || null,
        returnedState,
        stepReceipts,
        outputPaths: normalized.outputs,
        logSha256: await sha256Text(text(body.log).slice(-12000)),
        evaluationSha256: body.evaluation == null ? null : await sha256Text(canonicalJson(body.evaluation)),
        promotionSha256: body.promotion == null ? null : await sha256Text(canonicalJson(body.promotion)),
        hostResultFingerprint: hostFingerprint || null,
        hostReceiptSchema,
        hostReceiptObservedSha256,
        hostReceiptVerified,
      };
      const serverReceiptSha256 = await sha256Text(canonicalJson(admissionCore));

      if (target.returnVerification?.verified === true) {
        if (target.returnVerification.serverReceiptSha256 === serverReceiptSha256) return json({ ok: true, idempotent: true, job: target, returnVerification: target.returnVerification });
        return json({ ok: false, code: "RESULT_CONFLICT", existingServerReceiptSha256: target.returnVerification.serverReceiptSha256, receivedServerReceiptSha256: serverReceiptSha256 }, 409);
      }

      if (errors.length) {
        const rejectedAt = now();
        const verification = { verified: false, schema: HYBRID_RETURN_VERIFICATION_SCHEMA_R203, release: HYBRID_RETURN_ADMISSION_R203, state: "RETURN_REJECTED_R203", errors, serverReceiptSha256, hostResultFingerprint: hostFingerprint || null, hostReceiptObservedSha256, hostReceiptVerified: false, hostCryptographicAttestationClaimed: false };
        jobs = jobs.map(row => row.id === jobId ? { ...row, status: "RETURN_REJECTED", heldAt: rejectedAt, needsReview: true, returnVerification: verification, lifecycle: appendLifecycle(row, "RETURN_REJECTED_R203", { deviceId, serverReceiptSha256 }) } : row);
        await this.put("jobs", jobs);
        let missions = await this.get<any[]>("missions", []);
        let missionChanged = false;
        missions = missions.map(mission => {
          if (mission.currentJobId !== jobId) return mission;
          missionChanged = true;
          return { ...mission, currentJob: jobs.find(row => row.id === jobId), status: "HOLD_REPAIR_REQUIRED", heldAt: rejectedAt, needsReview: true, lastProof: verification };
        });
        if (missionChanged) await this.put("missions", missions);
        await this.event("JOB_RETURN_REJECTED", `Job ${jobId} failed R203 authenticated return admission.`, { jobId, deviceId, errors, serverReceiptSha256 });
        return json({ ok: false, code: "RETURN_VERIFICATION_FAILED", errors, job: jobs.find(row => row.id === jobId) }, 400);
      }

      const completedAt = now();
      const finalStatus = success ? "COMPLETE" : "FAILED";
      const verification = {
        verified: true,
        schema: HYBRID_RETURN_VERIFICATION_SCHEMA_R203,
        release: HYBRID_RETURN_ADMISSION_R203,
        state: success ? "RETURN_VERIFIED_SUCCESS_R203" : "RETURN_VERIFIED_FAILURE_R203",
        verificationTier: hostReceiptVerified ? "HOST_HASH_BOUND_PLUS_SERVER_ADMISSION" : "AUTHENTICATED_SERVER_HASH_BOUND_ADMISSION",
        verifiedAt: completedAt,
        serverReceiptSha256,
        hostResultFingerprint: hostFingerprint || null,
        hostReceiptSchema,
        hostReceiptObservedSha256,
        hostReceiptVerified,
        completionBasis: success ? "FULL_QUEUED_STEP_LINEAGE_VERIFIED" : "AUTHENTICATED_FAILURE_RETURN_VERIFIED",
        hostCryptographicAttestationClaimed: false,
      };
      const packet = { schema: "OMEGA_HYBRID_RETURN_PACKET_R203", release: HYBRID_RETURN_ADMISSION_R203, receivedAt: completedAt, deviceId, executionId: text(body.executionId).slice(0, 160) || null, returnedState, stepProofs: proofs, outputPaths: normalized.outputs, log: text(body.log).slice(-12000), evaluation: body.evaluation ?? null, promotion: body.promotion ?? null, resultFingerprint: hostFingerprint || null, serverAdmissionCore: admissionCore, verification };
      jobs = jobs.map(row => row.id === jobId ? { ...row, status: finalStatus, completedAt, heldAt: finalStatus === "FAILED" ? completedAt : undefined, needsReview: finalStatus === "FAILED", returnPacket: packet, returnVerification: verification, outputPaths: normalized.outputs, log: packet.log, lifecycle: [...appendLifecycle(row, returnedState, { deviceId, serverReceiptSha256 }), { state: verification.state, at: completedAt, deviceId, serverReceiptSha256 }].slice(-40) } : row);
      await this.put("jobs", jobs);
      await this.event("JOB_RETURN_VERIFIED", `Job ${jobId} passed R203 return admission as ${finalStatus}.`, { jobId, deviceId, finalStatus, verificationTier: verification.verificationTier, serverReceiptSha256 });

      let missions = await this.get<any[]>("missions", []);
      let missionChanged = false;
      missions = missions.map(mission => {
        if (mission.currentJobId !== jobId) return mission;
        missionChanged = true;
        const complete = finalStatus === "COMPLETE" && verification.verified === true;
        const history = [...(mission.cycles || []), { cycle: mission.cycle, jobId, status: finalStatus, returnVerification: verification.state, serverReceiptSha256, completedAt }].slice(-8);
        return { ...mission, currentJob: jobs.find(row => row.id === jobId), cycles: history, status: complete ? "COMPLETE" : "HOLD_REPAIR_REQUIRED", completedAt: complete ? completedAt : undefined, heldAt: complete ? undefined : completedAt, needsReview: !complete, lastProof: packet };
      });
      if (missionChanged) {
        await this.put("missions", missions);
        const mission = missions.find(row => row.currentJobId === jobId);
        await this.event(mission?.status === "COMPLETE" ? "MISSION_COMPLETE" : "MISSION_HELD", mission?.status === "COMPLETE" ? `Mission ${mission.id} completed only after R203 verified successful return admission.` : `Mission ${mission?.id} held after a verified failed host return.`, { missionId: mission?.id, jobId, serverReceiptSha256 });
      }
      return json({ ok: true, job: jobs.find(row => row.id === jobId), mission: missionChanged ? missions.find(row => row.currentJobId === jobId) : undefined, returnVerification: verification });
    }

    if (path.startsWith("/jobs/") && path.endsWith("/receipt") && request.method === "GET") {
      if (!await this.authorized(request)) return json({ ok: false, code: "PAIR_AUTH_FAILED" }, 401);
      const jobId = safeId(path.split("/")[2], "");
      const jobs = await this.get<any[]>("jobs", []);
      const job = jobs.find(row => row.id === jobId);
      if (!job) return json({ ok: false, code: "JOB_NOT_FOUND" }, 404);
      return json({ ok: true, schema: "OMEGA_HYBRID_JOB_RECEIPT_R203", release: HYBRID_RETURN_ADMISSION_R203, jobId, status: job.status, lifecycle: job.lifecycle || [], returnPacket: job.returnPacket || null, returnVerification: job.returnVerification || null, authority: "AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE", canonicalMutation: false, promotionAuthorized: false });
    }

    return super.fetch(request);
  }
}