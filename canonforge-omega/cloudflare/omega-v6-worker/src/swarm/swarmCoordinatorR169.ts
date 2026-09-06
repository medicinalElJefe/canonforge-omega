import { AnyObj, DurableBinding, SwarmEnv, SWARM_CELL_COUNT, SWARM_LANE_COUNT, SWARM_MODEL_R121, clip, compactPlan, evidence, jsonResponse, modelText, num, planMission, publicMission, schedule, sha } from "./swarmCoreR169";

const RETURNED_NOT_ADMITTED = { proofState: "RETURNED_NOT_ADMITTED" } as const;

export class OmegaSwarmCoordinator {
  private storage: any; private env: SwarmEnv;
  constructor(state: any, env: SwarmEnv) { this.storage = state.storage; this.env = env; }
  private async ids(): Promise<string[]> { return (await this.storage.get("mission_ids")) || []; }
  private async get(id: string): Promise<AnyObj | null> { return await this.storage.get(`mission:${id}`) || null; }
  private async save(m: AnyObj): Promise<AnyObj> { await this.storage.put(`mission:${m.id}`, m); const ids = await this.ids(); if (!ids.includes(m.id)) await this.storage.put("mission_ids", [m.id, ...ids].slice(0, 48)); return m; }
  private executor(cell: AnyObj, mission: AnyObj): string {
    if (mission?.computation && cell.order === 0) return "COMPUTE_R170";
    if (cell.profile.domainRole === "PHYSICS" && cell.profile.phaseRole === "EXECUTE" && this.env?.OMEGA_GENESIS_MACHINE && this.env?.OMEGA_OPTICAL_MACHINE) return "OPTICAL_CHAIN";
    if (cell.profile.domainRole === "ORCHESTRATION" && cell.profile.phaseRole === "FRAME" && this.env?.OMEGA_GENESIS_MACHINE) return "GENESIS";
    if (cell.providerEligible && this.env?.AI?.run) return "WORKERS_AI";
    return "DETERMINISTIC";
  }
  private async dispatch(mission: AnyObj, cell: AnyObj): Promise<AnyObj> {
    const binding = this.env.OMEGA_SWARM_CELL as DurableBinding | undefined;
    if (!binding) return { cell, executor: "DETERMINISTIC", ok: false, status: 503, data: { code: "CELL_BINDING_UNAVAILABLE" } };
    const executor = this.executor(cell, mission), stub = binding.get(binding.idFromName(cell.id)), task = { schema: "OMEGA_SWARM_TASK_R121", missionId: mission.id, taskId: `${mission.id}:${cell.order}`, cellId: cell.id, index: cell.index, lane: cell.lane, intent: mission.intent, mode: mission.mode, executor, computation: executor === "COMPUTE_R170" ? mission.computation : null, evidence: mission.evidence || [], lineage: [`omega-v6:swarm:${mission.id}`, `organ:${cell.profile.domainRole}`, `branch:${cell.profile.phaseRole}`, `cell:${cell.id}`] }, response = await stub.fetch(new Request("https://swarm-cell.internal/task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(task) }));
    return { cell, executor, ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
  }
  private async process(id: string): Promise<AnyObj | null> {
    let m = await this.get(id); if (!m || !["QUEUED", "RUNNING"].includes(m.status)) return m;
    if (!this.env.OMEGA_SWARM_CELL) { m = { ...m, status: "FAILED", failed: m.total, proofState: "CELL_BINDING_UNAVAILABLE" }; return this.save(m); }
    const batchSize = m.mode === "PIPELINE" ? 1 : Math.min(24, m.pending.length), batch = m.pending.splice(0, batchSize); m.status = "RUNNING"; m.startedAt = m.startedAt || Date.now(); await this.save(m);
    const results = await Promise.all(batch.map((cell: AnyObj) => this.dispatch(m as AnyObj, cell).catch(error => ({ cell, executor: "UNKNOWN", ok: false, status: 500, data: { error: error instanceof Error ? error.message : String(error) } }))));
    for (const x of results) {
      m.completed += x.ok ? 1 : 0; m.failed += x.ok ? 0 : 1; m.organProcessed[x.cell.address.domain] = num(m.organProcessed[x.cell.address.domain]) + 1;
      const result = x.data?.result, summary = clip(result?.summary || result?.truthBoundary || x.data?.error || x.data?.code, 1200);
      m.recent.unshift({ cellId: x.cell.id, index: x.cell.index, organ: x.cell.profile.domainRole, phase: x.cell.profile.phaseRole, executor: x.executor, ok: x.ok, status: x.status, summary, receiptSha: x.data?.receipt?.resultSha256 || null, computeReceiptSha: result?.computeReceipt?.receiptSha256 || null }); m.recent = m.recent.slice(0, 36);
      if (x.executor === "WORKERS_AI" && x.ok && summary) m.providerOutputs.push({ cellId: x.cell.id, role: x.cell.profile.domainRole, summary }); m.providerOutputs = m.providerOutputs.slice(0, 12);
      if (x.executor === "COMPUTE_R170" && x.ok && result?.computation) m.computationOutputs.push({ cellId: x.cell.id, path: result.path, result: result.computation, computeReceipt: result.computeReceipt, authority: result.authority }); m.computationOutputs = m.computationOutputs.slice(0, 4);
    }
    if (m.pending.length) { await this.save(m); await schedule(this.storage, 500); return m; }
    m.status = m.completed ? "COMPLETE" : "FAILED"; m.completedAt = Date.now(); m.proofState = RETURNED_NOT_ADMITTED.proofState;
    if (m.providerOutputs.length && this.env?.AI?.run) {
      try { const contributions = m.providerOutputs.map((x: AnyObj) => `[${x.cellId} ${x.role}] ${x.summary}`).join("\n\n").slice(0, 16000), raw = await this.env.AI.run(SWARM_MODEL_R121, { messages: [{ role: "system", content: "Reconverge bounded OMEGA swarm contributions. Preserve contradictions and unresolved items. Do not convert interpretation into measurement, native execution, external evidence, or CanonState." }, { role: "user", content: `MISSION: ${m.intent}\n\nCONTRIBUTIONS:\n${contributions}` }], max_tokens: 700, temperature: 0.22, chat_template_kwargs: { enable_thinking: false } }), text = modelText(raw); if (text) m.finalSynthesis = { provider: SWARM_MODEL_R121, text: text.slice(0, 6000), authority: "MODEL_SYNTHESIS_NOT_CANON" }; }
      catch (error) { m.finalSynthesis = { provider: "FAILED", text: error instanceof Error ? error.message : String(error), authority: "NO_RESULT_FABRICATED" }; }
    }
    return this.save(m);
  }
  async alarm(): Promise<void> { for (const id of (await this.ids()).slice(0, 8)) { const m = await this.get(id); if (m && ["QUEUED", "RUNNING"].includes(m.status)) { await this.process(id); break; } } }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url), parts = url.pathname.split("/").filter(Boolean);
    if (request.method === "GET" && url.pathname === "/status") { const missions: AnyObj[] = []; for (const id of (await this.ids()).slice(0, 12)) { const m = await this.get(id); if (m) missions.push(publicMission(m) as AnyObj); } return jsonResponse({ ok: true, schema: "OMEGA_SWARM_STATUS_R121", runtimeRevision: "R121", recoveryRevision: "R169", computationRevision: "R170", cellCapacity: SWARM_CELL_COUNT, laneCapacity: SWARM_LANE_COUNT, active: missions.filter(x => ["QUEUED", "RUNNING"].includes(x.status)).length, missions, canonicalMutation: false }); }
    if (request.method === "POST" && url.pathname === "/missions") {
      try { const body = await request.json().catch(() => ({})) as AnyObj, plan = planMission(body), computation = body.computation && typeof body.computation === "object" ? { path: clip(body.computation.path, 160), input: body.computation.input && typeof body.computation.input === "object" ? body.computation.input : {} } : null, id = `swarm_${Date.now().toString(36)}_${(await sha(`${plan.intent}|${Date.now()}|${plan.seed}`)).slice(0, 12)}`, m: AnyObj = { schema: "OMEGA_SWARM_MISSION_R121", id, status: "QUEUED", mode: plan.mode, intent: plan.intent, requestedCells: plan.requestedCells, providerBudget: plan.providerBudget, createdAt: Date.now(), total: plan.selected.length, pending: [...plan.selected], completed: 0, failed: 0, organCounts: plan.organCounts, organProcessed: Array(12).fill(0), recent: [], providerOutputs: [], computation, computationOutputs: [], evidence: evidence(body.evidence), truthBoundary: plan.truthBoundary, proofState: "QUEUED_NOT_ADMITTED", canonicalMutation: false }; await this.save(m); await schedule(this.storage, 100); return jsonResponse({ ok: true, mission: publicMission(m), plan: { ...compactPlan(plan), computation: computation ? { path: computation.path, executor: "COMPUTE_R170_ON_FIRST_SELECTED_CELL", authority: "DERIVED_REFERENCE_COMPUTATION_NOT_CANON" } : null } }, 202); }
      catch (error) { return jsonResponse({ ok: false, code: error instanceof Error ? error.message : "MISSION_INVALID" }, 400); }
    }
    if (parts[0] === "missions" && parts[1]) { const id = parts[1]; if (request.method === "GET" && parts.length === 2) { const m = await this.get(id); return jsonResponse({ ok: Boolean(m), mission: publicMission(m) }, m ? 200 : 404); } if (request.method === "POST" && parts[2] === "tick") { const m = await this.process(id); return jsonResponse({ ok: Boolean(m), mission: publicMission(m) }, m ? 200 : 404); } }
    return jsonResponse({ ok: false, code: "NOT_FOUND" }, 404);
  }
}
