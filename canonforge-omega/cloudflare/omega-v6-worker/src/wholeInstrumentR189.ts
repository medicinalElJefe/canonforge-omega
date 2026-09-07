import {
  BASE_FAMILY_IDS_R189,
  EXTENSION_CAPABILITY_IDS_R189,
  EXECUTION_REGIMES_R189,
  cumulativeCapabilityManifestR189,
} from "./cumulativeCapabilityR189";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export const R189_REVISION = "R189_WHOLE_INSTRUMENT_CONVERGENCE";

export const R189_DOMAINS = [
  { id: "FIELD", label: "Living Field", route: "/", evidence: "CANONICAL_STATE_BOUND" },
  { id: "CANON", label: "Cumulative capability Canon", route: "/api/canon/r189/manifest", evidence: "61_GROUP_NON_REGRESSION_BODY" },
  { id: "EARTH", label: "Earth / observation", route: "/", evidence: "SOURCE_DERIVED_FORECAST_SEPARATED" },
  { id: "MODES", label: "Governed modes", route: "/", evidence: "MODE_ATLAS_AND_ABLATION_BOUND" },
  { id: "SKINS", label: "Individual skin relativity", route: "/", evidence: "REPRESENTATION_NOT_AUTHORITY" },
  { id: "CALCULUS", label: "Calculus / dimensional relativity", route: "/", evidence: "FRAME_RELATIVE_ADDRESS_RESOLUTION" },
  { id: "VISUAL", label: "Visual / spatial instrument", route: "/", evidence: "VISUAL_STATE_NOT_EXECUTION_PROOF" },
  { id: "WORKSPACE", label: "Recovered workspace / environment", route: "/", evidence: "AUTHORITATIVE_STATE_ACCURACY_BOUND" },
  { id: "COMPUTE", label: "Reference computation", route: "/compute", evidence: "DERIVED_REFERENCE_COMPUTE" },
  { id: "VALIDATE", label: "Validation ladder", route: "/validate", evidence: "EVIDENCE_TIERED" },
  { id: "CROSS_RUNTIME", label: "Cloud ↔ Sovereign parity", route: "/validate/cross-runtime", evidence: "L3_CROSS_RUNTIME_PARITY" },
  { id: "RCWA", label: "Independent RCWA", route: "/validate/independent", evidence: "L4_INDEPENDENT_SOLVER_FAMILY" },
  { id: "FEDERATION", label: "Genesis / Optical / Sovereign federation", route: "/federation", evidence: "PROPOSE_SCREEN_SOLVE_ADMIT_SEPARATED" },
  { id: "SWARM", label: "1,728-cell swarm", route: "/warp", evidence: "STATEFUL_EXECUTION_RECEIPTS" },
  { id: "CLOUD172", label: "172-cloud federation", route: "/clouds", evidence: "172_DURABLE_STATE_IDENTITIES" },
  { id: "SAI", label: "AI + SAI", route: "/sai", evidence: "PROVIDER_AND_B059_SCOPE_SEPARATED" },
  { id: "HYBRID", label: "Sovereign Hybrid", route: "/", evidence: "AUTHENTICATED_HEARTBEAT_REQUIRED" },
  { id: "MOTION", label: "Synchronous motion-time", route: "/api/swarm/motion/r188/manifest", evidence: "12_PHASE_BARRIER_RECEIPTS" },
  { id: "BUILD", label: "Build candidate", route: "/warp/build", evidence: "RETURNED_NOT_ADMITTED" },
  { id: "SUCCESSOR", label: "Successor superiority", route: "/api/swarm/successor/r183/manifest", evidence: "PROOF_GATED_COMPARISON" },
  { id: "DISCOVERY", label: "Improvement discovery", route: "/api/swarm/improvement/r184/manifest", evidence: "RELEASE_INTENT_NOT_AUTHORITY" },
  { id: "EVIDENCE", label: "Execution evidence", route: "/api/swarm/evidence/r186/manifest", evidence: "EXECUTION_DERIVED_METRICS" },
  { id: "PATCH", label: "Bounded self-patch", route: "/api/swarm/patch/r187/manifest", evidence: "ALLOWLIST_HASH_ROLLBACK_BOUND" },
  { id: "MEMORY", label: "Memory / scar / continuity", route: "/", evidence: "SCAR_AND_HISTORY_CARRY" },
  { id: "RECOVERY", label: "Proof / rollback / recovery", route: "/", evidence: "RECOVERABLE_PATH_REQUIRED" },
] as const;

type R189DomainId = (typeof R189_DOMAINS)[number]["id"];
type R189ExtensionId = (typeof EXTENSION_CAPABILITY_IDS_R189)[number];

export const R189_EXTENSION_DOMAIN_MAP: Record<R189ExtensionId, readonly R189DomainId[]> = {
  R85_RUNTIME_RECOVERY: ["RECOVERY"],
  R89_GENESIS_BINDING: ["FEDERATION"],
  R91_CAPABILITY_ROUTER: ["CANON", "FIELD"],
  R94_RELATION_WORKBENCH: ["FIELD", "WORKSPACE"],
  R95_MEMORY_SCAR_FORECAST: ["MEMORY"],
  R106_UNIFIED_OPERATIONAL_CORE: ["FIELD", "CANON"],
  R107_R115_PROOF_LEARNING_CHAIN: ["VALIDATE", "EVIDENCE"],
  R118_R130_HD_SPATIAL_VISUAL: ["VISUAL", "WORKSPACE"],
  R136_R147_CALCULUS_VISUAL_RELATIVITY: ["CALCULUS", "MODES", "SKINS", "VISUAL"],
  R148_MEMORY_CONTINUITY: ["MEMORY"],
  R149_INTELLIGENCE_REASONING: ["SAI"],
  R150_CREATE_SIMULATE: ["BUILD"],
  R151_SOVEREIGN_DEVICE_COMPUTE: ["HYBRID", "COMPUTE"],
  R152_EARTH_TRUTH: ["EARTH"],
  R154_BUILD_EVOLUTION_GOVERNANCE: ["BUILD", "SUCCESSOR"],
  R159_R167_ENVIRONMENT_WORKSPACE_TRUTH: ["WORKSPACE", "FIELD", "VISUAL"],
  R168_CLOUDFLARE_DO_SAI_HYBRID: ["HYBRID", "SAI", "SWARM"],
  R169_SWARM_NAMESPACE: ["SWARM"],
  R170_COMPUTATION: ["COMPUTE"],
  R171_PRECISION_CONVERGENCE: ["COMPUTE", "SWARM"],
  R172_VALIDATION_FABRIC: ["VALIDATE"],
  R173_CROSS_RUNTIME: ["CROSS_RUNTIME", "VALIDATE"],
  R174_FEDERATED_ORGANS: ["FEDERATION"],
  R175_INDEPENDENT_SOLVER: ["RCWA", "VALIDATE"],
  R176_WARP_COMPUTATION: ["SWARM", "COMPUTE"],
  R177_WARP_INTEGRITY: ["SWARM", "VALIDATE", "EVIDENCE"],
  R178_CANDIDATE_LAB: ["BUILD"],
  R179_B059_AI_SAI: ["SAI"],
  R180_LOAD_GOVERNOR: ["SWARM", "HYBRID"],
  R181_LIVE_ACCEPTANCE: ["VALIDATE", "HYBRID", "SAI"],
  R182_CONTINUITY_DEPLOY_FIRST: ["RECOVERY", "VALIDATE"],
  R183_SUCCESSOR_SUPERIORITY: ["SUCCESSOR", "VALIDATE"],
  R184_IMPROVEMENT_DISCOVERY: ["DISCOVERY", "SUCCESSOR"],
  R185_172_CLOUD_FEDERATION: ["CLOUD172", "SWARM"],
  R186_EXECUTION_EVIDENCE: ["EVIDENCE", "SUCCESSOR"],
  R187_BOUNDED_SELF_PATCH: ["PATCH", "BUILD", "RECOVERY"],
  R188_MOTION_TIME: ["MOTION", "SWARM"],
};

export const R189_EXECUTION_PROFILES = [
  { id: "PULSE", cells: 12 },
  { id: "FLOCK", cells: 24 },
  { id: "ORGAN", cells: 144 },
  { id: "WARP", cells: 576 },
  { id: "FULL", cells: 1728 },
] as const;

export const R189_CONTINUITY_LAW = [
  "FRAME", "PARTITION", "TRANSFORM", "EXCHANGE", "INVARIANT_CARRY", "SCAR_CARRY",
  "RECONTEXTUALIZE", "FORECAST", "SYNTHESIZE", "EXECUTE", "OBSERVE", "PROVE",
] as const;

export function r189Coverage() {
  const domainIds = new Set<string>(R189_DOMAINS.map((domain) => domain.id));
  const unmappedExtensionOrgans = EXTENSION_CAPABILITY_IDS_R189.filter(
    (capability) => !(R189_EXTENSION_DOMAIN_MAP[capability] || []).length,
  );
  const invalidDomainMappings = EXTENSION_CAPABILITY_IDS_R189.flatMap((capability) =>
    (R189_EXTENSION_DOMAIN_MAP[capability] || [])
      .filter((domain) => !domainIds.has(domain))
      .map((domain) => ({ capability, domain })),
  );
  const mappedExtensionOrgans = EXTENSION_CAPABILITY_IDS_R189.length - unmappedExtensionOrgans.length;
  return {
    schema: "OMEGA_R189_CUMULATIVE_SURFACE_COVERAGE_v1",
    baseFamilyCount: BASE_FAMILY_IDS_R189.length,
    extensionOrganCount: EXTENSION_CAPABILITY_IDS_R189.length,
    totalCapabilityGroups: BASE_FAMILY_IDS_R189.length + EXTENSION_CAPABILITY_IDS_R189.length,
    mappedExtensionOrgans,
    unmappedExtensionOrgans,
    invalidDomainMappings,
    wholeInstrumentDomainCount: R189_DOMAINS.length,
    executionRegimeCount: EXECUTION_REGIMES_R189.length,
    complete:
      BASE_FAMILY_IDS_R189.length === 24 &&
      EXTENSION_CAPABILITY_IDS_R189.length === 37 &&
      unmappedExtensionOrgans.length === 0 &&
      invalidDomainMappings.length === 0,
  };
}

export function r189Manifest() {
  const cumulativeCanon = cumulativeCapabilityManifestR189();
  const coverage = r189Coverage();
  return {
    schema: "OMEGA_WHOLE_INSTRUMENT_MANIFEST_v1",
    revision: R189_REVISION,
    predecessor: "R188",
    protectedBaseIdentity: "r87-semantic-edge-settle-proof",
    intent: "Expose and coordinate the admitted OMEGA instrument without flattening inherited mechanisms.",
    domains: R189_DOMAINS,
    executionProfiles: R189_EXECUTION_PROFILES,
    executionRegimes: EXECUTION_REGIMES_R189,
    continuityLaw: R189_CONTINUITY_LAW,
    addressHierarchy: [12, 144, 1728, 20736, 248832],
    addressHierarchyMeaning: "software address/execution/presentation resolution; not literal physical dimensions",
    cumulativeCanon: {
      schema: cumulativeCanon.schema,
      revision: cumulativeCanon.revision,
      baseFamilies: cumulativeCanon.baseFamilies,
      extensionOrgans: cumulativeCanon.extensionOrgans,
      totalCapabilityGroups: cumulativeCanon.totalCapabilityGroups,
      executionRegimes: cumulativeCanon.executionRegimes,
      law: cumulativeCanon.law,
      coverage,
    },
    extensionDomainMap: R189_EXTENSION_DOMAIN_MAP,
    compositionLaw: [
      "INTENT", "ROUTE", "STATE", "MODE", "SKIN", "CAPABILITY", "EXECUTE", "RECEIPT",
      "VALIDATE", "SCAR", "RECONTEXTUALIZE", "IMPROVE", "PROVE", "ADMIT",
    ],
    preservation: {
      additiveSuccessor: true,
      inheritedRoutesPreserved: true,
      inheritedVisualShellPreserved: true,
      durableObjectNamespacesPreserved: true,
      cumulativeCapabilityCoverageComplete: coverage.complete,
      protectedBaseIdentityPreserved: true,
      canonicalMutation: false,
      autonomousPromotion: false,
    },
    truthBoundaries: [
      "visual motion is not execution proof",
      "model synthesis is not CanonState",
      "provider model weights are externally pretrained",
      "B059 training claims are limited to its verified deterministic corpus scope",
      "cross-runtime parity is not independent solver-family evidence",
      "independent RCWA evidence is not fabrication measurement",
      "self-patch materialization cannot commit, deploy, or promote Canon",
      "a successor/release-intent packet is not release authority",
      "a newer revision identity does not overwrite protected predecessor identity",
    ],
  };
}

function html(): string {
  const domains = JSON.stringify(R189_DOMAINS);
  const coverage = r189Coverage();
  const regimes = JSON.stringify(EXECUTION_REGIMES_R189);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA R189 · Whole Instrument</title><style>
  :root{color-scheme:dark;font:14px/1.45 Inter,ui-sans-serif,system-ui;background:#05070b;color:#f5f7fb}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 25% 0,#151c2d 0,#070a10 38%,#040609 78%)}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:20;display:flex;gap:14px;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #263248;background:#06090ed9;backdrop-filter:blur(18px)}.brand{font-weight:900;letter-spacing:.13em}.badge{padding:7px 10px;border:1px solid #34445e;border-radius:999px;color:#b9c5d7}.wrap{max-width:1500px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.5fr);gap:16px}.card{border:1px solid #28364d;border-radius:18px;background:#0a1019db;padding:16px;box-shadow:0 24px 80px #0005}.hero h1{font-size:clamp(2rem,5vw,4.8rem);line-height:.92;margin:8px 0 12px}.muted{color:#9caac0}.law,.regimes{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}.phase{border:1px solid #33435d;border-radius:10px;padding:7px 9px;background:#0c1420}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.domain{min-height:142px;display:flex;flex-direction:column;justify-content:space-between}.domain:hover{border-color:#607da8;background:#0d1724}.eyebrow{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#7f90a9}.state{display:flex;gap:7px;align-items:center}.dot{width:9px;height:9px;border-radius:50%;background:#68758a}.dot.ok{background:#42cb7c;box-shadow:0 0 14px #42cb7c66}.dot.warn{background:#e6bd4e}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.btn{border:1px solid #354761;border-radius:11px;background:#111a27;padding:9px 12px;cursor:pointer}.btn:hover{background:#172438}.profiles{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.profile{text-align:center;border:1px solid #34435b;border-radius:12px;padding:10px}.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.stat{border:1px solid #2f4059;border-radius:12px;padding:10px;background:#0b1320}.stat b{display:block;font-size:1.45rem}.receipt{white-space:pre-wrap;word-break:break-word;max-height:340px;overflow:auto;font:12px/1.45 ui-monospace,SFMono-Regular,monospace;color:#aebbd0}.footer{margin:18px 0 40px;color:#7f8da2}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:780px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}.profiles{grid-template-columns:repeat(3,1fr)}.top{align-items:flex-start}.badge{font-size:.75rem}}@media(max-width:520px){.grid{grid-template-columns:1fr}.profiles,.stats{grid-template-columns:1fr 1fr}.wrap{padding:10px}.top{padding:10px}}
  </style></head><body><header class="top"><div class="brand">OMEGA · R189</div><div class="badge" id="summary">WHOLE INSTRUMENT · CHECKING LIVE SURFACES</div></header><main class="wrap"><section class="hero"><div class="card"><div class="eyebrow">Whole-instrument convergence</div><h1>One instrument.<br>All depth retained.</h1><p class="muted">R189 does not replace the established Field. It exposes every major computation, validation, federation, intelligence, motion, build, proof, skin and continuity mechanism through one coherent depth surface, while each underlying engine keeps its own authority boundary.</p><div class="law" id="law"></div><div class="regimes" id="regimes"></div><div class="controls"><a class="btn" href="/">Living Field</a><a class="btn" href="/api/canon/r189/manifest">Cumulative Canon</a><a class="btn" href="/api/canon/r189/regimes">Execution Regimes</a><a class="btn" href="/compute">Compute</a><a class="btn" href="/validate">Validate</a><a class="btn" href="/federation">Federation</a><a class="btn" href="/clouds">172 Cloud</a><a class="btn" href="/sai">SAI</a><a class="btn" href="/warp">Warp</a></div></div><aside class="card"><div class="eyebrow">Cumulative body</div><div class="stats"><div class="stat"><b>${coverage.baseFamilyCount}</b><span class="muted">base families</span></div><div class="stat"><b>${coverage.extensionOrganCount}</b><span class="muted">extension organs</span></div><div class="stat"><b>${coverage.totalCapabilityGroups}</b><span class="muted">protected groups</span></div><div class="stat"><b>${coverage.executionRegimeCount}</b><span class="muted">execution regimes</span></div></div><p class="muted">Coverage: <b>${coverage.complete ? "COMPLETE" : "INCOMPLETE"}</b>. New revisions extend this body; they do not silently erase predecessor identity or capability.</p><hr style="border:0;border-top:1px solid #28364d;margin:16px 0"><div class="eyebrow">Execution hierarchy</div><h2>12 → 144 → 1,728 → 20,736 → 248,832</h2><p class="muted">Address/execution/presentation resolution. Whole/part, inner/outer and representation remain frame-relative roles.</p><div class="profiles" id="profiles"></div><hr style="border:0;border-top:1px solid #28364d;margin:16px 0"><div class="eyebrow">Authority</div><b>PROOF-GATED</b><p class="muted">Returned results, visuals, model synthesis, patches and release-intent packets do not silently become Canon.</p></aside></section><section class="grid" id="grid"></section><section class="card" style="margin-top:14px"><div class="eyebrow">R189 manifest / truth boundary</div><div class="controls"><button class="btn" id="refresh">Refresh live probes</button><a class="btn" href="/api/instrument/r189/manifest">Machine manifest</a><a class="btn" href="/api/instrument/r189/coverage">Coverage proof</a></div><pre class="receipt" id="receipt"></pre></section><div class="footer">R189 is additive over R188 and preserves the protected R87 semantic base identity. Unknown or unreachable surfaces remain visibly unknown; the instrument does not synthesize green status.</div></main><script>
  const domains=${domains};const law=${JSON.stringify(R189_CONTINUITY_LAW)};const profiles=${JSON.stringify(R189_EXECUTION_PROFILES)};const regimes=${regimes};
  document.querySelector('#law').innerHTML=law.map(x=>'<span class="phase">'+x+'</span>').join('');document.querySelector('#profiles').innerHTML=profiles.map(x=>'<div class="profile"><b>'+x.id+'</b><div class="muted">'+x.cells+'</div></div>').join('');document.querySelector('#regimes').innerHTML=regimes.map(x=>'<span class="phase">'+x+'</span>').join('');
  const grid=document.querySelector('#grid');function render(items){grid.innerHTML=items.map(d=>'<a class="card domain" href="'+d.route+'"><div><div class="eyebrow">'+d.id+'</div><h3>'+d.label+'</h3><div class="muted">'+d.evidence+'</div></div><div class="state"><span class="dot '+(d.live==='reachable'?'ok':d.live==='unreachable'?'warn':'')+'"></span><span>'+(d.live||'not probed')+'</span></div></a>').join('')}
  async function probe(){render(domains);const unique=[...new Set(domains.map(d=>d.route).filter(r=>r.startsWith('/api/')||['/compute','/validate','/validate/cross-runtime','/validate/independent','/federation','/clouds','/sai','/warp','/warp/build'].includes(r)))];const result={};await Promise.all(unique.map(async r=>{try{const x=await fetch(r,{method:'GET',cache:'no-store'});result[r]=x.ok?'reachable':'unreachable'}catch(e){result[r]='unreachable'}}));const items=domains.map(d=>({...d,live:result[d.route]||'surface'}));render(items);const reachable=Object.values(result).filter(x=>x==='reachable').length;const [m,c]=await Promise.all([fetch('/api/instrument/r189/manifest',{cache:'no-store'}).then(r=>r.json()),fetch('/api/instrument/r189/coverage',{cache:'no-store'}).then(r=>r.json())]);document.querySelector('#summary').textContent='WHOLE INSTRUMENT · '+reachable+'/'+unique.length+' PROBED · '+c.totalCapabilityGroups+' GROUPS · '+(c.complete?'CUMULATIVE':'INCOMPLETE');document.querySelector('#receipt').textContent=JSON.stringify({manifest:m,coverage:c,probe:result},null,2)}
  document.querySelector('#refresh').onclick=probe;probe();
</script></body></html>`;
}

export function wholeInstrumentR189Response(): Response {
  return new Response(html(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-revision": R189_REVISION } });
}

export function handleWholeInstrumentR189(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.pathname === "/instrument" || url.pathname === "/instrument/") return wholeInstrumentR189Response();
  if (url.pathname === "/api/instrument/r189/manifest" || url.pathname === "/api/instrument/r189/manifest/") return new Response(JSON.stringify(r189Manifest()), { headers: jsonHeaders });
  if (url.pathname === "/api/instrument/r189/coverage" || url.pathname === "/api/instrument/r189/coverage/") return new Response(JSON.stringify(r189Coverage()), { headers: jsonHeaders });
  return null;
}
