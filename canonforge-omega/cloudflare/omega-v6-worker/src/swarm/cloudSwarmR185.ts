import {
  AnyObj,
  SwarmEnv,
  capabilityProfile,
  decodeCell,
  jsonResponse,
  sha,
} from "./swarmCoreR169";

export const CLOUD_SWARM_REVISION_R185 = "R185";
export const CLOUD_SWARM_SCHEMA_R185 = "OMEGA_172_CLOUD_FEDERATION_R185";
export const CLOUD_SWARM_NODE_COUNT_R185 = 172;
export const CLOUD_SWARM_WAVE_SIZE_R185 = 12;

const STRATA = Object.freeze([
  "CONTROL_AND_ORCHESTRATION",
  "COMPUTE_AND_BUILD",
  "VALIDATION_AND_PROOF",
  "DELIVERY_AND_RECOVERY",
]);

const EXECUTORS = new Set(["DETERMINISTIC", "COMPUTE_R170", "WORKERS_AI", "GENESIS", "OPTICAL_CHAIN"]);

const clip = (value: any, limit = 5000) => String(value ?? "").trim().slice(0, limit);
const nodeId = (n: number) => `omega-cloud-${String(n).padStart(3, "0")}`;
const durableName = (n: number) => `omega-cloud-r185-${String(n).padStart(3, "0")}`;
const routeId = (n: number) => String(n).padStart(3, "0");
const nodeNumber = (value: string): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= CLOUD_SWARM_NODE_COUNT_R185 ? n : null;
};

function mappedCellIndex(n: number): number {
  // 137 is coprime to 1,728, so the first 172 nodes are unique and spread over the existing swarm lattice.
  return ((n - 1) * 137) % 1728;
}

function treeParent(n: number): number | null {
  return n <= 1 ? null : Math.floor(n / 2);
}

function treeChildren(n: number): number[] {
  return [n * 2, n * 2 + 1].filter((x) => x <= CLOUD_SWARM_NODE_COUNT_R185);
}

function crossStratumPeers(n: number): number[] {
  const column = ((n - 1) % 43) + 1;
  const out: number[] = [];
  for (let stratum = 0; stratum < 4; stratum++) {
    const candidate = stratum * 43 + column;
    if (candidate !== n && candidate <= CLOUD_SWARM_NODE_COUNT_R185) out.push(candidate);
  }
  return out;
}

export function cloudNodeDescriptorR185(n: number, origin: string): AnyObj {
  if (n < 1 || n > CLOUD_SWARM_NODE_COUNT_R185) throw new Error("CLOUD_NODE_OUT_OF_RANGE");
  const index = mappedCellIndex(n);
  const address = decodeCell(index);
  const profile = capabilityProfile(address);
  const stratum = Math.floor((n - 1) / 43) + 1;
  const column = ((n - 1) % 43) + 1;
  const id = nodeId(n);
  const rid = routeId(n);
  const parent = treeParent(n);
  const children = treeChildren(n);
  const ringPrevious = n === 1 ? CLOUD_SWARM_NODE_COUNT_R185 : n - 1;
  const ringNext = n === CLOUD_SWARM_NODE_COUNT_R185 ? 1 : n + 1;
  const peers = crossStratumPeers(n);
  return {
    schema: "OMEGA_CLOUD_NODE_DESCRIPTOR_R185",
    revision: CLOUD_SWARM_REVISION_R185,
    id,
    ordinal: n,
    stratum,
    stratumRole: STRATA[stratum - 1],
    column,
    mappedSwarmCell: {
      index,
      cellId: profile.cellId,
      address,
      domainRole: profile.domainRole,
      phaseRole: profile.phaseRole,
      regulationRole: profile.regulationRole,
    },
    topology: {
      parent: parent ? nodeId(parent) : null,
      children: children.map(nodeId),
      ringPrevious: nodeId(ringPrevious),
      ringNext: nodeId(ringNext),
      crossStratumPeers: peers.map(nodeId),
    },
    durableObjectName: durableName(n),
    links: {
      public: `${origin}/cloud/${rid}`,
      machine: `${origin}/api/clouds/r185/node/${rid}`,
      task: `${origin}/api/clouds/r185/node/${rid}/task`,
    },
    independentStateBackend: "named OmegaSwarmCell Durable Object instance",
    federationMembership: "OMEGA_172_CLOUD_FEDERATION_R185",
    authority: "DISTRIBUTED_EXECUTION_NODE_NOT_CANON",
    canonicalMutation: false,
    separateCloudProviderInstanceClaim: false,
    physicalDimensionClaim: false,
  };
}

export function cloudWavePlanR185(origin: string): AnyObj[] {
  const waves: AnyObj[] = [];
  for (let start = 1, wave = 0; start <= CLOUD_SWARM_NODE_COUNT_R185; start += CLOUD_SWARM_WAVE_SIZE_R185, wave++) {
    const end = Math.min(CLOUD_SWARM_NODE_COUNT_R185, start + CLOUD_SWARM_WAVE_SIZE_R185 - 1);
    waves.push({
      wave,
      nodeOrdinals: Array.from({ length: end - start + 1 }, (_, i) => start + i),
      nodeIds: Array.from({ length: end - start + 1 }, (_, i) => nodeId(start + i)),
      links: Array.from({ length: end - start + 1 }, (_, i) => `${origin}/api/clouds/r185/node/${routeId(start + i)}`),
    });
  }
  return waves;
}

export async function cloudManifestR185(origin: string, env?: SwarmEnv): Promise<AnyObj> {
  const nodes = Array.from({ length: CLOUD_SWARM_NODE_COUNT_R185 }, (_, i) => cloudNodeDescriptorR185(i + 1, origin));
  const waves = cloudWavePlanR185(origin);
  const core = {
    schema: CLOUD_SWARM_SCHEMA_R185,
    revision: CLOUD_SWARM_REVISION_R185,
    nodeCount: nodes.length,
    allNodesConfigured: nodes.length === CLOUD_SWARM_NODE_COUNT_R185,
    edgeRuntime: "Cloudflare Worker",
    stateRuntime: "172 independently named OmegaSwarmCell Durable Object instances",
    durableObjectBindingAvailable: Boolean(env?.OMEGA_SWARM_CELL),
    hierarchy: {
      cloudNodes: CLOUD_SWARM_NODE_COUNT_R185,
      strata: 4,
      columnsPerStratum: 43,
      mappedUnderlyingSwarmCells: CLOUD_SWARM_NODE_COUNT_R185,
      underlyingOmegaCells: 1728,
      underlyingOmegaLanes: 20736,
    },
    topology: {
      tree: "binary parent/child command spine",
      ring: "172-node continuity ring",
      crossStratum: "same-column four-stratum peer mesh",
      waveSize: CLOUD_SWARM_WAVE_SIZE_R185,
      fullMissionWaveCount: waves.length,
    },
    developmentLoop: {
      continuity: "R182",
      successorSuperiority: "R183",
      exactDesignDiscovery: "R184",
      federation: "R185",
      law: "shape -> execute -> measure -> compare predecessor -> preserve capabilities -> detect superiority -> bind exact design -> release intent -> verify/deploy -> carry scar -> continue",
      automaticProductionMutation: false,
      proofGatedPromotion: true,
    },
    routes: {
      publicIndex: `${origin}/cloud`,
      manifest: `${origin}/api/clouds/r185/manifest`,
      health: `${origin}/api/clouds/r185/health`,
      plan: `${origin}/api/clouds/r185/plan`,
      mission: `${origin}/api/clouds/r185/mission`,
    },
    waves,
    nodes,
    truthBoundary: "R185 creates 172 distinct public/machine cloud-node URLs backed by 172 independently named Durable Object state identities inside the canonical OMEGA Worker. It does not claim 172 separate Cloudflare accounts, separate providers, physical dimensions, or independent machines. Production authority remains proof-gated.",
    canonicalMutation: false,
  };
  return { ...core, manifestSha256: await sha(core) };
}

async function nodeStateR185(n: number, env: SwarmEnv): Promise<AnyObj> {
  if (!env.OMEGA_SWARM_CELL) {
    return { reachable: false, code: "OMEGA_SWARM_CELL_BINDING_UNAVAILABLE", nodeId: nodeId(n) };
  }
  try {
    const binding = env.OMEGA_SWARM_CELL;
    const stub = binding.get(binding.idFromName(durableName(n)));
    const response = await stub.fetch(new Request("https://cloud-node.internal/state", { method: "GET" }));
    const data = await response.json().catch(() => null) as AnyObj | null;
    return { reachable: response.ok, status: response.status, state: data?.cell || null };
  } catch (error) {
    return { reachable: false, status: 500, error: error instanceof Error ? error.message : String(error) };
  }
}

async function executeNodeTaskR185(n: number, input: AnyObj, env: SwarmEnv, missionId: string): Promise<AnyObj> {
  if (!env.OMEGA_SWARM_CELL) return { ok: false, nodeId: nodeId(n), code: "OMEGA_SWARM_CELL_BINDING_UNAVAILABLE" };
  const descriptor = cloudNodeDescriptorR185(n, "https://omegav6.jeffdeweyeljefe.workers.dev");
  const mapped = descriptor.mappedSwarmCell;
  const executorRaw = String(input.executor || "DETERMINISTIC").toUpperCase();
  const executor = EXECUTORS.has(executorRaw) ? executorRaw : "DETERMINISTIC";
  const taskId = clip(input.taskId || `${missionId}:${nodeId(n)}`, 220);
  try {
    const binding = env.OMEGA_SWARM_CELL;
    const stub = binding.get(binding.idFromName(durableName(n)));
    const response = await stub.fetch(new Request("https://cloud-node.internal/task", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        schema: "OMEGA_CLOUD_NODE_TASK_R185",
        missionId,
        taskId,
        cellId: mapped.cellId,
        index: mapped.index,
        lane: (n - 1) % 12,
        intent: clip(input.intent || input.text, 7000),
        executor,
        computation: input.computation || undefined,
        computationReceipt: input.computationReceipt || undefined,
        evidence: Array.isArray(input.evidence) ? input.evidence.slice(0, 16) : [],
        lineage: [
          ...(Array.isArray(input.lineage) ? input.lineage.slice(-8) : []),
          `r185:${nodeId(n)}`,
          `stratum:${descriptor.stratum}`,
          `mapped-cell:${mapped.cellId}`,
        ],
      }),
    }));
    const data = await response.json().catch(() => null) as AnyObj | null;
    return {
      ok: response.ok && data?.ok === true,
      nodeId: nodeId(n),
      ordinal: n,
      mappedCellId: mapped.cellId,
      status: response.status,
      receipt: data?.receipt || null,
      result: data?.result || null,
      cell: data?.cell || null,
      deduplicated: data?.deduplicated === true,
    };
  } catch (error) {
    return { ok: false, nodeId: nodeId(n), ordinal: n, status: 500, error: error instanceof Error ? error.message : String(error) };
  }
}

async function dispatchWaveR185(input: AnyObj, env: SwarmEnv, origin: string): Promise<Response> {
  const intent = clip(input.intent || input.text, 7000);
  if (!intent) return jsonResponse({ ok: false, code: "INTENT_REQUIRED", revision: CLOUD_SWARM_REVISION_R185 }, 400);
  const waves = cloudWavePlanR185(origin);
  const wave = Number.isInteger(Number(input.wave)) ? Number(input.wave) : 0;
  if (wave < 0 || wave >= waves.length) return jsonResponse({ ok: false, code: "WAVE_OUT_OF_RANGE", waveCount: waves.length }, 400);
  const selected = waves[wave].nodeOrdinals as number[];
  const missionId = clip(input.missionId || `r185_${Date.now().toString(36)}_${(await sha(intent)).slice(0, 12)}`, 220);
  const startedAt = Date.now();
  const results = await Promise.all(selected.map((n) => executeNodeTaskR185(n, { ...input, intent }, env, missionId)));
  const successful = results.filter((row) => row.ok);
  const receiptCore = {
    schema: "OMEGA_CLOUD_WAVE_RECEIPT_R185",
    revision: CLOUD_SWARM_REVISION_R185,
    missionId,
    wave,
    totalWaves: waves.length,
    requestedNodes: selected.length,
    successfulNodes: successful.length,
    failedNodes: selected.length - successful.length,
    nodeIds: selected.map(nodeId),
    nodeResultHashes: results.map((row) => row.receipt?.resultSha256 || null),
    startedAt,
    completedAt: Date.now(),
    nextWave: wave + 1 < waves.length ? wave + 1 : null,
    full172Complete: wave === waves.length - 1,
    canonicalMutation: false,
    authority: "R185_DISTRIBUTED_EXECUTION_RECEIPT_NOT_CANON",
  };
  const receipt = { ...receiptCore, receiptSha256: await sha(receiptCore) };
  return jsonResponse({
    ok: successful.length === selected.length,
    schema: "OMEGA_CLOUD_WAVE_RESULT_R185",
    revision: CLOUD_SWARM_REVISION_R185,
    missionId,
    wave,
    wavePlan: waves[wave],
    receipt,
    results,
    continuation: receipt.nextWave === null
      ? { state: "WAVE_SEQUENCE_COMPLETE", next: "R183 successor comparison -> R184 exact design discovery" }
      : { state: "CONTINUE_NEXT_WAVE", nextWave: receipt.nextWave, missionId },
    canonicalMutation: false,
  }, successful.length === selected.length ? 200 : 207);
}

function escapeHtml(value: any): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-cloud-swarm": CLOUD_SWARM_REVISION_R185,
    },
  });
}

function cloudIndexHtmlR185(origin: string): string {
  const cards = Array.from({ length: CLOUD_SWARM_NODE_COUNT_R185 }, (_, i) => {
    const n = i + 1;
    const node = cloudNodeDescriptorR185(n, origin);
    return `<a class="node" href="${node.links.public}"><strong>${escapeHtml(node.id)}</strong><span>${escapeHtml(node.stratumRole)}</span><small>${escapeHtml(node.mappedSwarmCell.domainRole)} · ${escapeHtml(node.mappedSwarmCell.phaseRole)}</small></a>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA 172 Cloud Swarm · R185</title><style>
  :root{color-scheme:dark;background:#070b10;color:#eef3f7;font-family:Inter,system-ui,sans-serif}body{margin:0;background:radial-gradient(circle at 50% 0,#152334,#070b10 42%);min-height:100vh}.wrap{max-width:1480px;margin:auto;padding:30px 22px 60px}.hero{position:sticky;top:0;z-index:2;background:rgba(7,11,16,.92);backdrop-filter:blur(14px);border-bottom:1px solid #263649;padding:18px 0 16px}h1{font-size:clamp(28px,5vw,58px);margin:0;letter-spacing:-.04em}p{max-width:900px;color:#aebdca;line-height:1.55}.meta{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.pill{border:1px solid #31475d;border-radius:999px;padding:7px 11px;color:#cfe2ef;background:#0d1620}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:22px}.node{display:flex;min-height:96px;flex-direction:column;gap:6px;text-decoration:none;color:#edf6fb;border:1px solid #213344;border-radius:13px;padding:14px;background:#0b121a;transition:.16s}.node:hover{transform:translateY(-2px);border-color:#6388a4;background:#101c27}.node span{color:#8fb2c8;font-size:12px}.node small{color:#778c9d;line-height:1.35}code{color:#b5d9ec}</style></head><body><main class="wrap"><section class="hero"><h1>OMEGA 172 Cloud Swarm</h1><p>R185 exposes 172 independently addressable cloud-node identities backed by named Durable Object state, mapped across the existing 1,728-cell OMEGA execution lattice. The nodes cooperate through a tree spine, continuity ring, cross-stratum peer mesh, and bounded execution waves.</p><div class="meta"><span class="pill">172 node links</span><span class="pill">4 × 43 strata</span><span class="pill">15 bounded waves</span><span class="pill">R182 → R183 → R184 → R185</span><a class="pill" href="${origin}/api/clouds/r185/manifest">machine manifest</a></div></section><section class="grid">${cards}</section></main></body></html>`;
}

function cloudNodeHtmlR185(n: number, origin: string): string {
  const node = cloudNodeDescriptorR185(n, origin);
  const topology = node.topology;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(node.id)} · OMEGA R185</title><style>
  :root{color-scheme:dark;background:#070b10;color:#eef3f7;font-family:Inter,system-ui,sans-serif}body{margin:0}.wrap{max-width:980px;margin:auto;padding:40px 22px}a{color:#9dc9e3}h1{font-size:clamp(34px,7vw,72px);margin:.2em 0}.panel{border:1px solid #263b4f;background:#0b131c;border-radius:16px;padding:20px;margin:18px 0}.k{color:#8199aa;text-transform:uppercase;font-size:11px;letter-spacing:.12em}.v{font-size:18px;margin-top:5px}.links{display:flex;flex-wrap:wrap;gap:10px}.links a{border:1px solid #33506a;border-radius:999px;padding:8px 12px;text-decoration:none}code{color:#b9deef}</style></head><body><main class="wrap"><a href="${origin}/cloud">← all 172 clouds</a><h1>${escapeHtml(node.id)}</h1><p>${escapeHtml(node.stratumRole)} · stratum ${node.stratum}, column ${node.column}</p><section class="panel"><div class="k">Mapped OMEGA cell</div><div class="v"><code>${escapeHtml(node.mappedSwarmCell.cellId)}</code></div><p>${escapeHtml(node.mappedSwarmCell.domainRole)} / ${escapeHtml(node.mappedSwarmCell.phaseRole)} / ${escapeHtml(node.mappedSwarmCell.regulationRole)}</p></section><section class="panel"><div class="k">Federation topology</div><p>Parent: <code>${escapeHtml(topology.parent || "ROOT")}</code><br>Children: <code>${escapeHtml(topology.children.join(", ") || "leaf")}</code><br>Ring: <code>${escapeHtml(topology.ringPrevious)} ↔ ${escapeHtml(topology.ringNext)}</code><br>Cross-stratum peers: <code>${escapeHtml(topology.crossStratumPeers.join(", "))}</code></p></section><section class="panel"><div class="k">Machine surfaces</div><div class="links"><a href="${node.links.machine}">node state</a><a href="${origin}/api/clouds/r185/manifest">swarm manifest</a></div><p>This link is one stateful cloud node inside the canonical Worker federation. It is not represented as a separate provider account or independent physical machine.</p></section></main></body></html>`;
}

export async function handleCloudSwarmR185(request: Request, env: SwarmEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });

  if (request.method === "GET" && (path === "/cloud" || path === "/clouds")) return htmlResponse(cloudIndexHtmlR185(url.origin));
  const publicMatch = path.match(/^\/cloud\/(\d{1,3})$/);
  if (request.method === "GET" && publicMatch) {
    const n = nodeNumber(publicMatch[1]);
    return n ? htmlResponse(cloudNodeHtmlR185(n, url.origin)) : jsonResponse({ ok: false, code: "CLOUD_NODE_NOT_FOUND" }, 404);
  }

  if (request.method === "GET" && path === "/api/clouds/r185/manifest") return jsonResponse({ ok: true, ...(await cloudManifestR185(url.origin, env)) });
  if (request.method === "GET" && path === "/api/clouds/r185/health") {
    return jsonResponse({
      ok: Boolean(env.OMEGA_SWARM_CELL),
      schema: "OMEGA_172_CLOUD_HEALTH_R185",
      revision: CLOUD_SWARM_REVISION_R185,
      configuredNodes: CLOUD_SWARM_NODE_COUNT_R185,
      independentlyNamedStateNodes: CLOUD_SWARM_NODE_COUNT_R185,
      durableObjectBindingAvailable: Boolean(env.OMEGA_SWARM_CELL),
      fullLinkVerification: "POST_DEPLOY_CI_PROBES_ALL_172_MACHINE_URLS",
      canonicalMutation: false,
    }, env.OMEGA_SWARM_CELL ? 200 : 503);
  }
  if (request.method === "GET" && path === "/api/clouds/r185/plan") {
    return jsonResponse({ ok: true, schema: "OMEGA_172_CLOUD_WAVE_PLAN_R185", revision: CLOUD_SWARM_REVISION_R185, nodeCount: CLOUD_SWARM_NODE_COUNT_R185, waveSize: CLOUD_SWARM_WAVE_SIZE_R185, waves: cloudWavePlanR185(url.origin), canonicalMutation: false });
  }
  if (request.method === "POST" && path === "/api/clouds/r185/mission") {
    const input = await request.json().catch(() => ({})) as AnyObj;
    return dispatchWaveR185(input, env, url.origin);
  }

  const machineMatch = path.match(/^\/api\/clouds\/r185\/node\/(\d{1,3})(\/task)?$/);
  if (machineMatch) {
    const n = nodeNumber(machineMatch[1]);
    if (!n) return jsonResponse({ ok: false, code: "CLOUD_NODE_NOT_FOUND", range: "001-172" }, 404);
    const descriptor = cloudNodeDescriptorR185(n, url.origin);
    if (request.method === "GET" && !machineMatch[2]) {
      const state = await nodeStateR185(n, env);
      return jsonResponse({ ok: state.reachable, schema: "OMEGA_CLOUD_NODE_STATUS_R185", revision: CLOUD_SWARM_REVISION_R185, node: descriptor, runtime: state, canonicalMutation: false }, state.reachable ? 200 : 503);
    }
    if (request.method === "POST" && machineMatch[2] === "/task") {
      const input = await request.json().catch(() => ({})) as AnyObj;
      const intent = clip(input.intent || input.text, 7000);
      if (!intent) return jsonResponse({ ok: false, code: "INTENT_REQUIRED", node: descriptor }, 400);
      const missionId = clip(input.missionId || `r185_node_${Date.now().toString(36)}_${n}`, 220);
      const result = await executeNodeTaskR185(n, { ...input, intent }, env, missionId);
      return jsonResponse({ ok: result.ok, schema: "OMEGA_CLOUD_NODE_TASK_RESULT_R185", revision: CLOUD_SWARM_REVISION_R185, node: descriptor, missionId, execution: result, canonicalMutation: false }, result.ok ? 200 : (result.status || 500));
    }
  }

  return jsonResponse({ ok: false, code: "R185_CLOUD_ROUTE_NOT_FOUND" }, 404);
}
