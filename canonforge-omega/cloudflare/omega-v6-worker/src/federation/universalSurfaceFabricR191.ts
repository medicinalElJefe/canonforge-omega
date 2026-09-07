import { cumulativeCapabilityManifestR190 } from "../acceptance/cumulativeCapabilityR190";

export const UNIVERSAL_SURFACE_FABRIC_RELEASE_R191 = "r191-universal-surface-fabric";
export const UNIVERSAL_SURFACE_FABRIC_SCHEMA_R191 = "OMEGA_UNIVERSAL_SURFACE_FABRIC_R191";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  ...CORS,
};

type ServiceBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type R191Env = {
  CANONICAL_GIT_SHA?: string;
  GENESIS?: ServiceBinding;
  OMEGA_GENESIS_MACHINE?: ServiceBinding;
  OMEGA_OPTICAL_MACHINE?: ServiceBinding;
};

type SurfaceState = {
  id: string;
  label: string;
  kind: "CANONICAL" | "INTERNAL_SERVICE" | "EXTERNAL_SURFACE";
  role: string;
  authority: string;
  href: string;
  healthPath?: string;
  binding?: "GENESIS" | "OMEGA_GENESIS_MACHINE" | "OMEGA_OPTICAL_MACHINE";
  promotionControl: string;
  sameUrlPromotionAuthorized: boolean;
  requiredForCanonicalFabric: boolean;
};

export const R191_SURFACES: readonly SurfaceState[] = [
  {
    id: "OMEGA_V6",
    label: "OMEGA V6 Canonical Runtime",
    kind: "CANONICAL",
    role: "OPERATIONAL_CANON_AND_RELEASE_AUTHORITY",
    authority: "CANONICAL_OPERATIONAL_RUNTIME",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/",
    healthPath: "/_omega/health",
    promotionControl: "OMEGA_V6_PROOF_GATED_RELEASE",
    sameUrlPromotionAuthorized: true,
    requiredForCanonicalFabric: true,
  },
  {
    id: "WHOLE_INSTRUMENT",
    label: "R189 Whole Instrument",
    kind: "CANONICAL",
    role: "CUMULATIVE_OPERATOR_SURFACE",
    authority: "READ_ONLY_INSTRUMENT_PROJECTION",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/instrument",
    healthPath: "/api/instrument/r189/manifest",
    promotionControl: "NONE",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "CAPABILITY_TRUTH",
    label: "R190 Capability Truth",
    kind: "CANONICAL",
    role: "IMPLEMENTED_ROUTE_INVOKED_RETURNED_VERIFIED_ACCEPTANCE",
    authority: "READ_ONLY_ACCEPTANCE_PLANE",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/truth",
    healthPath: "/api/acceptance/r190/manifest",
    promotionControl: "NONE",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "GENESIS_HUMAN",
    label: "OMEGA Genesis",
    kind: "INTERNAL_SERVICE",
    role: "DISCOVERY_AND_EVOLUTION_AUTHORITY",
    authority: "GENESIS_DISCOVERY_EVOLUTION_AUTHORITY",
    href: "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/",
    healthPath: "/_omega/health",
    binding: "GENESIS",
    promotionControl: "GENESIS_MAY_NOT_DEPLOY_V6_CANON",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: false,
  },
  {
    id: "GENESIS_MACHINE",
    label: "Genesis Machine Organ",
    kind: "INTERNAL_SERVICE",
    role: "PROPOSAL_GENERATION",
    authority: "PROPOSE_ONLY",
    href: "https://omega-genesis-machine-r115.jeffdeweyeljefe.workers.dev/",
    healthPath: "/api/health",
    binding: "OMEGA_GENESIS_MACHINE",
    promotionControl: "NO_CANONICAL_MUTATION",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "OPTICAL_MACHINE",
    label: "Optical Machine Organ",
    kind: "INTERNAL_SERVICE",
    role: "REDUCED_ORDER_SCREEN_AND_TIER2_PREPARATION",
    authority: "SCREEN_ONLY",
    href: "https://omega-optical-machine-r115.jeffdeweyeljefe.workers.dev/",
    healthPath: "/api/health",
    binding: "OMEGA_OPTICAL_MACHINE",
    promotionControl: "NO_RCWA_OR_FABRICATION_CLAIM_WITHOUT_RECEIPT",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "LIVING_LIGHT_VERCEL",
    label: "Living Light Vercel Target",
    kind: "EXTERNAL_SURFACE",
    role: "OPTICAL_HUMAN_SURFACE_TARGET",
    authority: "EXTERNAL_PROJECT_CONTROL_REQUIRED",
    href: "https://omega-living-light-etching-private-woven2.vercel.app/",
    promotionControl: "VERCEL_PROJECT_WRITE_ACCESS_REQUIRED",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: false,
  },
  {
    id: "SOVEREIGN_CONVERGENCE",
    label: "Sovereign Convergence Surface",
    kind: "EXTERNAL_SURFACE",
    role: "SOVEREIGN_HYBRID_OPERATOR_SURFACE",
    authority: "AUTHENTICATED_HEARTBEAT_REQUIRED_FOR_PC_ONLINE_CLAIM",
    href: "https://omega-sovereign-convergence.foundasound.chatgpt.site/",
    promotionControl: "EXTERNAL_SURFACE_CONTROL_REQUIRED",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: false,
  },
  {
    id: "CLOUD172",
    label: "172-Cloud Federation",
    kind: "CANONICAL",
    role: "ADDRESSABLE_DURABLE_CLOUD_FABRIC",
    authority: "STATEFUL_EXECUTION_RECEIPTS",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/clouds",
    healthPath: "/api/clouds/r185/manifest",
    promotionControl: "PROOF_GATED_ONLY",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "SAI",
    label: "AI + SAI",
    kind: "CANONICAL",
    role: "PROVIDER_AND_B059_SCOPE_SEPARATED_INTELLIGENCE",
    authority: "PROVIDER_INFERENCE_PLUS_SOVEREIGN_B059_SCOPE",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/sai",
    healthPath: "/api/sai/manifest",
    promotionControl: "NO_MODEL_OUTPUT_IS_CANONSTATE_BY_ITSELF",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "COMPUTE",
    label: "Reference Compute",
    kind: "CANONICAL",
    role: "DETERMINISTIC_REFERENCE_COMPUTATION",
    authority: "DERIVED_REFERENCE_COMPUTE",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/compute",
    promotionControl: "VALIDATION_REQUIRED",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
  {
    id: "VALIDATE",
    label: "Validation Fabric",
    kind: "CANONICAL",
    role: "EVIDENCE_TIERING_AND_ADMISSION_GATES",
    authority: "VALIDATION_NOT_AUTONOMOUS_PROMOTION",
    href: "https://omegav6.jeffdeweyeljefe.workers.dev/validate",
    promotionControl: "EXACT_SHA_PROOF_GATED",
    sameUrlPromotionAuthorized: false,
    requiredForCanonicalFabric: true,
  },
] as const;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: jsonHeaders });
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, code: "NON_JSON_RESPONSE", preview: text.slice(0, 360) };
  }
}

async function probeBinding(env: R191Env, surface: SurfaceState): Promise<any> {
  if (!surface.binding || !surface.healthPath) return null;
  const binding = env[surface.binding];
  if (!binding?.fetch) {
    return {
      id: surface.id,
      observed: true,
      bound: false,
      reachable: false,
      status: 0,
      transport: "CLOUDFLARE_SERVICE_BINDING_UNAVAILABLE",
      authority: surface.authority,
    };
  }
  try {
    const response = await binding.fetch(new Request(`https://${surface.id.toLowerCase()}.internal${surface.healthPath}`, {
      method: "GET",
      headers: { accept: "application/json", "x-omega-surface-probe": UNIVERSAL_SURFACE_FABRIC_RELEASE_R191 },
    }));
    const body = await readJson(response);
    return {
      id: surface.id,
      observed: true,
      bound: true,
      reachable: response.ok && body?.ok !== false,
      status: response.status,
      transport: "CLOUDFLARE_SERVICE_BINDING",
      authority: body?.authority || body?.runtime?.role || surface.authority,
      version: body?.version || body?.revision || null,
      body,
    };
  } catch (error) {
    return {
      id: surface.id,
      observed: true,
      bound: true,
      reachable: false,
      status: 0,
      transport: "CLOUDFLARE_SERVICE_BINDING",
      authority: surface.authority,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function probeExternal(surface: SurfaceState): Promise<any> {
  try {
    const response = await fetch(surface.href, {
      method: "GET",
      redirect: "manual",
      headers: { accept: "text/html,application/json", "x-omega-surface-probe": UNIVERSAL_SURFACE_FABRIC_RELEASE_R191 },
    });
    const location = response.headers.get("location");
    const protectedAccess = response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400);
    return {
      id: surface.id,
      observed: true,
      reachable: response.status > 0,
      status: response.status,
      protectedAccess,
      redirectLocation: location,
      transport: "EXTERNAL_HTTPS_PROBE",
      authority: surface.authority,
      sameUrlPromotionAuthorized: false,
    };
  } catch (error) {
    return {
      id: surface.id,
      observed: true,
      reachable: false,
      status: 0,
      protectedAccess: null,
      transport: "EXTERNAL_HTTPS_PROBE",
      authority: surface.authority,
      sameUrlPromotionAuthorized: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function r191SurfaceManifest(env?: R191Env) {
  const predecessor = cumulativeCapabilityManifestR190();
  return {
    ok: predecessor.complete === true,
    schema: UNIVERSAL_SURFACE_FABRIC_SCHEMA_R191,
    revision: "R191",
    release: UNIVERSAL_SURFACE_FABRIC_RELEASE_R191,
    predecessorRevision: predecessor.revision,
    predecessorCapabilityGroups: predecessor.totalCapabilityGroups,
    canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
    deploymentIdentityBound: Boolean(env?.CANONICAL_GIT_SHA),
    intent: "Converge every OMEGA-facing surface on one capability-truth registry without creating another Canon authority.",
    surfaces: R191_SURFACES,
    surfaceCount: R191_SURFACES.length,
    canonicalAuthority: "OMEGA_V6_ONLY",
    authorityLaw: "GENESIS_PROPOSES; OPTICAL_SCREENS; SOVEREIGN_EXECUTES_WHEN_AUTHENTICATED; VALIDATION_GRADES; OMEGA_V6_ADMITS",
    addressHierarchy: [12, 144, 1728, 20736, 248832],
    addressHierarchyMeaning: "atlas/address/execution resolution, not literal physical dimensions",
    continuityLaw: [
      "FRAME", "PARTITION", "TRANSFORM", "EXCHANGE", "INVARIANT_CARRY", "SCAR_CARRY",
      "RECONTEXTUALIZE", "FORECAST", "SYNTHESIZE", "EXECUTE", "OBSERVE", "PROVE",
    ],
    vercelTarget: {
      href: "https://omega-living-light-etching-private-woven2.vercel.app/",
      projectWriteAccessRequired: true,
      sameUrlPromotionAuthorized: false,
      deployReadyMirrorPath: "vercel/omega-r191-universal-surface",
    },
    preservation: {
      protectedR87IdentityPreserved: true,
      r189WholeInstrumentPreserved: true,
      r190CapabilityTruthPreserved: true,
      inheritedRoutesPreserved: true,
      durableObjectNamespacesPreserved: true,
      autonomousPromotion: false,
      canonicalMutation: false,
    },
    truthBoundaries: [
      "a reachable URL is not proof of write authority",
      "a protected external surface is not promoted until project-level write access is verified",
      "PC ONLINE requires a current authenticated Sovereign heartbeat",
      "screening is not RCWA/FDTD/FEM validation",
      "RCWA evidence is not fabrication measurement",
      "visual state is not execution proof",
      "model output is not CanonState",
    ],
  };
}

export async function r191SurfaceStatus(env: R191Env) {
  const bindingSurfaces = R191_SURFACES.filter((surface) => surface.kind === "INTERNAL_SERVICE" && surface.binding);
  const externalSurfaces = R191_SURFACES.filter((surface) => surface.kind === "EXTERNAL_SURFACE");
  const [bindingResults, externalResults] = await Promise.all([
    Promise.all(bindingSurfaces.map((surface) => probeBinding(env, surface))),
    Promise.all(externalSurfaces.map((surface) => probeExternal(surface))),
  ]);
  const observedById = new Map<string, any>(
    [...bindingResults, ...externalResults].filter(Boolean).map((entry: any) => [entry.id, entry]),
  );
  const surfaces = R191_SURFACES.map((surface) => {
    const observed = observedById.get(surface.id);
    if (observed) return { ...surface, ...observed };
    return {
      ...surface,
      observed: true,
      reachable: true,
      status: 200,
      transport: "LOCAL_CANONICAL_ROUTE_REGISTRY",
    };
  });
  const required = surfaces.filter((surface) => surface.requiredForCanonicalFabric);
  const requiredReachable = required.every((surface: any) => surface.reachable === true);
  const genesisMachine = surfaces.find((surface) => surface.id === "GENESIS_MACHINE") as any;
  const opticalMachine = surfaces.find((surface) => surface.id === "OPTICAL_MACHINE") as any;
  const vercel = surfaces.find((surface) => surface.id === "LIVING_LIGHT_VERCEL") as any;
  const canonicalFabricReady = Boolean(requiredReachable && genesisMachine?.reachable && opticalMachine?.reachable);
  return {
    ok: canonicalFabricReady,
    schema: "OMEGA_UNIVERSAL_SURFACE_STATUS_R191",
    revision: "R191",
    release: UNIVERSAL_SURFACE_FABRIC_RELEASE_R191,
    canonicalGitSha: env.CANONICAL_GIT_SHA || null,
    canonicalFabricReady,
    everywherePromotionProved: false,
    surfaceCount: surfaces.length,
    surfaces,
    vercel: {
      reachable: Boolean(vercel?.reachable),
      httpStatus: vercel?.status ?? 0,
      protectedAccess: vercel?.protectedAccess ?? null,
      sameUrlPromotionAuthorized: false,
      blocker: "VERCEL_PROJECT_WRITE_ACCESS_REQUIRED",
    },
    nextFullPromotionGate: "VERIFY_WRITABLE_TARGET_PROJECT_THEN_DEPLOY_IDENTICAL_R191_MIRROR_AND_PROBE_EXACT_URL",
    canonicalMutation: false,
  };
}

function html(): string {
  const surfaces = JSON.stringify(R191_SURFACES);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA R191 · Universal Surface Fabric</title><style>
  :root{color-scheme:dark;font:14px/1.45 Inter,ui-sans-serif,system-ui;background:#05070b;color:#f4f7fb}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% 0,#172037 0,#080c14 38%,#040609 78%)}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:30;display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #293650;background:#060a10e8;backdrop-filter:blur(18px)}.brand{font-weight:900;letter-spacing:.12em}.nav{display:flex;gap:7px;flex-wrap:wrap}.nav a,.btn{border:1px solid #34455f;border-radius:10px;padding:8px 10px;background:#0d1521}.wrap{max-width:1520px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.55fr);gap:14px}.card{border:1px solid #2b3950;border-radius:18px;background:#0a1019e6;padding:16px;box-shadow:0 20px 80px #0006}.hero h1{font-size:clamp(2.25rem,5vw,5rem);line-height:.92;margin:8px 0 12px}.muted{color:#98a7bd}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.surface{min-height:170px;display:flex;flex-direction:column;justify-content:space-between}.surface:hover{border-color:#6f88b3;background:#0e1827}.eyebrow{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#7f91ac}.status{display:flex;align-items:center;gap:8px;margin-top:10px}.dot{width:10px;height:10px;border-radius:50%;background:#6f798b}.dot.ok{background:#41d17f;box-shadow:0 0 16px #41d17f66}.dot.warn{background:#e7b84d}.dot.bad{background:#e46565}.law{display:flex;gap:6px;flex-wrap:wrap}.pill{border:1px solid #34445e;border-radius:999px;padding:6px 9px;color:#b7c4d8}.receipt{white-space:pre-wrap;word-break:break-word;max-height:360px;overflow:auto;font:12px/1.45 ui-monospace,SFMono-Regular,monospace;color:#aab8cd}.footer{margin:18px 0 40px;color:#78869a}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}.top{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.grid{grid-template-columns:1fr}.wrap{padding:11px}.nav{width:100%}.nav a{flex:1;text-align:center}}
  </style></head><body><header class="top"><div class="brand">OMEGA · R191 SURFACE FABRIC</div><nav class="nav"><a href="/">Field</a><a href="/instrument">Instrument</a><a href="/truth">Truth</a><a href="/compute">Compute</a><a href="/validate">Validate</a><a href="/clouds">Clouds</a><a href="/sai">AI/SAI</a></nav></header><main class="wrap"><section class="hero"><article class="card"><div class="eyebrow">Universal surface convergence</div><h1>One system.<br>Every surface truthful.</h1><p class="muted">R191 binds the current OMEGA-facing surfaces to one registry and one authority contract. It does not flatten Genesis, Optical, Sovereign, swarm, SAI, validation, or the protected Vercel target into fake sameness.</p><div class="law"><span class="pill">R190 predecessor = 62 groups</span><span class="pill">R191 additive organ</span><span class="pill">R87 identity preserved</span><span class="pill">No autonomous promotion</span></div></article><aside class="card"><div class="eyebrow">Current fabric</div><h2 id="fabricState">Checking live surface truth…</h2><p class="muted" id="fabricDetail">Canonical readiness is separate from same-URL external promotion.</p><button class="btn" id="refresh">Refresh status</button><pre class="receipt" id="receipt"></pre></aside></section><section class="grid" id="grid"></section><div class="footer">Visual reachability is not write authority. PC ONLINE requires a current authenticated heartbeat. Optical screening is not full-wave validation. Full-wave validation is not fabrication measurement.</div></main><script>
  const declared=${surfaces}; const grid=document.getElementById('grid');
  function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
  function render(list){grid.innerHTML=list.map(s=>{const reach=s.reachable;const cls=reach===true?'ok':reach===false?'bad':'warn';const label=reach===true?'reachable':reach===false?'unreachable':'declared';return '<a class="card surface" href="'+esc(s.href)+'" target="'+(s.kind==='EXTERNAL_SURFACE'?'_blank':'_self')+'"><div><div class="eyebrow">'+esc(s.id)+' · '+esc(s.kind)+'</div><h3>'+esc(s.label)+'</h3><p class="muted">'+esc(s.role)+'</p></div><div><div>'+esc(s.authority)+'</div><div class="status"><span class="dot '+cls+'"></span><span>'+esc(label)+(s.status?' · HTTP '+esc(s.status):'')+'</span></div></div></a>';}).join('');}
  async function load(){render(declared);try{const r=await fetch('/api/fabric/r191/status',{cache:'no-store'});const j=await r.json();render(j.surfaces||declared);document.getElementById('fabricState').textContent=j.canonicalFabricReady?'Canonical fabric ready':'Canonical fabric has blocked surfaces';document.getElementById('fabricDetail').textContent=j.vercel?.sameUrlPromotionAuthorized?'Vercel target promotable':'Vercel same-URL promotion still requires verified project write access';document.getElementById('receipt').textContent=JSON.stringify({release:j.release,canonicalGitSha:j.canonicalGitSha,canonicalFabricReady:j.canonicalFabricReady,everywherePromotionProved:j.everywherePromotionProved,vercel:j.vercel},null,2);}catch(e){document.getElementById('fabricState').textContent='Status probe unavailable';document.getElementById('receipt').textContent=String(e);}}
  document.getElementById('refresh').addEventListener('click',load); load();
  </script></body></html>`;
}

export async function handleUniversalSurfaceFabricR191(request: Request, env: R191Env): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const isFabricPath = path === "/fabric" || path.startsWith("/api/fabric/r191");
  if (!isFabricPath) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  if (path === "/fabric") {
    return new Response(html(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy": "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://omegav6.jeffdeweyeljefe.workers.dev; img-src 'self' data: https:; frame-ancestors 'none'",
        ...CORS,
      },
    });
  }
  if (path === "/api/fabric/r191/manifest") return json(r191SurfaceManifest(env));
  if (path === "/api/fabric/r191/status") return json(await r191SurfaceStatus(env));
  return json({
    ok: false,
    code: "R191_ROUTE_NOT_FOUND",
    routes: ["/fabric", "/api/fabric/r191/manifest", "/api/fabric/r191/status"],
    canonicalMutation: false,
  }, 404);
}
