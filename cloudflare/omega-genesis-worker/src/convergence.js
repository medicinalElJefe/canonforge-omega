import base, {OmegaGenesisState} from "./index.js";
import {MODES,MENUS,GATES,CAPABILITIES} from "./catalog.js";

export {OmegaGenesisState};

const V6_URL="https://omegav6.jeffdeweyeljefe.workers.dev";
const OPTICAL_MACHINE_URL="https://omega-optical-machine-r115.jeffdeweyeljefe.workers.dev";
const OPTICAL_HUMAN_URL="https://omega-living-light-etching-private-woven2.vercel.app";
const SOVEREIGN_HUMAN_URL="https://omega-sovereign-convergence.foundasound.chatgpt.site";
const R191_FABRIC_URL=V6_URL+"/api/fabric/r191/status";
const R191_CANON_URL=V6_URL+"/api/canon/r191/manifest";
const LAW=["OBSERVE","INVENTORY","RELATE","PRUNE","TRANSLATE","PROVE","PLAN","BUILD","TEST","VISUAL_ACCEPTANCE","ADVERSARIAL_VERIFY","PROMOTE_OR_REJECT","OBSERVE_RESULT","UPDATE_STRATEGY_MEMORY"];
const OPERATOR_ROLES=["ALPHA","BASE","CONSTRUCT","PRUNE","OMEGA"];
const DONOR_DISPOSITIONS=["KEEP","BIND","REIMPLEMENT","PRUNE","QUARANTINE"];
const VISUAL_BOUNDARY="Genesis live phase rendering is a discovery/evolution visualization channel only. Text/chat output remains separate. Animation, phase, symmetry/asymmetry and 144/1728/20736/12^n projection depth do not mutate state or create empirical evidence.";
const FEDERATION_R102={
  schema:"OMEGA_NODE_CAPABILITIES_R102",
  federation_revision:"R102",
  node_id:"omega-genesis",
  verb:"PROPOSE",
  role:"proposal-generation-exploration",
  authority_scope:"NODE_LOCAL_PROPOSAL_STATE_ONLY",
  global_canonical_authority:"omega-v6",
  may_mutate_global_canon_state:false,
  user_model:"one project + one packet lineage + four specialized runtimes",
  handoff_order:["PROPOSE","SCREEN","SOLVE","ADMIT"],
  peers:{
    "omega-v6":{verb:"ADMIT",url:V6_URL+"/",transport:"CLOUDFLARE_SERVICE_BINDING",binding:"OMEGA_V6",scope:"GLOBAL_FEDERATION_CANONSTATE"},
    "omega-optical":{verb:"SCREEN",url:OPTICAL_MACHINE_URL+"/",transport:"CLOUDFLARE_SERVICE_BINDING",binding:"OMEGA_OPTICAL",human_surface:OPTICAL_HUMAN_URL+"/",scope:"WORKER_RETURN_PACKET_ONLY"},
    "omega-sovereign":{verb:"SOLVE",url:null,human_surface:SOVEREIGN_HUMAN_URL+"/",scope:"AUTHENTICATED_WORKER_RESULT_RETURN_ONLY"}
  },
  input:["intent","project context","canonical snapshot"],
  output:["proposal packets","candidate families","alternatives"],
  shared_context:["project_id","packet_id","state_id","atlas_address","observer_frame","evidence_class","proof_gate","scar_history","orientation_sigma","lineage"],
  truth_boundary:"Genesis Durable Object state is authoritative for Genesis replay/proposal continuity only. It is not the global federation CanonState and cannot silently promote V6 operational state."
};
const SURFACE_FABRIC_R191={
  schema:"OMEGA_GENESIS_SURFACE_FABRIC_OBSERVER_R191",
  revision:"R191",
  role:"GENESIS_DISCOVERY_EVOLUTION_OBSERVER",
  federation_verb:"PROPOSE",
  canonical_authority:"OMEGA_V6_ONLY",
  canonical_fabric:R191_FABRIC_URL,
  canonical_canon:R191_CANON_URL,
  optical_machine:OPTICAL_MACHINE_URL+"/",
  optical_human_target:OPTICAL_HUMAN_URL+"/",
  sovereign_human_target:SOVEREIGN_HUMAN_URL+"/",
  machine_transport:"CLOUDFLARE_SERVICE_BINDINGS",
  required_bindings:["OMEGA_V6","OMEGA_OPTICAL"],
  may_mutate_global_canon_state:false,
  may_promote_v6:false,
  may_claim_vercel_same_url_promotion:false,
  truth_boundary:"Genesis observes R191 surface truth and may propose changes. Reachability does not imply write authority, execution proof, or Canon admission."
};

function canonical(value){
  if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
  if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
  return JSON.stringify(value);
}
async function digest(value){
  const bytes=new TextEncoder().encode(canonical(value));
  const out=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(out)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function parseProbeResponse(response,transport){
  const text=await response.text();
  let body=null;
  try{body=JSON.parse(text)}catch{body={error:"non_json_response",preview:text.slice(0,180)}}
  return{reachable:response.ok,status:response.status,transport,body};
}
async function probe(url){
  try{
    const response=await fetch(url,{headers:{accept:"application/json","x-omega-genesis-observer":"r191"}});
    return await parseProbeResponse(response,"public_https_fallback");
  }catch(error){
    return{reachable:false,status:0,transport:"public_https_fallback",error:String(error?.message||error)};
  }
}
async function probePeer(binding,publicUrl,path,peer){
  if(binding&&typeof binding.fetch==="function"){
    try{
      const request=new Request(`https://${peer}.omega.internal${path}`,{headers:{accept:"application/json","x-omega-genesis-observer":"r191","x-omega-peer-transport":"service-binding"}});
      return await parseProbeResponse(await binding.fetch(request),"cloudflare_service_binding");
    }catch(error){
      return{reachable:false,status:0,transport:"cloudflare_service_binding",error:String(error?.message||error)};
    }
  }
  return probe(publicUrl);
}
async function federationManifest(){
  return{...FEDERATION_R102,manifest_digest:await digest(FEDERATION_R102)};
}
async function surfaceFabricSnapshot(env){
  const [fabric,canon,optical]=await Promise.all([
    probePeer(env?.OMEGA_V6,R191_FABRIC_URL,"/api/fabric/r191/status","omega-v6"),
    probePeer(env?.OMEGA_V6,R191_CANON_URL,"/api/canon/r191/manifest","omega-v6"),
    probePeer(env?.OMEGA_OPTICAL,OPTICAL_MACHINE_URL+"/api/health","/api/health","omega-optical")
  ]);
  const canonicalSha=fabric.body?.canonicalGitSha||canon.body?.canonicalGitSha||null;
  const canonicalGroups=canon.body?.totalCapabilityGroups||null;
  const opticalAuthority=optical.body?.authority||null;
  const bindingTransport=fabric.transport==="cloudflare_service_binding"&&canon.transport==="cloudflare_service_binding"&&optical.transport==="cloudflare_service_binding";
  return{
    ...SURFACE_FABRIC_R191,
    observed_at:new Date().toISOString(),
    ok:Boolean(bindingTransport&&fabric.reachable&&canon.reachable&&optical.reachable),
    service_bindings_active:bindingTransport,
    canonical_git_sha:canonicalSha,
    canonical_capability_groups:canonicalGroups,
    canonical_fabric_ready:fabric.body?.canonicalFabricReady===true,
    everywhere_promotion_proved:fabric.body?.everywherePromotionProved===true,
    optical_machine_authority:opticalAuthority,
    observations:{fabric,canon,optical},
    authority_boundary:"Observed R191 state is peer evidence only. Genesis may generate proposals but cannot mutate, deploy, or admit OMEGA V6 Canon."
  };
}
async function manifest(env){
  const core={
    schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3",
    authority_contract:"OMEGA_ROLE_SEPARATED_CONVERGENCE_V1",
    federation:await federationManifest(),
    surface_fabric:{...SURFACE_FABRIC_R191,build:env.GENESIS_SURFACE_FABRIC_R191_ID||"r191-genesis-surface-observer"},
    runtime:{
      role:"GENESIS_DISCOVERY_EVOLUTION_AUTHORITY",
      federation_verb:"PROPOSE",
      canonical_branch:"omega-genesis-v1-full",
      public_url:"https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/",
      build:env.BUILD_ID||"omega-genesis-v1",
      authority:"durable-object-canonical-for-genesis-internal-state-only",
      authority_scope:"NODE_LOCAL_PROPOSAL_STATE_ONLY",
      global_canonical_authority:"OMEGAv6",
      may_mutate_global_canon_state:false,
      operational_release_authority:false,
      private_corpus_embedded:false
    },
    public_product:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      public_url:V6_URL+"/",
      operator_surface:V6_URL+"/fabric",
      release_authority:"omega-v6-full-convergence",
      genesis_transport:"cloudflare-service-binding-observation",
      state_rule:"Genesis discovery, archive recovery, evidence and candidate evolution cannot mutate or promote V6 operational state. V6 owns its operational/release lifecycle.",
      genesis_may_deploy_v6:false
    },
    capability_genome:{
      capability_count:CAPABILITIES.length,
      menu_count:MENUS.length,
      mode_count:MODES.length,
      acceptance_gate_count:GATES.length,
      capability_ids:CAPABILITIES.map(x=>x.id||x.name||String(x)),
      capabilities:CAPABILITIES,
      modes:MODES,
      acceptance_gates:GATES
    },
    recursive_law:LAW,
    operator_roles:OPERATOR_ROLES,
    donor_dispositions:DONOR_DISPOSITIONS,
    promotion_boundary:"Genesis may discover, recover, test and propose bounded candidates. OMEGA V6 remains the canonical operational/release authority and promotes through its own exact-head verification workflow.",
    authority_boundary:"Genesis internal Durable Object state is node-local proposal/replay state, not V6 global federation CanonState. Reciprocal convergence is observational and proposal-oriented; it does not grant cross-runtime mutation authority.",
    dimensional_boundary:"144/1728/20736 and larger 12^n spaces are software/model/interface representation shells unless independently evidenced otherwise"
  };
  return{...core,manifest_digest:await digest(core)};
}
async function reciprocalSnapshot(env){
  const [ownManifest,v6Health,v6Convergence,r191]=await Promise.all([
    manifest(env),
    probePeer(env?.OMEGA_V6,V6_URL+"/_omega/health","/_omega/health","omega-v6"),
    probePeer(env?.OMEGA_V6,V6_URL+"/api/convergence/edge","/api/convergence/edge","omega-v6"),
    surfaceFabricSnapshot(env)
  ]);
  return{
    schema:"OMEGA_RECIPROCAL_CONVERGENCE_SNAPSHOT_V3",
    observed_at:new Date().toISOString(),
    ok:Boolean(v6Health.reachable&&v6Convergence.reachable&&r191.ok),
    genesis_manifest:ownManifest,
    surface_fabric:r191,
    peer:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      health:v6Health,
      convergence:v6Convergence,
      boundary:"peer observation cannot mutate Genesis node-local proposal state or V6 global operational/release state"
    }
  };
}
function surfaceBar(){
  return `<div id="omega-r191-genesis-bar" style="position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 11px;border:1px solid rgba(126,151,190,.42);border-radius:13px;background:rgba(5,10,17,.9);backdrop-filter:blur(16px);box-shadow:0 12px 44px rgba(0,0,0,.45);font:12px/1.3 Inter,system-ui;color:#d8e2f2"><b style="letter-spacing:.09em">GENESIS · PROPOSE</b><span style="color:#91a3bc">R191 surface-aware · Canon remains OMEGA V6</span><span style="flex:1"></span><a href="${V6_URL}/fabric" style="color:#d8e2f2;text-decoration:none;border:1px solid #3a4e6d;border-radius:8px;padding:6px 8px">Fabric</a><a href="${V6_URL}/instrument" style="color:#d8e2f2;text-decoration:none;border:1px solid #3a4e6d;border-radius:8px;padding:6px 8px">Instrument</a><a href="${V6_URL}/truth" style="color:#d8e2f2;text-decoration:none;border:1px solid #3a4e6d;border-radius:8px;padding:6px 8px">Truth</a></div><style>@media(max-width:620px){#omega-r191-genesis-bar{left:7px!important;right:7px!important;bottom:7px!important}#omega-r191-genesis-bar span:not(:first-of-type){display:none}}</style>`;
}
async function injectVisual(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  let html=await response.text();
  if(!html.includes("live-phase-visual.js"))html=html.replace("</body>",'<script src="/live-phase-visual.js" defer></script></body>');
  if(!html.includes("omega-r191-genesis-bar"))html=html.replace("</body>",surfaceBar()+"</body>");
  const headers=new Headers(response.headers);
  headers.set("cache-control","no-store");
  headers.set("x-omega-visual-channel","genesis-live-phase-separated-from-chat");
  headers.set("x-omega-visual-boundary",VISUAL_BOUNDARY);
  headers.set("x-omega-federation-role","PROPOSE");
  headers.set("x-omega-federation-revision","R102");
  headers.set("x-omega-surface-fabric","R191_OBSERVER");
  return new Response(html,{status:response.status,headers});
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/federation/manifest"||url.pathname==="/_omega/federation"){
      return Response.json(await federationManifest(),{headers:{"cache-control":"no-store","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102"}});
    }
    if(url.pathname==="/api/fabric/r191"||url.pathname==="/_omega/fabric/r191"){
      return Response.json(await surfaceFabricSnapshot(env),{headers:{"cache-control":"no-store","access-control-allow-origin":"*","x-omega-authority":"genesis-r191-observer-only","x-omega-federation-role":"PROPOSE","x-omega-surface-fabric":"R191_OBSERVER"}});
    }
    if(url.pathname==="/api/convergence/manifest"){
      return Response.json(await manifest(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-discovery-evolution-manifest","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102","x-omega-surface-fabric":"R191_OBSERVER"}});
    }
    if(url.pathname==="/_omega/convergence"){
      return Response.json(await reciprocalSnapshot(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-observer","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102","x-omega-surface-fabric":"R191_OBSERVER"}});
    }
    const eligibleVisual=request.method==="GET"&&!url.pathname.startsWith("/api/")&&!url.pathname.startsWith("/_omega/")&&!url.pathname.startsWith("/host/");
    if(!eligibleVisual)return base.fetch(request,env);
    return injectVisual(await base.fetch(request,env));
  }
};