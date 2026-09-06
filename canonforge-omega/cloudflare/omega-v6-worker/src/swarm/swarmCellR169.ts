import { AnyObj, SwarmEnv, SWARM_MODEL_R121, CONTINUITY_LAW, capabilityProfile, clip, decodeCell, evidence, jsonResponse, modelText, num, parseCellId, sha } from "./swarmCoreR169";

function initialCell(address: AnyObj): AnyObj {
  const profile = capabilityProfile(address);
  return { schema: "OMEGA_SWARM_CELL_STATE_R121", id: profile.cellId, index: address.index, address: { domain: address.domain, phase: address.phase, regulation: address.regulation }, profile, status: "IDLE", missionId: null, heartbeatAt: null, completedTasks: 0, failedTasks: 0, scar: 0, lastReceipt: null, lastResultPreview: null, canonicalMutation: false };
}
function deterministic(task: AnyObj, address: AnyObj, profile: AnyObj): AnyObj {
  const intent = clip(task.intent || task.text), words = intent.split(/\s+/).filter(Boolean), ev = evidence(task.evidence);
  return { kind: "DETERMINISTIC_CELL_ANALYSIS", summary: `${profile.cellId} processed the mission through ${profile.domainRole}/${profile.phaseRole}/${profile.regulationRole}.`, metrics: { intentLength: intent.length, wordCount: words.length, evidencePackets: ev.length, evidenceWithHashes: ev.filter(x => x.sha256).length, localSeed: (address.index * 131 + intent.length * 17) % 100000 }, partition: { domain: profile.domainRole, phase: profile.phaseRole, regulation: profile.regulationRole }, evidence: ev.map(x => ({ id: x.id, type: x.type, sha256: x.sha256, authority: x.authority })), carry: { invariant: "operator intent + address + lineage + evidence identities", scar: "local failures remain scar until recovery" }, continuityLaw: CONTINUITY_LAW, truthBoundary: "Deterministic swarm decomposition is instrumentation. Operator evidence retains its authority label and is not promoted into measurement or canonical truth." };
}
async function runCellTask(env: SwarmEnv, task: AnyObj, address: AnyObj, profile: AnyObj): Promise<AnyObj> {
  const executor = String(task.executor || "DETERMINISTIC");
  if (executor === "WORKERS_AI") {
    if (!env?.AI?.run) return { kind: "PROVIDER_GATED", summary: "Workers AI binding unavailable; no model result fabricated.", authority: "NO_RESULT_FABRICATED" };
    const ev = evidence(task.evidence), system = `You are bounded OMEGA swarm cell ${profile.cellId}. Role ${profile.domainRole}; phase ${profile.phaseRole}; regulation ${profile.regulationRole}. Return a specialist contribution, not a canonical conclusion. Preserve evidence authority and unresolved claims. 12/144/1728/20736 are address-resolution levels, not physical dimensions. Never claim PC execution, measurement, RCWA/FDTD, external research, or CanonState mutation unless explicit evidence supports it.`, user = `${clip(task.intent || task.text, 7000)}\n\nEVIDENCE:\n${ev.map(x => `- ${x.id} [${x.type}] ${x.summary} (${x.authority})`).join("\n").slice(0, 6000)}`;
    const raw = await env.AI.run(SWARM_MODEL_R121, { messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 520, temperature: 0.24, chat_template_kwargs: { enable_thinking: false } }), text = modelText(raw);
    return text ? { kind: "WORKERS_AI_CELL_SYNTHESIS", provider: SWARM_MODEL_R121, summary: text.slice(0, 3600), evidenceCount: ev.length, authority: "MODEL_SYNTHESIS_NOT_CANON" } : { kind: "PROVIDER_GATED", summary: "Workers AI returned no usable text; no result fabricated.", authority: "NO_RESULT_FABRICATED" };
  }
  if (executor === "GENESIS") {
    if (!env?.OMEGA_GENESIS_MACHINE?.fetch) return { kind: "SERVICE_GATED", summary: "Genesis proposal-machine binding unavailable; no proposal result fabricated.", authority: "NO_RESULT_FABRICATED" };
    const response = await env.OMEGA_GENESIS_MACHINE.fetch(new Request("https://genesis.internal/api/federation/propose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ intent: clip(task.intent || task.text, 4000), evidence: evidence(task.evidence), ceremony_id: task.missionId || task.taskId || "swarm-r169" }) }));
    return { kind: "GENESIS_MACHINE", ok: response.ok, status: response.status, data: await response.json().catch(() => null), authority: "PROPOSAL_NOT_CANON" };
  }
  if (executor === "OPTICAL_CHAIN") {
    if (!env?.OMEGA_GENESIS_MACHINE?.fetch || !env?.OMEGA_OPTICAL_MACHINE?.fetch) return { kind: "SERVICE_GATED", summary: "Optical federation bindings unavailable; RCWA/FDTD/FEM or fabrication-grade validation was not claimed.", authority: "NO_RESULT_FABRICATED" };
    const proposalResponse = await env.OMEGA_GENESIS_MACHINE.fetch(new Request("https://genesis.internal/api/federation/propose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ intent: clip(task.intent || task.text, 4000), evidence: evidence(task.evidence), ceremony_id: task.missionId || task.taskId || "swarm-r169" }) })), proposed = await proposalResponse.json().catch(() => null) as AnyObj | null, proposal = proposed?.packet;
    if (!proposal) return { kind: "OPTICAL_CHAIN_FAILED", stage: "PROPOSE", status: proposalResponse.status, authority: "NO_RESULT_FABRICATED" };
    const screenResponse = await env.OMEGA_OPTICAL_MACHINE.fetch(new Request("https://optical.internal/api/federation/screen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ proposal, evidence: evidence(task.evidence) }) }));
    return { kind: "OPTICAL_MACHINE_CHAIN", ok: screenResponse.ok, status: screenResponse.status, proposal, screen: await screenResponse.json().catch(() => null), authority: "SCREENING_NOT_FABRICATION_VALIDATION", truthBoundary: "Reduced-order screening only unless an explicit full-wave solver receipt proves otherwise." };
  }
  return deterministic(task, address, profile);
}

export class OmegaSwarmCell {
  private storage: any; private env: SwarmEnv;
  constructor(state: any, env: SwarmEnv) { this.storage = state.storage; this.env = env; }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/state") return jsonResponse({ ok: true, cell: (await this.storage.get("cell")) || { schema: "OMEGA_SWARM_CELL_STATE_R121", status: "UNINITIALIZED", canonicalMutation: false } });
    if (request.method !== "POST" || url.pathname !== "/task") return jsonResponse({ ok: false, code: "NOT_FOUND" }, 404);
    const task = await request.json().catch(() => ({})) as AnyObj, address = parseCellId(task.cellId) || decodeCell(task.index || 0), profile = capabilityProfile(address), base = (await this.storage.get("cell")) || initialCell(address), started = Date.now(), taskId = clip(task.taskId || `${task.missionId || "mission"}:${profile.cellId}:${started}`, 220), evidenceIds = evidence(task.evidence).map(x => ({ id: x.id, sha256: x.sha256, authority: x.authority }));
    await this.storage.put("cell", { ...base, ...initialCell(address), status: "WORKING", missionId: clip(task.missionId, 180) || null, taskId, heartbeatAt: started, lastStartedAt: started, completedTasks: num(base.completedTasks), failedTasks: num(base.failedTasks), scar: num(base.scar), evidence: evidenceIds });
    try {
      const result = await runCellTask(this.env, task, address, profile), completed = Date.now(), receipt = { schema: "OMEGA_SWARM_CELL_RECEIPT_R121", taskId, missionId: clip(task.missionId, 180) || null, cellId: profile.cellId, index: address.index, lane: Number.isFinite(Number(task.lane)) ? Number(task.lane) : null, executor: task.executor || "DETERMINISTIC", evidence: evidenceIds, startedAt: started, completedAt: completed, runtimeMs: completed - started, resultSha256: await sha(result), lineage: [...(Array.isArray(task.lineage) ? task.lineage.slice(-12) : []), `swarm:${profile.cellId}:complete`], canonicalMutation: false }, next = { ...base, ...initialCell(address), status: "IDLE", heartbeatAt: completed, lastCompletedAt: completed, completedTasks: num(base.completedTasks) + 1, failedTasks: num(base.failedTasks), scar: Math.max(0, num(base.scar) * 0.96), lastReceipt: receipt, lastResultPreview: { kind: result.kind, summary: clip(result.summary || result.truthBoundary || result.authority, 1000), provider: result.provider || null, evidenceCount: evidenceIds.length } };
      await this.storage.put("cell", next); return jsonResponse({ ok: true, cell: next, receipt, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error), next = { ...base, ...initialCell(address), status: "FAILED", heartbeatAt: Date.now(), completedTasks: num(base.completedTasks), failedTasks: num(base.failedTasks) + 1, scar: Math.min(1, num(base.scar) + 0.08), evidence: evidenceIds, lastResultPreview: { kind: "ERROR", summary: message.slice(0, 1000), evidenceCount: evidenceIds.length } };
      await this.storage.put("cell", next); return jsonResponse({ ok: false, code: "CELL_EXECUTION_FAILED", cell: next, error: message }, 500);
    }
  }
}
