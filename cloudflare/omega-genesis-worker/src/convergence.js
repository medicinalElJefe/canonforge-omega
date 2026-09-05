import base, {OmegaGenesisState} from "./index.js";
import {MODES,MENUS,GATES,CAPABILITIES} from "./catalog.js";

export {OmegaGenesisState};

const V6_URL="https://omegav6.jeffdeweyeljefe.workers.dev";
const OPTICAL_URL="https://omega-living-light-etching-private-woven2.vercel.app";
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
    "omega-v6":{verb:"ADMIT",url:V6_URL+"/",scope:"GLOBAL_FEDERATION_CANONSTATE"},
    "omega-optical":{verb:"SCREEN",url:OPTICAL_URL+"/",scope:"WORKER_RETURN_PACKET_ONLY"},
    "omega-sovereign":{verb:"SOLVE",url:null,scope:"WORKER_RESULT_RETURN_ONLY"}
  },
  input:["intent","project context","canonical snapshot"],
  output:["proposal packets","candidate families","alternatives"],
  shared_context:["project_id","packet_id","state_id","atlas_address","observer_frame","evidence_class","proof_gate","scar_history","orientation_sigma","lineage"],
  truth_boundary:"Genesis Durable Object state is authoritative for Genesis replay/proposal continuity only. It is not the global federation CanonState and cannot silently promote V6 operational state."
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
async function probe(url){
  try{
    const response=await fetch(url,{headers:{accept:"application/json"}});
    const text=await response.text();
    let body=null;
    try{body=JSON.parse(text)}catch{body={error:"non_json_response",preview:text.slice(0,180)}}
    return{reachable:response.ok,status:response.status,body};
  }catch(error){
    return{reachable:false,status:0,error:String(error?.message||error)};
  }
}
async function federationManifest(){
  return{...FEDERATION_R102,manifest_digest:await digest(FEDERATION_R102)};
}
async function manifest(env){
  const core={
    schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3",
    authority_contract:"OMEGA_ROLE_SEPARATED_CONVERGENCE_V1",
    federation:await federationManifest(),
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
  const [ownManifest,v6Health,v6Convergence]=await Promise.all([
    manifest(env),
    probe(V6_URL+"/_omega/health"),
    probe(V6_URL+"/api/convergence/edge")
  ]);
  return{
    schema:"OMEGA_RECIPROCAL_CONVERGENCE_SNAPSHOT_V3",
    observed_at:new Date().toISOString(),
    ok:Boolean(v6Health.reachable&&v6Convergence.reachable),
    genesis_manifest:ownManifest,
    peer:{
      role:"V6_CANONICAL_OPERATIONAL_RUNTIME",
      health:v6Health,
      convergence:v6Convergence,
      boundary:"peer observation cannot mutate Genesis node-local proposal state or V6 global operational/release state"
    }
  };
}
async function injectVisual(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  let html=await response.text();
  if(!html.includes("live-phase-visual.js"))html=html.replace("</body>",'<script src="/live-phase-visual.js" defer></script></body>');
  const headers=new Headers(response.headers);
  headers.set("cache-control","no-store");
  headers.set("x-omega-visual-channel","genesis-live-phase-separated-from-chat");
  headers.set("x-omega-visual-boundary",VISUAL_BOUNDARY);
  headers.set("x-omega-federation-role","PROPOSE");
  headers.set("x-omega-federation-revision","R102");
  return new Response(html,{status:response.status,headers});
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/federation/manifest"||url.pathname==="/_omega/federation"){
      return Response.json(await federationManifest(),{headers:{"cache-control":"no-store","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102"}});
    }
    if(url.pathname==="/api/convergence/manifest"){
      return Response.json(await manifest(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-discovery-evolution-manifest","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102"}});
    }
    if(url.pathname==="/_omega/convergence"){
      return Response.json(await reciprocalSnapshot(env),{headers:{"cache-control":"no-store","x-omega-authority":"genesis-convergence-observer","x-omega-federation-role":"PROPOSE","x-omega-federation-revision":"R102"}});
    }
    const eligibleVisual=request.method==="GET"&&!url.pathname.startsWith("/api/")&&!url.pathname.startsWith("/_omega/")&&!url.pathname.startsWith("/host/");
    if(!eligibleVisual)return base.fetch(request,env);
    return injectVisual(await base.fetch(request,env));
  }
};
